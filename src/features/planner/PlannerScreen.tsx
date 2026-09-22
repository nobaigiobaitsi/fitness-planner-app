import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { AppIcon } from "@/components/AppIcon";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/Section";
import { DaySelector } from "@/components/Selectors";
import { WorkoutCard } from "@/components/WorkoutCard";
import { getDayKey, getDayLabel } from "@/data/days";
import { useAppStore } from "@/store/AppStore";
import { colors, radii, spacing, typography } from "@/theme/tokens";
import { DayKey, dayKeys } from "@/types/domain";
import { useEffect, useMemo, useState } from "react";

function isDayKey(value: string | string[] | undefined): value is DayKey {
  return typeof value === "string" && dayKeys.includes(value as DayKey);
}

function AddButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create workout"
      onPress={() => router.push("/workout/create")}
      style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
    >
      <AppIcon name="add" color={colors.white} size={24} />
    </Pressable>
  );
}

export default function PlannerScreen() {
  const params = useLocalSearchParams<{ day?: string | string[] }>();
  const { state } = useAppStore();
  const [selectedDay, setSelectedDay] = useState<DayKey>(
    isDayKey(params.day) ? params.day : getDayKey(),
  );

  useEffect(() => {
    if (isDayKey(params.day)) setSelectedDay(params.day);
  }, [params.day]);

  const counts = useMemo(
    () =>
      state.workouts.reduce<Partial<Record<DayKey, number>>>(
        (result, workout) => {
          result[workout.day] = (result[workout.day] ?? 0) + 1;
          return result;
        },
        {},
      ),
    [state.workouts],
  );
  const selectedWorkouts = state.workouts.filter(
    (workout) => workout.day === selectedDay,
  );

  return (
    <Screen>
      <AppHeader
        title="Weekly planner"
        eyebrow="Build a routine you can follow"
        right={<AddButton />}
      />

      <DaySelector
        selectedDay={selectedDay}
        onSelect={setSelectedDay}
        counts={counts}
      />

      <SectionHeader title={getDayLabel(selectedDay)} />
      {selectedWorkouts.length ? (
        <View style={styles.list}>
          {selectedWorkouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onPress={() => router.push(`/workout/${workout.id}`)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="calendar"
          title="Rest day"
          message={`There are no workouts planned for ${getDayLabel(selectedDay)}.`}
          actionLabel="Add a workout"
          onAction={() =>
            router.push({
              pathname: "/workout/create",
              params: { day: selectedDay },
            })
          }
        />
      )}

      <View style={styles.note}>
        <AppIcon name="info" color={colors.primary} size={20} />
        <Text style={styles.noteText}>
          Start with a schedule you can repeat consistently. You can edit sets,
          reps, weight, and rest from each workout.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  list: {
    gap: spacing.sm,
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    marginTop: spacing.xl,
  },
  noteText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: typography.label,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
