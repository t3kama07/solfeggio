import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, gradients } from '../theme/colors';
import { AMBIENT_SOUNDS, TIMER_PRESETS, type AmbientSoundKey } from '../utils/frequencyMap';

const TWO_PI = Math.PI * 2;
const BUTTON_WIDTH = 172;
const COMPACT_BREAKPOINT = 380;

type ControlsProps = {
  isPlaying: boolean;
  isReady: boolean;
  selectedAmbient: AmbientSoundKey | null;
  playbackProgress: SharedValue<number>;
  selectedTimerMs: number | null;
  timerDisplay: string | null;
  onToggleAmbient: (ambient: AmbientSoundKey) => void;
  onSelectTimer: (timerMs: number | null) => void;
  onTogglePlay: () => void;
};

type BarProps = {
  offset: number;
  playbackProgress: SharedValue<number>;
};

function getAmbientAccentStyles(ambientKey: AmbientSoundKey) {
  switch (ambientKey) {
    case 'rain':
    case 'river':
      return {
        chip: styles.ambientChipActiveWater,
        dot: styles.ambientDotWater,
      };
    case 'fire':
      return {
        chip: styles.ambientChipActiveFire,
        dot: styles.ambientDotFire,
      };
    case 'bird':
      return {
        chip: styles.ambientChipActiveBird,
        dot: styles.ambientDotBird,
      };
    case 'om':
      return {
        chip: styles.ambientChipActiveOm,
        dot: styles.ambientDotOm,
      };
    case 'singbowl':
    default:
      return {
        chip: styles.ambientChipActiveBowl,
        dot: styles.ambientDotBowl,
      };
  }
}

function Bar({ offset, playbackProgress }: BarProps) {
  const style = useAnimatedStyle(() => {
    const wave = (Math.sin(playbackProgress.value * TWO_PI + offset) + 1) / 2;

    return {
      height: 10 + wave * 16,
      opacity: 0.4 + wave * 0.5,
    };
  });

  return <Animated.View style={[styles.bar, style]} />;
}

type BarsIconProps = {
  playbackProgress: SharedValue<number>;
};

function BarsIcon({ playbackProgress }: BarsIconProps) {
  return (
    <View style={styles.barsWrap}>
      <Bar offset={0} playbackProgress={playbackProgress} />
      <Bar offset={0.7} playbackProgress={playbackProgress} />
      <Bar offset={1.35} playbackProgress={playbackProgress} />
      <Bar offset={2.1} playbackProgress={playbackProgress} />
    </View>
  );
}

