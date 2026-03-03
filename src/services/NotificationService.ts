import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ────────────────────────────────────────────────────────────────────
// Foreground handler — show notifications even when the app is open
// ────────────────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,   // heads-up / pop-over banner
    shouldShowList: true,     // appears in notification shade
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

const TAG = '[NotificationService]';
const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';
const isNative = Platform.OS === 'android' || Platform.OS === 'ios';

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

/** Safely cancel a notification — never throws. */
async function safeCancel(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Notification may not exist — safe to ignore
  }
}

/** Cancel all notifications whose identifier starts with a given prefix. */
async function cancelByPrefix(prefix: string): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      if (n.identifier.startsWith(prefix)) {
        await safeCancel(n.identifier);
      }
    }
  } catch (e) {
    console.warn(TAG, 'cancelByPrefix error:', e);
  }
}

/**
 * FIX Bug 4: Always request permissions before scheduling.
 * Returns true if granted, false otherwise.
 */
async function ensurePermissions(): Promise<boolean> {
  if (!isNative) return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;

  // Ask the OS
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  const granted = newStatus === 'granted';
  console.log(TAG, 'Permission re-check:', granted ? 'GRANTED ✅' : 'DENIED ❌');
  return granted;
}

// ────────────────────────────────────────────────────────────────────
// Public Service
// ────────────────────────────────────────────────────────────────────

