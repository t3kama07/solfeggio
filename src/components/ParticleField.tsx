import { StyleSheet, View } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { colors } from '../theme/colors';

const TWO_PI = Math.PI * 2;
const PARTICLES = Array.from({ length: 20 }, (_, index) => ({
  angle: (TWO_PI * index) / 20 + (index % 4) * 0.14,
  float: 2 + (index % 4) * 0.6,
  opacity: 0.24 + (index % 3) * 0.035,
  radiusFactor: 0.31 + (index % 5) * 0.04,
  size: 2 + (index % 3) * 0.45,
  spin: index % 2 === 0 ? 0.08 : -0.06,
  tint:
    index % 4 === 0
      ? colors.highlightCyan
      : index % 4 === 1
        ? colors.primaryGlow
        : index % 4 === 2
          ? colors.accentPink
          : colors.textWhite,
}));

type ParticleFieldProps = {
  ambientPhase: SharedValue<number>;
  changePulse: SharedValue<number>;
  rotation: SharedValue<number>;
  playbackProgress: SharedValue<number>;
  size: number;
  themeColor: string;
};

type ParticleProps = {
  ambientPhase: SharedValue<number>;
  center: number;
  changePulse: SharedValue<number>;
  particle: (typeof PARTICLES)[number];
  playbackProgress: SharedValue<number>;
  rotation: SharedValue<number>;
  size: number;
  themeColor: string;
};

function Particle({
  ambientPhase,
  center,
  changePulse,
  particle,
  playbackProgress,
  rotation,
  size,
  themeColor,
}: ParticleProps) {
  const cx = useDerivedValue(() => {
    const angle = particle.angle + ambientPhase.value * TWO_PI * particle.spin + rotation.value * 0.0015;
    const orbit = size * particle.radiusFactor + Math.sin(ambientPhase.value * TWO_PI + particle.angle) * particle.float;

    return center + Math.cos(angle) * orbit;
  });

  const cy = useDerivedValue(() => {
    const angle = particle.angle + ambientPhase.value * TWO_PI * particle.spin + rotation.value * 0.0015;
    const orbit = size * particle.radiusFactor + Math.sin(ambientPhase.value * TWO_PI + particle.angle) * particle.float;

    return center + Math.sin(angle) * orbit + Math.sin(ambientPhase.value * TWO_PI * 1.3 + particle.angle) * 4;
  });

  const radius = useDerivedValue(() => particle.size + changePulse.value * 0.35 + playbackProgress.value * 0.12);
  const opacity = useDerivedValue(() => Math.min(0.35, particle.opacity + changePulse.value * 0.08));
  const color = themeColor === colors.textWhite && particle.tint === colors.textWhite ? colors.highlightCyan : particle.tint;

  return <Circle cx={cx as any} cy={cy as any} r={radius as any} color={color} opacity={opacity as any} />;
}

export function ParticleField({
  ambientPhase,
  changePulse,
  playbackProgress,
  rotation,
  size,
  themeColor,
}: ParticleFieldProps) {
  const center = size / 2;

  return (
    <View pointerEvents="none" style={[styles.container, { width: size, height: size }]}> 
      <Canvas style={StyleSheet.absoluteFillObject}>
        {PARTICLES.map((particle, index) => (
          <Particle
            ambientPhase={ambientPhase}
            center={center}
            changePulse={changePulse}
            key={index}
            particle={particle}
            playbackProgress={playbackProgress}
            rotation={rotation}
            size={size}
            themeColor={themeColor}
          />
        ))}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
});
