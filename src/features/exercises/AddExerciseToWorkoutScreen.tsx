import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackHeader } from '@/components/AppHeader';
import { AppIcon } from '@/components/AppIcon';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { getExerciseById } from '@/data/exercises';
import { useAppStore } from '@/store/AppStore';
import { colors, radii, spacing, typography } from '@/theme/tokens';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function AddExerciseToWorkoutScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const exercise = getExerciseById(getParam(params.id) ?? '');
  const { state, addExerciseToWorkout } = useAppStore();

  if (!exercise) {
    return (
      <Screen>
        <BackHeader title="Add exercise" />
        <EmptyState icon="info" title="Exercise not found" message="Return to the exercise library and try again." />
      </Screen>
    );
  }

  return (
    <Screen>
      <BackHeader title="Choose a workout" />
      <Text style={styles.intro}>
        Add <Text style={styles.strong}>{exercise.name}</Text> to one of your workout days.
      </Text>

      {state.workouts.length ? (
        <View style={styles.list}>
          {state.workouts.map((workout) => {
            const alreadyAdded = workout.exercises.some((item) => item.exerciseId === exercise.id);
            return (
              <Pressable
                key={workout.id}
                accessibilityRole="button"
                accessibilityState={{ disabled: alreadyAdded }}
                disabled={alreadyAdded}
                onPress={() => {
                  addExerciseToWorkout(workout.id, exercise.id);
                  router.back();
                }}
                style={({ pressed }) => [
                  styles.workout,
                  alreadyAdded && styles.disabled,
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.accent, { backgroundColor: workout.accent }]} />
                <View style={styles.copy}>
                  <Text style={styles.name}>{workout.name}</Text>
                  <Text style={styles.meta}>{workout.exercises.length} exercises</Text>
                </View>
                {alreadyAdded ? (
                  <View style={styles.addedBadge}>
                    <AppIcon name="check" color={colors.primary} size={18} />
                    <Text style={styles.addedText}>Added</Text>
                  </View>
                ) : (
                  <AppIcon name="plusCircle" color={colors.primary} size={24} />
                )}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <EmptyState
          icon="calendar"
          title="Create a workout first"
          message="Once you have a workout day, you can add this exercise to it."
          actionLabel="Create workout"
          onAction={() => router.push('/workout/create')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    color: colors.inkMuted,
    fontSize: typography.body,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  strong: {
    color: colors.ink,
    fontWeight: '700',
  },
  list: {
    gap: spacing.sm,
  },
  workout: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  accent: {
    width: 6,
    alignSelf: 'stretch',
    marginRight: spacing.md,
  },
  copy: {
    flex: 1,
  },
  name: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
  },
  meta: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 4,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addedText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.58,
  },
  pressed: {
    opacity: 0.7,
  },
});
