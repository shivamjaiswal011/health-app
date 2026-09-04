import { useColorScheme } from 'react-native';

/**
 * Native props like `tabBarActiveTintColor` take real colour values, not classNames,
 * so the palette in global.css is mirrored here for the few places NativeWind
 * cannot reach. Keep the two in step.
 */
const PALETTE = {
  light: {
    surface: '#fafafa',
    surfaceRaised: '#ffffff',
    content: '#18181b',
    contentFaint: '#8e8e96',
    accent: '#2563eb',
  },
  dark: {
    surface: '#0c0c0e',
    surfaceRaised: '#1a1a1e',
    content: '#f4f4f5',
    contentFaint: '#71717a',
    accent: '#60a5fa',
  },
} as const;

export type ThemeColorName = keyof typeof PALETTE.light;

export function useThemeColor(name: ThemeColorName): string {
  const scheme = useColorScheme();
  return PALETTE[scheme === 'dark' ? 'dark' : 'light'][name];
}
