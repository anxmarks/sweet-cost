/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

const PALETTE = {
  text: '#4B342C',
  background: '#EFE9DE',
  backgroundElement: '#F8F5EF',
  backgroundSelected: 'rgba(156,113,100,0.16)',
  textSecondary: 'rgba(75,52,44,0.6)',
  accent: '#9C7164',
  amber: '#b68235',
  amberDeep: '#7d5411',
  danger: '#C38380',
  border: 'rgba(75,52,44,0.14)',
  tabBar: '#E8E1D1',
  avatar: '#D8B69F',
} as const;

// Paleta única e fixa (sem variação por modo claro/escuro do sistema) — ver plano de redesign.
export const Colors = {
  light: PALETTE,
  dark: PALETTE,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const FontFamilies = {
  displayRegular: 'CormorantGaramond_400Regular',
  displaySemiBold: 'CormorantGaramond_600SemiBold',
  displayRegularItalic: 'CormorantGaramond_400Regular_Italic',
  bodyRegular: 'Lora_400Regular',
  bodyMedium: 'Lora_500Medium',
  bodySemiBold: 'Lora_600SemiBold',
  bodyRegularItalic: 'Lora_400Regular_Italic',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
