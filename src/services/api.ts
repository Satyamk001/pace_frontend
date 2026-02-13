import { useAuth } from '@clerk/clerk-expo';

const BACKEND_URL = 'http://localhost:3001/api'; // Android emulator usually needs 10.0.2.2, iOS localhost. 
// For physical device, use LAN IP. 
// TODO: Make this an env var or dynamic based on environment.

export const createApiService = (getToken: () => Promise<string | null>) => {
  const getHeaders = async () => {
    const token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  return {
    getTodos: async (date?: string, status?: 'active' | 'completed') => {
      const headers = await getHeaders();
      let url = `${BACKEND_URL}/todos?`;
      if (date) url += `date=${date}&`;
      if (status) url += `status=${status}`;
      
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch todos');
      return res.json();
    },

    createTodo: async (title: string, energyLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM', dueDate?: string) => {
      const headers = await getHeaders();
      const res = await fetch(`${BACKEND_URL}/todos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, energyLevel, dueDate }),
      });
      if (!res.ok) throw new Error('Failed to create todo');
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
        return res.json();
    },

    deleteTodo: async (id: string) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/todos/${id}`, {
            method: 'DELETE',
            headers,
        });
        if (!res.ok) throw new Error('Failed to delete todo');
        return res.json();
    },

    getDailyLog: async (date: string) => {
      const headers = await getHeaders();
      const res = await fetch(`${BACKEND_URL}/daily-logs?date=${date}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch daily log');
      return res.json();
    },

    logDay: async (date: string, dayType?: 'NORMAL' | 'FLARE_UP' | 'LOW_ENERGY', mood?: string) => {
      const headers = await getHeaders();
      const res = await fetch(`${BACKEND_URL}/daily-logs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ date, dayType, mood }),
      });
      if (!res.ok) throw new Error('Failed to log day');
      return res.json();
    },

    getStats: async (range: string = '7') => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/reports/stats?range=${range}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
    },

    getCalendarData: async () => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/reports/calendar`, { headers });
        if (!res.ok) throw new Error('Failed to fetch calendar');
        return res.json();
    },

    getHealthMetrics: async (date: string) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/health-metrics?date=${date}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch health metrics');
        return res.json();
    },

    logHealthMetrics: async (data: { date: string, painLevel: number, fatigueLevel: number, mood: string, notes?: string }) => {
        const headers = await getHeaders();
        const res = await fetch(`${BACKEND_URL}/health-metrics`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to log metrics');
        return res.json();
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
