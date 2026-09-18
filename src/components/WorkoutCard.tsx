import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { getDayLabel } from '@/data/days';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import { WorkoutPlan } from '@/types/domain';

type WorkoutCardProps = {
  workout: WorkoutPlan;
  onPress: () => void;
  showDay?: boolean;
};

export function WorkoutCard({ workout, onPress, showDay = false }: WorkoutCardProps) {
  const setCount = workout.exercises.reduce((total, item) => total + item.sets, 0);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${workout.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.accent, { backgroundColor: workout.accent }]} />
      <View style={styles.copy}>
        {showDay ? <Text style={styles.day}>{getDayLabel(workout.day)}</Text> : null}
        <Text style={styles.name}>{workout.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <AppIcon name="exercise" color={colors.inkMuted} size={16} />
            <Text style={styles.metaText}>{workout.exercises.length} exercises</Text>
          </View>
          <View style={styles.metaItem}>
            <AppIcon name="clock" color={colors.inkMuted} size={16} />
            <Text style={styles.metaText}>{workout.estimatedMinutes} min</Text>
          </View>
        </View>
        <Text style={styles.sets}>{setCount} working sets</Text>
      </View>
      <AppIcon name="chevronRight" color={colors.inkMuted} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 126,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  accent: {
    width: 7,
    alignSelf: 'stretch',
  },
  copy: {
    flex: 1,
    padding: spacing.md,
  },
  day: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.xxs,
  },
  name: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: colors.inkMuted,
    fontSize: typography.caption,
  },
  sets: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
