import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { Button } from "@/components/Buttons";
import { SessionTimerOptions } from "@/components/SessionTimerOptions";
import { useAppStore } from "@/store/AppStore";
import { spacing } from "@/theme/tokens";
import { defaultSessionTimerSettings } from "@/types/domain";

export function StartWorkoutButton({ workoutId, dark = false, buttonStyle, stayOnScreen = false }: {
  workoutId: string;
  dark?: boolean;
  buttonStyle?: StyleProp<ViewStyle>;
  stayOnScreen?: boolean;
}) {
  const { state, isReady, startSession } = useAppStore();
  const [options, setOptions] = useState({ ...defaultSessionTimerSettings });
  const [asking, setAsking] = useState(false);
  const starting = useRef(false);
  const workout = state.workouts.find((item) => item.id === workoutId);

  useFocusEffect(useCallback(() => {
    // A previous session's choice is never consent for the next workout.
    setOptions({ ...defaultSessionTimerSettings });
    starting.current = false;
  }, [workoutId]));

  const startWorkout = () => {
    if (starting.current || asking || !isReady || !workout?.exercises.length) return;
    starting.current = true;
    if (!state.activeSession) startSession(workoutId, options);
    if (!stayOnScreen) router.push(`/session/${workoutId}`);
  };

  return (
    <View style={styles.group}>
      {!state.activeSession ? (
        <SessionTimerOptions
          value={options}
          onChange={(patch) => setOptions((current) => ({ ...current, ...patch }))}
          onBusyChange={setAsking}
          dark={dark}
        />
      ) : null}
      <Button
        label={state.activeSession?.workoutId === workoutId ? "Resume workout" : "Start workout"}
        icon="play"
        disabled={!isReady || !workout?.exercises.length || asking}
        onPress={startWorkout}
        style={buttonStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({ group: { gap: spacing.md, marginTop: spacing.md } });
