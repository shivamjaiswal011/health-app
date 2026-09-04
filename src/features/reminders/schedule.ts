import * as Notifications from 'expo-notifications';

export const REMINDER_HOUR = 20;
const REMINDER_MINUTE = 0;

/**
 * A single daily nudge, scheduled with the operating system rather than by the app.
 *
 * The OS holds the schedule and fires it, so the app is not woken to decide whether to
 * remind anyone — which is what keeps a closed app at zero battery cost. Waking to
 * check would undo the whole reason this app has no background work.
 */
export async function scheduleDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Log today',
      body: 'A minute now beats reconstructing the day tomorrow.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** True when the user allowed notifications; false is a decision, not a failure. */
export async function requestReminderPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function hasScheduledReminder(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length > 0;
}
