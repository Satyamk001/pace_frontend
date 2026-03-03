const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';

export const createApiService = (getToken: () => Promise<string | null>) => {
  const getHeaders = async () => {
    const token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = await getHeaders();
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`API error ${res.status}: ${errText}`);
    }
    // Handle 204 No Content
    if (res.status === 204) return null;
    return res.json();
  };

  return {
    // ─── TODOS ───────────────────────────────────────────────────
    getTodos: async (date?: string, status?: 'active' | 'completed') => {
      let url = `${BACKEND_URL}/todos`;
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (status) params.set('status', status);
      const qs = params.toString();
      if (qs) url += `?${qs}`;
      return await apiFetch(url);
    },

    createTodo: async (title: string, energyLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM', dueDate?: string, feedback?: string, repeatType?: string) => {
      return await apiFetch(`${BACKEND_URL}/todos`, {
        method: 'POST',
        body: JSON.stringify({ title, energyLevel, dueDate, feedback, repeatType }),
      });
    },

    toggleTodo: async (id: string, isCompleted: boolean) => {
      return await apiFetch(`${BACKEND_URL}/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isCompleted }),
      });
    },

    updateTodoDetails: async (id: string, updates: any) => {
      return await apiFetch(`${BACKEND_URL}/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    deleteTodo: async (id: string) => {
      return await apiFetch(`${BACKEND_URL}/todos/${id}`, { method: 'DELETE' });
    },

    // ─── DAILY LOGS ──────────────────────────────────────────────
    getDailyLog: async (date: string) => {
      return await apiFetch(`${BACKEND_URL}/daily-logs?date=${date}`);
    },

    logDay: async (date: string, dayType?: 'NORMAL' | 'FLARE_UP' | 'LOW_ENERGY', mood?: string) => {
      return await apiFetch(`${BACKEND_URL}/daily-logs`, {
        method: 'POST',
        body: JSON.stringify({ date, dayType, mood }),
      });
    },

    // ─── STATS / REPORTS ─────────────────────────────────────────
    getStats: async (range: string = '7') => {
      return await apiFetch(`${BACKEND_URL}/reports/stats?range=${range}`);
    },

    getCalendarData: async () => {
      return await apiFetch(`${BACKEND_URL}/reports/calendar`);
    },

    // ─── HEALTH METRICS ──────────────────────────────────────────
    getHealthMetrics: async (date: string) => {
      return await apiFetch(`${BACKEND_URL}/health-metrics?date=${date}`);
    },

    logHealthMetrics: async (data: { date: string, painLevel: number, fatigueLevel: number, mood: string, notes?: string, painkillerCount?: number }) => {
      return await apiFetch(`${BACKEND_URL}/health-metrics`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // ─── FOOD ────────────────────────────────────────────────────
    logFood: async (data: { date: string, name: string, quantity?: string, calories: number, time?: string, notes?: string }) => {
      return await apiFetch(`${BACKEND_URL}/health-metrics/food`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getDailyFoodLog: async (date: string) => {
      return await apiFetch(`${BACKEND_URL}/health-metrics/food/daily?date=${date}`);
    },

    // ─── MEDICINE ────────────────────────────────────────────────
    addMedicine: async (data: { name: string, dosage: string, frequency: string, times: string[] }) => {
      return await apiFetch(`${BACKEND_URL}/health-metrics/medicines`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateMedicine: async (id: string, data: { name: string, dosage: string, frequency: string, times: string[] }) => {
      return await apiFetch(`${BACKEND_URL}/health-metrics/medicines/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    deleteMedicine: async (id: string) => {
      return await apiFetch(`${BACKEND_URL}/health-metrics/medicines/${id}`, { method: 'DELETE' });
    },

    getMedicines: async () => {
      return await apiFetch(`${BACKEND_URL}/health-metrics/medicines`);
    },

    logMedicineIntake: async (data: { medicineId: string, date: string, time: string, status: 'TAKEN' | 'SKIPPED' }) => {
      return await apiFetch(`${BACKEND_URL}/health-metrics/medicines/intake`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    deleteMedicineIntake: async (data: { medicineId: string, date: string, time: string }) => {
      const params = new URLSearchParams(data).toString();
      return await apiFetch(`${BACKEND_URL}/health-metrics/medicines/intake?${params}`, { method: 'DELETE' });
    },

    getIntakeHistory: async (date: string) => {
      return await apiFetch(`${BACKEND_URL}/health-metrics/medicines/intake/history?date=${date}`);
    },

    // ─── WEIGHT ──────────────────────────────────────────────────
    logWeight: async (data: { date: string, weight: number }) => {
      return await apiFetch(`${BACKEND_URL}/health-metrics/weight`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getWeightHistory: async (startDate: string, endDate: string) => {
      return await apiFetch(`${BACKEND_URL}/health-metrics/weight/history?startDate=${startDate}&endDate=${endDate}`);
    },

    // ─── PAYMENTS ────────────────────────────────────────────────
    createOrder: async (amount: number) => {
      return await apiFetch(`${BACKEND_URL}/payments/create-order`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
    },

    verifyPayment: async (paymentData: any) => {
      return await apiFetch(`${BACKEND_URL}/payments/verify`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
    },

    getSubscriptionStatus: async () => {
      return await apiFetch(`${BACKEND_URL}/payments/status`);
    },
  };
};
