import { useEffect, useState } from "react";
import {
  AppState as NativeAppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppIcon } from "@/components/AppIcon";
import { getExerciseById } from "@/data/exercises";
import { useAppStore } from "@/store/AppStore";
import { colors, radii, spacing, typography } from "@/theme/tokens";
import { formatElapsed } from "@/utils/format";

export function RestCountdown() {
  const { state, cancelRestTimer } = useAppStore();
  const [now, setNow] = useState(Date.now());
  const session = state.activeSession;
  const timer = session?.restTimer;
  useEffect(() => {
    if (!session?.timerSettings.enabled || !timer || timer.finished) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 250);
    const subscription = NativeAppState.addEventListener("change", tick);
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [session?.timerSettings.enabled, timer?.id, timer?.finished]);

  if (!session || !session.timerSettings.enabled) return null;
  const workout = state.workouts.find((item) => item.id === session.workoutId);
  const item = workout?.exercises.find(
    (exercise) => exercise.id === timer?.itemId,
  );
  const exercise = item ? getExerciseById(item.exerciseId) : undefined;
  const remaining = timer
    ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
    : 0;
  const title = timer?.finished ? "Rest finished" : "Rest timer";
  const timeLabel = !timer
    ? "Rest timer ready. Complete a set to start your rest."
    : timer.finished
      ? "Rest finished. Ready for your next set."
      : `${remaining} seconds of rest remaining${exercise ? ` after ${exercise.name}` : ""}, set ${timer.setIndex + 1} completed`;

  return (
    <View style={styles.card}>
      <View style={styles.timerInfo}>
        <View style={styles.titleRow}>
          <AppIcon
            name={timer?.finished ? "check" : "clock"}
            color={colors.primaryDark}
            size={16}
          />
          <Text style={styles.title} accessibilityLiveRegion="polite">
            {title}
          </Text>
        </View>
        <Text
          style={[styles.time, !timer && styles.ready]}
          accessibilityLabel={timeLabel}
        >
          {timer ? formatElapsed(timer.finished ? 0 : remaining) : "Ready"}
        </Text>
      </View>
      {timer ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            timer.finished ? "Dismiss rest timer" : "Skip rest"
          }
          onPress={() => cancelRestTimer(session.workoutId)}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>
            {timer.finished ? "Dismiss" : "Skip"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "flex-end",
    maxWidth: "100%",
    minWidth: 164,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  timerInfo: { flexShrink: 1, gap: spacing.xxs },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xxs },
  title: {
    flexShrink: 1,
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  time: {
    color: colors.primaryDark,
    fontSize: 28,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  ready: { fontSize: typography.heading },
  action: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  actionText: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  pressed: { opacity: 0.65 },
});
