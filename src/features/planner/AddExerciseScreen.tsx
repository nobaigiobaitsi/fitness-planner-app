import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BackHeader } from '@/components/AppHeader';
import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { SearchField } from '@/components/Inputs';
import { Screen } from '@/components/Screen';
import { exercises } from '@/data/exercises';
import { useAppStore } from '@/store/AppStore';
import { colors, radii, spacing, typography } from '@/theme/tokens';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

export default function AddExerciseScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const workoutId = getParam(params.id) ?? '';
  const { state, addExerciseToWorkout, removeExerciseFromWorkout } = useAppStore();
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
    <Screen
      scroll={false}
      contentContainerStyle={styles.screen}
      footer={
        <View style={styles.footer}>
          <Button
            label={`Done · ${workout.exercises.length} selected`}
            icon="check"
            onPress={() => router.back()}
          />
        </View>
      }>
      <BackHeader title={`Add to ${workout.name}`} />
      <SearchField value={query} onChangeText={setQuery} placeholder="Search exercises" />
      <Text style={styles.helper}>
        You can add several exercises before returning to your workout. Your selections are saved
        automatically. Tap Done when finished.
      </Text>

      <FlatList
        data={results}
        style={styles.listView}
        keyExtractor={(exercise) => exercise.id}
        renderItem={({ item: exercise }) => {
          const workoutExercise = workout.exercises.find(
            (item) => item.exerciseId === exercise.id,
          );
          const added = Boolean(workoutExercise);

          const toggleExercise = () => {
            if (workoutExercise) {
              removeExerciseFromWorkout(workout.id, workoutExercise.id);
              return;
            }
            addExerciseToWorkout(workout.id, exercise.id);
          };

          return (
            <View style={styles.row}>
              <Image
                source={exercise.imageSource}
                contentFit="cover"
                transition={150}
                style={styles.image}
              />
              <View style={styles.copy}>
                <Text style={styles.name}>{exercise.name}</Text>
                <Text style={styles.meta}>
                  {exercise.muscleGroup} · {exercise.difficulty}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  added ? `Remove ${exercise.name} from workout` : `Add ${exercise.name} to workout`
                }
                onPress={toggleExercise}
                style={({ pressed }) => [
                  styles.addButton,
                  added && styles.addedButton,
                  pressed && styles.pressed,
                ]}>
                <AppIcon
                  name={added ? 'check' : 'add'}
                  color={added ? colors.primary : colors.white}
                  size={19}
                />
              </Pressable>
            </View>
          );
        }}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title="No exercises found"
            message="Try a shorter exercise or muscle name."
            actionLabel="Clear search"
            onAction={() => setQuery('')}
          />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, !results.length && styles.emptyList]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 0,
  },
  helper: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  listView: {
    flex: 1,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: spacing.sm,
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
  footer: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
