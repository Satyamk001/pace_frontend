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

  const fetchWithCache = async (url: string) => {
      // 1. Check Memory Cache
      const cached = getCached(url);
      if (cached) return cached;

      // 2. Check In-Flight Requests (Deduplication)
      if (inFlightRequests.has(url)) {
          return inFlightRequests.get(url);
      }

      // 3. Make Request
      const requestPromise = (async () => {
          try {
              const headers = await getHeaders();
              const res = await fetch(url, { headers });
              if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
              const data = await res.json();
              setCache(url, data);
              return data;
          } finally {
              inFlightRequests.delete(url);
          }
      })();

      inFlightRequests.set(url, requestPromise);
      return requestPromise;
  };

  return {
    getTodos: async (date?: string, status?: 'active' | 'completed') => {
      // Offline-first read: Return straight from StorageService
      const allTodos = await StorageService.getItem('offline_todos') || [];
      
      let filtered = [...allTodos];
      if (date) {
        filtered = filtered.filter((t: any) => {
            if (t.due_date && t.due_date.startsWith(date)) return true;
            if (t.completed_at && t.completed_at.startsWith(date)) return true;
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

    createTodo: async (title: string, energyLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM', dueDate?: string, feedback?: string) => {
      // 1. Mutate locally and generate temp ID
      const newTodo = await StorageService.addTodo({ title, energy_level: energyLevel, due_date: dueDate, feedback });
      
      // 2. Queue background sync
      await OfflineSyncService.queueRequest(
          `${BACKEND_URL}/todos`, 
          'POST', 
          { title, energyLevel, dueDate, feedback },
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
      return await StorageService.getDailyLog(date);
    },

    logDay: async (date: string, dayType?: 'NORMAL' | 'FLARE_UP' | 'LOW_ENERGY', mood?: string) => {
      const log = await StorageService.updateDailyLog({ date, day_type: dayType, mood });
      await OfflineSyncService.queueRequest(`${BACKEND_URL}/daily-logs`, 'POST', { date, dayType, mood });
      return log;
    },

    getStats: async (range: string = '7') => {
        const url = `${BACKEND_URL}/reports/stats?range=${range}`;
        return fetchWithCache(url);
    },

    getCalendarData: async () => {
        const url = `${BACKEND_URL}/reports/calendar`;
        return fetchWithCache(url);
    },

    getHealthMetrics: async (date: string) => {
        return await StorageService.getHealthMetrics(date);
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
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/health-metrics/food`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to log food');
        invalidateCache('/food');
        return res.json();
    },

    getDailyFoodLog: async (date: string) => {
        const url = `${BACKEND_URL}/health-metrics/food/daily?date=${date}`;
        return fetchWithCache(url);
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
        return await StorageService.getItem('offline_medicines') || [];
    },

    logMedicineIntake: async (data: { medicineId: string, date: string, time: string, status: 'TAKEN' | 'SKIPPED' }) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/health-metrics/medicines/intake`, {
             method: 'POST',
             headers,
             body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to log intake');
        invalidateCache('/medicines');
        return res.json();
    },

    deleteMedicineIntake: async (data: { medicineId: string, date: string, time: string }) => {
        const headers = await getHeaders();
        // Use query parameters for DELETE requests
        const params = new URLSearchParams({
            medicineId: data.medicineId,
            date: data.date,
            time: data.time
        }).toString();
        
        const res = await fetch(`${BACKEND_URL}/health-metrics/medicines/intake?${params}`, {
             method: 'DELETE',
             headers,
        });
        if (!res.ok) throw new Error('Failed to delete intake');
        invalidateCache('/medicines');
        return res.json();
    },

    getIntakeHistory: async (date: string) => {
         const url = `${BACKEND_URL}/health-metrics/medicines/intake/history?date=${date}`;
         return fetchWithCache(url);
    },

    // --- WEIGHT API ---
    logWeight: async (data: { date: string, weight: number }) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/health-metrics/weight`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to log weight');
        invalidateCache('/weight');
        invalidateCache('/reports');
        return res.json();
    },

    getWeightHistory: async (startDate: string, endDate: string) => {
        const url = `${BACKEND_URL}/health-metrics/weight/history?startDate=${startDate}&endDate=${endDate}`;
        return fetchWithCache(url);
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
