import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { AppIcon } from "@/components/AppIcon";
import { StatCard, SurfaceCard } from "@/components/Cards";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/Section";
import { useAppStore } from "@/store/AppStore";
import { colors, radii, spacing, typography } from "@/theme/tokens";
import { WorkoutLog } from "@/types/domain";
import { displayWeight, formatHistoryDate } from "@/utils/format";
import { getWorkoutTotals } from "@/utils/progress";
import { getLastSevenDaysActivity, getSevenDayLogs } from "@/utils/workouts";

function WorkoutHistoryCard({ log }: { log: WorkoutLog }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = log.exercises !== undefined;

  return (
    <SurfaceCard style={styles.historyCard}>
      <Pressable
        accessibilityRole={hasDetails ? "button" : undefined}
        accessibilityLabel={
          hasDetails
            ? `${log.workoutName}, ${formatHistoryDate(log.completedAt)}, ${log.exerciseCount} exercises, ${log.completedSets} completed sets, ${log.durationMinutes} minutes`
            : undefined
        }
        accessibilityState={hasDetails ? { expanded } : undefined}
        aria-expanded={hasDetails ? expanded : undefined}
        accessibilityHint={
          hasDetails
            ? "Shows the exercises and completed sets from this workout"
            : undefined
        }
        disabled={!hasDetails}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [
          styles.historySummary,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.historyIcon}>
          <AppIcon name="check" color={colors.primary} size={22} />
        </View>
        <View style={styles.historyCopy}>
          <Text style={styles.historyTitle}>{log.workoutName}</Text>
          <Text style={styles.historyDate}>
            {formatHistoryDate(log.completedAt)}
          </Text>
          <Text style={styles.historyMeta}>
            {log.exerciseCount}{" "}
            {log.exerciseCount === 1 ? "exercise" : "exercises"} ·{" "}
            {log.completedSets} {log.completedSets === 1 ? "set" : "sets"}
          </Text>
          <Text style={styles.historyHint}>
            {hasDetails
              ? expanded
                ? "Hide exercise details"
                : "View exercise details"
              : "Summary only"}
          </Text>
        </View>
        <View style={styles.historyAside}>
          <Text style={styles.historyMinutes}>{log.durationMinutes} min</Text>
          {hasDetails ? (
            <AppIcon
              name="chevronRight"
              color={colors.inkMuted}
              size={18}
              style={expanded ? styles.expandedChevron : undefined}
            />
          ) : null}
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.historyDetails}>
          {log.exercises?.map((exercise) => (
            <View
              key={exercise.workoutExerciseId}
              style={styles.loggedExercise}
            >
              <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
              <Text style={styles.exerciseSetCount}>
                {exercise.sets.length} completed{" "}
                {exercise.sets.length === 1 ? "set" : "sets"}
              </Text>
              <View style={styles.setRow}>
                <Text style={[styles.setCell, styles.setHeading]}>Set</Text>
                <Text style={[styles.setCell, styles.setHeading]}>Reps</Text>
                <Text style={[styles.weightCell, styles.setHeading]}>
                  Weight
                </Text>
              </View>
              {exercise.sets.map((set) => (
                <View key={set.setNumber} style={styles.setRow}>
                  <Text style={styles.setCell}>{set.setNumber}</Text>
                  <Text style={styles.setCell}>{set.reps}</Text>
                  <Text style={styles.weightCell}>
                    {displayWeight(set.weightKg)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </SurfaceCard>
  );
}

export default function ProgressScreen() {
  const { state } = useAppStore();
  const activity = getLastSevenDaysActivity(state.history);
  const weekLogs = getSevenDayLogs(state.history);
  const weekTotals = getWorkoutTotals(weekLogs);
  const totals = getWorkoutTotals(state.history);
  const hasSummaryOnlyHistory = state.history.some(
    (log) => log.exercises === undefined,
  );
  const maxMinutes = Math.max(...activity.map((day) => day.minutes), 1);

  return (
    <Screen>
      <AppHeader title="Your progress" eyebrow="Consistency over perfection" />

      <SectionHeader title="All-time totals" />
      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <StatCard
            label="Workouts"
            value={totals.workouts.toLocaleString()}
            icon="history"
            tint="#C66AE1"
          />
        </View>
        <View style={styles.statCell}>
          <StatCard
            label="Training minutes"
            value={totals.minutes.toLocaleString()}
            icon="clock"
            tint="#5C7CFA"
          />
        </View>
        <View style={styles.statCell}>
          <StatCard
            label="Exercises logged"
            value={totals.exercises.toLocaleString()}
            icon="exercise"
          />
        </View>
        <View style={styles.statCell}>
          <StatCard
            label="Sets completed"
            value={totals.sets.toLocaleString()}
            icon="check"
            tint="#C17A15"
          />
        </View>
      </View>
      <Text style={styles.totalsNote}>
        Exercises count once per workout when at least one set is completed.
      </Text>
      {hasSummaryOnlyHistory ? (
        <Text style={styles.totalsNote}>
          Older workouts include all planned exercises in their totals and have
          summary records only.
        </Text>
      ) : null}

      <SectionHeader title="Last 7 days" />
      <SurfaceCard style={styles.chartCard}>
        <View style={styles.chartSummary}>
          <View>
            <Text style={styles.chartValue}>
              {weekTotals.minutes.toLocaleString()}
            </Text>
            <Text style={styles.chartLabel}>training minutes</Text>
          </View>
          <View style={styles.chartCounts}>
            <Text style={styles.chartCountText}>
              {weekTotals.workouts}{" "}
              {weekTotals.workouts === 1 ? "workout" : "workouts"} ·{" "}
              {weekTotals.exercises}{" "}
              {weekTotals.exercises === 1 ? "exercise" : "exercises"}
            </Text>
            <View style={styles.setBadge}>
              <AppIcon name="check" color={colors.primary} size={18} />
              <Text style={styles.setBadgeText}>
                {weekTotals.sets.toLocaleString()}{" "}
                {weekTotals.sets === 1 ? "set" : "sets"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.chart}>
          {activity.map((day) => {
            const height = day.minutes
              ? 18 + (day.minutes / maxMinutes) * 86
              : 8;
            return (
              <View key={day.key} style={styles.barColumn}>
                <Text style={styles.barValue}>{day.minutes || ""}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor: day.minutes
                          ? colors.primary
                          : colors.surfaceMuted,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{day.label}</Text>
              </View>
            );
          })}
        </View>
      </SurfaceCard>

      <SectionHeader title="Workout history" />
      {state.history.length ? (
        <View style={styles.historyList}>
          {state.history.map((log) => (
            <WorkoutHistoryCard key={log.id} log={log} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="progress"
          title="Progress starts with one workout"
          message="Complete a session and your weekly activity will appear here."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statCell: {
    flexBasis: "45%",
    flexGrow: 1,
  },
  totalsNote: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  chartCard: {
    padding: spacing.lg,
  },
  chartSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chartCounts: {
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  chartCountText: {
    color: colors.inkMuted,
    fontSize: typography.caption,
  },
  chartValue: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "800",
  },
  chartLabel: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 2,
  },
  setBadge: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  setBadgeText: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  chart: {
    height: 150,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  barColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
  },
  barValue: {
    height: 18,
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: "600",
  },
  barTrack: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: "62%",
    maxWidth: 30,
    borderRadius: 8,
  },
  barLabel: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyCard: {
    overflow: "hidden",
  },
  historySummary: {
    minHeight: 94,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  historyCopy: {
    flex: 1,
  },
  historyTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "700",
  },
  historyDate: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 3,
  },
  historyMeta: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 3,
  },
  historyMinutes: {
    color: colors.ink,
    fontSize: typography.label,
    fontWeight: "800",
  },
  historyAside: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  historyHint: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  expandedChevron: {
    transform: [{ rotate: "90deg" }],
  },
  historyDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    gap: spacing.lg,
  },
  loggedExercise: {
    gap: spacing.xxs,
  },
  exerciseName: {
    color: colors.ink,
    fontSize: typography.label,
    fontWeight: "700",
  },
  exerciseSetCount: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginBottom: spacing.xs,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 32,
    gap: spacing.xs,
  },
  setCell: {
    flex: 1,
    color: colors.ink,
    fontSize: typography.label,
  },
  weightCell: {
    flex: 2,
    color: colors.ink,
    fontSize: typography.label,
    textAlign: "right",
  },
  setHeading: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
});
