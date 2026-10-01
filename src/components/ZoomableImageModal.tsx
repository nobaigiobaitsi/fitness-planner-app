import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/AppIcon";
import { colors, spacing, typography } from "@/theme/tokens";

const MIN_SCALE = 1;
const DOUBLE_TAP_SCALE = 2;
const MAX_SCALE = 4;

function clamp(value: number, minimum: number, maximum: number) {
  "worklet";

  return Math.min(Math.max(value, minimum), maximum);
}

type ZoomableImageModalProps = {
  visible: boolean;
  source: number;
  title: string;
  onClose: () => void;
};

export function ZoomableImageModal({
  visible,
  source,
  title,
  onClose,
}: ZoomableImageModalProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(MIN_SCALE);
  const savedScale = useSharedValue(MIN_SCALE);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    scale.value = MIN_SCALE;
    savedScale.value = MIN_SCALE;

    translateX.value = 0;
    translateY.value = 0;

    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [
    visible,
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
  ]);

  const resetZoom = () => {
    "worklet";

    scale.value = withTiming(MIN_SCALE);
    savedScale.value = MIN_SCALE;

    translateX.value = withTiming(0);
    translateY.value = withTiming(0);

    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      if (scale.value <= MIN_SCALE) {
        resetZoom();
        return;
      }

      savedScale.value = scale.value;

      const maximumX = (width * (scale.value - 1)) / 2;
      const maximumY = (height * (scale.value - 1)) / 2;

      const nextX = clamp(translateX.value, -maximumX, maximumX);

      const nextY = clamp(translateY.value, -maximumY, maximumY);

      translateX.value = withTiming(nextX);
      translateY.value = withTiming(nextY);

      savedTranslateX.value = nextX;
      savedTranslateY.value = nextY;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= MIN_SCALE) return;

      const maximumX = (width * (scale.value - 1)) / 2;
      const maximumY = (height * (scale.value - 1)) / 2;

      translateX.value = clamp(
        savedTranslateX.value + event.translationX,
        -maximumX,
        maximumX,
      );

      translateY.value = clamp(
        savedTranslateY.value + event.translationY,
        -maximumY,
        maximumY,
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((_event, successful) => {
      if (!successful) return;

      if (scale.value > MIN_SCALE) {
        resetZoom();
        return;
      }

      scale.value = withTiming(DOUBLE_TAP_SCALE);
      savedScale.value = DOUBLE_TAP_SCALE;
    });

  const gesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const close = () => {
    scale.value = MIN_SCALE;
    savedScale.value = MIN_SCALE;

    translateX.value = 0;
    translateY.value = 0;

    savedTranslateX.value = 0;
    savedTranslateY.value = 0;

    onClose();
  };

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      onRequestClose={close}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <GestureHandlerRootView accessibilityViewIsModal style={styles.backdrop}>
        <StatusBar style="light" />

        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.imageCanvas, animatedImageStyle]}>
            <Image
              accessibilityLabel={`${title} exercise demonstration`}
              allowDownscaling={false}
              contentFit="contain"
              source={source}
              style={styles.image}
            />
          </Animated.View>
        </GestureDetector>

        <View
          pointerEvents="box-none"
          style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}
        >
          <Text numberOfLines={1} pointerEvents="none" style={styles.title}>
            {title}
          </Text>

          <Pressable
            accessibilityLabel="Close enlarged image"
            accessibilityRole="button"
            hitSlop={12}
            onPress={close}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon color={colors.white} name="close" size={24} />
          </Pressable>
        </View>

        <Text
          pointerEvents="none"
          style={[styles.hint, { bottom: insets.bottom + spacing.lg }]}
        >
          Pinch to zoom · drag to move · double-tap to reset
        </Text>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.black,
  },
  imageCanvas: {
    flex: 1,
    width: "100%",
  },
  image: {
    flex: 1,
    width: "100%",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.38)",
  },
  title: {
    flex: 1,
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  hint: {
    position: "absolute",
    alignSelf: "center",
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.56)",
  },
  pressed: {
    opacity: 0.65,
  },
});
