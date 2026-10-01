import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import { createInitialState } from "@/data/initialState";
import { useRestTimerEffects } from "@/hooks/useRestTimerEffects";
import { loadAppState, saveAppState } from "@/services/stateStorage";
import {
  AppState,
  DayKey,
  defaultSessionTimerSettings,
  SessionTimerSettings,
  WorkoutExercise,
  WorkoutLog,
  WorkoutPlan,
} from "@/types/domain";
import { createId } from "@/utils/id";

type WorkoutExercisePatch = Partial<
  Pick<WorkoutExercise, "sets" | "reps" | "restSeconds" | "weightKg" | "notes">
>;

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "toggleFavorite"; exerciseId: string }
  | { type: "createWorkout"; workout: WorkoutPlan }
  | { type: "renameWorkout"; workoutId: string; name: string }
  | { type: "deleteWorkout"; workoutId: string }
  | { type: "addExercise"; workoutId: string; item: WorkoutExercise }
  | { type: "removeExercise"; workoutId: string; itemId: string }
  | {
      type: "updateExercise";
      workoutId: string;
      itemId: string;
      patch: WorkoutExercisePatch;
    }
  | { type: "startSession"; workoutId: string; options: SessionTimerSettings }
  | {
      type: "updateSessionTimerSettings";
      workoutId: string;
      patch: Partial<SessionTimerSettings>;
    }
  | { type: "cancelRestTimer"; workoutId: string }
  | { type: "finishRestTimer"; workoutId: string; timerId: string }
  | {
      type: "toggleSessionSet";
      workoutId: string;
      itemId: string;
      setIndex: number;
      elapsedSeconds: number;
      now: number;
      timerId: string;
    }
  | { type: "checkpointSession"; workoutId: string; elapsedSeconds: number }
  | { type: "discardSession"; workoutId: string }
  | { type: "completeWorkout"; log: WorkoutLog }
  | { type: "reset"; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
    case "reset":
      return action.state;
    case "toggleFavorite":
      return {
        ...state,
        favoriteExerciseIds: state.favoriteExerciseIds.includes(
          action.exerciseId,
        )
          ? state.favoriteExerciseIds.filter((id) => id !== action.exerciseId)
          : [...state.favoriteExerciseIds, action.exerciseId],
      };
    case "createWorkout":
      return { ...state, workouts: [...state.workouts, action.workout] };
    case "renameWorkout": {
      const name = action.name.trim();
      const workout = state.workouts.find(
        (item) => item.id === action.workoutId,
      );
      if (!name || !workout || workout.name === name) return state;

      return {
        ...state,
        workouts: state.workouts.map((item) =>
          item.id === action.workoutId ? { ...item, name } : item,
        ),
      };
    }
    case "deleteWorkout":
      return {
        ...state,
        workouts: state.workouts.filter(
          (workout) => workout.id !== action.workoutId,
        ),
        activeSession:
          state.activeSession?.workoutId === action.workoutId
            ? null
            : state.activeSession,
      };
    case "addExercise":
      return {
        ...state,
        workouts: state.workouts.map((workout) =>
          workout.id === action.workoutId
            ? { ...workout, exercises: [...workout.exercises, action.item] }
            : workout,
        ),
      };
    case "removeExercise":
      return {
        ...state,
        workouts: state.workouts.map((workout) =>
          workout.id === action.workoutId
            ? {
                ...workout,
                exercises: workout.exercises.filter(
                  (item) => item.id !== action.itemId,
                ),
              }
            : workout,
        ),
      };
    case "updateExercise":
      return {
        ...state,
        workouts: state.workouts.map((workout) =>
          workout.id === action.workoutId
            ? {
                ...workout,
                exercises: workout.exercises.map((item) =>
                  item.id === action.itemId
                    ? { ...item, ...action.patch }
                    : item,
                ),
              }
            : workout,
        ),
      };
    case "startSession": {
      if (state.activeSession) return state;
      const workout = state.workouts.find(
        (item) => item.id === action.workoutId,
      );
      if (!workout?.exercises.length) return state;
      return {
        ...state,
        activeSession: {
          workoutId: action.workoutId,
          elapsedSeconds: 0,
          timerSettings: { ...action.options },
          restTimer: null,
          completed: Object.fromEntries(
            workout.exercises.map((item) => [
              item.id,
              Array<boolean>(item.sets).fill(false),
            ]),
          ),
        },
      };
    }
    case "updateSessionTimerSettings": {
      const session = state.activeSession;
      if (!session || session.workoutId !== action.workoutId) return state;
      const timerSettings = { ...session.timerSettings, ...action.patch };
      return {
        ...state,
        activeSession: {
          ...session,
          timerSettings,
          restTimer: timerSettings.enabled ? session.restTimer : null,
        },
      };
    }
    case "cancelRestTimer":
      return state.activeSession?.workoutId === action.workoutId
        ? {
            ...state,
            activeSession: { ...state.activeSession, restTimer: null },
          }
        : state;
    case "finishRestTimer": {
      const session = state.activeSession;
      if (
        !session ||
        session.workoutId !== action.workoutId ||
        session.restTimer?.id !== action.timerId ||
        session.restTimer.finished
      )
        return state;
      return {
        ...state,
        activeSession: {
          ...session,
          restTimer: { ...session.restTimer, finished: true },
        },
      };
    }
    case "toggleSessionSet": {
      const session = state.activeSession;
      if (!session || session.workoutId !== action.workoutId) return state;
      const sets = session.completed[action.itemId];
      const item = state.workouts
        .find((workout) => workout.id === action.workoutId)
        ?.exercises.find((exercise) => exercise.id === action.itemId);
      if (
        !item ||
        !sets ||
        action.setIndex < 0 ||
        action.setIndex >= sets.length
      )
        return state;
      const markingDone = !sets[action.setIndex];
      const completed = {
        ...session.completed,
        [action.itemId]: sets.map((done, index) =>
          index === action.setIndex ? !done : done,
        ),
      };
      let restTimer = session.restTimer;
      if (markingDone) {
        const endsAt = action.now + item.restSeconds * 1000;
        const hasMoreSets = Object.values(completed).some((values) =>
          values.some((done) => !done),
        );
        restTimer =
          session.timerSettings.enabled &&
          hasMoreSets &&
          item.restSeconds > 0 &&
          Number.isSafeInteger(endsAt) &&
          endsAt <= 8640000000000000
            ? {
                id: action.timerId,
                itemId: item.id,
                setIndex: action.setIndex,
                endsAt,
                finished: false,
              }
            : null;
      } else if (
        restTimer?.itemId === item.id &&
        restTimer.setIndex === action.setIndex
      ) {
        restTimer = null;
      }
      return {
        ...state,
        activeSession: {
          ...session,
          elapsedSeconds: Math.max(
            session.elapsedSeconds,
            action.elapsedSeconds,
          ),
          completed,
          restTimer,
        },
      };
    }
    case "checkpointSession":
      if (
        !state.activeSession ||
        state.activeSession.workoutId !== action.workoutId ||
        action.elapsedSeconds <= state.activeSession.elapsedSeconds
      )
        return state;
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          elapsedSeconds: action.elapsedSeconds,
        },
      };
    case "discardSession":
      return state.activeSession?.workoutId === action.workoutId
        ? { ...state, activeSession: null }
        : state;
    case "completeWorkout":
      return {
        ...state,
        history: [action.log, ...state.history],
        activeSession: null,
      };
    default:
      return state;
  }
}

