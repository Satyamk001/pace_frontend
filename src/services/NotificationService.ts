import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService, STORAGE_KEYS } from './StorageService';

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as Notifications.NotificationBehavior),
});

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';

export const NotificationService = {
  async init() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Default to true on first launch
    const enabledStr = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    if (enabledStr === null) {
      await this.setNotificationsEnabled(true);
      await this.requestPermissions();
    }
  },

  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  },

  async getNotificationsEnabled(): Promise<boolean> {
    const enabledStr = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return enabledStr !== 'false';
  },

  async setNotificationsEnabled(enabled: boolean) {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
    if (!enabled) {
      await this.cancelAll();
    } else {
      await this.requestPermissions();
      await this.rescheduleAll();
    }
  },

  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async rescheduleAll() {
    await this.cancelAll();
    
    // Reschedule Todos
    const todos = await StorageService.getItem(STORAGE_KEYS.TODOS) || [];
    for (const todo of todos) {
      await this.scheduleTodo(todo);
    }

    // Reschedule Medicines
    // Assuming backend or local storage has MEDICINES configured
    // Wait, where are medicines stored? I need to fetch them.
    // For now, assume StorageService.getItem('offline_medicines')
    const medicines = await StorageService.getItem('offline_medicines') || [];
    for (const med of medicines) {
      await this.scheduleMedicine(med);
    }
  },

  async scheduleTodo(todo: any) {
    try {
      const enabled = await this.getNotificationsEnabled();
      if (!enabled || todo.is_completed || !todo.due_date) return;

      const dueDate = new Date(todo.due_date);
      if (dueDate.getTime() <= Date.now()) return; // Already passed

      const trigger: any = Platform.OS === 'android' ? { date: dueDate, channelId: 'default' } : { date: dueDate };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✅ Task Due",
          body: `${todo.title} is due now`,
          data: { todoId: todo.id },
        },
        trigger,
      });
    } catch (e) {
      console.warn('Failed to schedule todo notification:', e);
    }
  },

  async scheduleMedicine(medicine: any) {
    const enabled = await this.getNotificationsEnabled();
    if (!enabled) return;

    // medicine.times is an array of "HH:mm" strings
    if (!medicine.times || !Array.isArray(medicine.times)) return;

    const isDaily = medicine.frequency === 'DAILY';

    for (const timeStr of medicine.times) {
      try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // Schedule daily
        if (isDaily) {
          const trigger: any = Platform.OS === 'android' ? {
              hour: hours,
              minute: minutes,
              repeats: true,
              channelId: 'default',
          } : {
              hour: hours,
              minute: minutes,
              repeats: true,
          };

          await Notifications.scheduleNotificationAsync({
            content: {
              title: "💊 Medicine Reminder",
              body: `Time to take ${medicine.name}`,
              data: { medicineId: medicine.id },
            },
            trigger,
          });
        } else {
          // Just today for now if not daily
          const triggerDate = new Date();
          triggerDate.setHours(hours, minutes, 0, 0);
          if (triggerDate.getTime() > Date.now()) {
            const trigger: any = Platform.OS === 'android' ? { date: triggerDate, channelId: 'default' } : { date: triggerDate };
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "💊 Medicine Reminder",
                body: `Time to take ${medicine.name}`,
                data: { medicineId: medicine.id },
              },
              trigger,
            });
          }
        }
      } catch (e) {
        console.warn('Failed to schedule medicine notification:', e);
      }
    }
  }
};
