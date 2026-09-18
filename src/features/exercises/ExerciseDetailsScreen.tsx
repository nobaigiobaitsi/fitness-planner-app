import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackHeader } from '@/components/AppHeader';
import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/Section';
import { getExerciseById } from '@/data/exercises';
import { useAppStore } from '@/store/AppStore';
import { colors, radii, spacing, typography } from '@/theme/tokens';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ExerciseDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const exercise = getExerciseById(getParam(params.id) ?? '');
  const { state, toggleFavorite } = useAppStore();

  if (!exercise) {
    return (
      <Screen>
        <BackHeader title="Exercise" />
        <EmptyState
          icon="info"
          title="Exercise not found"
          message="This exercise may have been removed from the library."
        />
      </Screen>
    );
  }

  const favorite = state.favoriteExerciseIds.includes(exercise.id);

  return (
    <Screen>
      <BackHeader
        title="Exercise details"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
            onPress={() => toggleFavorite(exercise.id)}
            style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}>
            <AppIcon
              name={favorite ? 'favorite' : 'favoriteOutline'}
              color={favorite ? colors.danger : colors.ink}
              size={22}
            />
          </Pressable>
        }
      />

      <Image source={exercise.imageSource} contentFit="cover" transition={200} style={styles.heroImage} />

      <View style={styles.titleBlock}>
        <Text style={styles.eyebrow}>{exercise.muscleGroup.toUpperCase()}</Text>
        <Text style={styles.title}>{exercise.name}</Text>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{exercise.difficulty}</Text>
          </View>
          {exercise.equipment.map((item) => (
            <View key={item} style={styles.tag}>
              <Text style={styles.tagText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {exercise.secondaryMuscles.length ? (
        <Text style={styles.secondary}>Also works: {exercise.secondaryMuscles.join(', ')}</Text>
      ) : null}

      <SectionHeader title="How to perform it" />
      <View style={styles.steps}>
        {exercise.instructions.map((instruction, index) => (
          <View key={instruction} style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{instruction}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Form tips" />
      <View style={styles.tipBox}>
        {exercise.tips.map((tip) => (
          <View key={tip} style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        Technique guidance is educational. Use an appropriate load and ask a qualified professional if
        you are unsure about your form or have pain.
      </Text>

      <Button
        label="Add to a workout"
        icon="add"
        onPress={() => router.push(`/exercise/${exercise.id}/add-to-workout`)}
        style={styles.addButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceMuted,
  },
  titleBlock: {
    marginTop: spacing.xl,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  tagText: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  secondary: {
    color: colors.inkMuted,
    fontSize: typography.label,
    marginTop: spacing.md,
  },
  steps: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  stepNumberText: {
    color: colors.white,
    fontSize: typography.label,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: colors.ink,
    fontSize: typography.body,
    lineHeight: 24,
  },
  tipBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 7,
    backgroundColor: colors.primary,
  },
  tipText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: typography.label,
    lineHeight: 21,
  },
  disclaimer: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.lg,
  },
  addButton: {
    marginTop: spacing.xl,
  },
  pressed: {
    opacity: 0.65,
  },
});
