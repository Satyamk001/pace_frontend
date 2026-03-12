import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { MoodProvider } from './src/context/MoodContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GlobalErrorBoundary } from './src/components/GlobalErrorBoundary';
import { View, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { ToastProvider } from './src/contexts/ToastContext';
import { TasksProvider } from './src/contexts/TasksContext';
import { NotificationService } from './src/services/NotificationService';

if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      overflow-x: hidden;
      overflow-y: hidden;
      width: 100%;
      height: 100%;
      overscroll-behavior-y: none;
    }
    
    /* Hide scrollbar for Chrome, Safari and Opera */
    *::-webkit-scrollbar {
      display: none;
    }
    
    /* Hide scrollbar for IE, Edge and Firefox */
    * {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
  `;
  document.head.append(style);
}

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env');
}

const ServiceGuard = ({ children }: { children: React.ReactNode }) => {
    const { isLoaded, isSignedIn } = useAuth();
    const [backendStatus, setBackendStatus] = useState<'checking' | 'ok' | 'error'>('checking');
    const [hasValidOfflineSession, setHasValidOfflineSession] = useState<boolean | null>(null);

    useEffect(() => {
        let isMounted = true;
        const checkServices = async () => {
             try {
                 const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
                 const rootUrl = BACKEND_URL.replace('/api', '');
                 const controller = new AbortController();
                 const id = setTimeout(() => controller.abort(), 8000);
                 
                 // Ping backend root
                 await fetch(rootUrl, { signal: controller.signal });
                 clearTimeout(id);
                 if (isMounted) setBackendStatus('ok');
             } catch (e) {
                 if (isMounted) setBackendStatus('error');
             }
        };
        checkServices();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isLoaded && backendStatus !== 'error') {
                setBackendStatus('error');
            }
        }, 15000);
        return () => clearTimeout(timer);
    }, [isLoaded, backendStatus]);

    useEffect(() => {
        const checkOfflineSession = async () => {
            if (isLoaded && isSignedIn) {
                await AsyncStorage.setItem('offline_session_timestamp', Date.now().toString());
                setHasValidOfflineSession(true);
            } else {
                const cached = await AsyncStorage.getItem('offline_session_timestamp');
                if (cached && Date.now() - parseInt(cached) < 7 * 24 * 60 * 60 * 1000) {
                    setHasValidOfflineSession(true);
                } else {
                    setHasValidOfflineSession(false);
                }
            }
        };
        // Don't wait for isLoaded if we want offline first to bypass Clerk completely
        checkOfflineSession();
    }, [isLoaded, isSignedIn]);

    // If backend is down, but we don't have an offline session -> Show error
    if (backendStatus === 'error' && hasValidOfflineSession === false) {
         throw new Error("We're having trouble connecting to our services. Please check your internet connection or try again later.");
    }

    // Still checking everything, or waiting for clerk with NO local bypass
    if ((!isLoaded && !hasValidOfflineSession) || backendStatus === 'checking' || hasValidOfflineSession === null) {
         return <View style={{ flex: 1, backgroundColor: '#F0EEE9' }} />; 
    }

    return <>{children}</>;
};

export default function App() {
  return (
    <GlobalErrorBoundary>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <ServiceGuard>
          <ActionSheetProvider>
            <MoodProvider>
              <SafeAreaProvider>
                <ToastProvider>
                  <TasksProvider>
                    <MainAppContent />
                  </TasksProvider>
                </ToastProvider>
              </SafeAreaProvider>
            </MoodProvider>
          </ActionSheetProvider>
        </ServiceGuard>
      </ClerkProvider>
    </GlobalErrorBoundary>
  );
}



function MainAppContent() {
    const [isSplashVisible, setIsSplashVisible] = React.useState(true);
    // FIX Bug 8: hold the listener subscription so we can remove it on unmount
    const notifListenerRef = useRef<Notifications.Subscription | null>(null);

    React.useEffect(() => {
        NotificationService.init().then(() => {
            NotificationService.debugListScheduled();
        });

        // FIX Bug 8: Handle notification taps (foreground + background)
        notifListenerRef.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data as any;
            console.log('[App] Notification tapped:', data);
            // Navigation from here requires a navigationRef; the handlers in
            // individual screens already cover the in-app case. This listener
            // ensures the app wakes and the data is logged for future deep linking.
        });

        return () => {
            if (notifListenerRef.current) {
                notifListenerRef.current.remove();
            }
        };
    }, []);

    return (
        <React.Fragment>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <AppNavigator />
                {isSplashVisible && (
                    <SplashScreen onFinish={() => setIsSplashVisible(false)} />
                )}
            </GestureHandlerRootView>
        </React.Fragment>
    );
};
