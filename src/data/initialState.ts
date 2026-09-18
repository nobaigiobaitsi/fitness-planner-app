import type { AppState } from '@/types/domain';

export function createInitialState(): AppState {
  return {
    workouts: [],
    favoriteExerciseIds: [],
    history: [],
    weightUnit: 'kg',
  };
}