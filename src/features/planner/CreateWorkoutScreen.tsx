import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackHeader } from '@/components/AppHeader';
import { Button } from '@/components/Buttons';
import { LabeledInput } from '@/components/Inputs';
import { Screen } from '@/components/Screen';
import { days, getDayKey } from '@/data/days';
import { useAppStore } from '@/store/AppStore';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import { dayKeys, DayKey } from '@/types/domain';

const accentOptions = ['#FF8A65', '#5C9DFF', '#B388FF', '#2DBE8C', '#F2B84B'];

function isDayKey(value: string | string[] | undefined): value is DayKey {
  return typeof value === 'string' && dayKeys.includes(value as DayKey);
}

export default function CreateWorkoutScreen() {
  const params = useLocalSearchParams<{ day?: string | string[] }>();
  const { createWorkout } = useAppStore();
  const [name, setName] = useState('');
  const [day, setDay] = useState<DayKey>(isDayKey(params.day) ? params.day : getDayKey());
  const [accent, setAccent] = useState(accentOptions[3]);

  const submit = () => {
    if (!name.trim()) return;
    const workoutId = createWorkout({ name, day, accent });
    router.replace(`/workout/${workoutId}`);
  };

  return (
    <Screen>
      <BackHeader title="New workout" />
      <Text style={styles.title}>Create a training day</Text>
      <Text style={styles.subtitle}>Give it a clear name, choose its day, then add exercises.</Text>

      <View style={styles.form}>
        <LabeledInput
          label="Workout name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Upper Body"
          autoFocus
        />

        <View style={styles.field}>
          <Text style={styles.label}>Training day</Text>
          <View style={styles.dayGrid}>
            {days.map((option) => {
              const selected = day === option.key;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setDay(option.key)}
                  style={({ pressed }) => [
                    styles.dayOption,
                    selected && styles.selectedDay,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.dayText, selected && styles.selectedDayText]}>{option.shortLabel}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            {accentOptions.map((color) => (
              <Pressable
                key={color}
                accessibilityRole="button"
                accessibilityLabel={`Choose color ${color}`}
                accessibilityState={{ selected: accent === color }}
                onPress={() => setAccent(color)}
                style={({ pressed }) => [
                  styles.colorOuter,
                  accent === color && styles.selectedColorOuter,
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.colorInner, { backgroundColor: color }]} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Button label="Create workout" icon="add" onPress={submit} disabled={!name.trim()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.xl,
    marginVertical: spacing.xxl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.ink,
    fontSize: typography.label,
    fontWeight: '700',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  dayOption: {
    minWidth: 64,
    height: 44,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedDay: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dayText: {
    color: colors.ink,
    fontSize: typography.label,
    fontWeight: '700',
  },
  selectedDayText: {
    color: colors.white,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  colorOuter: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOuter: {
    borderColor: colors.ink,
  },
  colorInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  pressed: {
    opacity: 0.65,
  },
});
