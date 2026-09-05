import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { WEIGHT_UNITS, type WeightUnit } from '@/domain/units/weight';
import { shareBackup } from '@/features/backup/share-backup';
import {
  cancelDailyReminder,
  hasScheduledReminder,
  REMINDER_HOUR,
  requestReminderPermission,
  scheduleDailyReminder,
} from '@/features/reminders/schedule';
import {
  bodyweightUnit,
  displayUnit,
  setBodyweightUnit,
  setDisplayUnit,
} from '@/features/settings/units';
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
        <Text className="text-[17px] text-content">{title}</Text>
        <Text className="mt-1 text-[13px] leading-[18px] text-content-muted">{detail}</Text>
      </View>
      {children}
    </View>
  );
}

/** A two-way segmented picker. Both units are always visible, so neither is hidden behind a tap. */
function UnitPicker({ value, onChange }: { value: WeightUnit; onChange: (u: WeightUnit) => void }) {
  return (
    <View className="flex-row gap-1 rounded-xl bg-surface-sunken p-1">
      {WEIGHT_UNITS.map((unit) => (
        <Pressable
          key={unit}
          onPress={() => onChange(unit)}
          accessibilityRole="radio"
          accessibilityState={{ selected: unit === value }}
          accessibilityLabel={unit}
          className={`h-9 w-12 items-center justify-center rounded-lg ${unit === value ? 'bg-surface-raised' : ''}`}>
          <Text
            className={`text-[15px] ${unit === value ? 'font-semibold text-content' : 'text-content-muted'}`}>
            {unit}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Totals, charts and records read in one unit, chosen here. It is a display choice
 * only: individual sets keep whatever unit they were logged in, so a leg press marked
 * in pounds still reads in pounds while the weekly tonnage adds up in kilograms.
 */
function UnitSettings() {
  const [display, setDisplay] = useState(displayUnit);
  const [bodyweight, setBodyweight] = useState(bodyweightUnit);

  function chooseDisplay(unit: WeightUnit) {
    setDisplayUnit(unit);
    setDisplay(unit);
  }

  function chooseBodyweight(unit: WeightUnit) {
    setBodyweightUnit(unit);
    setBodyweight(unit);
  }

  return (
    <>
      <SettingRow
        title="Weight units"
        detail="Used for totals, charts and records. Each set still shows the unit you typed it in.">
        <UnitPicker value={display} onChange={chooseDisplay} />
      </SettingRow>
      <SettingRow title="Bodyweight" detail="Whatever your bathroom scale reads.">
        <UnitPicker value={bodyweight} onChange={chooseBodyweight} />
      </SettingRow>
    </>
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
        <Text className="text-[17px] font-semibold text-accent">Export</Text>
      </Pressable>
    </SettingRow>
  );
}

export default function SettingsScreen() {
  return (
    <Screen>
      <ScreenHeader left={{ label: 'Back', onPress: () => router.back(), tone: 'muted' }} />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">Settings</Text>
      <ScrollView contentContainerClassName="px-5 pb-10">
        <UnitSettings />
        <ReminderSetting />
        <BackupSetting />
        <SettingRow
          title="Daily targets"
          detail="Calories and macros. Applies from today onward; days already logged keep theirs.">
          <Pressable onPress={() => router.push('/diet/targets')} className="active:opacity-60">
            <Text className="text-[17px] font-semibold text-accent">Edit</Text>
          </Pressable>
        </SettingRow>

        <Text className="pt-8 text-[13px] leading-[19px] text-content-faint">
          Everything you log stays on this device. There is no account, no server, and nothing is
          sent anywhere. Food data comes from USDA FoodData Central (public domain), with Indian
          dishes composed from those ingredients.
        </Text>
      </ScrollView>
    </Screen>
  );
}
