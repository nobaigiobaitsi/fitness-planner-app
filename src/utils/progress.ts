import type { ActiveSession, WorkoutLog, WorkoutPlan } from '@/types/domain';

type WorkoutLogDetails = Pick<WorkoutLog, 'id' | 'completedAt' | 'durationMinutes'>;

export function createWorkoutLog(
  workout: WorkoutPlan,
  session: ActiveSession,
  details: WorkoutLogDetails,
  getExerciseName: (exerciseId: string) => string | undefined,
): WorkoutLog | null {
  if (session.workoutId !== workout.id) return null;

  const exercises = workout.exercises.flatMap((item) => {
    const sets = Array.from({ length: item.sets }, (_, index) => index)
      .filter((index) => session.completed[item.id]?.[index] === true)
      .map((index) => ({
        setNumber: index + 1,
        reps: item.reps,
        ...(item.weightKg === undefined ? {} : { weightKg: item.weightKg }),
      }));

    if (!sets.length) return [];

    return [{
      workoutExerciseId: item.id,
      exerciseId: item.exerciseId,
      exerciseName: getExerciseName(item.exerciseId) ?? item.exerciseId,
      sets,
    }];
  });

  if (!exercises.length) return null;

  return {
    ...details,
    workoutId: workout.id,
    workoutName: workout.name,
    completedSets: exercises.reduce((total, exercise) => total + exercise.sets.length, 0),
    exerciseCount: exercises.length,
    exercises,
  };
}

export function getWorkoutTotals(history: WorkoutLog[]) {
  return history.reduce(
    (totals, log) => ({
      workouts: totals.workouts + 1,
      minutes: totals.minutes + log.durationMinutes,
      exercises: totals.exercises + log.exerciseCount,
      sets: totals.sets + log.completedSets,
    }),
    { workouts: 0, minutes: 0, exercises: 0, sets: 0 },
  );
}
