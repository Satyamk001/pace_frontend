import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { STORAGE_KEYS } from '../services/StorageService';
import { createApiService } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';

interface SubscriptionContextType {
    isProUser: boolean;
    setProStatus: (status: boolean) => Promise<void>;
    checkSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
    const [isProUser, setIsProUser] = useState(false);
    const { getToken, isLoaded } = useAuth();

    useEffect(() => {
        loadStatus();

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkSubscriptionStatus();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const loadStatus = async () => {
        try {
            const storedStatus = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
            if (storedStatus !== null) {
                setIsProUser(storedStatus === 'true');
            }
            // we could also fetch from API here via `api.getSubscriptionStatus()`
            await checkSubscriptionStatus();
        } catch (error) {
            console.error('Failed to load subscription status', error);
        }
    };

    const checkSubscriptionStatus = async () => {
        if (!isLoaded) return;
        try {
            const api = createApiService(getToken);
            const status = await api.getSubscriptionStatus();
            if (status && typeof status.is_premium === 'boolean') {
                setIsProUser(status.is_premium);
                await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, status.is_premium.toString());
            }
        } catch (error) {
            console.error('Failed to verify subscription status from backend', error);
        }
    };

    const setProStatus = async (status: boolean) => {
        setIsProUser(status);
        await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, status.toString());
    };

    return (
        <SubscriptionContext.Provider value={{ isProUser, setProStatus, checkSubscriptionStatus }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
