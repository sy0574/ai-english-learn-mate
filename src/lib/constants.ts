export const THEME_COLORS = {
  primary: '#007AFF', // iOS blue
  secondary: '#34C759', // iOS green
  destructive: '#FF3B30', // iOS red
  background: {
    light: '#FFFFFF',
    dark: '#000000',
    secondary: '#F5F5F7'
  },
  text: {
    primary: '#1D1D1F',
    secondary: '#86868B',
    tertiary: '#6E6E73'
  },
  border: '#D2D2D7',
  divider: 'rgba(0, 0, 0, 0.1)'
} as const;

export const BLUR_STYLES = {
  light: 'backdrop-blur-xl bg-white/70',
  dark: 'backdrop-blur-xl bg-black/70'
} as const;