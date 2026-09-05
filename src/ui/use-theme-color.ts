import { useColorScheme } from 'react-native';

/**
 * Native props like `tabBarActiveTintColor` take real colour values, not classNames,
 * so the palette in global.css is mirrored here for the few places NativeWind
 * cannot reach. Keep the two in step.
 */
const PALETTE = {
  light: {
    surface: '#f2f2f7',
    surfaceRaised: '#ffffff',
    surfaceSunken: '#e9e9ee',
    content: '#111113',
    contentMuted: '#5a5a62',
    contentFaint: '#8a8a93',
    line: '#dcdce2',
    accent: '#2563eb',
    danger: '#dc2626',
  },
  dark: {
    surface: '#0a0a0c',
    surfaceRaised: '#1c1c20',
    surfaceSunken: '#2a2a30',
    content: '#f4f4f5',
    contentMuted: '#a3a3ad',
    contentFaint: '#787882',
    line: '#34343c',
    accent: '#60a5fa',
    danger: '#f87171',
  },
} as const;

export type ThemeColorName = keyof typeof PALETTE.light;

export function useThemeColor(name: ThemeColorName): string {
  const scheme = useColorScheme();
  return PALETTE[scheme === 'dark' ? 'dark' : 'light'][name];
}
