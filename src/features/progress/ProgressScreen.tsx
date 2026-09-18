import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { AppIcon } from '@/components/AppIcon';
import { StatCard, SurfaceCard } from '@/components/Cards';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/Section';
import { useAppStore } from '@/store/AppStore';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import { formatHistoryDate } from '@/utils/format';
import { getLastSevenDaysActivity, getSevenDayLogs } from '@/utils/workouts';

export default function ProgressScreen() {
  const { state } = useAppStore();
  const activity = getLastSevenDaysActivity(state.history);
  const weekLogs = getSevenDayLogs(state.history);
  const weekMinutes = weekLogs.reduce((total, log) => total + log.durationMinutes, 0);
  const weekSets = weekLogs.reduce((total, log) => total + log.completedSets, 0);
  const maxMinutes = Math.max(...activity.map((day) => day.minutes), 1);

  return (
    <Screen>
      <AppHeader title="Your progress" eyebrow="Consistency over perfection" />

      <View style={styles.statsRow}>
        <StatCard label="This week" value={weekLogs.length} icon="bolt" />
        <StatCard label="Minutes" value={weekMinutes} icon="clock" tint="#5C7CFA" />
        <StatCard label="All time" value={state.history.length} icon="history" tint="#C66AE1" />
      </View>

      <SectionHeader title="Last 7 days" />
      <SurfaceCard style={styles.chartCard}>
        <View style={styles.chartSummary}>
          <View>
            <Text style={styles.chartValue}>{weekMinutes}</Text>
            <Text style={styles.chartLabel}>training minutes</Text>
          </View>
          <View style={styles.setBadge}>
            <AppIcon name="check" color={colors.primary} size={18} />
            <Text style={styles.setBadgeText}>{weekSets} sets</Text>
          </View>
        </View>

        <View style={styles.chart}>
          {activity.map((day) => {
            const height = day.minutes ? 18 + (day.minutes / maxMinutes) * 86 : 8;
            return (
              <View key={day.key} style={styles.barColumn}>
                <Text style={styles.barValue}>{day.minutes || ''}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height, backgroundColor: day.minutes ? colors.primary : colors.surfaceMuted },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{day.label}</Text>
              </View>
            );
          })}
        </View>
      </SurfaceCard>

      <SectionHeader title="Workout history" />
      {state.history.length ? (
        <View style={styles.historyList}>
          {state.history.map((log) => (
            <SurfaceCard key={log.id} style={styles.historyCard}>
              <View style={styles.historyIcon}>
                <AppIcon name="check" color={colors.primary} size={22} />
              </View>
              <View style={styles.historyCopy}>
                <Text style={styles.historyTitle}>{log.workoutName}</Text>
                <Text style={styles.historyDate}>{formatHistoryDate(log.completedAt)}</Text>
                <Text style={styles.historyMeta}>
                  {log.exerciseCount} exercises · {log.completedSets} sets
                </Text>
              </View>
              <Text style={styles.historyMinutes}>{log.durationMinutes} min</Text>
            </SurfaceCard>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="progress"
          title="Progress starts with one workout"
          message="Complete a session and your weekly activity will appear here."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chartCard: {
    padding: spacing.lg,
  },
  chartSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartValue: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '800',
  },
  chartLabel: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 2,
  },
  setBadge: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  setBadgeText: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  chart: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
  },
  barValue: {
    height: 18,
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '62%',
    maxWidth: 30,
    borderRadius: 8,
  },
  barLabel: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyCard: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  historyCopy: {
    flex: 1,
  },
  historyTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
  },
  historyDate: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 3,
  },
  historyMeta: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 3,
  },
  historyMinutes: {
    color: colors.ink,
    fontSize: typography.label,
    fontWeight: '800',
  },
});
