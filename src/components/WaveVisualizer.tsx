import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { type SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { colors } from '../theme/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const POINTS = 56;

function buildWavePath(width: number, height: number, phase: number, amplitude: number, offset = 0) {
  const mid = height / 2;
  let path = `M 0 ${mid.toFixed(2)}`;

  for (let index = 0; index <= POINTS; index += 1) {
    const x = (width / POINTS) * index;
    const progress = index / POINTS;
    const angle = progress * Math.PI * 2 * 2.2 + phase * Math.PI * 2 + offset;
    const y =
      mid +
      Math.sin(angle) * amplitude +
      Math.sin(angle * 0.54 + phase * Math.PI * 1.2) * (amplitude * 0.34);

    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  return path;
}

type WaveVisualizerProps = {
  changePulse: SharedValue<number>;
  playbackProgress: SharedValue<number>;
  wavePhase: SharedValue<number>;
  width: number;
};

export function WaveVisualizer({
  changePulse,
  playbackProgress,
  wavePhase,
  width,
}: WaveVisualizerProps) {
  const height = 92;

  const primaryProps = useAnimatedProps(() => {
    const amplitude = 7 + playbackProgress.value * 7 + changePulse.value * 5;

    return {
      d: buildWavePath(width, height, wavePhase.value, amplitude),
      opacity: 0.6,
    };
  });

  const secondaryProps = useAnimatedProps(() => {
    const amplitude = 4 + playbackProgress.value * 4 + changePulse.value * 2.5;

    return {
      d: buildWavePath(width, height, wavePhase.value + 0.22, amplitude, Math.PI / 2.8),
      opacity: 0.28,
    };
  });

  return (
    <View style={[styles.container, { width }]}>
      <Svg height={height} width={width} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <SvgLinearGradient id="wavePrimary" x1="0%" x2="100%" y1="0%" y2="0%">
            <Stop offset="0%" stopColor={colors.highlightCyan} stopOpacity="0.08" />
            <Stop offset="55%" stopColor={colors.highlightCyan} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={colors.accentPink} stopOpacity="0.32" />
          </SvgLinearGradient>
          <SvgLinearGradient id="waveSecondary" x1="0%" x2="100%" y1="0%" y2="0%">
            <Stop offset="0%" stopColor={colors.highlightCyan} stopOpacity="0.04" />
            <Stop offset="45%" stopColor={colors.accentPink} stopOpacity="0.42" />
            <Stop offset="100%" stopColor={colors.accentPink} stopOpacity="0.14" />
          </SvgLinearGradient>
        </Defs>

        <AnimatedPath
          animatedProps={secondaryProps}
          fill="none"
          stroke="url(#waveSecondary)"
          strokeLinecap="round"
          strokeWidth={2}
        />
        <AnimatedPath
          animatedProps={primaryProps}
          fill="none"
          stroke="url(#wavePrimary)"
          strokeLinecap="round"
          strokeWidth={3}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 16, 38, 0.18)',
    borderColor: 'rgba(160, 167, 192, 0.1)',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
