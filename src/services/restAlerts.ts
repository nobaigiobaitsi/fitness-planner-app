import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";

import { ActiveSession } from "@/types/domain";

const REST_NOTIFICATION_KIND = "fitplanner-rest";
const SOUND_CHANNEL = "fitplanner-rest-sound-v1";
const SILENT_CHANNEL = "fitplanner-rest-silent-v1";

export type RestAlertError = "permission" | "exact-alarm" | "unavailable";

type AlertTarget = {
  identifier: string;
  workoutId: string;
  endsAt: number;
  soundEnabled: boolean;
};

let desiredTarget: AlertTarget | null = null;
let revision = 0;
let notificationQueue: Promise<unknown> = Promise.resolve();

if (Platform.OS !== "web") {
  // The visible app uses its own countdown and sound. Suppress its system
  // notification in the foreground so the same rest never produces two sounds.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function notificationsAllowed(settings: Notifications.NotificationPermissionsStatus) {
  if (Platform.OS === "ios") {
    return (
      settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
    );
  }
  return settings.granted;
}

async function createRestChannels() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(SOUND_CHANNEL, {
    name: "Rest timer sounds",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "rest_finished.wav",
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
  if (Platform.OS === "web") return false;
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
    !timer || timer.finished || timer.endsAt <= Date.now()
  ) return null;
  return {
    identifier: `fitplanner-rest-${timer.id}`,
    workoutId: session.workoutId,
    endsAt: timer.endsAt,
    soundEnabled: session.timerSettings.soundEnabled,
  };
}

// Serialize native operations. A replacement/cancellation that arrives while
// scheduling is in flight invalidates the old request before it can remain live.
export function syncRestAlert(session: ActiveSession | null): Promise<RestAlertError | null> {
  if (Platform.OS === "web") return Promise.resolve(null);
  desiredTarget = getTarget(session);
  const requestedRevision = ++revision;
  const task = notificationQueue.catch(() => undefined).then(async () => {
    if (requestedRevision !== revision) return null;
    const target = desiredTarget;
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const request of scheduled) {
        if (request.content.data?.kind === REST_NOTIFICATION_KIND) {
          await Notifications.cancelScheduledNotificationAsync(request.identifier);
        }
      }
      const presented = await Notifications.getPresentedNotificationsAsync();
      for (const notification of presented) {
        if (notification.request.content.data?.kind === REST_NOTIFICATION_KIND) {
          await Notifications.dismissNotificationAsync(notification.request.identifier);
        }
      }
      if (!target || requestedRevision !== revision || target.endsAt <= Date.now()) return null;
      await createRestChannels();
      const settings = await Notifications.getPermissionsAsync();
      if (!notificationsAllowed(settings)) return "permission";
      if (requestedRevision !== revision || target.endsAt <= Date.now()) return null;
      const identifier = await Notifications.scheduleNotificationAsync({
        identifier: target.identifier,
        content: {
          title: "Rest finished",
          body: "Ready for your next set.",
          sound: target.soundEnabled ? "rest_finished.wav" : false,
          data: { kind: REST_NOTIFICATION_KIND, workoutId: target.workoutId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(target.endsAt),
          channelId: target.soundEnabled ? SOUND_CHANNEL : SILENT_CHANNEL,
        },
      });
      if (requestedRevision !== revision) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      }
      return null;
    } catch (error) {
      if (requestedRevision !== revision) return null;
      const message = String(error).toLowerCase();
      return Platform.OS === "android" && /exact.?alarm|schedule_exact_alarm/.test(message)
        ? "exact-alarm" : "unavailable";
    }
  });
  notificationQueue = task;
  return task;
}
