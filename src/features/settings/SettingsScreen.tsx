import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BackHeader } from '@/components/AppHeader';
import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Buttons';
import { SurfaceCard } from '@/components/Cards';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/Section';
import { useAppStore } from '@/store/AppStore';
import { colors, spacing, typography } from '@/theme/tokens';

export default function SettingsScreen() {
  const { state, storageLoadFailed, deleteAllData } = useAppStore();

  const hasUserData =
  state.workouts.length > 0 ||
  state.favoriteExerciseIds.length > 0 ||
  state.history.length > 0 ||
  state.activeSession !== null ||
  storageLoadFailed;

const confirmDeleteAllData = () => {
  Alert.alert(
    'Delete all data?',
    'This permanently removes all workouts, favorites, active sessions, and workout history stored on this device, including saved data that could not be loaded.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: deleteAllData,
      },
    ],
  );
};

  return (
    <Screen>
      <BackHeader title="Settings" />

      <SectionHeader title="Your data" />
      <SurfaceCard style={styles.dataCard}>
        <View style={styles.dataIcon}>
          <AppIcon name="info" color={colors.primary} size={22} />
        </View>
        <View style={styles.dataCopy}>
          <Text style={styles.settingTitle}>Stored on this device</Text>
          <Text style={styles.settingDescription}>
            FitPlanner does not require an account. Your workouts, favorites, and history are stored locally on this device.
          </Text>
        </View>
      </SurfaceCard>
      {storageLoadFailed ? (
        <Text style={styles.storageWarning}>
          Saved data could not be read. It has not been overwritten. Deleting all data will reset the app and cannot be undone.
        </Text>
      ) : null}
      <Button label="Delete all data" icon="delete" variant="danger" disabled={!hasUserData} onPress={confirmDeleteAllData} />

      <SectionHeader title="Legal & safety" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open health and exercise disclaimer"
        accessibilityHint="Shows important safety and medical guidance"
        onPress={() => router.push('/disclaimer')}
        style={({ pressed }) => pressed && styles.pressed}>
        <SurfaceCard style={styles.legalCard}>
          <View style={styles.dataIcon}>
            <AppIcon name="info" color={colors.primary} size={22} />
          </View>

          <View style={styles.dataCopy}>
            <Text style={styles.settingTitle}>
              Health & exercise disclaimer
            </Text>
            <Text style={styles.settingDescription}>
              Read important safety and medical guidance before training.
            </Text>
          </View>

          <AppIcon
            name="chevronRight"
            color={colors.inkMuted}
            size={20}
          />
        </SurfaceCard>
      </Pressable>

      <SectionHeader title="About" />
      <SurfaceCard style={styles.aboutCard}>
        <View style={styles.logo}>
          <AppIcon name="exercise" color={colors.white} size={28} />
        </View>
        <View style={styles.aboutCopy}>
          <Text style={styles.aboutTitle}>FitPlanner</Text>
          <Text style={styles.aboutVersion}>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </SurfaceCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  storageWarning: {
    color: colors.danger,
    fontSize: typography.caption,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  settingTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
  },
  settingDescription: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: 4,
  },
  dataCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dataIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  dataCopy: {
    flex: 1,
  },
  aboutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  aboutCopy: {
    flex: 1,
  },
  aboutTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  aboutVersion: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: 3,
  },
  legalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.65,
  },
});
