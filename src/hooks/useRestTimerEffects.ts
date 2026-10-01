import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { AppState as NativeAppState } from "react-native";

import { RestAlertError, syncRestAlert } from "@/services/restAlerts";
import { ActiveSession } from "@/types/domain";

export function useRestTimerEffects(
  session: ActiveSession | null,
  isReady: boolean,
  finishRest: (workoutId: string, timerId: string) => void,
) {
  const player = useAudioPlayer(require("../../assets/audio/rest_finished.wav"));
  const latest = useRef({ session, finishRest });
  latest.current = { session, finishRest };
  const [alertError, setAlertError] = useState<RestAlertError | null>(null);
  const [soundError, setSoundError] = useState(false);
  const timer = session?.restTimer;

  useEffect(() => {
    if (!isReady) return;
    let active = true;
    const sync = () => {
      void syncRestAlert(latest.current.session).then((error) => {
        if (active) setAlertError(error);
      });
    };
    sync();
    const subscription = NativeAppState.addEventListener("change", (status) => {
      if (status === "active") sync();
    });
    return () => { active = false; subscription.remove(); };
  }, [isReady, session?.workoutId, timer?.id, timer?.finished,
    session?.timerSettings.enabled, session?.timerSettings.soundEnabled,
    session?.timerSettings.backgroundAlerts]);

  useEffect(() => {
    setSoundError(false);
    if (!isReady || !session || !timer || timer.finished) return;
    let handled = false;
    let maySound = timer.endsAt > Date.now() && NativeAppState.currentState === "active";
    const playSound = async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: false,
          shouldPlayInBackground: false,
          interruptionMode: "mixWithOthers",
        });
        await player.seekTo(0);
        const current = latest.current.session;
        if (current?.restTimer?.id === timer.id && current.timerSettings.enabled &&
            current.timerSettings.soundEnabled && NativeAppState.currentState === "active") {
          player.play();
        }
      } catch {
        if (latest.current.session?.restTimer?.id === timer.id) setSoundError(true);
      }
    };
    const tick = () => {
      if (handled || NativeAppState.currentState !== "active" || Date.now() < timer.endsAt) return;
      handled = true;
      latest.current.finishRest(session.workoutId, timer.id);
      if (maySound && Date.now() - timer.endsAt < 1500 && latest.current.session?.timerSettings.soundEnabled) {
        void playSound();
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    const subscription = NativeAppState.addEventListener("change", (status) => {
      if (status === "active") {
        // Returning after an expiry must not replay a background notification sound.
        maySound = Date.now() < timer.endsAt;
        tick();
      } else {
        maySound = false;
      }
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [isReady, session?.workoutId, timer?.id, timer?.finished, player]);

  useEffect(() => {
    if (!session?.timerSettings.enabled || !session.timerSettings.soundEnabled) player.pause();
  }, [player, session?.timerSettings.enabled, session?.timerSettings.soundEnabled]);

  return { alertError, soundError };
}
