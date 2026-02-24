import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
    TODOS: 'offline_todos',
    CALENDAR: 'offline_calendar', // Stores calendar data for daily logs
    SUBSCRIPTION: 'offline_subscription',
    MEDICINES: 'offline_medicines',
    DAILY_LOGS: 'offline_daily_logs', // Specifically for the detailed log objects
    HEALTH_METRICS: 'offline_health_metrics', // Specifically for the detailed metrics
};

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const StorageService = {
    async setItem(key: string, value: any) {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('StorageService setItem error:', e);
        }
    },

    async getItem(key: string) {
        try {
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('StorageService getItem error:', e);
            return null;
        }
    },

    async syncTodos(todos: any[]) {
        await this.setItem(STORAGE_KEYS.TODOS, todos);
    },

    async syncCalendar(calendarData: any) {
        await this.setItem(STORAGE_KEYS.CALENDAR, calendarData);
    },
    
    async syncMedicines(medicines: any[]) {
        await this.setItem(STORAGE_KEYS.MEDICINES, medicines);
    },

    // --- TEMPORARY ID RECONCILIATION ---
    async replaceTempId(tempId: string, realId: string) {
        // 1. Replace in Todos
        const todos = await this.getItem(STORAGE_KEYS.TODOS) || [];
        let todosChanged = false;
        const updatedTodos = todos.map((t: any) => {
            if (t.id === tempId) {
                todosChanged = true;
                return { ...t, id: realId };
            }
            return t;
        });
        if (todosChanged) await this.setItem(STORAGE_KEYS.TODOS, updatedTodos);

        // Add additional replacements here if other entities use temp IDs (e.g., Medicines)
    },

    // --- LOCAL CRUD FOR TODOS ---
    async addTodo(todoData: any): Promise<any> {
        const id = generateTempId();
        const newTodo = {
            id,
            ...todoData,
            created_at: new Date().toISOString(),
            is_completed: false,
            progress: 0,
            _isTemp: true // Optional flag for UI
        };
        const todos = await this.getItem(STORAGE_KEYS.TODOS) || [];
        await this.setItem(STORAGE_KEYS.TODOS, [newTodo, ...todos]);
        return newTodo;
    },

    async updateTodo(id: string, updates: any): Promise<any> {
        const todos = await this.getItem(STORAGE_KEYS.TODOS) || [];
        let updatedTodo = null;
        const updatedTodos = todos.map((t: any) => {
            if (t.id === id) {
                updatedTodo = { 
                    ...t, 
                    ...updates,
                    completed_at: updates.isCompleted ? new Date().toISOString() : (updates.isCompleted === false ? null : t.completed_at),
                    is_completed: updates.isCompleted !== undefined ? updates.isCompleted : t.is_completed
                };
                return updatedTodo;
            }
            return t;
        });
        await this.setItem(STORAGE_KEYS.TODOS, updatedTodos);
        return updatedTodo;
    },

    async deleteTodo(id: string): Promise<void> {
        const todos = await this.getItem(STORAGE_KEYS.TODOS) || [];
        const filtered = todos.filter((t: any) => t.id !== id);
        await this.setItem(STORAGE_KEYS.TODOS, filtered);
    },

    // --- LOCAL CRUD FOR DAILY LOGS / METRICS ---
    async updateDailyLog(logData: any) {
        const logs = await this.getItem(STORAGE_KEYS.DAILY_LOGS) || {};
        const dateKey = logData.date; // assuming YYYY-MM-DD
        logs[dateKey] = { ...logs[dateKey], ...logData };
        await this.setItem(STORAGE_KEYS.DAILY_LOGS, logs);

        // Also update the lean calendar cache used for rolling stats
        const calendar = await this.getItem(STORAGE_KEYS.CALENDAR) || {};
        calendar[dateKey] = { ...calendar[dateKey], ...logData };
        await this.setItem(STORAGE_KEYS.CALENDAR, calendar);
        
        return logs[dateKey];
    },

    async getDailyLog(dateStr: string) {
        const logs = await this.getItem(STORAGE_KEYS.DAILY_LOGS) || {};
        return logs[dateStr] || null;
    },

    async updateHealthMetrics(metricData: any) {
        const metrics = await this.getItem(STORAGE_KEYS.HEALTH_METRICS) || {};
        const dateKey = metricData.date;
        metrics[dateKey] = { ...metrics[dateKey], ...metricData };
        await this.setItem(STORAGE_KEYS.HEALTH_METRICS, metrics);
        return metrics[dateKey];
    },

    async getHealthMetrics(dateStr: string) {
        const metrics = await this.getItem(STORAGE_KEYS.HEALTH_METRICS) || {};
        return metrics[dateStr] || null;
    },
    
    // Feature 1: 7-Day Rolling Stats locally
    async calculate7DayStats() {
        try {
            const todos = await this.getItem(STORAGE_KEYS.TODOS) || [];
            const calendar = await this.getItem(STORAGE_KEYS.CALENDAR) || {};
            
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);

            // 1. Calculate Tasks Done strictly within 7-day window
            let totalTasks = 0;
            todos.forEach((todo: any) => {
                if (todo.is_completed && todo.completed_at) {
                    const completedDate = new Date(todo.completed_at);
                    if (completedDate >= sevenDaysAgo && completedDate <= new Date()) {
                        totalTasks++;
                    }
                }
            });

            // 2. Calculate Calm Days within 7-day window
            let calmDays = 0;
            // 3. Calculate Day Streak within 7-day window
            let streak = 0;
            
            // Extract dates from calendar objects that are within last 7 days
            const recentLogDates = Object.keys(calendar).filter(dateStr => {
                const logDate = new Date(dateStr);
                return logDate >= sevenDaysAgo && logDate <= now;
            }).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // DESC

            recentLogDates.forEach(dateStr => {
                const dayData = calendar[dateStr];
                if (dayData && dayData.day_type && dayData.day_type !== 'FLARE_UP') {
                    calmDays++;
                }
            });

            if (recentLogDates.length > 0) {
                const today = new Date();
                today.setHours(0,0,0,0);
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                
                const lastLogDate = new Date(recentLogDates[0]);
                lastLogDate.setHours(0,0,0,0);
                
                const isToday = lastLogDate.getTime() === today.getTime();
                const isYesterday = lastLogDate.getTime() === yesterday.getTime();
                
                if (isToday || isYesterday) {
                    streak = 1;
                    for (let i = 0; i < recentLogDates.length - 1; i++) {
                        const current = new Date(recentLogDates[i]);
                        const next = new Date(recentLogDates[i+1]);
                        
                        current.setHours(0,0,0,0);
                        next.setHours(0,0,0,0);

                        const diffTime = Math.abs(current.getTime() - next.getTime());
                        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
                        
                        if (diffDays === 1) {
                            streak++;
                        } else if (diffDays > 1) {
                            break;
                        }
                    }
                }
            }

            return {
                streak,
                totalTasks,
                calmDays
            };
        } catch (error) {
            console.error('Error calculating 7 day stats:', error);
            return { streak: 0, totalTasks: 0, calmDays: 0 };
        }
    }
};