export function Controls({
  isPlaying,
  isReady,
  selectedAmbient,
  playbackProgress,
  selectedTimerMs,
  timerDisplay,
  onToggleAmbient,
  onSelectTimer,
  onTogglePlay,
}: ControlsProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < COMPACT_BREAKPOINT;
  const scale = useSharedValue(1);
  const hasTimer = timerDisplay != null;
  const timerChipText = hasTimer ? timerDisplay : 'Timer';
  const ambientDisabled = !isReady || !isPlaying;
  const buttonWidth = isCompact ? Math.min(BUTTON_WIDTH, Math.max(148, width - 160)) : BUTTON_WIDTH;
  const ambientChipWidth = Math.min(110, Math.max(76, Math.floor((width - 84) / 3)));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withTiming(0.96, { duration: 120 });
  }

  function handlePressOut() {
    scale.value = withTiming(1, { duration: 140 });
  }

  function handleCycleTimer() {
    const currentIndex = TIMER_PRESETS.findIndex((preset) => preset.ms === selectedTimerMs);

    if (currentIndex === -1) {
      onSelectTimer(TIMER_PRESETS[0].ms);
      return;
    }

    const nextPreset = TIMER_PRESETS[currentIndex + 1];
    onSelectTimer(nextPreset ? nextPreset.ms : null);
  }

  const timerChip = (
    <Pressable
      accessibilityRole="button"
      onLongPress={() => onSelectTimer(null)}
      onPress={handleCycleTimer}
      style={[
        styles.sideChip,
        styles.timerChip,
        hasTimer ? styles.sideChipActive : styles.sideChipIdle,
      ]}
    >
      <View style={styles.clockIcon}>
        <View style={[styles.clockFace, hasTimer && styles.clockFaceActive]}>
          <View style={styles.clockHandLong} />
          <View style={styles.clockHandShort} />
        </View>
      </View>
      <Text style={[styles.timerText, !hasTimer && styles.timerTextIdle]}>{timerChipText}</Text>
    </Pressable>
  );

  const mainButton = (
    <Animated.View style={animatedButtonStyle}>
      <Pressable
        accessibilityRole="button"
        disabled={!isReady}
        onPress={onTogglePlay}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.buttonWrap, !isReady && styles.buttonDisabled]}
      >
        <View style={[styles.buttonGlow, { width: buttonWidth }]} />
        <LinearGradient
          colors={[...gradients.button]}
          end={{ x: 1, y: 0.4 }}
          start={{ x: 0, y: 0 }}
          style={[styles.button, { minWidth: buttonWidth }]}
        >
          <Text style={styles.buttonText}>{isPlaying ? 'PAUSE' : 'START'}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  const meterChip = (
    <View style={[styles.sideChip, styles.meterChip]}>
      <BarsIcon playbackProgress={playbackProgress} />
    </View>
  );

  const ambientChips = (
    <View style={styles.ambientRow}>
      {(Object.keys(AMBIENT_SOUNDS) as AmbientSoundKey[]).map((ambientKey) => {
        const isActive = selectedAmbient === ambientKey;
        const accentStyles = getAmbientAccentStyles(ambientKey);

        return (
          <Pressable
            key={ambientKey}
            accessibilityRole="button"
            disabled={ambientDisabled}
            onPress={() => onToggleAmbient(ambientKey)}
            style={[
              styles.ambientChip,
              { width: ambientChipWidth },
              isActive && styles.ambientChipActiveBase,
              isActive && accentStyles.chip,
              ambientDisabled && styles.ambientChipDisabled,
            ]}
          >
            <View style={[styles.ambientDot, accentStyles.dot, !isActive && styles.ambientDotIdle]} />
            <Text
              numberOfLines={2}
              style={[styles.ambientText, isActive ? styles.ambientTextActive : styles.ambientTextIdle]}
            >
              {AMBIENT_SOUNDS[ambientKey].label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {isCompact ? (
        <>
          {mainButton}
          <View style={styles.metaRow}>
            {timerChip}
            {meterChip}
          </View>
        </>
      ) : (
        <View style={styles.bottomRow}>
          {timerChip}
          {mainButton}
          {meterChip}
        </View>
      )}
      {ambientChips}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    width: '100%',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  ambientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    width: '100%',
  },
  sideChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(12, 18, 40, 0.34)',
    borderColor: 'rgba(160, 167, 192, 0.18)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  timerChip: {
    minWidth: 94,
    paddingHorizontal: 14,
  },
  meterChip: {
    minWidth: 60,
  },
  ambientChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(9, 14, 32, 0.52)',
    borderColor: 'rgba(160, 167, 192, 0.14)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  ambientChipDisabled: {
    opacity: 0.4,
  },
  ambientChipActiveBase: {
    borderWidth: 1.4,
    elevation: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    transform: [{ translateY: -1 }],
  },
  ambientChipActiveWater: {
    backgroundColor: 'rgba(82, 241, 255, 0.16)',
    borderColor: 'rgba(82, 241, 255, 0.58)',
    shadowColor: colors.highlightCyan,
  },
  ambientChipActiveFire: {
    backgroundColor: 'rgba(255, 158, 88, 0.16)',
    borderColor: 'rgba(255, 176, 120, 0.58)',
    shadowColor: '#FFB36B',
  },
  ambientChipActiveBowl: {
    backgroundColor: 'rgba(240, 216, 120, 0.16)',
    borderColor: 'rgba(240, 216, 120, 0.58)',
    shadowColor: '#F0D878',
  },
  ambientChipActiveOm: {
    backgroundColor: 'rgba(216, 108, 255, 0.16)',
    borderColor: 'rgba(216, 108, 255, 0.58)',
    shadowColor: colors.accentPink,
  },
  ambientChipActiveBird: {
    backgroundColor: 'rgba(168, 255, 140, 0.16)',
    borderColor: 'rgba(168, 255, 140, 0.58)',
    shadowColor: '#A8FF8C',
  },
  ambientDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  ambientDotWater: {
    backgroundColor: colors.highlightCyan,
  },
  ambientDotFire: {
    backgroundColor: '#FFB36B',
  },
  ambientDotBowl: {
    backgroundColor: '#F0D878',
  },
  ambientDotOm: {
    backgroundColor: colors.accentPink,
  },
  ambientDotBird: {
    backgroundColor: '#A8FF8C',
  },
  ambientDotIdle: {
    opacity: 0.52,
  },
  ambientText: {
    flexShrink: 1,
    fontSize: 11.5,
    letterSpacing: 0.2,
    lineHeight: 13,
    textAlign: 'center',
  },
  ambientTextActive: {
    color: colors.textWhite,
    fontWeight: '700',
  },
  ambientTextIdle: {
    color: colors.softText,
    fontWeight: '500',
  },
  sideChipIdle: {
    backgroundColor: 'rgba(12, 18, 40, 0.28)',
  },
  sideChipActive: {
    backgroundColor: 'rgba(82, 241, 255, 0.08)',
    borderColor: 'rgba(82, 241, 255, 0.48)',
  },
  clockIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockFace: {
    alignItems: 'center',
    borderColor: colors.softText,
    borderRadius: 999,
    borderWidth: 1.5,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  clockFaceActive: {
    borderColor: colors.highlightCyan,
  },
  clockHandLong: {
    backgroundColor: colors.textWhite,
    borderRadius: 999,
    height: 5,
    left: 7,
    position: 'absolute',
    top: 3,
    width: 1.5,
  },
  clockHandShort: {
    backgroundColor: colors.textWhite,
    borderRadius: 999,
    height: 1.5,
    left: 7,
    position: 'absolute',
    top: 7,
    width: 4,
  },
  timerText: {
    color: colors.textWhite,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    letterSpacing: 0.3,
    minWidth: 42,
    textAlign: 'center',
  },
  timerTextIdle: {
    color: colors.softText,
    fontVariant: undefined,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  buttonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  buttonGlow: {
    backgroundColor: colors.buttonShadow,
    borderRadius: 28,
    height: 56,
    opacity: 0.82,
    position: 'absolute',
    boxShadow: `0px 0px 14px 0px ${colors.primaryGlow}80`,
    width: BUTTON_WIDTH,
  },
  button: {
    alignItems: 'center',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    minWidth: BUTTON_WIDTH,
    paddingHorizontal: 24,
    boxShadow: `0px 0px 14px 0px ${colors.primaryGlow}42`,
  },
  buttonText: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  barsWrap: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    height: 22,
  },
  bar: {
    backgroundColor: colors.softText,
    borderRadius: 999,
    width: 4,
  },
});



