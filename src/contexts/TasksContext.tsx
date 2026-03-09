import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { createApiService } from '../services/api';
import { useToast } from './ToastContext';
import { NotificationService } from '../services/NotificationService';

export type Task = {
    id: string;
    title: string;
    energy_level: 'LOW' | 'MEDIUM' | 'HIGH';
    is_completed: boolean;
    progress: number;
    due_date?: string | null;
    feedback?: string | null;
    repeat_type?: string;
};

interface TasksContextData {
    tasksByDate: Record<string, Task[]>;
    loadingTasks: boolean;
    getTasks: (dateStr: string) => Task[];
    fetchTasks: (date: Date) => Promise<void>;
    addTask: (title: string, energy: 'LOW' | 'MEDIUM' | 'HIGH', dueDate?: Date, feedback?: string, repeatType?: string) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
}

const TasksContext = createContext<TasksContextData | undefined>(undefined);

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { getToken } = useAuth();
    const api = createApiService(getToken);
    const { showToast } = useToast();

    // Map Tasks by date "YYYY-MM-DD" -> Task[]
    const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});
    const [loadingTasks, setLoadingTasks] = useState(false);
    
    // Prevent fetching wiping optimistic logic
    const activeMutations = useRef<Record<string, number>>({});

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getTasks = useCallback((dateStr: string) => {
        return tasksByDate[dateStr] || [];
    }, [tasksByDate]);

    const fetchTasks = useCallback(async (date: Date) => {
        const dateStr = formatDate(date);
        
        // Skip fetching if mutating THIS specific date to prevent screen wiping
        if (activeMutations.current[dateStr] > 0) return;

        setLoadingTasks(true);
        try {
            const tasks = await api.getTodos(dateStr);
            setTasksByDate(prev => ({ ...prev, [dateStr]: tasks || [] }));
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            showToast('Failed to load tasks', 'error');
        } finally {
            setLoadingTasks(false);
        }
    }, [getToken, showToast]);

    const addMutation = (dateStr: string) => {
        activeMutations.current[dateStr] = (activeMutations.current[dateStr] || 0) + 1;
    };

    const removeMutation = (dateStr: string) => {
        activeMutations.current[dateStr] = Math.max(0, (activeMutations.current[dateStr] || 0) - 1);
    };

    const addTask = async (title: string, energy: 'LOW' | 'MEDIUM' | 'HIGH', dueDate?: Date, feedback?: string, repeatType?: string) => {
        const dateStr = dueDate ? formatDate(dueDate) : formatDate(new Date());
        addMutation(dateStr);

        const optimisticId = `temp-${Date.now()}`;
        const tempTask: Task = {
            id: optimisticId,
            title,
            energy_level: energy,
            is_completed: false,
            progress: 0,
            due_date: dueDate ? dueDate.toISOString() : undefined,
            feedback,
            repeat_type: repeatType
        };

        setTasksByDate(prev => ({
            ...prev,
            [dateStr]: [...(prev[dateStr] || []), tempTask]
        }));

        try {
            const newTodo = await api.createTodo(
                title, 
                energy, 
                dueDate ? dueDate.toISOString() : undefined, 
                feedback?.trim() || undefined, 
                repeatType
            );

            setTasksByDate(prev => ({
                ...prev,
                [dateStr]: (prev[dateStr] || []).map(t => t.id === optimisticId ? newTodo : t)
            }));
            
            if (newTodo.due_date) {
                await NotificationService.scheduleTodo(newTodo);
            }
            showToast('Task added successfully', 'success');
        } catch (error) {
            console.error('Add task error:', error);
            setTasksByDate(prev => ({
                ...prev,
                [dateStr]: (prev[dateStr] || []).filter(t => t.id !== optimisticId)
            }));
            showToast('Failed to add task', 'error');
        } finally {
            removeMutation(dateStr);
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        let targetDateStr: string | null = null;
        for (const [date, tasks] of Object.entries(tasksByDate)) {
            if (tasks.find(t => t.id === id)) {
                targetDateStr = date;
                break;
            }
        }

        if (!targetDateStr) return;
        addMutation(targetDateStr);

        const prevState = tasksByDate[targetDateStr] || [];
        
        setTasksByDate(prev => ({
            ...prev,
            [targetDateStr!]: (prev[targetDateStr!] || []).map(t => 
                t.id === id ? { ...t, ...updates } : t
            )
        }));

        try {
            const apiUpdates: any = {};
            if (updates.title !== undefined) apiUpdates.title = updates.title;
            if (updates.energy_level !== undefined) apiUpdates.energyLevel = updates.energy_level;
            if (updates.progress !== undefined) apiUpdates.progress = updates.progress;
            if (updates.feedback !== undefined) apiUpdates.feedback = updates.feedback;
            if (updates.is_completed !== undefined) apiUpdates.isCompleted = updates.is_completed;
            if (updates.due_date !== undefined) apiUpdates.dueDate = updates.due_date;
            if (updates.repeat_type !== undefined) apiUpdates.repeatType = updates.repeat_type;

            const updatedTask = await api.updateTodoDetails(id, apiUpdates);
            
            if (updatedTask && updatedTask.id) {
                 setTasksByDate(prev => ({
                    ...prev,
                    [targetDateStr!]: (prev[targetDateStr!] || []).map(t => t.id === id ? updatedTask : t)
                 }));
                 
                 if (updatedTask.is_completed) {
                     await NotificationService.cancelTodo(updatedTask.id);
                 } else if (updatedTask.due_date) {
                     await NotificationService.scheduleTodo(updatedTask);
                 }
            }
            showToast('Task updated successfully', 'success');
        } catch (error) {
            console.error('Update task error:', error);
            setTasksByDate(prev => ({
                ...prev,
                [targetDateStr!]: prevState
            }));
            showToast('Failed to update task', 'error');
        } finally {
            removeMutation(targetDateStr);
        }
    };

    const deleteTask = async (id: string) => {
        let foundDateStr: string | null = null;
        
        // Find which date holds this task to isolate mutation lock and backup state
        for (const [date, tasks] of Object.entries(tasksByDate)) {
            if (tasks.find(t => t.id === id)) {
                foundDateStr = date;
                break;
            }
        }

        if (foundDateStr) {
            addMutation(foundDateStr);
        }
        
        // Save full prevState just in case
        const prevState = { ...tasksByDate };
        
        // Defensively scrub the ID from ALL date buckets to ensure immediate UI update everywhere
        setTasksByDate(prev => {
            const next = { ...prev };
            for (const date of Object.keys(next)) {
                next[date] = next[date].filter(t => t.id !== id);
            }
            return next;
        });

        try {
            await api.deleteTodo(id);
            await NotificationService.cancelTodo(id);
            showToast('Task deleted successfully', 'success');
        } catch (error) {
            console.error('Delete task error:', error);
            setTasksByDate(prevState); // Restore full state on error
            showToast('Failed to delete task', 'error');
        } finally {
            if (foundDateStr) {
                removeMutation(foundDateStr);
            }
        }
    };

    return (
        <TasksContext.Provider value={{
            tasksByDate,
            loadingTasks,
            getTasks,
            fetchTasks,
            addTask,
            updateTask,
            deleteTask
        }}>
            {children}
        </TasksContext.Provider>
    );
};

export const useTasks = () => {
    const context = useContext(TasksContext);
    if (!context) throw new Error('useTasks must be used within a TasksProvider');
    return context;
};
