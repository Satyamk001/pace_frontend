import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { createApiService } from '../services/api';
import { StorageService } from '../services/StorageService';

import { OfflineSyncService } from '../services/OfflineSyncService';

interface OfflineContextType {
  isOffline: boolean;
  lastSynced: string | null;
  syncAllData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [isOffline, setIsOffline] = useState(false);
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

    return () => unsubscribe();
  }, []);

  const syncAllData = async () => {
    if (isOffline) return;
    try {
      // 1. Push any pending UI edits to the server
      await OfflineSyncService.syncPendingRequests(getToken);
      
      // 2. Pull down aggressive 7-day deep cache + global stats 
      await OfflineSyncService.sync7DaysHistory(getToken);
      
      const now = new Date().toISOString();
      setLastSynced(now);
      
      console.log('Full data sync complete via OfflineSyncService');
    } catch (e) {
      console.error('Failed to pull sync data via OfflineSyncService', e);
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
    <OfflineContext.Provider value={{ isOffline, lastSynced, syncAllData }}>
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
