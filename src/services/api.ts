import { useAuth } from '@clerk/clerk-expo';
import { StorageService } from './StorageService';
import { OfflineSyncService } from './OfflineSyncService';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';



const apiCache = new Map<string, { data: any; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL = 60000; // 60 seconds

export const createApiService = (getToken: () => Promise<string | null>) => {
  const getHeaders = async () => {
    const token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const getCached = (url: string) => {
    const cached = apiCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  };

  const setCache = (url: string, data: any) => {
    apiCache.set(url, { data, timestamp: Date.now() });
  };

  const invalidateCache = (pattern: string) => {
    for (const key of apiCache.keys()) {
      if (key.includes(pattern)) {
        apiCache.delete(key);
      }
    }
  };

  const fetchWithDynamicCache = async (url: string, localReadFn: () => Promise<any>, localWriteFn: (data: any) => Promise<void>) => {
      // 1. Read local data for instantly returning
      let localData = await localReadFn();
      const isLocalEmpty = !localData || (Array.isArray(localData) && localData.length === 0) || (typeof localData === 'object' && Object.keys(localData).length === 0);

      // 2. Check if we need to fetch from network (not in flight, TTL expired, OR local DB is completely empty)
      const isCacheValid = getCached(url) !== null;
      let requestPromise = inFlightRequests.get(url);
      
      if (!requestPromise && (!isCacheValid || isLocalEmpty)) {
          requestPromise = (async () => {
              try {
                  const headers = await getHeaders();
                  const res = await fetch(url, { headers });
                  if (res.ok) {
                      const data = await res.json();
                      await localWriteFn(data);
                      setCache(url, true); // Mark TTL as recently fetched to stop spamming
                      return data;
                  }
              } catch(e) {
                  console.log(`[Sync] Background fetch failed for ${url}`);
              } finally {
                  inFlightRequests.delete(url);
              }
              return null;
          })();
          inFlightRequests.set(url, requestPromise);
      }

      // 3. If local is empty, we must await the network
      if (isLocalEmpty && requestPromise) {
          const networkData = await requestPromise;
          if (networkData) return networkData;
          return Array.isArray(localData) ? [] : {};
      }

      // 4. Otherwise, return local data instantly (0s UI loading)
      // The background sync will run silently and update the DB if TTL expired.
      return localData;
  };

  return {
    getTodos: async (date?: string, status?: 'active' | 'completed') => {
      const allTodos = await fetchWithDynamicCache(
          `${BACKEND_URL}/todos`,
          async () => { return await StorageService.getItem('offline_todos') || []; },
          async (data: any) => { await StorageService.setItem('offline_todos', data); }
      );
      
      let filtered = [...(allTodos || [])];
      if (date && date.includes('-')) {
        const [year, month, day] = date.split('-');
        const queryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        queryDate.setHours(0, 0, 0, 0);

        filtered = filtered.filter((t: any) => {
            // Evaluator Helper
            const isSameLocalDay = (serverUtcStr: string) => {
                if (!serverUtcStr) return false;
                const d = new Date(serverUtcStr);
                return d.getFullYear() === queryDate.getFullYear() && 
                       d.getMonth() === queryDate.getMonth() && 
                       d.getDate() === queryDate.getDate();
            };

            // 1. Exact strict match strictly in Local Time
            if (isSameLocalDay(t.due_date) || isSameLocalDay(t.completed_at)) {
                return true;
            }

            // 2. Evaluate Repeat Logic for past dates pushing to future
            if (t.repeat_type && t.repeat_type !== 'NONE' && t.due_date) {
                const dueDate = new Date(t.due_date);
                dueDate.setHours(0, 0, 0, 0);

                // Only repeat if the query date is ON or AFTER the task's originating due date
                if (queryDate >= dueDate) {
                    if (t.repeat_type === 'DAILY') {
                        return true;
                    }
                    if (t.repeat_type === 'WEEKLY') {
                        // Check if the weekday matches
                        return queryDate.getDay() === dueDate.getDay();
                    }
                }
            }
            return false;
        });
      }
      if (status === 'active') {
          filtered = filtered.filter((t: any) => !t.is_completed);
      } else if (status === 'completed') {
          filtered = filtered.filter((t: any) => t.is_completed);
      }
      
      // Sort logic (matching backend)
      filtered.sort((a, b) => {
          if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
          const energyOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          const eA = energyOrder[a.energy_level as keyof typeof energyOrder] || 2;
          const eB = energyOrder[b.energy_level as keyof typeof energyOrder] || 2;
          if (eA !== eB) return eB - eA;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      return filtered;
    },

    createTodo: async (title: string, energyLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM', dueDate?: string, feedback?: string, repeatType?: string) => {
      // 1. Mutate locally and generate temp ID
      const newTodo = await StorageService.addTodo({ title, energy_level: energyLevel, due_date: dueDate, feedback, repeat_type: repeatType });
      
      // 2. Queue background sync
      await OfflineSyncService.queueRequest(
          `${BACKEND_URL}/todos`, 
          'POST', 
          { title, energyLevel, dueDate, feedback, repeatType },
          newTodo.id // Pass temp ID for Server Reconciliation later
      );
      
      // 3. Return instantly
      return newTodo;
    },

    toggleTodo: async (id: string, isCompleted: boolean) => {
        // 1. Mutate Locally
        const updatedTodo = await StorageService.updateTodo(id, { isCompleted });
        
        // 2. Queue Sync
        await OfflineSyncService.queueRequest(
            `${BACKEND_URL}/todos/${id}`, 
            'PUT', 
            { isCompleted }
        );
        
        return updatedTodo;
    },

    updateTodoDetails: async (id: string, updates: any) => {
        // 1. Mutate Locally
        const updatedTodo = await StorageService.updateTodo(id, updates);
        
        // 2. Queue Sync
        await OfflineSyncService.queueRequest(
            `${BACKEND_URL}/todos/${id}`, 
            'PUT', 
            updates
        );
        
        return updatedTodo;
    },

    deleteTodo: async (id: string) => {
        // 1. Mutate locally
        await StorageService.deleteTodo(id);
        
        // 2. Queue Sync
        await OfflineSyncService.queueRequest(`${BACKEND_URL}/todos/${id}`, 'DELETE');
        
        return { message: 'Todo deleted locally (queued)' };
    },

    getDailyLog: async (date: string) => {
        return await fetchWithDynamicCache(
            `${BACKEND_URL}/daily-logs?date=${date}`,
            async () => { return await StorageService.getDailyLog(date); },
            async (data: any) => { 
                if (data && data.date) await StorageService.updateDailyLog(data); 
            }
        );
    },

    logDay: async (date: string, dayType?: 'NORMAL' | 'FLARE_UP' | 'LOW_ENERGY', mood?: string) => {
      const log = await StorageService.updateDailyLog({ date, day_type: dayType, mood });
      await OfflineSyncService.queueRequest(`${BACKEND_URL}/daily-logs`, 'POST', { date, dayType, mood });
      return log;
    },

    getStats: async (range: string = '7') => {
        const url = `${BACKEND_URL}/reports/stats?range=${range}`;
        return await fetchWithDynamicCache(
            url,
            async () => { return await StorageService.getItem(`offline_stats_${range}`) || null; },
            async (data: any) => { await StorageService.setItem(`offline_stats_${range}`, data); }
        );
    },

    getCalendarData: async () => {
        const url = `${BACKEND_URL}/reports/calendar`;
        return await fetchWithDynamicCache(
            url,
            async () => { return await StorageService.getItem('offline_calendar') || {}; },
            async (data: any) => { await StorageService.syncCalendar(data); }
        );
    },

    getHealthMetrics: async (date: string) => {
        return await fetchWithDynamicCache(
            `${BACKEND_URL}/health-metrics?date=${date}`,
            async () => { return await StorageService.getHealthMetrics(date); },
            async (data: any) => { 
                if (data && data.date) await StorageService.updateHealthMetrics(data); 
            }
        );
    },

    logHealthMetrics: async (data: { date: string, painLevel: number, fatigueLevel: number, mood: string, notes?: string }) => {
        const metrics = await StorageService.updateHealthMetrics({
            date: data.date,
            pain_level: data.painLevel,
            fatigue_level: data.fatigueLevel,
            mood: data.mood,
            notes: data.notes
        });
        await OfflineSyncService.queueRequest(`${BACKEND_URL}/health-metrics`, 'POST', data);
        return metrics;
    },

    // --- FOOD API ---
    logFood: async (data: { date: string, name: string, quantity?: string, calories: number, time?: string, notes?: string }) => {
        const tempId = `temp_${Date.now()}`;
        const newLog = { id: tempId, ...data };
        const existingLogs = await StorageService.getDailyFoodLogs(data.date) || [];
        await StorageService.updateDailyFoodLogs(data.date, [...existingLogs, newLog]);

        await OfflineSyncService.queueRequest(`${BACKEND_URL}/health-metrics/food`, 'POST', data, tempId);
        return newLog;
    },

    getDailyFoodLog: async (date: string) => {
        return await fetchWithDynamicCache(
            `${BACKEND_URL}/health-metrics/food/daily?date=${date}`,
            async () => { return await StorageService.getDailyFoodLogs(date); },
            async (data: any) => { await StorageService.updateDailyFoodLogs(date, data); }
        );
    },

    // --- MEDICINE API ---
    addMedicine: async (data: { name: string, dosage: string, frequency: string, times: string[] }) => {
        // Since getMedicines logic relies heavily on the server to sort schedules,
        // we'll optimistic-update the local cache by finding the global Medicines array.
        const allMeds = await StorageService.getItem('offline_medicines') || [];
        const newMed = {
            id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...data,
            _isTemp: true
        };
        await StorageService.syncMedicines([...allMeds, newMed]);
        
        await OfflineSyncService.queueRequest(`${BACKEND_URL}/health-metrics/medicines`, 'POST', data, newMed.id);
        return newMed;
    },

    updateMedicine: async (id: string, data: { name: string, dosage: string, frequency: string, times: string[] }) => {
        const allMeds = await StorageService.getItem('offline_medicines') || [];
        const updatedMeds = allMeds.map((m: any) => m.id === id ? { ...m, ...data } : m);
        await StorageService.syncMedicines(updatedMeds);
        
        await OfflineSyncService.queueRequest(`${BACKEND_URL}/health-metrics/medicines/${id}`, 'PUT', data);
        return { id, ...data };
    },

    deleteMedicine: async (id: string) => {
        const allMeds = await StorageService.getItem('offline_medicines') || [];
        const filtered = allMeds.filter((m: any) => m.id !== id);
        await StorageService.syncMedicines(filtered);
        
        await OfflineSyncService.queueRequest(`${BACKEND_URL}/health-metrics/medicines/${id}`, 'DELETE');
        return { message: 'Medicine deleted locally' };
    },

    getMedicines: async () => {
        return await fetchWithDynamicCache(
            `${BACKEND_URL}/health-metrics/medicines`,
            async () => { return await StorageService.getItem('offline_medicines') || []; },
            async (data: any) => { await StorageService.syncMedicines(data); }
        );
    },

    logMedicineIntake: async (data: { medicineId: string, date: string, time: string, status: 'TAKEN' | 'SKIPPED' }) => {
        const existingIntakes = await StorageService.getMedicineIntakes(data.date) || [];
        const newIntake = { id: `temp_${Date.now()}`, medicine_id: data.medicineId, time: data.time, status: data.status, date: data.date };
        await StorageService.updateMedicineIntakes(data.date, [...existingIntakes, newIntake]);

        await OfflineSyncService.queueRequest(`${BACKEND_URL}/health-metrics/medicines/intake`, 'POST', data, newIntake.id);
        return newIntake;
    },

    deleteMedicineIntake: async (data: { medicineId: string, date: string, time: string }) => {
        const existingIntakes = await StorageService.getMedicineIntakes(data.date) || [];
        const filtered = existingIntakes.filter((i: any) => !(i.medicine_id === data.medicineId && i.time.slice(0,5) === data.time.slice(0,5)));
        await StorageService.updateMedicineIntakes(data.date, filtered);

        const params = new URLSearchParams(data).toString();
        await OfflineSyncService.queueRequest(`${BACKEND_URL}/health-metrics/medicines/intake?${params}`, 'DELETE');
        return { message: 'Deleted intake locally' };
    },

    getIntakeHistory: async (date: string) => {
        return await fetchWithDynamicCache(
            `${BACKEND_URL}/health-metrics/medicines/intake/history?date=${date}`,
            async () => { return await StorageService.getMedicineIntakes(date); },
            async (data: any) => { await StorageService.updateMedicineIntakes(date, data); }
        );
    },

    // --- WEIGHT API ---
    logWeight: async (data: { date: string, weight: number }) => {
        const tempId = `temp_${Date.now()}`;
        const newWeight = { id: tempId, ...data };
        await StorageService.updateWeightHistory([newWeight]);
        
        await OfflineSyncService.queueRequest(`${BACKEND_URL}/health-metrics/weight`, 'POST', data, tempId);
        return newWeight;
    },

    getWeightHistory: async (startDate: string, endDate: string) => {
        return await fetchWithDynamicCache(
            `${BACKEND_URL}/health-metrics/weight/history?startDate=${startDate}&endDate=${endDate}`,
            async () => { return await StorageService.getWeightHistory(startDate, endDate); },
            async (data: any) => { await StorageService.updateWeightHistory(data?.history || data); }
        );
    },



    createOrder: async (amount: number) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/payments/create-order`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ amount }),
        });
        if (!res.ok) throw new Error('Failed to create order');
        return res.json();
    },

    verifyPayment: async (paymentData: any) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/payments/verify`, {
            method: 'POST',
            headers,
            body: JSON.stringify(paymentData),
        });
        if (!res.ok) throw new Error('Failed to verify payment');
        return res.json();
    },
    
    getSubscriptionStatus: async () => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/payments/status`, { headers });
        if (!res.ok) throw new Error('Failed to fetch subscription status');
        return res.json();
    }
  };
};
