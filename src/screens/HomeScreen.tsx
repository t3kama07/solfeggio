import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Controls } from '../components/Controls';
import { FrequencyDial } from '../components/FrequencyDial';
import { FrequencyInfo } from '../components/FrequencyInfo';
import { Header } from '../components/Header';
import { MandalaField } from '../components/MandalaField';
import { ParticleField } from '../components/ParticleField';
import { StarfieldBackground } from '../components/StarfieldBackground';
import { WaveVisualizer } from '../components/WaveVisualizer';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useDialRotation } from '../hooks/useDialRotation';
import { colors, gradients } from '../theme/colors';
import {
  AMBIENT_SOUNDS,
  DEFAULT_FREQUENCY,
  DIAL_STEP_ANGLE,
  FREQUENCIES,
  FREQUENCY_DETAILS,
  formatDuration,
  getFrequencyFromIndex,
  getFrequencyIndex,
  type AmbientSoundKey,
  type FrequencyValue,
} from '../utils/frequencyMap';

export function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const { isReady, playAmbient, playFrequency, playTick, stop, stopAmbient } = useAudioPlayer();
  const [selectedFrequency, setSelectedFrequency] = useState(DEFAULT_FREQUENCY);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAmbient, setSelectedAmbient] = useState<AmbientSoundKey | null>(null);
  const [selectedTimerMs, setSelectedTimerMs] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [showPlaybackVisuals, setShowPlaybackVisuals] = useState(false);
  const timerEndAtRef = useRef<number | null>(null);
  const ambientPhase = useSharedValue(0);
  const breathPhase = useSharedValue(0);
  const changePulse = useSharedValue(0);
  const playbackProgress = useSharedValue(0);
  const playbackReveal = useSharedValue(0);
  const wavePhase = useSharedValue(0);

  const onStepChange = useEffectEvent((index: number) => {
    const frequency = getFrequencyFromIndex(index);

    changePulse.value = 0;
    changePulse.value = withSequence(withTiming(1, { duration: 150 }), withTiming(0, { duration: 240 }));

    startTransition(() => {
      setSelectedFrequency(frequency);
    });

    void playTick();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

    if (isPlaying) {
      void playFrequency(frequency);
    }
  });

  const { animateToIndex, dialRef, gesture, rotation } = useDialRotation({
    initialIndex: getFrequencyIndex(DEFAULT_FREQUENCY),
    onStepChange,
    stepAngle: DIAL_STEP_ANGLE,
    stepCount: FREQUENCIES.length,
  });

  useEffect(() => {
    ambientPhase.value = 0;
    ambientPhase.value = withRepeat(
      withTiming(1, {
        duration: 18000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    breathPhase.value = 0;
    breathPhase.value = withRepeat(
      withTiming(1, {
        duration: 6500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );

    return () => {
      cancelAnimation(ambientPhase);
      cancelAnimation(breathPhase);
    };
  }, [ambientPhase, breathPhase]);

  useEffect(() => {
    if (isPlaying) {
      wavePhase.value = 0;
      wavePhase.value = withRepeat(
        withTiming(1, {
          duration: 5000,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      return () => {
        cancelAnimation(wavePhase);
      };
    }

    cancelAnimation(wavePhase);
    wavePhase.value = withTiming(0.35, {
      duration: 260,
      easing: Easing.out(Easing.ease),
    });

    return () => {
      cancelAnimation(wavePhase);
    };
  }, [isPlaying, wavePhase]);

  useEffect(() => {
    if (isPlaying) {
      playbackProgress.value = 0;
      playbackProgress.value = withRepeat(
        withTiming(1, {
          duration: 4000,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      return;
    }

    cancelAnimation(playbackProgress);
    playbackProgress.value = withTiming(0, { duration: 260 });
  }, [isPlaying, playbackProgress]);

  useEffect(() => {
    playbackReveal.value = withTiming(isPlaying ? 1 : 0, {
      duration: 360,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isPlaying, playbackReveal]);

  useEffect(() => {
    if (isPlaying) {
      setShowPlaybackVisuals(true);
      return;
    }

    const timeout = setTimeout(() => {
      setShowPlaybackVisuals(false);
    }, 360);

    return () => clearTimeout(timeout);
  }, [isPlaying]);

  const stopPlayback = useEffectEvent(async () => {
    await stop();
    setIsPlaying(false);
    setSelectedAmbient(null);
    timerEndAtRef.current = null;
    setRemainingMs(selectedTimerMs);
  });

  useEffect(() => {
    if (!isPlaying || !timerEndAtRef.current) {
      return;
    }

    const interval = setInterval(() => {
      const endAt = timerEndAtRef.current;

      if (!endAt) {
        return;
      }

      const nextRemaining = endAt - Date.now();

      if (nextRemaining <= 0) {
        clearInterval(interval);
        setRemainingMs(0);
        void stopPlayback();
        return;
      }

      setRemainingMs(nextRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, stopPlayback]);

  const theme = FREQUENCY_DETAILS[selectedFrequency];
  const compactWidth = width < 380;
  const shortViewport = height < 760;
  const contentPaddingHorizontal = compactWidth ? 16 : 22;
  const contentPaddingVertical = shortViewport ? 18 : 24;
  const panelWidth = Math.min(420, width - contentPaddingHorizontal * 2);
  const dialSize = Math.max(
    204,
    Math.min(width * (compactWidth ? 0.68 : 0.76), height * (shortViewport ? 0.38 : 0.43), 334)
  );
  const stageSize = dialSize + Math.min(width * 0.24, shortViewport ? 78 : 108);
  const waveWidth = Math.max(200, Math.min(panelWidth - 32, 340));
  const timerDisplay =
    isPlaying && remainingMs != null
      ? formatDuration(remainingMs)
      : selectedTimerMs != null
        ? formatDuration(selectedTimerMs)
        : null;
  const timerText =
    isPlaying && remainingMs != null
      ? `${formatDuration(remainingMs)} remaining`
      : selectedTimerMs != null
        ? `${formatDuration(selectedTimerMs)} selected`
        : null;
  const soundscapeText =
    selectedAmbient == null ? null : `${AMBIENT_SOUNDS[selectedAmbient].label} ambience`;
  const mandalaStageStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + playbackReveal.value * 0.88,
    transform: [{ scale: 0.94 + playbackReveal.value * 0.1 }],
  }));
  const particleStageStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + playbackReveal.value * 0.28,
    transform: [{ scale: 0.97 + playbackReveal.value * 0.02 }],
  }));
  const dialStageStyle = useAnimatedStyle(() => ({
    opacity: 1 - playbackReveal.value,
    transform: [{ scale: 1 - playbackReveal.value * 0.08 }],
  }));

  async function handleTogglePlayback() {
    if (!isReady) {
      return;
    }

    if (isPlaying) {
      await stopPlayback();
      return;
    }

    changePulse.value = 0;
    changePulse.value = withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 360 }));
    setIsPlaying(true);

    if (selectedTimerMs != null) {
      timerEndAtRef.current = Date.now() + selectedTimerMs;
      setRemainingMs(selectedTimerMs);
    } else {
      timerEndAtRef.current = null;
      setRemainingMs(null);
    }

    try {
      await playFrequency(selectedFrequency);
    } catch (error) {
      console.warn('Playback failed', error);
      setIsPlaying(false);
      timerEndAtRef.current = null;
      setRemainingMs(selectedTimerMs);
    }
  }

  function handleSelectTimer(timerMs: number | null) {
    setSelectedTimerMs(timerMs);

    if (timerMs == null) {
      timerEndAtRef.current = null;
      setRemainingMs(null);
      return;
    }

    if (isPlaying) {
      timerEndAtRef.current = Date.now() + timerMs;
    }

    setRemainingMs(timerMs);
  }

  const handleSelectFrequency = useEffectEvent((frequency: FrequencyValue, index: number) => {
    changePulse.value = 0;
    changePulse.value = withSequence(withTiming(1, { duration: 150 }), withTiming(0, { duration: 240 }));

    animateToIndex(index);

    startTransition(() => {
      setSelectedFrequency(frequency);
    });

    void playTick();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

    if (isPlaying) {
      void playFrequency(frequency);
    }
  });

  async function handleToggleAmbient(ambient: AmbientSoundKey) {
    if (!isReady || !isPlaying) {
      return;
    }

    try {
      if (selectedAmbient === ambient) {
        await stopAmbient();
        setSelectedAmbient(null);
        return;
      }

      await playAmbient(ambient);
      setSelectedAmbient(ambient);
    } catch (error) {
      console.warn('Ambient playback failed', error);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.screen}>
        <LinearGradient
          colors={[...gradients.background]}
          end={{ x: 0.88, y: 1 }}
          start={{ x: 0.12, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />

        <StarfieldBackground ambientPhase={ambientPhase} height={height} width={width} />

        <LinearGradient
          colors={['rgba(82, 241, 255, 0.08)', 'rgba(82, 241, 255, 0.01)']}
          end={{ x: 0.82, y: 0.84 }}
          start={{ x: 0.15, y: 0.18 }}
          style={[styles.cosmicGlow, styles.topGlow]}
        />
        <LinearGradient
          colors={['rgba(216, 108, 255, 0.12)', 'rgba(216, 108, 255, 0.01)']}
          end={{ x: 0.8, y: 0.82 }}
          start={{ x: 0.2, y: 0.18 }}
          style={[styles.cosmicGlow, styles.sideGlow]}
        />

        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.content,
            {
              minHeight: height,
              paddingHorizontal: contentPaddingHorizontal,
              paddingVertical: contentPaddingVertical,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <Header />

          <View
            style={[
              styles.stage,
              {
                width: stageSize,
                height: stageSize,
                marginTop: shortViewport ? 0 : 8,
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(82, 241, 255, 0.08)', 'rgba(11, 16, 38, 0.01)', 'rgba(216, 108, 255, 0.12)']}
              end={{ x: 0.82, y: 0.88 }}
              start={{ x: 0.18, y: 0.14 }}
              style={[styles.stageHalo, { width: stageSize * 0.94, height: stageSize * 0.94 }]}
            />
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.03)', 'rgba(11, 16, 38, 0.01)']}
              end={{ x: 0.8, y: 0.9 }}
              start={{ x: 0.2, y: 0.2 }}
              style={[styles.stageVeil, { width: stageSize * 0.68, height: stageSize * 0.68 }]}
            />

            {showPlaybackVisuals ? (
              <Animated.View pointerEvents="none" style={[styles.stageLayer, mandalaStageStyle]}>
                <MandalaField
                  ambientPhase={ambientPhase}
                  changePulse={changePulse}
                  playbackProgress={playbackProgress}
                  rotation={rotation}
                  selectedFrequency={selectedFrequency}
                  size={stageSize}
                  themeColor={theme.color}
                />
              </Animated.View>
            ) : null}

            {showPlaybackVisuals ? (
              <Animated.View pointerEvents="none" style={[styles.stageLayer, particleStageStyle]}>
                <ParticleField
                  ambientPhase={ambientPhase}
                  changePulse={changePulse}
                  playbackProgress={playbackProgress}
                  rotation={rotation}
                  size={stageSize}
                  themeColor={theme.color}
                />
              </Animated.View>
            ) : null}

            <Animated.View
              pointerEvents={isPlaying ? 'none' : 'auto'}
              style={[styles.stageLayer, dialStageStyle]}
            >
              <FrequencyDial
                ambientPhase={ambientPhase}
                breathPhase={breathPhase}
                changePulse={changePulse}
                dialRef={dialRef}
                gesture={gesture}
                onSelectFrequency={handleSelectFrequency}
                playbackProgress={playbackProgress}
                rotation={rotation}
                selectedFrequency={selectedFrequency}
                size={dialSize}
                themeColor={theme.color}
              />
            </Animated.View>
          </View>

          <FrequencyInfo
            audioReady={isReady}
            frequency={selectedFrequency}
            isPlaying={isPlaying}
            soundscapeText={soundscapeText}
            timerText={timerText}
          />

          <LinearGradient
            colors={['rgba(18, 27, 61, 0.9)', 'rgba(11, 16, 38, 0.72)']}
            end={{ x: 0.88, y: 1 }}
            start={{ x: 0.12, y: 0 }}
            style={styles.bottomPanel}
          >
            <WaveVisualizer
              changePulse={changePulse}
              playbackProgress={playbackProgress}
              wavePhase={wavePhase}
              width={waveWidth}
            />

            <Controls
              isPlaying={isPlaying}
              isReady={isReady}
              onToggleAmbient={handleToggleAmbient}
              onSelectTimer={handleSelectTimer}
              onTogglePlay={handleTogglePlayback}
              playbackProgress={playbackProgress}
              selectedAmbient={selectedAmbient}
              selectedTimerMs={selectedTimerMs}
              timerDisplay={timerDisplay}
            />
          </LinearGradient>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    gap: 18,
    justifyContent: 'space-between',
  },
  cosmicGlow: {
    borderRadius: 999,
    position: 'absolute',
  },
  topGlow: {
    height: 260,
    left: -60,
    top: -40,
    width: 260,
  },
  sideGlow: {
    height: 280,
    right: -80,
    top: 190,
    width: 280,
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageHalo: {
    borderRadius: 999,
    opacity: 0.95,
    position: 'absolute',
  },
  stageVeil: {
    borderRadius: 999,
    opacity: 0.6,
    position: 'absolute',
  },
  bottomPanel: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: 'rgba(160, 167, 192, 0.16)',
    borderRadius: 30,
    borderWidth: 1,
    gap: 18,
    maxWidth: 420,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 18,
    width: '100%',
  },
});
