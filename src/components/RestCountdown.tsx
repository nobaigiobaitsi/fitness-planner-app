import { useEffect, useState } from "react";
import { AppState as NativeAppState, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Buttons";
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
    if (!timer || timer.finished) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 250);
    const subscription = NativeAppState.addEventListener("change", tick);
    return () => { clearInterval(interval); subscription.remove(); };
  }, [timer?.id, timer?.finished]);

  if (!session || !timer || !session.timerSettings.enabled) return null;
  const workout = state.workouts.find((item) => item.id === session.workoutId);
  const item = workout?.exercises.find((exercise) => exercise.id === timer.itemId);
  const exercise = item ? getExerciseById(item.exerciseId) : undefined;
  const remaining = Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityLiveRegion="polite">
        {timer.finished ? "Rest finished · Ready for your next set" : "Rest before your next set"}
      </Text>
      <Text style={styles.caption}>{exercise?.name} · Set {timer.setIndex + 1} completed</Text>
      <Text style={styles.time} accessibilityLabel={timer.finished ? "Rest finished" : `${remaining} seconds of rest remaining`}>
        {formatElapsed(timer.finished ? 0 : remaining)}
      </Text>
      <Button label={timer.finished ? "Dismiss" : "Skip rest"} variant="secondary"
        onPress={() => cancelRestTimer(session.workoutId)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.primarySoft, gap: spacing.xs, marginBottom: spacing.lg },
  title: { color: colors.primaryDark, fontSize: typography.label, fontWeight: "800" },
  caption: { color: colors.inkMuted, fontSize: typography.caption },
  time: { color: colors.primaryDark, fontSize: 42, fontWeight: "800", fontVariant: ["tabular-nums"], textAlign: "center", marginVertical: spacing.xs },
});
