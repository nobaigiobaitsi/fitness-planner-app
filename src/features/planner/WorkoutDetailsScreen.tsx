import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BackHeader } from "@/components/AppHeader";
import { AppIcon } from "@/components/AppIcon";
import { Button } from "@/components/Buttons";
import { EmptyState } from "@/components/EmptyState";
import { LabeledInput } from "@/components/Inputs";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/Section";
import { getDayLabel } from "@/data/days";
import { getExerciseById } from "@/data/exercises";
import { useAppStore } from "@/store/AppStore";
import { colors, pageLayout, radii, spacing, typography } from "@/theme/tokens";
import { WorkoutExercise } from "@/types/domain";
import { displayWeight, secondsToRestLabel } from "@/utils/format";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.stepperGroup}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          onPress={onDecrease}
          style={({ pressed }) => [
            styles.stepperButton,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="minus" color={colors.ink} size={17} />
        </Pressable>
        <Text numberOfLines={1} style={styles.stepperValue}>
          {value}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          onPress={onIncrease}
          style={({ pressed }) => [
            styles.stepperButton,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="add" color={colors.ink} size={17} />
        </Pressable>
      </View>
    </View>
  );
}

function ExerciseEditor({
  workoutId,
  item,
  index,
}: {
  workoutId: string;
  item: WorkoutExercise;
  index: number;
}) {
  const { removeExerciseFromWorkout, updateWorkoutExercise } = useAppStore();
  const exercise = getExerciseById(item.exerciseId);
  if (!exercise) return null;

  const update = (patch: Partial<WorkoutExercise>) =>
    updateWorkoutExercise(workoutId, item.id, patch);

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderText}>{index + 1}</Text>
        </View>
        <View style={styles.exerciseCopy}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseMeta}>
            {exercise.muscleGroup} · {secondsToRestLabel(item.restSeconds)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${exercise.name}`}
          onPress={() => removeExerciseFromWorkout(workoutId, item.id)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="delete" color={colors.danger} size={19} />
        </Pressable>
      </View>

      <View style={styles.steppers}>
        <Stepper
          label="Sets"
          value={`${item.sets}`}
          onDecrease={() => update({ sets: Math.max(1, item.sets - 1) })}
          onIncrease={() => update({ sets: Math.min(10, item.sets + 1) })}
        />
        <Stepper
          label="Reps"
          value={`${item.reps}`}
          onDecrease={() => update({ reps: Math.max(1, item.reps - 1) })}
          onIncrease={() => update({ reps: Math.min(50, item.reps + 1) })}
        />
        <Stepper
          label="Weight"
          value={displayWeight(item.weightKg)}
          onDecrease={() =>
            update({
              weightKg:
                item.weightKg && item.weightKg > 2.5
                  ? item.weightKg - 2.5
                  : undefined,
            })
          }
          onIncrease={() =>
            update({ weightKg: Math.min(500, (item.weightKg ?? 0) + 2.5) })
          }
        />
        <Stepper
          label="Rest"
          value={secondsToRestLabel(item.restSeconds)}
          onDecrease={() =>
            update({ restSeconds: Math.max(0, item.restSeconds - 15) })
          }
          onIncrease={() =>
            update({ restSeconds: Math.min(600, item.restSeconds + 15) })
          }
        />
      </View>
    </View>
  );
}

function WorkoutNameEditor({
  workoutId,
  name,
}: {
  workoutId: string;
  name: string;
}) {
  const { renameWorkout } = useAppStore();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(name);

  const openEditor = () => {
    setDraft(name);
    setVisible(true);
  };

  const saveName = () => {
    if (!draft.trim()) return;
    renameWorkout(workoutId, draft);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Rename ${name}`}
        accessibilityHint="Opens a field to edit the workout name"
        onPress={openEditor}
        style={({ pressed }) => [styles.titleRow, pressed && styles.pressed]}
      >
        <Text style={[styles.title, styles.editableTitle]}>{name}</Text>
        <AppIcon name="edit" color={colors.white} size={20} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.nameModalOverlay}
        >
          <View style={styles.nameDialog}>
            <Text style={styles.nameDialogTitle}>Rename workout</Text>

            <LabeledInput
              label="Workout name"
              value={draft}
              onChangeText={setDraft}
              autoFocus
            />

            <View style={styles.nameDialogActions}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setVisible(false)}
                style={styles.nameDialogButton}
              />
              <Button
                label="Save"
                icon="check"
                disabled={!draft.trim()}
                onPress={saveName}
                style={styles.nameDialogButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

export default function WorkoutDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const workoutId = getParam(params.id) ?? "";
  const { state, storageError, deleteWorkout } = useAppStore();
  const workout = state.workouts.find((item) => item.id === workoutId);

  if (!workout) {
    return (
      <Screen>
        <BackHeader title="Workout" />
        <EmptyState
          icon="info"
          title="Workout not found"
          message="It may have been removed from your weekly plan."
          actionLabel="Open planner"
          onAction={() => router.replace("/planner")}
        />
      </Screen>
    );
  }

  const totalSets = workout.exercises.reduce(
    (total, item) => total + item.sets,
    0,
  );

  const confirmDelete = () => {
    Alert.alert(
      "Delete workout?",
      `${workout.name} will be removed from your weekly plan.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteWorkout(workout.id);
            router.replace("/planner");
          },
        },
      ],
    );
  };

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Text style={[styles.footerNote, storageError && styles.footerError]}>
            {storageError
              ? "Changes could not be saved on this device."
              : "Changes are saved automatically."}
          </Text>
          <Button
            label="Done"
            icon="check"
            onPress={() =>
              router.replace({
                pathname: "/planner",
                params: { day: workout.day },
              })
            }
          />
        </View>
      }
    >
      <BackHeader
        title="Workout details"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete workout"
            onPress={confirmDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon name="delete" color={colors.danger} size={20} />
          </Pressable>
        }
      />

      <View style={styles.summary}>
        <View
          style={[styles.summaryGlow, { backgroundColor: workout.accent }]}
        />
        <Text style={styles.day}>{getDayLabel(workout.day).toUpperCase()}</Text>
        <WorkoutNameEditor workoutId={workout.id} name={workout.name} />
        <View style={styles.summaryMeta}>
          <Text style={styles.summaryText}>
            {workout.exercises.length} exercises
          </Text>
          <View style={styles.dot} />
          <Text style={styles.summaryText}>{totalSets} sets</Text>
        </View>
        <Button
          label="Start workout"
          icon="play"
          disabled={!workout.exercises.length}
          onPress={() => router.push(`/session/${workout.id}`)}
          style={styles.startButton}
        />
      </View>

      <SectionHeader
        title="Exercises"
        actionLabel="Add exercise"
        onAction={() => router.push(`/workout/${workout.id}/add-exercise`)}
      />

      {workout.exercises.length ? (
        <View style={styles.exerciseList}>
          {workout.exercises.map((item, index) => (
            <ExerciseEditor
              key={item.id}
              workoutId={workout.id}
              item={item}
              index={index}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="exercise"
          title="This workout is empty"
          message="Add exercises, then adjust their sets, repetitions, weight, and rest."
          actionLabel="Add exercises"
          onAction={() => router.push(`/workout/${workout.id}/add-exercise`)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dangerSoft,
  },
  summary: {
    position: "relative",
    overflow: "hidden",
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.ink,
  },
  summaryGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -90,
    right: -40,
    opacity: 0.46,
  },
  day: {
    color: "#AEE7D1",
    fontSize: typography.caption,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    color: colors.white,
    fontSize: 29,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  summaryMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  summaryText: {
    color: "#C5D1CC",
    fontSize: typography.label,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#74867E",
  },
  startButton: {
    marginTop: spacing.xl,
  },
  exerciseList: {
    gap: spacing.sm,
  },
  exerciseCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  orderBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  orderText: {
    color: colors.ink,
    fontSize: typography.label,
    fontWeight: "800",
  },
  exerciseCopy: {
    flex: 1,
  },
  exerciseName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "700",
  },
  exerciseMeta: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 3,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dangerSoft,
  },
  steppers: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stepperGroup: {
    flexGrow: 1,
    gap: 6,
  },
  stepperLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stepper: {
    minWidth: 104,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperButton: {
    width: 34,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  stepperValue: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.62,
  },
  footer: {
    width: "100%",
    maxWidth: pageLayout.maxWidth,
    alignSelf: "center",
    paddingHorizontal: pageLayout.horizontalPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerNote: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  footerError: {
    color: colors.danger,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
  },
  editableTitle: {
    flex: 1,
  },
  nameModalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: spacing.lg,
  },
  nameDialog: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  nameDialogTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "800",
    marginBottom: spacing.lg,
  },
  nameDialogActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  nameDialogButton: {
    flex: 1,
  },
});
