import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


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
      // Note: individual screens handle scheduling when notifications are re-enabled
    }
  },

  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async cancelMedicine(medicineId: string, times: string[] = []) {
    for (const timeStr of times) {
      try {
        await Notifications.cancelScheduledNotificationAsync(`med-${medicineId}-${timeStr}`);
      } catch (e) {
        // Notification may not exist, ignore
      }
    }
    // Also try without specific times — cancel any remaining med notifications
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.identifier.startsWith(`med-${medicineId}-`)) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } catch (e) {
      console.warn('Failed to cancel medicine notifications:', e);
    }
  },

  async rescheduleAll(todos: any[] = [], medicines: any[] = []) {
    await this.cancelAll();
    
    // Reschedule Todos
    for (const todo of todos) {
      await this.scheduleTodo(todo);
    }

    // Reschedule Medicines
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
          trigger = { type: 'calendar', hour: dueDate.getHours(), minute: dueDate.getMinutes(), repeats: true };
      } else if (repeatType === 'WEEKLY') {
          // Expo weekday format: 1=Sun, 2=Mon... JS getDay() returns 0=Sun
          trigger = { type: 'calendar', weekday: dueDate.getDay() + 1, hour: dueDate.getHours(), minute: dueDate.getMinutes(), repeats: true };
      } else if (repeatType === 'MONTHLY') {
          trigger = { type: 'calendar', day: dueDate.getDate(), hour: dueDate.getHours(), minute: dueDate.getMinutes(), repeats: true };
      } else if (repeatType === 'YEARLY') {
          trigger = { type: 'calendar', month: dueDate.getMonth(), day: dueDate.getDate(), hour: dueDate.getHours(), minute: dueDate.getMinutes(), repeats: true };
      } else {
          // Explicitly validate that the localized single-occurrence Date is securely in the future
          // Expo absolute Date triggers will FIRE INSTANTLY if evaluating to the past.
          if (dueDate.getTime() <= Date.now()) {
            return;
          }
          trigger = { type: 'date', date: dueDate };
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
            type: 'calendar',
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
            trigger = { type: 'date', date: triggerDate };
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
