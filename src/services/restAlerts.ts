import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import type { NotificationPermissionsStatus } from "expo-notifications";
import { Linking, AppState as NativeAppState, Platform } from "react-native";

import { ActiveSession } from "@/types/domain";

// Loading expo-notifications also initializes its push-token support. On
// Android Expo Go that can throw before Router can load any of our screens.
// Our bundled custom sound and locked-screen alert settings need our own build.
export const supportsBackgroundRestAlerts =
  Platform.OS !== "web" && !isRunningInExpoGo();

const Notifications: typeof import("expo-notifications") | null =
  supportsBackgroundRestAlerts ? require("expo-notifications") : null;

const REST_NOTIFICATION_KIND = "fitplanner-rest";
// Android keeps a channel's original sound and audio attributes. A new ID is
// needed to apply the alarm audio usage to existing installations.
const SOUND_CHANNEL = "fitplanner-rest-sound-v2";
const SILENT_CHANNEL = "fitplanner-rest-silent-v1";

export type RestAlertError =
  | "permission"
  | "sound-disabled"
  | "exact-alarm"
  | "unavailable";

type AlertTarget = {
  identifier: string;
  workoutId: string;
  endsAt: number;
  soundEnabled: boolean;
};

let desiredTarget: AlertTarget | null = null;
let revision = 0;
let notificationQueue: Promise<unknown> = Promise.resolve();

if (Notifications) {
  // Use the player while the app is visible and the system alert while it is
  // inactive/backgrounded. Check at delivery time, including screen locking.
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isRestAlert =
        notification.request.content.data?.kind === REST_NOTIFICATION_KIND;
      const showAlert =
        !isRestAlert || NativeAppState.currentState !== "active";
      return {
        shouldShowBanner: showAlert,
        shouldShowList: showAlert,
        shouldPlaySound:
          showAlert &&
          notification.request.content.data?.soundEnabled !== false,
        shouldSetBadge: false,
      };
    },
  });
}

function notificationsAllowed(settings: NotificationPermissionsStatus) {
  if (!Notifications) return false;
  if (Platform.OS === "ios") {
    return (
      settings.ios?.status ===
        Notifications.IosAuthorizationStatus.AUTHORIZED ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
    );
  }
  return settings.granted;
}

