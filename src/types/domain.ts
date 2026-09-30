export const muscleGroups = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Full Body",
] as const;

export type MuscleGroup = (typeof muscleGroups)[number];

export type Equipment =
  | "Barbell"
  | "Dumbbells"
  | "Bodyweight"
  | "Cable"
  | "Machine"
  | "Bench"
  | "Kettlebell"
  | "Resistance Band"
  | "Ab Wheel"
  | "Battle Ropes"
  | "Box"
  | "Gymnastic Rings"
  | "Jump Rope"
  | "Medicine Ball"
  | "Sled"
  | "Stability Ball"
  | "Suspension Trainer"
  | "Weight Plate";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  difficulty: Difficulty;
  imageSource: number;
  instructions: string[];
  tips: string[];
};

export const dayKeys = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayKey = (typeof dayKeys)[number];

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  sets: number;
  reps: number;
  restSeconds: number;
  weightKg?: number;
  notes?: string;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  day: DayKey;
  accent: string;
  estimatedMinutes: number;
  exercises: WorkoutExercise[];
};

export type WorkoutLog = {
  id: string;
  workoutId: string;
  workoutName: string;
  completedAt: string;
  durationMinutes: number;
  completedSets: number;
  exerciseCount: number;
};

export type ActiveSession = {
  workoutId: string;
  elapsedSeconds: number;
  completed: Record<string, boolean[]>;
};

export type AppState = {
  workouts: WorkoutPlan[];
  favoriteExerciseIds: string[];
  history: WorkoutLog[];
  activeSession: ActiveSession | null;
};
