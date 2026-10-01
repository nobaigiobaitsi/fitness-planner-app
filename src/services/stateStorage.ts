import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import {
  ActiveSession,
  AppState,
  dayKeys,
  WorkoutExercise,
  WorkoutLog,
  WorkoutPlan,
} from "@/types/domain";

// Keep the existing location so users upgrading from v1 retain their workouts.
const STORAGE_KEY = "fitplanner.app-state.v1";
const STATE_FILE_NAME = "fitplanner-state-v1.json";

function getStateFile() {
  return new File(Paths.document, STATE_FILE_NAME);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isWorkoutExercise(value: unknown): value is WorkoutExercise {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.exerciseId) &&
    isNonNegativeInteger(value.sets) &&
    value.sets > 0 &&
    value.sets <= 100 &&
    isNonNegativeInteger(value.reps) &&
    value.reps > 0 &&
    isNonNegativeInteger(value.restSeconds) &&
    (value.weightKg === undefined ||
      (typeof value.weightKg === "number" &&
        Number.isFinite(value.weightKg) &&
        value.weightKg >= 0)) &&
    (value.notes === undefined || typeof value.notes === "string")
  );
}

function isWorkoutPlan(value: unknown): value is WorkoutPlan {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    typeof value.day === "string" &&
    dayKeys.includes(value.day as WorkoutPlan["day"]) &&
    isNonEmptyString(value.accent) &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isWorkoutExercise)
  );
}

function isWorkoutLog(value: unknown): value is WorkoutLog {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.workoutId) &&
    isNonEmptyString(value.workoutName) &&
    isNonEmptyString(value.completedAt) &&
    isNonNegativeInteger(value.durationMinutes) &&
    isNonNegativeInteger(value.completedSets) &&
    isNonNegativeInteger(value.exerciseCount)
  );
}

type StateV1 = Omit<AppState, "activeSession">;

function isStateV1(value: unknown): value is StateV1 {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.workouts) &&
    value.workouts.every(isWorkoutPlan) &&
    Array.isArray(value.favoriteExerciseIds) &&
    value.favoriteExerciseIds.every(isNonEmptyString) &&
    Array.isArray(value.history) &&
    value.history.every(isWorkoutLog)
  );
}

function isActiveSession(value: unknown): value is ActiveSession {
  if (!isRecord(value) || !isRecord(value.completed)) return false;
  return (
    isNonEmptyString(value.workoutId) &&
    isNonNegativeInteger(value.elapsedSeconds) &&
    Object.values(value.completed).every(
      (sets) =>
        Array.isArray(sets) && sets.every((done) => typeof done === "boolean"),
    )
  );
}

function migratePayload(value: unknown): AppState {
  if (!isRecord(value) || !isStateV1(value.state)) {
    throw new Error("Saved FitPlanner data is invalid.");
  }

  if (value.version === 1) {
    return { ...value.state, activeSession: null };
  }

  if (value.version === 2) {
    const activeSession = (value.state as StateV1 & { activeSession?: unknown })
      .activeSession;
    if (activeSession !== null && !isActiveSession(activeSession)) {
      throw new Error("Saved FitPlanner session is invalid.");
    }
    if (activeSession) {
      const workout = value.state.workouts.find(
        (item) => item.id === activeSession.workoutId,
      );
      if (
        !workout ||
        workout.exercises.length === 0 ||
        workout.exercises.some(
          (item) => activeSession.completed[item.id]?.length !== item.sets,
        ) ||
        Object.keys(activeSession.completed).length !== workout.exercises.length
      ) {
        throw new Error("Saved FitPlanner session does not match its workout.");
      }
    }
    return { ...value.state, activeSession };
  }

  throw new Error("Saved FitPlanner data uses an unsupported version.");
}

export async function loadAppState(): Promise<AppState | null> {
  let raw: string | null = null;

  if (Platform.OS === "web") {
    raw = globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  } else {
    const file = getStateFile();
    raw = file.exists ? await file.text() : null;
  }

  if (raw === null) return null;
  return migratePayload(JSON.parse(raw) as unknown);
}

export async function saveAppState(state: AppState) {
  const raw = JSON.stringify({ version: 2, state });

  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(STORAGE_KEY, raw);
    return;
  }

  const file = getStateFile();
  if (!file.exists) file.create({ intermediates: true });
  file.write(raw);
}