async function createRestChannels() {
  if (!Notifications || Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(SOUND_CHANNEL, {
    name: "Rest timer sounds",
    description:
      "Audible rest alerts, including when the phone is locked. Uses alarm volume.",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "rest_finished.wav",
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
    enableVibrate: false,
    enableLights: false,
    bypassDnd: false,
    showBadge: false,
  });
  await Notifications.setNotificationChannelAsync(SILENT_CHANNEL, {
    name: "Silent rest timers",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    enableVibrate: false,
    enableLights: false,
    bypassDnd: false,
    showBadge: false,
  });
}

// Only called from the user's locked-screen alerts switch, never at app launch.
export async function requestRestAlertPermission(): Promise<boolean> {
  if (!Notifications) return false;
  await createRestChannels();
  let settings = await Notifications.getPermissionsAsync();
  if (!notificationsAllowed(settings) && settings.canAskAgain) {
    settings = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
  }
  return notificationsAllowed(settings);
}

export async function openRestAlertSettings(error: RestAlertError) {
  if (!supportsBackgroundRestAlerts) return;
  if (Platform.OS === "android" && error === "sound-disabled") {
    const appPackage = Constants.expoConfig?.android?.package;
    if (appPackage) {
      try {
        await Linking.sendIntent(
          "android.settings.CHANNEL_NOTIFICATION_SETTINGS",
          [
            { key: "android.provider.extra.APP_PACKAGE", value: appPackage },
            { key: "android.provider.extra.CHANNEL_ID", value: SOUND_CHANNEL },
          ],
        );
        return;
      } catch {
        // Fall back to the app settings on devices without channel settings.
      }
    }
  }
  if (Platform.OS === "android" && error === "exact-alarm") {
    try {
      // Opens Android's Alarms & reminders access list; select FitPlanner.
      await Linking.sendIntent("android.settings.REQUEST_SCHEDULE_EXACT_ALARM");
      return;
    } catch {
      // Some Android manufacturers do not expose this settings activity.
    }
  }
  await Linking.openSettings();
}

function getTarget(session: ActiveSession | null): AlertTarget | null {
  const timer = session?.restTimer;
  if (
    !session?.timerSettings.enabled ||
    !session.timerSettings.backgroundAlerts ||
    !timer ||
    timer.finished ||
    timer.endsAt <= Date.now()
  )
    return null;
  return {
    identifier: `fitplanner-rest-${timer.id}`,
    workoutId: session.workoutId,
    endsAt: timer.endsAt,
    soundEnabled: session.timerSettings.soundEnabled,
  };
}

// Serialize native operations. A replacement/cancellation that arrives while
// scheduling is in flight invalidates the old request before it can remain live.
export function syncRestAlert(
  session: ActiveSession | null,
): Promise<RestAlertError | null> {
  if (!Notifications) return Promise.resolve(null);
  desiredTarget = getTarget(session);
  const requestedRevision = ++revision;
  const task = notificationQueue
    .catch(() => undefined)
    .then(async () => {
      if (requestedRevision !== revision) return null;
      const target = desiredTarget;
      try {
        const scheduled =
          await Notifications.getAllScheduledNotificationsAsync();
        for (const request of scheduled) {
          if (request.content.data?.kind === REST_NOTIFICATION_KIND) {
            await Notifications.cancelScheduledNotificationAsync(
              request.identifier,
            );
          }
        }
        const presented = await Notifications.getPresentedNotificationsAsync();
        for (const notification of presented) {
          if (
            notification.request.content.data?.kind === REST_NOTIFICATION_KIND
          ) {
            await Notifications.dismissNotificationAsync(
              notification.request.identifier,
            );
          }
        }
        if (
          !target ||
          requestedRevision !== revision ||
          target.endsAt <= Date.now()
        )
          return null;
        await createRestChannels();
        const settings = await Notifications.getPermissionsAsync();
        if (!notificationsAllowed(settings)) return "permission";
        let soundError: RestAlertError | null = null;
        if (
          Platform.OS === "ios" &&
          target.soundEnabled &&
          settings.ios?.allowsSound === false
        ) {
          soundError = "sound-disabled";
        }
        if (Platform.OS === "android") {
          const channel = await Notifications.getNotificationChannelAsync(
            target.soundEnabled ? SOUND_CHANNEL : SILENT_CHANNEL,
          );
          if (channel?.importance === Notifications.AndroidImportance.NONE)
            return "permission";
          if (
            target.soundEnabled &&
            channel &&
            (channel.sound === null ||
              channel.importance < Notifications.AndroidImportance.DEFAULT)
          ) {
            soundError = "sound-disabled";
          }
        }
        if (requestedRevision !== revision || target.endsAt <= Date.now())
          return null;
        const identifier = await Notifications.scheduleNotificationAsync({
          identifier: target.identifier,
          content: {
            title: "Rest finished",
            body: "Ready for your next set.",
            sound: target.soundEnabled ? "rest_finished.wav" : false,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            interruptionLevel: "active",
            data: {
              kind: REST_NOTIFICATION_KIND,
              workoutId: target.workoutId,
              soundEnabled: target.soundEnabled,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(target.endsAt),
            channelId: target.soundEnabled ? SOUND_CHANNEL : SILENT_CHANNEL,
          },
        });
        if (requestedRevision !== revision) {
          await Notifications.cancelScheduledNotificationAsync(identifier);
          return null;
        }
        return soundError;
      } catch (error) {
        if (requestedRevision !== revision) return null;
        const message = String(error).toLowerCase();
        return Platform.OS === "android" &&
          /exact.?alarm|schedule_exact_alarm/.test(message)
          ? "exact-alarm"
          : "unavailable";
      }
    });
  notificationQueue = task;
  return task;
}