export const NotificationService = {

  // ─── Initialisation ──────────────────────────────────────────────
  async init() {
    console.log(TAG, 'init() — starting');
    if (!isNative) { console.log(TAG, 'Skipping on non-native platform'); return; }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
      console.log(TAG, 'Android notification channel "default" created');
    }

    // FIX Bug 4: Always request permissions on every init, not just once.
    // We still store the enabled flag so the toggle in ProfileScreen works.
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    if (stored === null) {
      // First launch — set enabled true and request
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
    }
    // Always request on every launch so users who previously denied can grant
    await this.requestPermissions();

    console.log(TAG, 'init() — done');
  },

  // ─── Permissions ────────────────────────────────────────────────
  async requestPermissions(): Promise<boolean> {
    if (!isNative) return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    const granted = finalStatus === 'granted';
    console.log(TAG, 'Permissions:', granted ? 'GRANTED ✅' : 'DENIED ❌');
    return granted;
  },

  // ─── Toggle ──────────────────────────────────────────────────────
  async getNotificationsEnabled(): Promise<boolean> {
    const v = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return v !== 'false';
  },

  async setNotificationsEnabled(enabled: boolean) {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
    console.log(TAG, 'Notifications', enabled ? 'ENABLED' : 'DISABLED');

    if (!enabled) {
      await this.cancelAll();
    } else {
      await this.requestPermissions();
    }
  },

  // ─── Cancel helpers ──────────────────────────────────────────────
  async cancelAll() {
    if (!isNative) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log(TAG, 'All scheduled notifications cancelled');
  },

  async cancelTodo(todoId: string) {
    if (!isNative) return;
    await cancelByPrefix(`todo-${todoId}`);
    console.log(TAG, `Cancelled notifications for todo ${todoId}`);
  },

  async cancelMedicine(medicineId: string, _times: string[] = []) {
    if (!isNative) return;
    await cancelByPrefix(`med-${medicineId}`);
    console.log(TAG, `Cancelled notifications for medicine ${medicineId}`);
  },

  // ─── Reschedule All ──────────────────────────────────────────────
  async rescheduleAll(todos: any[] = [], medicines: any[] = []) {
    if (!isNative) return;
    await this.cancelAll();

    for (const todo of todos) {
      await this.scheduleTodo(todo);
    }
    for (const med of medicines) {
      if (!med.is_taken && !med.is_completed) {
        await this.scheduleMedicine(med);
      }
    }

    console.log(TAG, `rescheduleAll — ${todos.length} todos, ${medicines.length} medicines`);
  },

  // ─── Schedule Todo ───────────────────────────────────────────────
  async scheduleTodo(todo: any) {
    if (!isNative) return;
    try {
      const enabled = await this.getNotificationsEnabled();
      if (!enabled) { console.log(TAG, 'scheduleTodo — notifications disabled, skipping'); return; }
      if (todo.is_completed) { console.log(TAG, 'scheduleTodo — task completed, skipping'); return; }
      if (!todo.due_date) { console.log(TAG, 'scheduleTodo — no due_date, skipping'); return; }

      // FIX Bug 4: ensure permissions before scheduling
      const hasPermission = await ensurePermissions();
      if (!hasPermission) {
        console.warn(TAG, 'scheduleTodo — no permission, skipping');
        return;
      }

      const identifier = `todo-${todo.id}`;
      await safeCancel(identifier);

      const dueDate = new Date(todo.due_date);
      const repeatType: string = (todo.repeatType || todo.repeat_type || 'NONE').toUpperCase();

      let trigger: Notifications.NotificationTriggerInput;

      if (repeatType === 'DAILY') {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: dueDate.getHours(),
          minute: dueDate.getMinutes(),
          channelId: Platform.OS === 'android' ? 'default' : undefined,
        } as any;
      } else if (repeatType === 'WEEKLY') {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: dueDate.getDay() + 1, // JS: 0=Sun → Expo: 1=Sun
          hour: dueDate.getHours(),
          minute: dueDate.getMinutes(),
          channelId: Platform.OS === 'android' ? 'default' : undefined,
        } as any;
      } else if (repeatType === 'MONTHLY') {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
          day: dueDate.getDate(),
          hour: dueDate.getHours(),
          minute: dueDate.getMinutes(),
          channelId: Platform.OS === 'android' ? 'default' : undefined,
        } as any;
      } else if (repeatType === 'YEARLY') {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.YEARLY,
          month: dueDate.getMonth(), // 0-indexed, matches JS Date
          day: dueDate.getDate(),
          hour: dueDate.getHours(),
          minute: dueDate.getMinutes(),
          channelId: Platform.OS === 'android' ? 'default' : undefined,
        } as any;
      } else {
        // One-time notification — must be in the future
        if (dueDate.getTime() <= Date.now()) {
          console.log(TAG, `scheduleTodo — due_date is in the past, skipping (${dueDate.toISOString()})`);
          return;
        }
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dueDate,
          channelId: Platform.OS === 'android' ? 'default' : undefined,
        } as any;
      }

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: '✅ Task Due',
          body: `${todo.title} is due now`,
          data: { todoId: todo.id },
          sound: 'default',
        },
        trigger,
      });

      console.log(TAG, `scheduleTodo ✅ id=${identifier} type=${repeatType} local=${dueDate.toLocaleString()}`);
    } catch (e) {
      console.error(TAG, 'scheduleTodo FAILED:', e);
    }
  },

  // ─── Schedule Medicine ───────────────────────────────────────────
  async scheduleMedicine(medicine: any) {
    if (!isNative) return;
    try {
      const enabled = await this.getNotificationsEnabled();
      if (!enabled) { console.log(TAG, 'scheduleMedicine — notifications disabled, skipping'); return; }
      if (!medicine.times || !Array.isArray(medicine.times) || medicine.times.length === 0) {
        console.log(TAG, 'scheduleMedicine — no times array, skipping');
        return;
      }

      // FIX Bug 4: ensure permissions before scheduling
      const hasPermission = await ensurePermissions();
      if (!hasPermission) {
        console.warn(TAG, 'scheduleMedicine — no permission, skipping');
        return;
      }

      await cancelByPrefix(`med-${medicine.id}`);

      const now = new Date();

      for (const timeStr of medicine.times) {
        if (typeof timeStr !== 'string') continue;

        const parts = timeStr.split(':');
        if (parts.length !== 2) continue;

        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (isNaN(hours) || isNaN(minutes)) continue;

        // FIX: DAILY trigger uses Android's inexact AlarmManager.setRepeating()
        // which the OS can delay by 1-3 min for battery savings.
        // Instead, schedule 30 individual exact DATE triggers (one per day).
        // Expo's DATE trigger uses setExactAndAllowWhileIdle → fires on time.
        let scheduled = 0;
        for (let day = 0; day <= 60 && scheduled < 30; day++) {
          const fireTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + day,
            hours,
            minutes,
            0,
            0,
          );

          // Skip times already in the past
          if (fireTime.getTime() <= now.getTime()) continue;

          // Unique id encodes medicine + time slot + date so cancelByPrefix works
          const dateKey = `${fireTime.getFullYear()}${String(fireTime.getMonth() + 1).padStart(2, '0')}${String(fireTime.getDate()).padStart(2, '0')}`;
          const identifier = `med-${medicine.id}-${timeStr}-${dateKey}`;

          await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
              title: '💊 Medicine Reminder',
              body: `Time to take ${medicine.name}`,
              data: { medicineId: medicine.id },
              sound: 'default',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: fireTime,
              channelId: Platform.OS === 'android' ? 'default' : undefined,
            } as any,
          });

          scheduled++;
        }

        console.log(TAG, `scheduleMedicine ✅ med-${medicine.id} at ${timeStr} (${scheduled} exact daily triggers)`);
      }
    } catch (e) {
      console.error(TAG, 'scheduleMedicine FAILED:', e);
    }
  },

  // ─── Debug helper ────────────────────────────────────────────────
  async debugListScheduled() {
    if (!isNative) { console.log(TAG, 'debugListScheduled — skipped (web)'); return; }
    try {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      console.log(TAG, `─── ${all.length} scheduled notification(s) ───`);
      for (const n of all) {
        console.log(TAG, `  • ${n.identifier}  trigger:`, JSON.stringify(n.trigger));
      }
      console.log(TAG, '─── end ───');
    } catch (e) {
      console.warn(TAG, 'debugListScheduled error:', e);
    }
  },
};
