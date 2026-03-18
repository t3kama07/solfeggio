import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { type SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { colors } from '../theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const TWO_PI = Math.PI * 2;
const STAR_COUNT = 36;

function fract(value: number) {
  return value - Math.floor(value);
}

const STARS = Array.from({ length: STAR_COUNT }, (_, index) => {
  const x = fract(Math.sin(index * 12.9898) * 43758.5453);
  const y = fract(Math.sin((index + 3) * 78.233) * 12345.6789);
  const size = 1.8 + fract(Math.sin((index + 11) * 19.19) * 2468.135) * 1.1;
  const opacity = 0.16 + fract(Math.sin((index + 7) * 33.33) * 9753.421) * 0.19;
  const drift = 1 + fract(Math.sin((index + 5) * 42.42) * 7531.147) * 2.4;
  const speed = 0.35 + fract(Math.sin((index + 13) * 15.15) * 5321.864) * 0.5;
  const phase = fract(Math.sin((index + 17) * 27.27) * 8642.531) * TWO_PI;
  const tintIndex = index % 5;
  const color =
    tintIndex === 0
      ? colors.textWhite
      : tintIndex === 1
        ? colors.highlightCyan
        : tintIndex === 2
          ? colors.primaryGlow
          : tintIndex === 3
            ? colors.accentPink
            : colors.textWhite;

  return { color, drift, opacity, phase, size, speed, x, y };
});

type StarfieldBackgroundProps = {
  ambientPhase: SharedValue<number>;
  height: number;
  width: number;
};

type StarProps = {
  ambientPhase: SharedValue<number>;
  height: number;
  star: (typeof STARS)[number];
  width: number;
};

function Star({ ambientPhase, height, star, width }: StarProps) {
  const animatedProps = useAnimatedProps(() => {
    const theta = ambientPhase.value * TWO_PI * star.speed + star.phase;
    const twinkle = (Math.sin(theta) + 1) / 2;

    return {
      cx: width * star.x + Math.cos(theta) * star.drift,
      cy: height * star.y + Math.sin(theta) * star.drift,
      fill: star.color,
      opacity: Math.min(0.35, star.opacity + twinkle * 0.06),
      r: star.size,
    };
  });

  return <AnimatedCircle animatedProps={animatedProps} />;
}

export function StarfieldBackground({ ambientPhase, height, width }: StarfieldBackgroundProps) {
  return (
    <View style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}> 
      <Svg height={height} width={width} viewBox={`0 0 ${width} ${height}`}>
        {STARS.map((star, index) => (
          <Star ambientPhase={ambientPhase} height={height} key={index} star={star} width={width} />
        ))}
      </Svg>
    </View>
  );
}
