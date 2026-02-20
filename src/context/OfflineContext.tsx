import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { createApiService } from '../services/api';
import { StorageService } from '../services/StorageService';

// Define the shape of a sync item
interface SyncItem {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body?: any;
  timestamp: number;
}

interface OfflineContextType {
  isOffline: boolean;
  lastSynced: string | null;
  queueRequest: (url: string, method: string, body?: any) => Promise<void>;
  syncPendingRequests: () => Promise<void>;
  syncAllData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [queue, setQueue] = useState<SyncItem[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    // 1. Monitor Network State
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const offline = state.isConnected === false;
      setIsOffline(offline);
      if (!offline) {
        syncAllData();
      }
    });

    // 2. Load Queue from Storage
    loadQueue();

    return () => unsubscribe();
  }, []);

  const loadQueue = async () => {
    try {
      const storedQueue = await AsyncStorage.getItem('offline_queue');
      if (storedQueue) {
        setQueue(JSON.parse(storedQueue));
      }
      const synced = await AsyncStorage.getItem('last_synced');
      if (synced) {
        setLastSynced(synced);
      }
    } catch (e) {
      console.error('Failed to load offline queue details', e);
    }
  };

  const saveQueue = async (newQueue: SyncItem[]) => {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(newQueue));
      setQueue(newQueue);
    } catch (e) {
      console.error('Failed to save offline queue', e);
    }
  };

  const queueRequest = async (url: string, method: string, body?: any) => {
    const newItem: SyncItem = {
      id: Date.now().toString(),
      url,
      method: method as any,
      body,
      timestamp: Date.now(),
    };
    const newQueue = [...queue, newItem];
    await saveQueue(newQueue);
    console.log('Request queued:', newItem);
  };

  const syncPendingRequests = async () => {
    if (queue.length === 0) return;

    console.log('Syncing pending requests...', queue.length);
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const remainingQueue: SyncItem[] = [];

    for (const item of queue) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers,
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (!res.ok) {
           // If 5xx error, keep in queue? For now, we assume if it fails it might be bad data or server issue
           // We'll retry 5xx, discard 4xx.
           if (res.status >= 500) {
              remainingQueue.push(item);
           }
           console.error(`Failed to sync item ${item.id}: ${res.status}`);
        } else {
             console.log(`Synced item ${item.id}`);
        }
      } catch (error) {
        console.error(`Network error syncing item ${item.id}`, error);
        remainingQueue.push(item); // Keep if network error
      }
    }

    await saveQueue(remainingQueue);
  };

  const syncAllData = async () => {
    if (isOffline) return;
    try {
      await syncPendingRequests();
      
      const api = createApiService(getToken);
      const [todos, calendar, medicines] = await Promise.all([
           api.getTodos(),
           api.getCalendarData(),
           api.getMedicines()
      ]);
      
      await StorageService.syncTodos(todos);
      await StorageService.syncCalendar(calendar);
      await StorageService.syncMedicines(medicines);
      
      const now = new Date().toISOString();
      setLastSynced(now);
      await AsyncStorage.setItem('last_synced', now);
      
      console.log('Full data sync complete');
    } catch (e) {
      console.error('Failed to pull sync data', e);
    }
  };

  useEffect(() => {
    // Call syncAllData when coming back to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && !isOffline) {
        syncAllData();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [isOffline]);

  return (
    <OfflineContext.Provider value={{ isOffline, lastSynced, queueRequest, syncPendingRequests, syncAllData }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
