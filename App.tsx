import 'react-native-gesture-handler';
import React from 'react';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { MoodProvider } from './src/context/MoodContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

export default function App() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <ActionSheetProvider>
          <MoodProvider>
            <SafeAreaProvider>
              <MainAppContent />
            </SafeAreaProvider>
          </MoodProvider>
        </ActionSheetProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

import { NotificationService } from './src/services/NotificationService';

const MainAppContent = () => {
    const [isSplashVisible, setIsSplashVisible] = React.useState(true);
    
    React.useEffect(() => {
        NotificationService.init();
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