type AppStoreValue = {
  state: AppState;
  isReady: boolean;
  storageError: boolean;
  storageLoadFailed: boolean;
  toggleFavorite: (exerciseId: string) => void;
  createWorkout: (input: {
    name: string;
    day: DayKey;
    accent: string;
  }) => string;
  deleteWorkout: (workoutId: string) => void;
  addExerciseToWorkout: (workoutId: string, exerciseId: string) => void;
  removeExerciseFromWorkout: (workoutId: string, itemId: string) => void;
  updateWorkoutExercise: (
    workoutId: string,
    itemId: string,
    patch: WorkoutExercisePatch,
  ) => void;
  startSession: (workoutId: string, options?: SessionTimerSettings) => void;
  updateSessionTimerSettings: (
    workoutId: string,
    patch: Partial<SessionTimerSettings>,
  ) => void;
  cancelRestTimer: (workoutId: string) => void;
  restAlertError: ReturnType<typeof useRestTimerEffects>["alertError"];
  restSoundError: boolean;
  toggleSessionSet: (
    workoutId: string,
    itemId: string,
    setIndex: number,
    elapsedSeconds: number,
  ) => void;
  checkpointSession: (workoutId: string, elapsedSeconds: number) => void;
  discardSession: (workoutId: string) => void;
  completeWorkout: (
    workoutId: string,
    durationMinutes: number,
    completedSets: number,
  ) => void;
  renameWorkout: (workoutId: string, name: string) => void;
  deleteAllData: () => void;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [hydrationFailed, setHydrationFailed] = useState(false);

  useEffect(() => {
    let active = true;

    loadAppState()
      .then((savedState) => {
        if (active && savedState)
          dispatch({ type: "hydrate", state: savedState });
      })
      .catch(() => {
        if (active) {
          setHydrationFailed(true);
          setStorageError(true);
        }
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || hydrationFailed) return;

    saveAppState(state)
      .then(() => setStorageError(false))
      .catch(() => setStorageError(true));
  }, [hydrationFailed, isReady, state]);

  const toggleFavorite = useCallback((exerciseId: string) => {
    dispatch({ type: "toggleFavorite", exerciseId });
  }, []);

  const createWorkout = useCallback(
    (input: { name: string; day: DayKey; accent: string }) => {
      const id = createId("workout");
      dispatch({
        type: "createWorkout",
        workout: {
          id,
          name: input.name.trim(),
          day: input.day,
          accent: input.accent,
          exercises: [],
        },
      });
      return id;
    },
    [],
  );

  const renameWorkout = useCallback((workoutId: string, name: string) => {
    dispatch({ type: "renameWorkout", workoutId, name });
  }, []);

  const deleteWorkout = useCallback((workoutId: string) => {
    dispatch({ type: "deleteWorkout", workoutId });
  }, []);

  const addExerciseToWorkout = useCallback(
    (workoutId: string, exerciseId: string) => {
      dispatch({
        type: "addExercise",
        workoutId,
        item: {
          id: createId("exercise"),
          exerciseId,
          sets: 3,
          reps: 10,
          restSeconds: 90,
        },
      });
    },
    [],
  );

  const removeExerciseFromWorkout = useCallback(
    (workoutId: string, itemId: string) => {
      dispatch({ type: "removeExercise", workoutId, itemId });
    },
    [],
  );

  const updateWorkoutExercise = useCallback(
    (workoutId: string, itemId: string, patch: WorkoutExercisePatch) => {
      dispatch({ type: "updateExercise", workoutId, itemId, patch });
    },
    [],
  );

  const startSession = useCallback(
    (workoutId: string, options = defaultSessionTimerSettings) => {
      dispatch({ type: "startSession", workoutId, options });
    },
    [],
  );

  const updateSessionTimerSettings = useCallback(
    (workoutId: string, patch: Partial<SessionTimerSettings>) => {
      dispatch({ type: "updateSessionTimerSettings", workoutId, patch });
    },
    [],
  );

  const cancelRestTimer = useCallback((workoutId: string) => {
    dispatch({ type: "cancelRestTimer", workoutId });
  }, []);

  const finishRestTimer = useCallback((workoutId: string, timerId: string) => {
    dispatch({ type: "finishRestTimer", workoutId, timerId });
  }, []);

  const toggleSessionSet = useCallback(
    (
      workoutId: string,
      itemId: string,
      setIndex: number,
      elapsedSeconds: number,
    ) => {
      dispatch({
        type: "toggleSessionSet",
        workoutId,
        itemId,
        setIndex,
        elapsedSeconds,
        now: Date.now(),
        timerId: createId("rest"),
      });
    },
    [],
  );

  const checkpointSession = useCallback(
    (workoutId: string, elapsedSeconds: number) => {
      dispatch({ type: "checkpointSession", workoutId, elapsedSeconds });
    },
    [],
  );

  const discardSession = useCallback((workoutId: string) => {
    dispatch({ type: "discardSession", workoutId });
  }, []);

  const completeWorkout = useCallback(
    (workoutId: string, durationMinutes: number, completedSets: number) => {
      const workout = state.workouts.find((item) => item.id === workoutId);
      if (!workout) return;

      dispatch({
        type: "completeWorkout",
        log: {
          id: createId("log"),
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

  const deleteAllData = useCallback(() => {
    dispatch({ type: "reset", state: createInitialState() });
    setHydrationFailed(false);
  }, []);

  const { alertError: restAlertError, soundError: restSoundError } =
    useRestTimerEffects(state.activeSession, isReady, finishRestTimer);

  const value = useMemo<AppStoreValue>(
    () => ({
      state,
      isReady,
      storageError,
      storageLoadFailed: hydrationFailed,
      toggleFavorite,
      createWorkout,
      deleteWorkout,
      addExerciseToWorkout,
      removeExerciseFromWorkout,
      updateWorkoutExercise,
      startSession,
      updateSessionTimerSettings,
      cancelRestTimer,
      restAlertError,
      restSoundError,
      toggleSessionSet,
      checkpointSession,
      discardSession,
      completeWorkout,
      deleteAllData,
      renameWorkout,
    }),
    [
      addExerciseToWorkout,
      cancelRestTimer,
      updateSessionTimerSettings,
      restAlertError,
      restSoundError,
      renameWorkout,
      completeWorkout,
      checkpointSession,
      createWorkout,
      deleteWorkout,
      discardSession,
      hydrationFailed,
      isReady,
      removeExerciseFromWorkout,
      deleteAllData,
      state,
      startSession,
      storageError,
      toggleSessionSet,
      toggleFavorite,
      updateWorkoutExercise,
    ],
  );

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const value = useContext(AppStoreContext);
  if (!value)
    throw new Error("useAppStore must be used inside AppStoreProvider");
  return value;
}
