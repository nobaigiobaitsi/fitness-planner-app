import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { AppIcon, AppIconName } from '@/components/AppIcon';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: AppIconName;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  trailing?: ReactNode;
};

const variantStyles = {
  primary: { backgroundColor: colors.primary, borderColor: colors.primary, color: colors.white },
  secondary: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft, color: colors.primaryDark },
  danger: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft, color: colors.danger },
  ghost: { backgroundColor: 'transparent', borderColor: colors.border, color: colors.ink },
} as const;

export function Button({
  label,
  onPress,
  icon,
  disabled = false,
  variant = 'primary',
  style,
  trailing,
}: ButtonProps) {
  const palette = variantStyles[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {icon ? <AppIcon name={icon} color={palette.color} size={20} /> : null}
      <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.42,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.88,
  },
});
