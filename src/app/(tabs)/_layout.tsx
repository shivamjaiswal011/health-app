import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useThemeColor } from '@/ui/use-theme-color';

type TabIconProps = { color: ColorValue; size: number };

function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return function TabIcon({ color, size }: TabIconProps) {
    return <Ionicons name={name} color={color} size={size} />;
  };
}

// Built once at module scope: a component created during render remounts every pass.
const TAB_ICONS = {
  today: tabIcon('today-outline'),
  train: tabIcon('barbell-outline'),
  diet: tabIcon('restaurant-outline'),
  progress: tabIcon('trending-up-outline'),
};

export default function TabsLayout() {
  const activeTint = useThemeColor('accent');
  const inactiveTint = useThemeColor('contentFaint');
  const background = useThemeColor('surfaceRaised');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: { backgroundColor: background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: TAB_ICONS.today }} />
      <Tabs.Screen name="workouts" options={{ title: 'Train', tabBarIcon: TAB_ICONS.train }} />
      <Tabs.Screen name="diet" options={{ title: 'Diet', tabBarIcon: TAB_ICONS.diet }} />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: TAB_ICONS.progress }}
      />
    </Tabs>
  );
}
