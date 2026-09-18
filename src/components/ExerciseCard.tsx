import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { cardShadow, colors, radii, spacing, typography } from '@/theme/tokens';
import { Exercise } from '@/types/domain';

type ExerciseCardProps = {
  exercise: Exercise;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  compact?: boolean;
};

export function ExerciseCard({
  exercise,
  favorite,
  onPress,
  onToggleFavorite,
  compact = false,
}: ExerciseCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${exercise.name}`}
        onPress={onPress}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <Image
          source={exercise.imageSource}
          contentFit="cover"
          transition={180}
          style={[styles.image, compact && styles.compactImage]}
        />
        <View style={styles.copy}>
          <View style={styles.tagRow}>
            <Text style={styles.muscle}>{exercise.muscleGroup}</Text>
            <Text style={styles.dot}>•</Text>
            <Text numberOfLines={1} style={styles.equipment}>
              {exercise.equipment.join(', ')}
            </Text>
          </View>
          <Text numberOfLines={2} style={styles.name}>
            {exercise.name}
          </Text>
          {!compact ? <Text style={styles.difficulty}>{exercise.difficulty}</Text> : null}
        </View>
        <AppIcon name="chevronRight" color={colors.inkMuted} size={20} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favorite ? `Remove ${exercise.name} from favorites` : `Favorite ${exercise.name}`}
        onPress={onToggleFavorite}
        hitSlop={8}
        style={({ pressed }) => [styles.favorite, pressed && styles.pressed]}>
        <AppIcon
          name={favorite ? 'favorite' : 'favoriteOutline'}
          color={favorite ? colors.danger : colors.inkMuted}
          size={20}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  main: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  image: {
    width: 112,
    height: 112,
    backgroundColor: colors.surfaceMuted,
  },
  compactImage: {
    width: 88,
    height: 96,
  },
  copy: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingRight: spacing.xl,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingRight: spacing.lg,
  },
  muscle: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dot: {
    color: colors.inkMuted,
    fontSize: typography.caption,
  },
  equipment: {
    flex: 1,
    color: colors.inkMuted,
    fontSize: typography.caption,
  },
  name: {
    color: colors.ink,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    marginTop: spacing.xxs,
  },
  difficulty: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: spacing.xxs,
  },
  favorite: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
