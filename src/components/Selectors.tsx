import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { days } from '@/data/days';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import { DayKey } from '@/types/domain';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selectedChip,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>{label}</Text>
    </Pressable>
  );
}

type DaySelectorProps = {
  selectedDay: DayKey;
  onSelect: (day: DayKey) => void;
  counts?: Partial<Record<DayKey, number>>;
};

export function DaySelector({ selectedDay, onSelect, counts }: DaySelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dayScroller}>
      {days.map((day) => {
        const selected = day.key === selectedDay;
        const count = counts?.[day.key] ?? 0;
        return (
          <Pressable
            key={day.key}
            accessibilityRole="button"
            accessibilityLabel={`${day.label}, ${count} workouts`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(day.key)}
            style={({ pressed }) => [
              styles.day,
              selected && styles.selectedDay,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.dayText, selected && styles.selectedDayText]}>{day.shortLabel}</Text>
            <View style={[styles.count, selected && styles.selectedCount]}>
              <Text style={[styles.countText, selected && styles.selectedCountText]}>{count}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedChip: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.inkMuted,
    fontSize: typography.label,
    fontWeight: '600',
  },
  selectedChipText: {
    color: colors.white,
  },
  dayScroller: {
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  day: {
    width: 66,
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
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
  count: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  selectedCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countText: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  selectedCountText: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.72,
  },
});
