import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { AppIcon, AppIconName } from '@/components/AppIcon';
import { Button } from '@/components/Buttons';
import { StatCard, SurfaceCard } from '@/components/Cards';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { InlineNotice, SectionHeader } from '@/components/Section';
import { getDayLabel } from '@/data/days';
import { useAppStore } from '@/store/AppStore';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import { formatHistoryDate, formatLongDate } from '@/utils/format';
import { getNextWorkout, getSevenDayLogs } from '@/utils/workouts';

function HeaderAction() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      onPress={() => router.push('/settings')}
      style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
      <AppIcon name="settings" color={colors.ink} size={22} />
    </Pressable>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: AppIconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
      <View style={styles.quickIcon}>
        <AppIcon name={icon} color={colors.primary} size={22} />
      </View>
      <View style={styles.quickCopy}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSubtitle}>{subtitle}</Text>
      </View>
      <AppIcon name="chevronRight" color={colors.inkMuted} size={20} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const { state, storageError } = useAppStore();
  const next = getNextWorkout(state.workouts);
  const resumableWorkout = state.workouts.find((item) => item.id === state.activeSession?.workoutId);
  const weekLogs = getSevenDayLogs(state.history);
  const weekMinutes = weekLogs.reduce((total, log) => total + log.durationMinutes, 0);
  const weekSets = weekLogs.reduce((total, log) => total + log.completedSets, 0);

  const scheduleLabel = next
    ? next.offsetDays === 0
      ? 'Today'
      : next.offsetDays === 1
        ? 'Tomorrow'
        : getDayLabel(next.workout.day)
    : '';

  return (
    <Screen>
      <AppHeader title="Ready to train?" eyebrow={formatLongDate()} right={<HeaderAction />} />

      {storageError ? (
        <InlineNotice>Your latest changes could not be saved on this device.</InlineNotice>
      ) : null}

      {resumableWorkout ? (
        <SurfaceCard style={styles.resumeCard}>
          <Text style={styles.resumeTitle}>Workout in progress</Text>
          <Text style={styles.resumeDescription}>{resumableWorkout.name}</Text>
          <Button
            label="Resume workout"
            icon="play"
            onPress={() => router.push(`/session/${resumableWorkout.id}`)}
          />
        </SurfaceCard>
      ) : null}

      {next ? (
        <View style={styles.hero}>
          <View style={[styles.heroGlow, { backgroundColor: next.workout.accent }]} />
          <Text style={styles.heroEyebrow}>{scheduleLabel.toUpperCase()}</Text>
          <Text style={styles.heroTitle}>{next.workout.name}</Text>
          <View style={styles.heroMeta}>
            <Text style={styles.heroMetaText}>{next.workout.exercises.length} exercises</Text>
            <View style={styles.heroDot} />
            <Text style={styles.heroMetaText}>{next.workout.estimatedMinutes} min</Text>
          </View>
          <Button
            label={next.workout.exercises.length ? 'Start workout' : 'Build workout'}
            icon={next.workout.exercises.length ? 'play' : 'add'}
            onPress={() =>
              next.workout.exercises.length
                ? router.push(`/session/${next.workout.id}`)
                : router.push(`/workout/${next.workout.id}`)
            }
            style={styles.heroButton}
          />
        </View>
      ) : (
        <EmptyState
          icon="calendar"
          title="Your week is open"
          message="Create your first workout and choose when you want to train."
          actionLabel="Create workout"
          onAction={() => router.push('/workout/create')}
        />
      )}

      <SectionHeader title="This week" />
      <View style={styles.statsRow}>
        <StatCard label="Workouts" value={weekLogs.length} icon="bolt" />
        <StatCard label="Minutes" value={weekMinutes} icon="clock" tint="#5C7CFA" />
        <StatCard label="Sets" value={weekSets} icon="check" tint="#C66AE1" />
      </View>

      <SectionHeader title="Quick actions" />
      <View style={styles.quickList}>
        <QuickAction
          icon="exercise"
          title="Explore exercises"
          subtitle="Search movements and learn the technique"
          onPress={() => router.push('/exercises')}
        />
        <QuickAction
          icon="calendar"
          title="Plan your week"
          subtitle="Create or adjust a workout day"
          onPress={() => router.push('/planner')}
        />
      </View>

      <SectionHeader
        title="Recent activity"
        actionLabel="View progress"
        onAction={() => router.push('/progress')}
      />
      {state.history.length ? (
        <SurfaceCard style={styles.historyCard}>
          {state.history.slice(0, 3).map((log, index) => (
            <View key={log.id} style={[styles.historyRow, index > 0 && styles.historyBorder]}>
              <View style={styles.historyIcon}>
                <AppIcon name="check" color={colors.primary} size={20} />
              </View>
              <View style={styles.historyCopy}>
                <Text style={styles.historyTitle}>{log.workoutName}</Text>
                <Text style={styles.historyDate}>{formatHistoryDate(log.completedAt)}</Text>
              </View>
              <Text style={styles.historyDuration}>{log.durationMinutes} min</Text>
            </View>
          ))}
        </SurfaceCard>
      ) : (
        <EmptyState
          icon="history"
          title="No completed workouts yet"
          message="Your workout history will appear here after your first session."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  resumeCard: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resumeTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  resumeDescription: {
    color: colors.inkMuted,
    fontSize: typography.body,
  },
  headerAction: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 250,
    justifyContent: 'flex-end',
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.ink,
  },
  heroGlow: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.42,
  },
  heroEyebrow: {
    color: '#AEE7D1',
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  heroMetaText: {
    color: '#C4D1CC',
    fontSize: typography.label,
  },
  heroDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#75867E',
  },
  heroButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xl,
    minWidth: 172,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickList: {
    gap: spacing.sm,
  },
  quickAction: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  quickCopy: {
    flex: 1,
  },
  quickTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
  },
  quickSubtitle: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    lineHeight: 17,
    marginTop: 3,
  },
  historyCard: {
    paddingHorizontal: spacing.md,
  },
  historyRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  historyCopy: {
    flex: 1,
  },
  historyTitle: {
    color: colors.ink,
    fontSize: typography.label,
    fontWeight: '700',
  },
  historyDate: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 3,
  },
  historyDuration: {
    color: colors.ink,
    fontSize: typography.label,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
