import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { ExerciseCard } from '@/components/ExerciseCard';
import { EmptyState } from '@/components/EmptyState';
import { HorizontalScroller, SearchField } from '@/components/Inputs';
import { Screen } from '@/components/Screen';
import { Chip } from '@/components/Selectors';
import { exercises } from '@/data/exercises';
import { useAppStore } from '@/store/AppStore';
import { colors, spacing, typography } from '@/theme/tokens';
import { MuscleGroup, muscleGroups } from '@/types/domain';

type Filter = 'All' | 'Favorites' | MuscleGroup;

export default function ExercisesScreen() {
  const { state, toggleFavorite } = useAppStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const filters: Filter[] = ['All', 'Favorites', ...muscleGroups];

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const matchesQuery =
        !normalizedQuery ||
        exercise.name.toLowerCase().includes(normalizedQuery) ||
        exercise.muscleGroup.toLowerCase().includes(normalizedQuery) ||
        exercise.equipment.some((item) => item.toLowerCase().includes(normalizedQuery));
      const matchesFilter =
        filter === 'All' ||
        (filter === 'Favorites' && state.favoriteExerciseIds.includes(exercise.id)) ||
        exercise.muscleGroup === filter;

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, state.favoriteExerciseIds]);

  return (
    <Screen>
      <AppHeader title="Exercise library" eyebrow={`${exercises.length} guided movements`} />
      <SearchField value={query} onChangeText={setQuery} placeholder="Search exercise, muscle, equipment" />

      <View style={styles.filters}>
        <HorizontalScroller>
          {filters.map((item) => (
            <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />
          ))}
        </HorizontalScroller>
      </View>

      <Text style={styles.resultCount}>
        {filteredExercises.length} {filteredExercises.length === 1 ? 'exercise' : 'exercises'}
      </Text>

      {filteredExercises.length ? (
        <View style={styles.list}>
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              favorite={state.favoriteExerciseIds.includes(exercise.id)}
              onPress={() => router.push(`/exercise/${exercise.id}`)}
              onToggleFavorite={() => toggleFavorite(exercise.id)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="search"
          title="No exercises found"
          message="Try another search term or choose a different muscle group."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery('');
            setFilter('All');
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    marginTop: spacing.md,
  },
  resultCount: {
    color: colors.inkMuted,
    fontSize: typography.label,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
});
