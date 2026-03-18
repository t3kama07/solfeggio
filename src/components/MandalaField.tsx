import { StyleSheet } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme/colors';
import { type FrequencyValue } from '../utils/frequencyMap';

const TWO_PI = Math.PI * 2;

type MandalaConfig = {
  accentColor: string;
  drift: number;
  innerPetals: number;
  innerSpin: number;
  middlePetals: number;
  middleSpin: number;
  outerPetals: number;
  outerSpin: number;
  pulseRate: number;
  twist: number;
};

const MANDALA_CONFIGS: Record<FrequencyValue, MandalaConfig> = {
  174: {
    accentColor: colors.highlightCyan,
    drift: 0.018,
    innerPetals: 6,
    innerSpin: 8,
    middlePetals: 8,
    middleSpin: -10,
    outerPetals: 4,
    outerSpin: 12,
    pulseRate: 0.8,
    twist: 0.4,
  },
  285: {
    accentColor: colors.accentPink,
    drift: 0.022,
    innerPetals: 8,
    innerSpin: 10,
    middlePetals: 10,
    middleSpin: -12,
    outerPetals: 5,
    outerSpin: 14,
    pulseRate: 0.95,
    twist: 0.55,
  },
  396: {
    accentColor: colors.primaryGlow,
    drift: 0.024,
    innerPetals: 8,
    innerSpin: 12,
    middlePetals: 12,
    middleSpin: -14,
    outerPetals: 6,
    outerSpin: 16,
    pulseRate: 1.05,
    twist: 0.62,
  },
  417: {
    accentColor: colors.accentPink,
    drift: 0.026,
    innerPetals: 10,
    innerSpin: -12,
    middlePetals: 14,
    middleSpin: 14,
    outerPetals: 7,
    outerSpin: -16,
    pulseRate: 1.1,
    twist: 0.72,
  },
  528: {
    accentColor: colors.highlightCyan,
    drift: 0.03,
    innerPetals: 12,
    innerSpin: 14,
    middlePetals: 16,
    middleSpin: -16,
    outerPetals: 8,
    outerSpin: 18,
    pulseRate: 1.2,
    twist: 0.82,
  },
  639: {
    accentColor: colors.accentPink,
    drift: 0.026,
    innerPetals: 10,
    innerSpin: 11,
    middlePetals: 12,
    middleSpin: -12,
    outerPetals: 6,
    outerSpin: 14,
    pulseRate: 1,
    twist: 0.58,
  },
  741: {
    accentColor: colors.primaryGlow,
    drift: 0.032,
    innerPetals: 12,
    innerSpin: -14,
    middlePetals: 18,
    middleSpin: 18,
    outerPetals: 9,
    outerSpin: -20,
    pulseRate: 1.28,
    twist: 0.92,
  },
  852: {
    accentColor: colors.highlightCyan,
    drift: 0.028,
    innerPetals: 12,
    innerSpin: 16,
    middlePetals: 20,
    middleSpin: -18,
    outerPetals: 10,
    outerSpin: 16,
    pulseRate: 1.18,
    twist: 1.02,
  },
  963: {
    accentColor: colors.highlightCyan,
    drift: 0.024,
    innerPetals: 14,
    innerSpin: 18,
    middlePetals: 24,
    middleSpin: -14,
    outerPetals: 12,
    outerSpin: 12,
    pulseRate: 1.08,
    twist: 1.12,
  },
};

type MandalaFieldProps = {
  ambientPhase: SharedValue<number>;
  changePulse: SharedValue<number>;
  playbackProgress: SharedValue<number>;
  rotation: SharedValue<number>;
  selectedFrequency: FrequencyValue;
  size: number;
  themeColor: string;
};

