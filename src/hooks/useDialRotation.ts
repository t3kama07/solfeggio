import { Gesture } from 'react-native-gesture-handler';
import type { View } from 'react-native';
import {
  cancelAnimation,
  measure,
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated';

type UseDialRotationParams = {
  initialIndex: number;
  stepAngle: number;
  stepCount: number;
  onStepChange: (index: number) => void;
};

function normalizeDelta(angle: number) {
  'worklet';

  if (angle > 180) {
    return angle - 360;
  }

  if (angle < -180) {
    return angle + 360;
  }

  return angle;
}

function wrapIndex(value: number, stepCount: number) {
  'worklet';

  const wrapped = value % stepCount;

  return wrapped < 0 ? wrapped + stepCount : wrapped;
}

function findNearestTargetAngle(currentAngle: number, targetAngle: number, fullRotation: number) {
  const turnOffset = Math.round((currentAngle - targetAngle) / fullRotation);
  const candidates = [
    targetAngle + (turnOffset - 1) * fullRotation,
    targetAngle + turnOffset * fullRotation,
    targetAngle + (turnOffset + 1) * fullRotation,
  ];

  return candidates.reduce((nearest, candidate) =>
    Math.abs(candidate - currentAngle) < Math.abs(nearest - currentAngle) ? candidate : nearest
  );
}

export function useDialRotation({
  initialIndex,
  stepAngle,
  stepCount,
  onStepChange,
}: UseDialRotationParams) {
  const dialRef = useAnimatedRef<View>();
  const rotation = useSharedValue(initialIndex * stepAngle);
  const centerX = useSharedValue(0);
  const centerY = useSharedValue(0);
  const isTracking = useSharedValue(false);
  const isProgrammatic = useSharedValue(false);
  const lastAngle = useSharedValue(0);
  const fullRotation = stepAngle * stepCount;

  const snapToNearest = () => {
    'worklet';

    rotation.value = withSpring(Math.round(rotation.value / stepAngle) * stepAngle, {
      damping: 18,
      stiffness: 180,
      mass: 0.9,
    });
  };

  useAnimatedReaction(
    () => wrapIndex(Math.round(rotation.value / stepAngle), stepCount),
    (nextIndex, previousIndex) => {
      if (isProgrammatic.value) {
        return;
      }

      if (previousIndex != null && nextIndex !== previousIndex) {
        runOnJS(onStepChange)(nextIndex);
      }
    }
  );

  function animateToIndex(index: number) {
    cancelAnimation(rotation);
    isProgrammatic.value = true;

    const targetRotation = findNearestTargetAngle(rotation.value, index * stepAngle, fullRotation);

    rotation.value = withSpring(
      targetRotation,
      {
        damping: 18,
        stiffness: 180,
        mass: 0.9,
      },
      () => {
        isProgrammatic.value = false;
      }
    );
  }

  const gesture = Gesture.Pan()
    .onBegin((event) => {
      cancelAnimation(rotation);
      isProgrammatic.value = false;
      const layout = measure(dialRef);

      if (!layout || layout.width === 0 || layout.height === 0) {
        isTracking.value = false;
        return;
      }

      centerX.value = layout.pageX + layout.width / 2;
      centerY.value = layout.pageY + layout.height / 2;
      lastAngle.value =
        (Math.atan2(event.absoluteY - centerY.value, event.absoluteX - centerX.value) * 180) /
        Math.PI;
      isTracking.value = true;
    })
    .onUpdate((event) => {
      if (!isTracking.value) {
        return;
      }

      const dx = event.absoluteX - centerX.value;
      const dy = event.absoluteY - centerY.value;
      const currentAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const touchRadius = Math.sqrt(dx * dx + dy * dy);

      if (touchRadius < 44) {
        lastAngle.value = currentAngle;
        return;
      }

      const delta = normalizeDelta(currentAngle - lastAngle.value);

      rotation.value += delta;
      lastAngle.value = currentAngle;
    })
    .onEnd((event) => {
      if (!isTracking.value) {
        return;
      }

      isTracking.value = false;
      const dx = event.absoluteX - centerX.value;
      const dy = event.absoluteY - centerY.value;
      const radius = Math.max(52, Math.sqrt(dx * dx + dy * dy));
      const angle = Math.atan2(dy, dx);
      const tangentX = -Math.sin(angle);
      const tangentY = Math.cos(angle);
      const tangentialVelocity = event.velocityX * tangentX + event.velocityY * tangentY;
      const angularVelocity = (tangentialVelocity / radius) * (180 / Math.PI);

      if (Math.abs(angularVelocity) < 10) {
        snapToNearest();
        return;
      }

      rotation.value = withDecay(
        {
          velocity: angularVelocity,
          deceleration: 0.992,
          clamp: [rotation.value - fullRotation, rotation.value + fullRotation],
          rubberBandEffect: false,
        },
        (finished) => {
          if (!finished) {
            return;
          }

          snapToNearest();
        }
      );
    })
    .onFinalize(() => {
      isTracking.value = false;
    });

  return {
    animateToIndex,
    dialRef,
    gesture,
    rotation,
  };
}
