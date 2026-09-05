import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { shareBackup } from '@/features/backup/share-backup';
import {
  cancelDailyReminder,
  hasScheduledReminder,
  REMINDER_HOUR,
  requestReminderPermission,
  scheduleDailyReminder,
} from '@/features/reminders/schedule';
import { announceFailure, reportFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

function SettingRow({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-4 border-b border-line py-4">
      <View className="flex-1">
        <Text className="text-base text-content">{title}</Text>
        <Text className="mt-0.5 text-xs leading-4 text-content-muted">{detail}</Text>
      </View>
      {children}
    </View>
  );
}

function ReminderSetting() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    hasScheduledReminder()
      .then(setEnabled)
      .catch((cause) => reportFailure('Reading reminder settings', cause));
  }, []);

  async function toggle(next: boolean) {
    if (!next) {
      await cancelDailyReminder();
      setEnabled(false);
      return;
    }
    const allowed = await requestReminderPermission();
    if (!allowed) {
      Alert.alert('Notifications are off', 'Turn them on for this app in Settings first.');
      return;
    }
    await scheduleDailyReminder();
    setEnabled(true);
  }

  return (
    <SettingRow
      title="Daily reminder"
      detail={`One notification at ${REMINDER_HOUR}:00. Scheduled by the system, so the app stays closed until you open it.`}>
      <Switch
        value={enabled}
        onValueChange={(next) =>
          toggle(next).catch((cause) => announceFailure('Changing the reminder', cause))
        }
      />
    </SettingRow>
  );
}

function BackupSetting() {
  function handleExport() {
    shareBackup()
      .then((result) =>
        Alert.alert('Backup ready', `${result.rows} records written to ${result.fileName}.`),
      )
      .catch((cause) => announceFailure('Exporting your data', cause));
  }

  return (
    <SettingRow
      title="Export your data"
      detail="Everything you have logged, as one JSON file. It goes wherever you send it — the app uploads nothing.">
      <Pressable onPress={handleExport} className="active:opacity-60">
        <Text className="text-sm font-semibold text-accent">Export</Text>
      </Pressable>
    </SettingRow>
  );
}

export default function SettingsScreen() {
  return (
    <Screen>
      <ScreenHeader left={{ label: 'Back', onPress: () => router.back(), tone: 'muted' }} />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">Settings</Text>
      <ScrollView contentContainerClassName="px-5 pb-8">
        <ReminderSetting />
        <BackupSetting />
        <SettingRow
          title="Daily targets"
          detail="Calories and macros. Applies from today onward; days already logged keep theirs.">
          <Pressable onPress={() => router.push('/diet/targets')} className="active:opacity-60">
            <Text className="text-sm font-semibold text-accent">Edit</Text>
          </Pressable>
        </SettingRow>

        <Text className="pt-6 text-xs leading-4 text-content-faint">
          Everything you log stays on this device. There is no account, no server, and nothing is
          sent anywhere. Food data comes from USDA FoodData Central (public domain), with Indian
          dishes composed from those ingredients.
        </Text>
      </ScrollView>
    </Screen>
  );
}