function toPoint(center: number, radius: number, angle: number) {
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

function buildRosettePath(center: number, radius: number, petals: number, depth: number, twist: number) {
  const points = Math.max(72, petals * 10);
  let path = '';

  for (let index = 0; index <= points; index += 1) {
    const progress = index / points;
    const angle = progress * TWO_PI;
    const petalWave = Math.sin(angle * petals);
    const echoWave = Math.cos(angle * petals * 2 + twist);
    const orbit = radius * (0.84 + petalWave * depth + echoWave * depth * 0.36);
    const point = toPoint(center, orbit, angle + echoWave * twist * 0.08);

    path += `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
  }

  return `${path}Z`;
}

function buildSparkDots(center: number, radius: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (TWO_PI * index) / count - Math.PI / 2;
    const point = toPoint(center, radius, angle);

    return {
      cx: point.x,
      cy: point.y,
      key: `${count}-${index}`,
      r: index % 2 === 0 ? 2.2 : 1.5,
    };
  });
}

function loopWave(progress: number, rate: number, offset = 0) {
  'worklet';
  return (Math.sin(progress * TWO_PI * rate + offset) + 1) / 2;
}

export function MandalaField({
  ambientPhase,
  changePulse,
  playbackProgress,
  rotation,
  selectedFrequency,
  size,
  themeColor,
}: MandalaFieldProps) {
  const config = MANDALA_CONFIGS[selectedFrequency];
  const center = size / 2;
  const primaryColor = themeColor === colors.textWhite ? colors.highlightCyan : themeColor;
  const outerPath = buildRosettePath(center, size * 0.31, config.outerPetals, 0.14, config.twist);
  const middlePath = buildRosettePath(center, size * 0.24, config.middlePetals, 0.11, config.twist * 1.2);
  const innerPath = buildRosettePath(center, size * 0.15, config.innerPetals, 0.09, config.twist * 1.45);
  const sparkDots = buildSparkDots(center, size * 0.35, Math.max(8, config.outerPetals * 2));

  const shellStyle = useAnimatedStyle(() => {
    const ambientWave = (Math.sin(ambientPhase.value * TWO_PI + config.outerPetals * 0.3) + 1) / 2;
    const pulse = loopWave(playbackProgress.value, config.pulseRate, 0.2);

    return {
      opacity: 0.54 + changePulse.value * 0.1,
      transform: [
        {
          scale:
            0.99 +
            (ambientWave - 0.5) * config.drift * 1.6 +
            pulse * 0.018 +
            changePulse.value * 0.016,
        },
      ],
    };
  });

  const outerLayerStyle = useAnimatedStyle(() => {
    const pulse = loopWave(playbackProgress.value, config.pulseRate, 0.4);

    return {
      opacity: 0.38 + pulse * 0.1 + changePulse.value * 0.05,
      transform: [
        {
          rotate: `${ambientPhase.value * config.outerSpin + (rotation.value % 360) * 0.025}deg`,
        },
        {
          scale: 0.995 + pulse * 0.012,
        },
      ],
    };
  });

  const middleLayerStyle = useAnimatedStyle(() => {
    const pulse = loopWave(playbackProgress.value, config.pulseRate + 0.18, 1);

    return {
      opacity: 0.36 + pulse * 0.1 + changePulse.value * 0.06,
      transform: [
        {
          rotate: `${ambientPhase.value * config.middleSpin - (rotation.value % 360) * 0.02}deg`,
        },
        {
          scale: 0.985 + pulse * 0.018,
        },
      ],
    };
  });

  const innerLayerStyle = useAnimatedStyle(() => {
    const pulse = loopWave(playbackProgress.value, config.pulseRate + 0.34, 1.8);

    return {
      opacity: 0.34 + pulse * 0.12 + changePulse.value * 0.07,
      transform: [
        {
          rotate: `${ambientPhase.value * config.innerSpin + changePulse.value * 12}deg`,
        },
        {
          scale: 0.98 + pulse * 0.022,
        },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.shell, { width: size, height: size }, shellStyle]}>
      <Animated.View style={[styles.layer, outerLayerStyle]}>
        <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
          <Path d={outerPath} fill="none" opacity={0.18} stroke={primaryColor} strokeWidth={12} />
          <Path d={outerPath} fill="none" opacity={0.34} stroke={primaryColor} strokeWidth={8} />
          <Path d={outerPath} fill="none" opacity={0.92} stroke={primaryColor} strokeWidth={1.55} />
          {sparkDots.map((dot) => (
            <Circle
              key={dot.key}
              cx={dot.cx}
              cy={dot.cy}
              fill={primaryColor}
              opacity={0.56}
              r={dot.r + 0.2}
            />
          ))}
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.layer, middleLayerStyle]}>
        <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
          <Path d={middlePath} fill="none" opacity={0.16} stroke={config.accentColor} strokeWidth={11} />
          <Path d={middlePath} fill="none" opacity={0.3} stroke={config.accentColor} strokeWidth={7} />
          <Path
            d={middlePath}
            fill="none"
            opacity={0.94}
            stroke={config.accentColor}
            strokeDasharray={[2, 6]}
            strokeWidth={1.35}
          />
          <Circle
            cx={center}
            cy={center}
            fill="none"
            opacity={0.4}
            r={size * 0.21}
            stroke={config.accentColor}
            strokeWidth={1.1}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.layer, innerLayerStyle]}>
        <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
          <Path d={innerPath} fill="none" opacity={0.14} stroke={colors.textWhite} strokeWidth={9} />
          <Path d={innerPath} fill="none" opacity={0.28} stroke={primaryColor} strokeWidth={5} />
          <Path d={innerPath} fill="none" opacity={0.9} stroke={colors.textWhite} strokeWidth={1.15} />
          <Circle
            cx={center}
            cy={center}
            fill="none"
            opacity={0.66}
            r={size * 0.052}
            stroke={primaryColor}
            strokeWidth={1.35}
          />
          <Circle cx={center} cy={center} fill={config.accentColor} opacity={0.96} r={size * 0.017} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 0,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
