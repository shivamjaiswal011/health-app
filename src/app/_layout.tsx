import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { router, Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import * as SplashScreen from 'expo-splash-screen';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { database } from '@/db/client';
import { ErrorBoundary } from '@/ui/error-boundary';
import migrations from '@/db/migrations/migrations';
import { useFirstRun } from '@/features/onboarding/first-run';
import { useCatalogueSeed } from '@/db/seed/use-catalogue-seed';

import '../global.css';

SplashScreen.preventAutoHideAsync();

function MigrationFailure({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-surface px-8">
      <Text className="text-center text-base font-semibold text-danger">
        Could not prepare the database
      </Text>
      <Text className="mt-2 text-center text-sm text-content-muted">{message}</Text>
    </View>
  );
}

/**
 * Sends a brand-new install to onboarding once, after the schema is ready. Rendered
 * inside the navigator rather than beside it, because `router` needs a mounted one.
 */
function FirstRunRedirect({ ready }: { ready: boolean }) {
  const firstRun = useFirstRun(ready);

  useEffect(() => {
    if (firstRun === 'needs-onboarding') router.replace('/onboarding');
  }, [firstRun]);

  return null;
}

/**
 * Holds the UI until the schema is current. Rendering screens against a stale database
 * is worse than a brief hold — every query below assumes the migration ran.
 */
function MigrationGate({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(database, migrations);
  const seed = useCatalogueSeed(success);
  const ready = success && seed.seeded;
  const failure = error ?? seed.error;

  useEffect(() => {
    if (ready || failure) SplashScreen.hideAsync();
  }, [ready, failure]);

  if (failure) return <MigrationFailure message={failure.message} />;
  if (!ready) return <View className="flex-1 bg-surface" />;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <KeyboardProvider>
            <MigrationGate>
              {/* Read-only, shipped in the binary and copied out on first launch.
                Versioned in the filename so a rebuilt database replaces the copy. */}
              <SQLiteProvider
                databaseName="foods-v1.db"
                assetSource={{ assetId: require('../../assets/foods.db') }}>
                <Stack screenOptions={{ headerShown: false }} />
                <FirstRunRedirect ready />
              </SQLiteProvider>
            </MigrationGate>
          </KeyboardProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
