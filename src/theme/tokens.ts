import { Platform, ViewStyle } from 'react-native';

export const colors = {
  background: '#F3F7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF1ED',
  ink: '#10231B',
  inkMuted: '#66766E',
  primary: '#16855E',
  primaryDark: '#0E6848',
  primarySoft: '#DDF5EA',
  border: '#DCE6E1',
  danger: '#C94B53',
  dangerSoft: '#FCE9EA',
  warning: '#E79A2D',
  overlay: 'rgba(5, 20, 14, 0.58)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: 32,
  title: 24,
  heading: 19,
  body: 16,
  label: 14,
  caption: 12,
} as const;

export const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
  },
  android: { elevation: 2 },
  default: {
    boxShadow: '0 7px 22px rgba(16, 35, 27, 0.08)',
  },
});

export const pageLayout = {
  maxWidth: 760,
  horizontalPadding: spacing.lg,
} as const;
