import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated, { type AnimatedRef, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Line,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { colors } from '../theme/colors';
import { DIAL_STEP_ANGLE, FREQUENCIES, type FrequencyValue } from '../utils/frequencyMap';

const DEGREE = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const GLINT_ANGLES = [-118, -26, 52, 168];

function getPolarPoint(center: number, radius: number, index: number) {
  const angle = (-90 + index * DIAL_STEP_ANGLE) * DEGREE;

  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

function polarToCartesian(center: number, radius: number, angleInDegrees: number) {
  const angle = (angleInDegrees - 90) * DEGREE;

  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

function describeArc(center: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(center, radius, endAngle);
  const end = polarToCartesian(center, radius, startAngle);
  const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${arcSweep} 0 ${end.x} ${end.y}`;
}

type FrequencyDialProps = {
  ambientPhase: SharedValue<number>;
  breathPhase: SharedValue<number>;
  changePulse: SharedValue<number>;
  dialRef: AnimatedRef<View>;
  gesture: GestureType;
  onSelectFrequency: (frequency: FrequencyValue, index: number) => void;
  playbackProgress: SharedValue<number>;
  rotation: SharedValue<number>;
  selectedFrequency: FrequencyValue;
  size: number;
  themeColor: string;
};

export function FrequencyDial({
  ambientPhase,
  breathPhase,
  changePulse,
  dialRef,
  gesture,
  onSelectFrequency,
  playbackProgress,
  rotation,
  selectedFrequency,
  size,
  themeColor,
}: FrequencyDialProps) {
  const center = size / 2;
  const labelRadius = size * 0.444;
  const markerRadius = size * 0.382;
  const mainRingRadius = size * 0.31;
  const glowRingRadius = mainRingRadius + 10;
  const outerGuideRadius = mainRingRadius + 30;
  const outerShellRadius = mainRingRadius + 38;
  const innerRingRadius = size * 0.226;
  const arcPath = describeArc(center, mainRingRadius, -112, -66);
  const tipY = size * 0.18;
  const tailY = center + size * 0.07;
  const activeAccent = themeColor === colors.textWhite ? colors.highlightCyan : themeColor;

  const glowStyle = useAnimatedStyle(() => {
    const breathing = 0.16 + (Math.sin(ambientPhase.value * TWO_PI) + 1) * 0.04;

    return {
      opacity: breathing + playbackProgress.value * 0.12 + changePulse.value * 0.16,
      transform: [{ scale: 1 + changePulse.value * 0.03 }],
    };
  });

  const pointerStyle = useAnimatedStyle(() => ({
    opacity: 0.92 + changePulse.value * 0.08,
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const arcStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + playbackProgress.value * 0.14 + changePulse.value * 0.18,
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    opacity: 0.1 + playbackProgress.value * 0.1 + changePulse.value * 0.18,
    transform: [{ scale: 0.97 + playbackProgress.value * 0.05 + changePulse.value * 0.05 }],
  }));

  const centerCoreStyle = useAnimatedStyle(() => {
    const breathe = ((Math.sin(breathPhase.value * TWO_PI - Math.PI / 2) + 1) / 2) * 0.05;

    return {
      opacity: 0.6 + playbackProgress.value * 0.08,
      transform: [{ scale: 1 + breathe + changePulse.value * 0.02 }],
    };
  });

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.outerGlow,
          {
            borderColor: themeColor,
            shadowColor: themeColor,
            width: size * 0.82,
            height: size * 0.82,
          },
          glowStyle,
        ]}
      />

      <GestureDetector gesture={gesture}>
        <Animated.View ref={dialRef} style={[styles.touchArea, { width: size, height: size }]}>
          <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <SvgLinearGradient id="dialRingGradient" x1="0%" x2="100%" y1="0%" y2="100%">
                <Stop offset="0%" stopColor={colors.highlightCyan} />
                <Stop offset="100%" stopColor={colors.accentPink} />
              </SvgLinearGradient>
              <SvgLinearGradient id="arcGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                <Stop offset="0%" stopColor={colors.highlightCyan} stopOpacity="0.08" />
                <Stop offset="100%" stopColor={colors.accentPink} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>

            <Circle cx={center} cy={center} fill="none" opacity={0.22} r={outerShellRadius} stroke="rgba(255,255,255,0.16)" strokeWidth={1.2} />
            <Circle cx={center} cy={center} fill="none" opacity={0.18} r={outerGuideRadius} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
            <Circle cx={center} cy={center} fill="none" opacity={0.3} r={glowRingRadius} stroke="url(#dialRingGradient)" strokeWidth={10} />
            <Circle cx={center} cy={center} fill="none" r={mainRingRadius} stroke="url(#dialRingGradient)" strokeWidth={6} />
            <Circle cx={center} cy={center} fill="none" opacity={0.65} r={innerRingRadius} stroke={colors.ringInner} strokeWidth={2} />

            <Line opacity={0.14} stroke={colors.textWhite} strokeWidth={1} x1={center - innerRingRadius} x2={center + innerRingRadius} y1={center} y2={center} />
            <Line opacity={0.14} stroke={colors.textWhite} strokeWidth={1} x1={center} x2={center} y1={center - innerRingRadius} y2={center + innerRingRadius} />

            {GLINT_ANGLES.map((angle, index) => {
              const point = polarToCartesian(center, outerGuideRadius, angle);
              const color = index % 2 === 0 ? colors.highlightCyan : colors.accentPink;

              return (
                <Fragment key={angle}>
                  <Circle cx={point.x} cy={point.y} fill={color} opacity={0.18} r={10} />
                  <Circle cx={point.x} cy={point.y} fill={color} opacity={0.85} r={2.6} />
                </Fragment>
              );
            })}

            {FREQUENCIES.map((frequency, index) => {
              const labelPoint = getPolarPoint(center, labelRadius, index);
              const dotPoint = getPolarPoint(center, markerRadius, index);
              const selected = frequency === selectedFrequency;
              const labelBadgeRadius = selected ? size * 0.062 : size * 0.053;
              const labelRingRadius = selected ? labelBadgeRadius + 5 : labelBadgeRadius + 2;
              const markerGlowRadius = selected ? 12 : 0;

              return (
                <G key={frequency} onPress={() => onSelectFrequency(frequency, index)}>
                  <Circle cx={labelPoint.x} cy={labelPoint.y} fill="transparent" r={labelBadgeRadius + 13} />

                  {selected ? (
                    <>
                      <Circle cx={labelPoint.x} cy={labelPoint.y} fill={activeAccent} opacity={0.16} r={labelRingRadius + 4} />
                      <Circle cx={dotPoint.x} cy={dotPoint.y} fill={activeAccent} opacity={0.16} r={markerGlowRadius} />
                    </>
                  ) : null}

                  <Circle
                    cx={labelPoint.x}
                    cy={labelPoint.y}
                    fill={selected ? 'rgba(255,255,255,0.08)' : 'rgba(8, 13, 30, 0.82)'}
                    stroke={selected ? activeAccent : 'rgba(160, 167, 192, 0.22)'}
                    strokeOpacity={selected ? 0.96 : 0.8}
                    strokeWidth={selected ? 1.9 : 1.15}
                    r={labelBadgeRadius}
                  />
                  <Circle
                    cx={labelPoint.x}
                    cy={labelPoint.y}
                    fill="rgba(255,255,255,0.02)"
                    opacity={selected ? 0.88 : 0.5}
                    r={labelBadgeRadius - 4.5}
                  />

                  <Circle
                    cx={dotPoint.x}
                    cy={dotPoint.y}
                    fill={selected ? activeAccent : 'rgba(160, 223, 255, 0.82)'}
                    opacity={selected ? 1 : 0.8}
                    r={selected ? 4.8 : 2.6}
                  />

                  {selected ? (
                    <SvgText
                      fill={activeAccent}
                      fillOpacity={0.22}
                      fontFamily="serif"
                      fontSize={18}
                      fontWeight="700"
                      letterSpacing={0.8}
                      textAnchor="middle"
                      x={labelPoint.x}
                      y={labelPoint.y + 5}
                    >
                      {frequency}
                    </SvgText>
                  ) : null}

                  <SvgText
                    fill={selected ? colors.textWhite : 'rgba(255,255,255,0.84)'}
                    fillOpacity={selected ? 1 : 0.98}
                    fontFamily="serif"
                    fontSize={selected ? 15.5 : 14}
                    fontWeight={selected ? '700' : '600'}
                    letterSpacing={selected ? 0.7 : 0.45}
                    textAnchor="middle"
                    x={labelPoint.x}
                    y={labelPoint.y + 5}
                  >
                    {frequency}
                  </SvgText>
                </G>
              );
            })}
          </Svg>

          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.arcLayer, arcStyle]}>
            <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
              <Path d={arcPath} fill="none" opacity={0.18} stroke={colors.highlightCyan} strokeLinecap="round" strokeWidth={10} />
              <Path d={arcPath} fill="none" stroke="url(#arcGradient)" strokeLinecap="round" strokeWidth={6} />
            </Svg>
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.centerShell,
              {
                borderColor: 'rgba(82, 241, 255, 0.24)',
                width: size * 0.25,
                height: size * 0.25,
              },
              centerCoreStyle,
            ]}
          >
            <View style={styles.centerShellInner} />
            <View style={styles.centerCoreGlow} />
            <View style={[styles.centerCore, { backgroundColor: activeAccent }]} />
          </Animated.View>

          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.pointerLayer, pointerStyle]}>
            <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
              <Line opacity={0.18} stroke={colors.highlightCyan} strokeLinecap="round" strokeWidth={12} x1={center} x2={center} y1={tailY} y2={tipY} />
              <Line stroke={colors.highlightCyan} strokeLinecap="round" strokeWidth={6} x1={center} x2={center} y1={tailY} y2={tipY} />
              <Circle cx={center} cy={tipY} fill={colors.highlightCyan} opacity={0.18} r={9} />
              <Circle cx={center} cy={tipY} fill={colors.highlightCyan} r={4} />
              <Circle cx={center} cy={center} fill="rgba(11, 16, 38, 0.92)" opacity={0.9} r={size * 0.048} />
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <Animated.View
        style={[
          styles.pulseRing,
          {
            borderColor: themeColor,
            width: size * 0.72,
            height: size * 0.72,
          },
          pulseRingStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    borderRadius: 999,
    borderWidth: 2,
    opacity: 0.2,
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 10,
  },
  arcLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 16, 38, 0.82)',
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: 'center',
    position: 'absolute',
  },
  centerShellInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 999,
    height: '74%',
    position: 'absolute',
    width: '74%',
  },
  centerCoreGlow: {
    backgroundColor: colors.highlightCyan,
    borderRadius: 999,
    height: '40%',
    opacity: 0.16,
    position: 'absolute',
    width: '40%',
  },
  centerCore: {
    borderRadius: 999,
    height: '26%',
    opacity: 0.92,
    shadowColor: colors.highlightCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 8,
    width: '26%',
  },
  pulseRing: {
    borderRadius: 999,
    borderWidth: 1.5,
    position: 'absolute',
  },
});
