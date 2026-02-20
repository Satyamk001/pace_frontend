import { useAuth } from '@clerk/clerk-expo';

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
      let url = `${BACKEND_URL}/todos?`;
      if (date) url += `date=${date}&`;
      if (status) url += `status=${status}`;
      return fetchWithCache(url);
    },

    createTodo: async (title: string, energyLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM', dueDate?: string) => {
      const headers = await getHeaders();
      const res = await fetch(`${BACKEND_URL}/todos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, energyLevel, dueDate }),
      });
      if (!res.ok) throw new Error('Failed to create todo');
      invalidateCache('/todos');
      invalidateCache('/reports'); 
      return res.json();
    },

    toggleTodo: async (id: string, isCompleted: boolean) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/todos/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ isCompleted }),
        });
        if (!res.ok) throw new Error('Failed to update todo');
        invalidateCache('/todos');
        invalidateCache('/reports');
        return res.json();
    },

    updateTodoDetails: async (id: string, updates: any) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/todos/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update details');
        invalidateCache('/todos');
        return res.json();
    },

    deleteTodo: async (id: string) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/todos/${id}`, {
            method: 'DELETE',
            headers,
        });
        if (!res.ok) throw new Error('Failed to delete todo');
        invalidateCache('/todos');
        invalidateCache('/reports');
        return res.json();
    },

    getDailyLog: async (date: string) => {
      const url = `${BACKEND_URL}/daily-logs?date=${date}`;
      return fetchWithCache(url);
    },

    logDay: async (date: string, dayType?: 'NORMAL' | 'FLARE_UP' | 'LOW_ENERGY', mood?: string) => {
      const headers = await getHeaders();
      const res = await fetch(`${BACKEND_URL}/daily-logs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ date, dayType, mood }),
      });
      if (!res.ok) throw new Error('Failed to log day');
      invalidateCache('/daily-logs');
      invalidateCache('/reports'); 
      return res.json();
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
        const url = `${BACKEND_URL}/health-metrics?date=${date}`;
        return fetchWithCache(url);
    },

    logHealthMetrics: async (data: { date: string, painLevel: number, fatigueLevel: number, mood: string, notes?: string }) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/health-metrics`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to log metrics');
        invalidateCache('/health-metrics');
        invalidateCache('/reports'); 
        return res.json();
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
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/health-metrics/medicines`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to add medicine');
        invalidateCache('/medicines');
        return res.json();
    },

    updateMedicine: async (id: string, data: { name: string, dosage: string, frequency: string, times: string[] }) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/health-metrics/medicines/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update medicine');
        invalidateCache('/medicines');
        return res.json();
    },

    deleteMedicine: async (id: string) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/health-metrics/medicines/${id}`, {
            method: 'DELETE',
            headers,
        });
        if (!res.ok) throw new Error('Failed to delete medicine');
        invalidateCache('/medicines');
        return res.json();
    },

    getMedicines: async () => {
        const headers = await getHeaders(); // medicines might not change often but good to be fresh or cached long
        return fetchWithCache(`${BACKEND_URL}/health-metrics/medicines`);
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
