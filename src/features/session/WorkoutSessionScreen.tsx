import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  AppState as NativeAppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BackHeader } from "@/components/AppHeader";
import { AppIcon } from "@/components/AppIcon";
import { Button } from "@/components/Buttons";
import { EmptyState } from "@/components/EmptyState";
import { RestCountdown } from "@/components/RestCountdown";
import { Screen } from "@/components/Screen";
import { SessionTimerOptions } from "@/components/SessionTimerOptions";
import { StartWorkoutButton } from "@/components/StartWorkoutButton";
import { getExerciseById } from "@/data/exercises";
import { openRestAlertSettings } from "@/services/restAlerts";
import { useAppStore } from "@/store/AppStore";
import { colors, radii, spacing, typography } from "@/theme/tokens";
import {
  displayWeight,
  formatElapsed,
  secondsToRestLabel,
} from "@/utils/format";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function WorkoutSessionScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const workoutId = getParam(params.id) ?? "";
  const navigation = useNavigation();
  const {
    state,
    updateSessionTimerSettings,
    restAlertError,
    restSoundError,
    toggleSessionSet,
    checkpointSession,
    discardSession,
    completeWorkout,
  } = useAppStore();
  const workout = state.workouts.find((item) => item.id === workoutId);
  const session =
    state.activeSession?.workoutId === workoutId ? state.activeSession : null;
  const allowExit = useRef(false);
  const promptVisible = useRef(false);
  const finishing = useRef(false);
  const clock = useRef({ base: 0, resumedAt: Date.now() });
  const [elapsedSeconds, setElapsedSeconds] = useState(
    session?.elapsedSeconds ?? 0,
  );

  useEffect(() => {
    if (!session) return;
    clock.current = { base: session.elapsedSeconds, resumedAt: Date.now() };
    setElapsedSeconds(session.elapsedSeconds);
    const currentElapsed = () =>
      clock.current.base +
      Math.floor((Date.now() - clock.current.resumedAt) / 1000);
    const interval = setInterval(() => {
      const seconds = currentElapsed();
      setElapsedSeconds(seconds);
      if (seconds > session.elapsedSeconds && seconds % 10 === 0)
        checkpointSession(workoutId, seconds);
    }, 1000);
    const subscription = NativeAppState.addEventListener("change", (status) => {
      if (status !== "active") checkpointSession(workoutId, currentElapsed());
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [checkpointSession, session?.workoutId, workoutId]);

  const showLeavePrompt = useCallback(
    (leave: () => void) => {
      if (promptVisible.current) return;
      promptVisible.current = true;
      Alert.alert(
        "Leave workout?",
        "Set progress from this active session will be discarded.",
        [
          {
            text: "Keep training",
            style: "cancel",
            onPress: () => {
              promptVisible.current = false;
            },
          },
          {
            text: "Leave",
            style: "destructive",
            onPress: () => {
              allowExit.current = true;
              discardSession(workoutId);
              leave();
            },
          },
        ],
        {
          cancelable: true,
          onDismiss: () => {
            promptVisible.current = false;
          },
        },
      );
    },
    [discardSession, workoutId],
  );

  useEffect(() => {
    if (!session) return;
    const removeListener = navigation.addListener("beforeRemove", (event) => {
      if (allowExit.current) return;
      event.preventDefault();
      showLeavePrompt(() => navigation.dispatch(event.data.action));
    });
    const backListener = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!navigation.isFocused()) return false;
        showLeavePrompt(() => router.back());
        return true;
      },
    );
    return () => {
      removeListener();
      backListener.remove();
    };
  }, [navigation, session?.workoutId, showLeavePrompt]);

  const counts = useMemo(() => {
    const total =
      workout?.exercises.reduce((sum, item) => sum + item.sets, 0) ?? 0;
    const done = Object.values(session?.completed ?? {}).reduce(
      (sum, sets) => sum + sets.filter(Boolean).length,
      0,
    );
    return { total, done };
  }, [session?.completed, workout?.exercises]);

  if (!workout) {
    return (
      <Screen>
        <EmptyState
          icon="info"
          title="Workout unavailable"
          message="This workout is no longer in your weekly plan."
          actionLabel="Return home"
          onAction={() => router.replace("/")}
        />
      </Screen>
    );
  }

  if (!workout.exercises.length) {
    return (
      <Screen>
        <EmptyState
          icon="exercise"
          title="Add exercises first"
          message="Build this workout before starting a session."
          actionLabel="Edit workout"
          onAction={() => router.replace(`/workout/${workoutId}`)}
        />
      </Screen>
    );
  }

  if (state.activeSession && !session) {
    return (
      <Screen>
        <EmptyState
          icon="clock"
          title="Workout already in progress"
          message="Resume or finish your current workout before starting another one."
          actionLabel="Resume workout"
          onAction={() =>
            router.replace(`/session/${state.activeSession?.workoutId}`)
          }
        />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <BackHeader title={workout.name} />
        <Text style={styles.setupDescription}>
          Choose your options, then start training.
        </Text>
        <StartWorkoutButton workoutId={workoutId} stayOnScreen />
      </Screen>
    );
  }

  const toggleSet = (itemId: string, setIndex: number) => {
    toggleSessionSet(workoutId, itemId, setIndex, elapsedSeconds);
  };

  const openExerciseDetails = (exerciseId: string) => {
    checkpointSession(workoutId, elapsedSeconds);
    router.push(`/exercise/${exerciseId}`);
  };

  const leaveSession = () => {
    showLeavePrompt(() => router.back());
  };

  const saveSession = () => {
    if (finishing.current) return;
    finishing.current = true;
    allowExit.current = true;
    completeWorkout(
      workout.id,
      Math.max(1, Math.round(elapsedSeconds / 60)),
      counts.done,
    );
    router.replace("/");
  };

  const finishSession = () => {
    if (counts.done < counts.total) {
      Alert.alert(
        "Finish early?",
        `You completed ${counts.done} of ${counts.total} sets. The completed sets will still be saved.`,
        [
          { text: "Keep training", style: "cancel" },
          { text: "Finish", onPress: saveSession },
        ],
      );
      return;
    }
    saveSession();
  };

  const progress = counts.total ? counts.done / counts.total : 0;

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            label={
              counts.done === counts.total
                ? "Complete workout"
                : `Finish · ${counts.done}/${counts.total} sets`
            }
            icon="check"
            onPress={finishSession}
            disabled={!counts.done}
          />
        </View>
      }
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leave workout"
          onPress={leaveSession}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="close" color={colors.ink} size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {workout.name}
          </Text>
          <Text style={styles.headerCaption}>Workout in progress</Text>
        </View>
        <View style={styles.timer}>
          <AppIcon name="clock" color={colors.primary} size={18} />
          <Text style={styles.timerText}>{formatElapsed(elapsedSeconds)}</Text>
        </View>
      </View>

      <View style={styles.restOptions}>
        <SessionTimerOptions
          value={session.timerSettings}
          onChange={(patch) => updateSessionTimerSettings(workoutId, patch)}
        />
        {restAlertError ? (
          <View style={styles.restWarning}>
            <Text style={styles.restWarningText}>
              {restAlertError === "exact-alarm"
                ? "Allow FitPlanner in Alarms & reminders for timed background alerts. The on-screen timer still works."
                : "Background alerts are unavailable. The on-screen timer still works. Check FitPlanner's notification settings."}
            </Text>
            <Button
              label={
                restAlertError === "exact-alarm"
                  ? "Alarm settings"
                  : "Notification settings"
              }
              variant="secondary"
              onPress={() => {
                void openRestAlertSettings(restAlertError).catch(
                  () => undefined,
                );
              }}
            />
          </View>
        ) : null}
        {restSoundError ? (
          <Text style={styles.restWarningText}>
            The rest sound could not play. You can continue using the countdown.
          </Text>
        ) : null}
      </View>
      <RestCountdown />

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Session progress</Text>
        <Text style={styles.progressValue}>{Math.round(progress * 100)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.exerciseList}>
        {workout.exercises.map((item, exerciseIndex) => {
          const exercise = getExerciseById(item.exerciseId);
          if (!exercise) return null;

          return (
            <View key={item.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeading}>
                <View
                  style={[
                    styles.exerciseNumber,
                    { backgroundColor: workout.accent },
                  ]}
                >
                  <Text style={styles.exerciseNumberText}>
                    {exerciseIndex + 1}
                  </Text>
                </View>
                <View style={styles.exerciseCopy}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View ${exercise.name} details`}
                    accessibilityHint="Shows the exercise image, instructions, and form tips"
                    hitSlop={6}
                    onPress={() => openExerciseDetails(exercise.id)}
                    style={({ pressed }) => [
                      styles.exerciseNameButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <AppIcon
                      name="chevronRight"
                      color={colors.primaryDark}
                      size={18}
                    />
                  </Pressable>
                  <Text style={styles.exerciseMeta}>
                    {secondsToRestLabel(item.restSeconds)}
                  </Text>
                </View>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeading, styles.setColumn]}>SET</Text>
                <Text style={styles.tableHeading}>WEIGHT</Text>
                <Text style={styles.tableHeading}>REPS</Text>
                <Text style={[styles.tableHeading, styles.doneColumn]}>
                  DONE
                </Text>
              </View>

              {Array.from({ length: item.sets }, (_, setIndex) => {
                const isDone = session.completed[item.id]?.[setIndex] ?? false;
                return (
                  <Pressable
                    key={`${item.id}-${setIndex}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isDone }}
                    accessibilityLabel={`${exercise.name}, set ${setIndex + 1}`}
                    onPress={() => toggleSet(item.id, setIndex)}
                    style={({ pressed }) => [
                      styles.setRow,
                      isDone && styles.completedSet,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.setValue, styles.setColumn]}>
                      {setIndex + 1}
                    </Text>
                    <Text style={styles.setValue}>
                      {displayWeight(item.weightKg)}
                    </Text>
                    <Text style={styles.setValue}>{item.reps}</Text>
                    <View style={styles.doneColumn}>
                      <View
                        style={[styles.checkbox, isDone && styles.checkedBox]}
                      >
                        {isDone ? (
                          <AppIcon
                            name="check"
                            color={colors.white}
                            size={19}
                          />
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  setupDescription: {
    color: colors.inkMuted,
    fontSize: typography.body,
    lineHeight: 23,
  },
  restOptions: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  restWarning: { gap: spacing.sm, marginTop: spacing.sm },
  restWarningText: {
    color: colors.danger,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  header: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "800",
  },
  headerCaption: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 2,
  },
  timer: {
    minWidth: 78,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  timerText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: colors.inkMuted,
    fontSize: typography.label,
  },
  progressValue: {
    color: colors.primary,
    fontSize: typography.label,
    fontWeight: "800",
  },
  progressTrack: {
    height: 9,
    overflow: "hidden",
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  exerciseList: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  exerciseCard: {
    overflow: "hidden",
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  exerciseHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  exerciseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseNumberText: {
    color: colors.white,
    fontSize: typography.label,
    fontWeight: "800",
  },
  exerciseCopy: {
    flex: 1,
  },
  exerciseNameButton: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  exerciseName: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
  exerciseMeta: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 3,
  },
  tableHeader: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeading: {
    flex: 1,
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  setRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  completedSet: {
    backgroundColor: "#F0FAF6",
  },
  setValue: {
    flex: 1,
    color: colors.ink,
    fontSize: typography.label,
    fontWeight: "600",
    textAlign: "center",
  },
  setColumn: {
    flex: 0.55,
  },
  doneColumn: {
    flex: 0.7,
    alignItems: "center",
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  checkedBox: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  footer: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.65,
  },
});
