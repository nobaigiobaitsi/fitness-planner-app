import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppIcon, AppIconName } from '@/components/AppIcon';
import { cardShadow, colors, radii, spacing, typography } from '@/theme/tokens';

export function SurfaceCard({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

type StatCardProps = {
  label: string;
  value: string | number;
  icon: AppIconName;
  tint?: string;
};

export function StatCard({ label, value, icon, tint = colors.primary }: StatCardProps) {
  return (
    <SurfaceCard style={styles.statCard}>
      <View style={[styles.iconBox, { backgroundColor: `${tint}18` }]}>
        <AppIcon name={icon} color={tint} size={20} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    padding: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 2,
  },
});
