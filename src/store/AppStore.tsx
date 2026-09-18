import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import { createInitialState } from '@/data/initialState';
import { loadAppState, saveAppState } from '@/services/stateStorage';
import {
  AppState,
  DayKey,
  WeightUnit,
  WorkoutExercise,
  WorkoutLog,
  WorkoutPlan,
} from '@/types/domain';
import { createId } from '@/utils/id';

type WorkoutExercisePatch = Partial<Pick<WorkoutExercise, 'sets' | 'reps' | 'restSeconds' | 'weightKg' | 'notes'>>;

type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'toggleFavorite'; exerciseId: string }
  | { type: 'createWorkout'; workout: WorkoutPlan }
  | { type: 'deleteWorkout'; workoutId: string }
  | { type: 'addExercise'; workoutId: string; item: WorkoutExercise }
  | { type: 'removeExercise'; workoutId: string; itemId: string }
  | { type: 'updateExercise'; workoutId: string; itemId: string; patch: WorkoutExercisePatch }
  | { type: 'completeWorkout'; log: WorkoutLog }
  | { type: 'setWeightUnit'; unit: WeightUnit }
  | { type: 'reset'; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
    case 'reset':
      return action.state;
    case 'toggleFavorite':
      return {
        ...state,
        favoriteExerciseIds: state.favoriteExerciseIds.includes(action.exerciseId)
          ? state.favoriteExerciseIds.filter((id) => id !== action.exerciseId)
          : [...state.favoriteExerciseIds, action.exerciseId],
      };
    case 'createWorkout':
      return { ...state, workouts: [...state.workouts, action.workout] };
    case 'deleteWorkout':
      return { ...state, workouts: state.workouts.filter((workout) => workout.id !== action.workoutId) };
    case 'addExercise':
      return {
        ...state,
        workouts: state.workouts.map((workout) =>
          workout.id === action.workoutId
            ? { ...workout, exercises: [...workout.exercises, action.item] }
            : workout,
        ),
      };
    case 'removeExercise':
      return {
        ...state,
        workouts: state.workouts.map((workout) =>
          workout.id === action.workoutId
            ? { ...workout, exercises: workout.exercises.filter((item) => item.id !== action.itemId) }
            : workout,
        ),
      };
    case 'updateExercise':
      return {
        ...state,
        workouts: state.workouts.map((workout) =>
          workout.id === action.workoutId
            ? {
                ...workout,
                exercises: workout.exercises.map((item) =>
                  item.id === action.itemId ? { ...item, ...action.patch } : item,
                ),
              }
            : workout,
        ),
      };
    case 'completeWorkout':
      return { ...state, history: [action.log, ...state.history] };
    case 'setWeightUnit':
      return { ...state, weightUnit: action.unit };
    default:
      return state;
  }
}

type AppStoreValue = {
  state: AppState;
  isReady: boolean;
  storageError: boolean;
  toggleFavorite: (exerciseId: string) => void;
  createWorkout: (input: { name: string; day: DayKey; accent: string }) => string;
  deleteWorkout: (workoutId: string) => void;
  addExerciseToWorkout: (workoutId: string, exerciseId: string) => void;
  removeExerciseFromWorkout: (workoutId: string, itemId: string) => void;
  updateWorkoutExercise: (workoutId: string, itemId: string, patch: WorkoutExercisePatch) => void;
  completeWorkout: (workoutId: string, durationMinutes: number, completedSets: number) => void;
  setWeightUnit: (unit: WeightUnit) => void;
  deleteAllData: () => void;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let active = true;

    loadAppState()
      .then((savedState) => {
        if (active && savedState) dispatch({ type: 'hydrate', state: savedState });
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const timeout = setTimeout(() => {
      saveAppState(state)
        .then(() => setStorageError(false))
        .catch(() => setStorageError(true));
    }, 250);

    return () => clearTimeout(timeout);
  }, [isReady, state]);

  const toggleFavorite = useCallback((exerciseId: string) => {
    dispatch({ type: 'toggleFavorite', exerciseId });
  }, []);

  const createWorkout = useCallback((input: { name: string; day: DayKey; accent: string }) => {
    const id = createId('workout');
    dispatch({
      type: 'createWorkout',
      workout: {
        id,
        name: input.name.trim(),
        day: input.day,
        accent: input.accent,
        estimatedMinutes: 45,
        exercises: [],
      },
    });
    return id;
  }, []);

  const deleteWorkout = useCallback((workoutId: string) => {
    dispatch({ type: 'deleteWorkout', workoutId });
  }, []);

  const addExerciseToWorkout = useCallback((workoutId: string, exerciseId: string) => {
    dispatch({
      type: 'addExercise',
      workoutId,
      item: {
        id: createId('exercise'),
        exerciseId,
        sets: 3,
        reps: 10,
        restSeconds: 90,
      },
    });
  }, []);

  const removeExerciseFromWorkout = useCallback((workoutId: string, itemId: string) => {
    dispatch({ type: 'removeExercise', workoutId, itemId });
  }, []);

  const updateWorkoutExercise = useCallback(
    (workoutId: string, itemId: string, patch: WorkoutExercisePatch) => {
      dispatch({ type: 'updateExercise', workoutId, itemId, patch });
    },
    [],
  );

  const completeWorkout = useCallback(
    (workoutId: string, durationMinutes: number, completedSets: number) => {
      const workout = state.workouts.find((item) => item.id === workoutId);
      if (!workout) return;

      dispatch({
        type: 'completeWorkout',
        log: {
          id: createId('log'),
          workoutId,
          workoutName: workout.name,
          completedAt: new Date().toISOString(),
          durationMinutes,
          completedSets,
          exerciseCount: workout.exercises.length,
        },
      });
    },
    [state.workouts],
  );

  const setWeightUnit = useCallback((unit: WeightUnit) => {
    dispatch({ type: 'setWeightUnit', unit });
  }, []);

  const deleteAllData = useCallback(() => {
    dispatch({ type: 'reset', state: createInitialState() });
  }, []);

  const value = useMemo<AppStoreValue>(
    () => ({
      state,
      isReady,
      storageError,
      toggleFavorite,
      createWorkout,
      deleteWorkout,
      addExerciseToWorkout,
      removeExerciseFromWorkout,
      updateWorkoutExercise,
      completeWorkout,
      setWeightUnit,
      deleteAllData,
    }),
    [
      addExerciseToWorkout,
      completeWorkout,
      createWorkout,
      deleteWorkout,
      isReady,
      removeExerciseFromWorkout,
      deleteAllData,
      setWeightUnit,
      state,
      storageError,
      toggleFavorite,
      updateWorkoutExercise,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const value = useContext(AppStoreContext);
  if (!value) throw new Error('useAppStore must be used inside AppStoreProvider');
  return value;
}
