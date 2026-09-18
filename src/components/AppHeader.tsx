import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { colors, spacing, typography } from '@/theme/tokens';

type AppHeaderProps = {
  title: string;
  eyebrow?: string;
  right?: ReactNode;
};

export function AppHeader({ title, eyebrow, right }: AppHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

type BackHeaderProps = {
  title: string;
  right?: ReactNode;
};

export function BackHeader({ title, right }: BackHeaderProps) {
  return (
    <View style={styles.backRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <AppIcon name="back" color={colors.ink} size={22} />
      </Pressable>
      <Text numberOfLines={1} style={styles.backTitle}>
        {title}
      </Text>
      <View style={styles.rightSlot}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  copy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.inkMuted,
    fontSize: typography.label,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  title: {
    color: colors.ink,
    fontSize: typography.display,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  backRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.65,
  },
  backTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  rightSlot: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
});
