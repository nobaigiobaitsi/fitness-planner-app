import { days } from '@/data/days';
import { WorkoutLog, WorkoutPlan } from '@/types/domain';

export type NextWorkout = {
  workout: WorkoutPlan;
  offsetDays: number;
};

export function getNextWorkout(workouts: WorkoutPlan[], date = new Date()): NextWorkout | undefined {
  const currentJsDay = date.getDay();

  return workouts
    .map((workout) => {
      const targetJsDay = days.find((day) => day.key === workout.day)?.jsDay ?? currentJsDay;
      return { workout, offsetDays: (targetJsDay - currentJsDay + 7) % 7 };
    })
    .sort((a, b) => a.offsetDays - b.offsetDays)[0];
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLastSevenDaysActivity(history: WorkoutLog[], today = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    const workouts = history.filter((log) => localDateKey(new Date(log.completedAt)) === key);

    return {
      key,
      label: new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(date),
      workoutCount: workouts.length,
      minutes: workouts.reduce((total, log) => total + log.durationMinutes, 0),
    };
  });
}

export function getSevenDayLogs(history: WorkoutLog[], today = new Date()) {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  return history.filter((log) => new Date(log.completedAt) >= start);
}
