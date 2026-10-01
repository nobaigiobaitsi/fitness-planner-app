import { useEffect, useRef, useState } from "react";
import { Alert, Linking, Platform, StyleSheet, Switch, Text, View } from "react-native";

import { requestRestAlertPermission } from "@/services/restAlerts";
import { colors, spacing, typography } from "@/theme/tokens";
import { SessionTimerSettings } from "@/types/domain";

type Props = {
  value: SessionTimerSettings;
  onChange: (patch: Partial<SessionTimerSettings>) => void;
  dark?: boolean;
  onBusyChange?: (busy: boolean) => void;
};

export function SessionTimerOptions({ value, onChange, dark = false, onBusyChange }: Props) {
  const [asking, setAsking] = useState(false);
  const requestVersion = useRef(0);
  const mounted = useRef(true);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; requestVersion.current++; };
  }, []);
  useEffect(() => { onBusyChange?.(asking); }, [asking, onBusyChange]);
  useEffect(() => {
    if (!value.enabled) { requestVersion.current++; setAsking(false); }
  }, [value.enabled]);

  const setBackgroundAlerts = async (enabled: boolean) => {
    const request = ++requestVersion.current;
    if (!enabled) { onChange({ backgroundAlerts: false }); return; }
    setAsking(true);
    try {
      const granted = await requestRestAlertPermission();
      if (!mounted.current || request !== requestVersion.current || !latest.current.value.enabled) return;
      if (granted) {
        latest.current.onChange({ backgroundAlerts: true });
      } else {
        Alert.alert("Notifications are off", "The on-screen rest timer still works. Allow FitPlanner notifications in your phone settings to receive locked-screen alerts.", [
          { text: "Keep using timer", style: "cancel" },
          { text: "Open settings", onPress: () => { void Linking.openSettings().catch(() => undefined); } },
        ]);
      }
    } catch {
      if (mounted.current && request === requestVersion.current) {
        Alert.alert("Alerts unavailable", "Locked-screen alerts could not be enabled. You can still use the countdown and in-app sound.");
      }
    } finally {
      if (mounted.current && request === requestVersion.current) setAsking(false);
    }
  };

  const row = (title: string, description: string, enabled: boolean,
    onValueChange: (enabled: boolean) => void, disabled = false) => (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={[styles.title, dark && styles.darkTitle]}>{title}</Text>
        <Text style={[styles.description, dark && styles.darkDescription]}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={enabled}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: dark ? "#52645B" : colors.border, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );

  return (
    <View style={styles.options}>
      {row("Automatic rest timer", "Start a countdown after each completed set.", value.enabled,
        (enabled) => onChange(enabled ? { enabled: true } : { enabled: false, backgroundAlerts: false }))}
      {value.enabled ? (
        <>
          {row("Rest sound", "Play a short sound when rest ends.", value.soundEnabled,
            (soundEnabled) => onChange({ soundEnabled }))}
          {Platform.OS !== "web" ? row("Locked-screen alerts", asking ? "Checking notification permission…" :
            "Notify me when the app is in the background.", value.backgroundAlerts,
            (enabled) => { void setBackgroundAlerts(enabled); }, asking) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.xs },
  row: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: typography.label, fontWeight: "700" },
  description: { color: colors.inkMuted, fontSize: typography.caption, lineHeight: 17, marginTop: 3 },
  darkTitle: { color: colors.white },
  darkDescription: { color: "#D2E2D9" },
});
