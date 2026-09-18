import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackHeader } from '@/components/AppHeader';
import { AppIcon } from '@/components/AppIcon';
import { EmptyState } from '@/components/EmptyState';
import { SearchField } from '@/components/Inputs';
import { Screen } from '@/components/Screen';
import { exercises } from '@/data/exercises';
import { useAppStore } from '@/store/AppStore';
import { colors, radii, spacing, typography } from '@/theme/tokens';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function AddExerciseScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const workoutId = getParam(params.id) ?? '';
  const { state, addExerciseToWorkout } = useAppStore();
  const [query, setQuery] = useState('');
  const workout = state.workouts.find((item) => item.id === workoutId);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return exercises.filter(
      (exercise) =>
        !normalizedQuery ||
        exercise.name.toLowerCase().includes(normalizedQuery) ||
        exercise.muscleGroup.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  if (!workout) {
    return (
      <Screen>
        <BackHeader title="Add exercises" />
        <EmptyState icon="info" title="Workout not found" message="Return to the planner and try again." />
      </Screen>
    );
  }

  return (
    <Screen>
      <BackHeader title={`Add to ${workout.name}`} />
      <SearchField value={query} onChangeText={setQuery} placeholder="Search exercises" />
      <Text style={styles.helper}>You can add several exercises before returning to your workout.</Text>

      <View style={styles.list}>
        {results.map((exercise) => {
          const added = workout.exercises.some((item) => item.exerciseId === exercise.id);
          return (
            <View key={exercise.id} style={styles.row}>
              <Image source={exercise.imageSource} contentFit="cover" transition={150} style={styles.image} />
              <View style={styles.copy}>
                <Text style={styles.name}>{exercise.name}</Text>
                <Text style={styles.meta}>
                  {exercise.muscleGroup} · {exercise.difficulty}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={added ? `${exercise.name} already added` : `Add ${exercise.name}`}
                accessibilityState={{ disabled: added }}
                disabled={added}
                onPress={() => addExerciseToWorkout(workout.id, exercise.id)}
                style={({ pressed }) => [
                  styles.addButton,
                  added && styles.addedButton,
                  pressed && styles.pressed,
                ]}>
                <AppIcon name={added ? 'check' : 'add'} color={added ? colors.primary : colors.white} size={19} />
              </Pressable>
            </View>
          );
        })}
      </View>

      {!results.length ? (
        <EmptyState
          icon="search"
          title="No exercises found"
          message="Try a shorter exercise or muscle name."
          actionLabel="Clear search"
          onAction={() => setQuery('')}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  helper: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  image: {
    width: 76,
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
  },
  copy: {
    flex: 1,
    padding: spacing.sm,
  },
  name: {
    color: colors.ink,
    fontSize: typography.label,
    fontWeight: '700',
  },
  meta: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 4,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  addedButton: {
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.62,
  },
});
