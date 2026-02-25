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
    // Consume from the exact synced offline DB state
    const medicines = await StorageService.getItem(STORAGE_KEYS.MEDICINES) || [];
    for (const med of medicines) {
      if (!med.is_taken || !med.is_completed) {
        await this.scheduleMedicine(med);
      }
    }
  },

  async scheduleTodo(todo: any) {
    try {
      const enabled = await this.getNotificationsEnabled();
      if (!enabled || todo.is_completed || !todo.due_date) return;

      const identifier = `todo-${todo.id}`;
      // Prevent duplicate stacking by clearing existing IDs first
      await Notifications.cancelScheduledNotificationAsync(identifier);

      // Parse absolute database UTC timestamp into local device clock Date object
      const dueDate = new Date(todo.due_date);
      const repeatType = todo.repeatType || todo.repeat_type || 'NONE';

      let trigger: any = {};
      
      if (repeatType === 'DAILY') {
          trigger = { hour: dueDate.getHours(), minute: dueDate.getMinutes(), repeats: true };
      } else if (repeatType === 'WEEKLY') {
          // Expo weekday format: 1=Sun, 2=Mon... JS getDay() returns 0=Sun
          trigger = { weekday: dueDate.getDay() + 1, hour: dueDate.getHours(), minute: dueDate.getMinutes(), repeats: true };
      } else if (repeatType === 'MONTHLY') {
          trigger = { day: dueDate.getDate(), hour: dueDate.getHours(), minute: dueDate.getMinutes(), repeats: true };
      } else if (repeatType === 'YEARLY') {
          trigger = { month: dueDate.getMonth(), day: dueDate.getDate(), hour: dueDate.getHours(), minute: dueDate.getMinutes(), repeats: true };
      } else {
          // Explicitly validate that the localized single-occurrence Date is securely in the future
          // Expo absolute Date triggers will FIRE INSTANTLY if evaluating to the past.
          if (dueDate.getTime() <= Date.now()) {
            return;
          }
          trigger = { date: dueDate };
      }

      if (Platform.OS === 'android') {
          trigger.channelId = 'default';
      }

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: "✅ Task Due",
          body: `${todo.title} is due now`,
          data: { todoId: todo.id },
          sound: true,
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
      if (typeof timeStr !== 'string') continue;
      
      const identifier = `med-${medicine.id}-${timeStr}`;
      await Notifications.cancelScheduledNotificationAsync(identifier);

      try {
        const parts = timeStr.split(':');
        if (parts.length !== 2) continue;
        
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        
        if (isNaN(hours) || isNaN(minutes)) continue;

        let trigger: any = {
            hour: hours,
            minute: minutes,
            repeats: isDaily
        };

        if (!isDaily) {
            // If not daily, explicitly target today's date
            const triggerDate = new Date();
            triggerDate.setHours(hours, minutes, 0, 0);
            
            if (triggerDate.getTime() <= Date.now()) {
                // If the specific time today has already passed and it doesn't repeat, do not schedule.
                continue;
            }
            trigger = { date: triggerDate };
        }

        if (Platform.OS === 'android') {
            trigger.channelId = 'default';
        }

        await Notifications.scheduleNotificationAsync({
          identifier,
          content: {
            title: "💊 Medicine Reminder",
            body: `Time to take ${medicine.name}`,
            data: { medicineId: medicine.id },
            sound: true,
          },
          trigger,
        });
      } catch (e) {
        console.warn(`Failed to schedule medicine notification for ${timeStr}:`, e);
      }
    }
  },
};
