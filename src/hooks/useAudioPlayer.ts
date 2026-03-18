import { useEffect, useRef, useState } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import {
  AMBIENT_SOUNDS,
  DEFAULT_FREQUENCY,
  FREQUENCY_DETAILS,
  type AmbientSoundKey,
  type FrequencyValue,
  TICK_SOUND,
} from '../utils/frequencyMap';

const FADE_DURATION = 220;
const FADE_STEPS = 8;
const TONE_VOLUME = 0.4;
const AMBIENT_VOLUME = 0.58;
const TONE_LOOP_CROSSFADE_MS = 80;
const TONE_LOOP_TRIGGER_MS = 140;
const TONE_STATUS_UPDATE_MS = 40;
const TONE_DURATION_FALLBACK_MS = 120_000;

type ToneSoundPair = {
  durationMs: number;
  players: [Audio.Sound, Audio.Sound];
};

type ToneSession = {
  activePlayerIndex: 0 | 1;
  frequency: FrequencyValue;
  id: number;
  isCrossfading: boolean;
  pair: ToneSoundPair;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function fadeSound(
  sound: Audio.Sound,
  from: number,
  to: number,
  duration: number,
  shouldContinue: () => boolean = () => true
) {
  const stepDuration = duration / FADE_STEPS;

  if (!shouldContinue()) {
    return false;
  }

  await sound.setVolumeAsync(from);

  for (let step = 1; step <= FADE_STEPS; step += 1) {
    if (!shouldContinue()) {
      return false;
    }

    const nextVolume = from + ((to - from) * step) / FADE_STEPS;
    await sleep(stepDuration);

    if (!shouldContinue()) {
      return false;
    }

    await sound.setVolumeAsync(nextVolume);
  }

  return true;
}

async function resetSound(sound: Audio.Sound) {
  try {
    await sound.pauseAsync();
  } catch {
    // Ignore pause failures when the sound is already stopped.
  }

  try {
    await sound.setPositionAsync(0);
  } catch {
    // Ignore reset failures during teardown or interrupted transitions.
  }

  try {
    await sound.setVolumeAsync(0);
  } catch {
    // Ignore volume reset failures during teardown.
  }
}

async function unloadSound(sound: Audio.Sound | null | undefined) {
  if (!sound) {
    return;
  }

  sound.setOnPlaybackStatusUpdate(null);

  try {
    await sound.unloadAsync();
  } catch {
    // Ignore cleanup failures during teardown.
  }
}

export function useAudioPlayer() {
  const tonePairsRef = useRef(new Map<FrequencyValue, ToneSoundPair>());
  const ambientRef = useRef(new Map<AmbientSoundKey, Audio.Sound>());
  const toneLoadRef = useRef(new Map<FrequencyValue, Promise<ToneSoundPair | null>>());
  const ambientLoadRef = useRef(new Map<AmbientSoundKey, Promise<Audio.Sound | null>>());
  const tickRef = useRef<Audio.Sound | null>(null);
  const tickLoadRef = useRef<Promise<Audio.Sound | null> | null>(null);
  const toneSessionRef = useRef<ToneSession | null>(null);
  const currentAmbientRef = useRef<AmbientSoundKey | null>(null);
  const frequencyQueueRef = useRef<Promise<void>>(Promise.resolve());
  const ambientQueueRef = useRef<Promise<void>>(Promise.resolve());
  const frequencyTokenRef = useRef(0);
  const ambientTokenRef = useRef(0);
  const mountedRef = useRef(true);
  const [isReady, setIsReady] = useState(false);

  function queueFrequencyOperation<T>(operation: (token: number) => Promise<T>) {
    const token = ++frequencyTokenRef.current;
    const queued = frequencyQueueRef.current.then(() => operation(token));

    frequencyQueueRef.current = queued.then(
      () => undefined,
      () => undefined
    );

    return queued;
  }

  function queueAmbientOperation<T>(operation: (token: number) => Promise<T>) {
    const token = ++ambientTokenRef.current;
    const queued = ambientQueueRef.current.then(() => operation(token));

    ambientQueueRef.current = queued.then(
      () => undefined,
      () => undefined
    );

    return queued;
  }

  function isToneSessionActive(sessionId: number) {
    const session = toneSessionRef.current;
    return session != null && session.id === sessionId;
  }

  function clearToneWatchers(pair: ToneSoundPair) {
    for (const player of pair.players) {
      player.setOnPlaybackStatusUpdate(null);
    }
  }

  async function createTonePlayer(frequency: FrequencyValue) {
    const sound = new Audio.Sound();

    const status = await sound.loadAsync(FREQUENCY_DETAILS[frequency].tone, {
      shouldPlay: false,
      isLooping: false,
      volume: 0,
      progressUpdateIntervalMillis: TONE_STATUS_UPDATE_MS,
    });

    const durationMs = status.isLoaded ? status.durationMillis ?? TONE_DURATION_FALLBACK_MS : TONE_DURATION_FALLBACK_MS;

    return { durationMs, sound };
  }

  async function ensureToneLoaded(frequency: FrequencyValue) {
    if (!mountedRef.current) {
      return null;
    }

    const cached = tonePairsRef.current.get(frequency);
    if (cached) {
      return cached;
    }

    const pending = toneLoadRef.current.get(frequency);
    if (pending) {
      return pending;
    }

    const loadPromise = (async () => {
      try {
        const [primary, secondary] = await Promise.all([createTonePlayer(frequency), createTonePlayer(frequency)]);

        if (!mountedRef.current) {
          await Promise.all([unloadSound(primary.sound), unloadSound(secondary.sound)]);
          return null;
        }

        const pair: ToneSoundPair = {
          durationMs: Math.max(primary.durationMs, secondary.durationMs, TONE_DURATION_FALLBACK_MS),
          players: [primary.sound, secondary.sound],
        };

        tonePairsRef.current.set(frequency, pair);
        return pair;
      } finally {
        toneLoadRef.current.delete(frequency);
      }
    })();

    toneLoadRef.current.set(frequency, loadPromise);
    return loadPromise;
  }

  async function ensureAmbientLoaded(ambient: AmbientSoundKey) {
    if (!mountedRef.current) {
      return null;
    }

    const cached = ambientRef.current.get(ambient);
    if (cached) {
      return cached;
    }

    const pending = ambientLoadRef.current.get(ambient);
    if (pending) {
      return pending;
    }

    const loadPromise = (async () => {
      const sound = new Audio.Sound();

      try {
        await sound.loadAsync(AMBIENT_SOUNDS[ambient].source, {
          shouldPlay: false,
          isLooping: true,
          volume: 0,
          progressUpdateIntervalMillis: 250,
        });

        if (!mountedRef.current) {
          await unloadSound(sound);
          return null;
        }

        ambientRef.current.set(ambient, sound);
        return sound;
      } catch (error) {
        await unloadSound(sound);
        throw error;
      } finally {
        ambientLoadRef.current.delete(ambient);
      }
    })();

    ambientLoadRef.current.set(ambient, loadPromise);
    return loadPromise;
  }

  async function ensureTickLoaded() {
    if (!mountedRef.current) {
      return null;
    }

    if (tickRef.current) {
      return tickRef.current;
    }

    if (tickLoadRef.current) {
      return tickLoadRef.current;
    }

    const loadPromise = (async () => {
      const sound = new Audio.Sound();

      try {
        await sound.loadAsync(TICK_SOUND, {
          shouldPlay: false,
          isLooping: false,
          volume: 0.28,
        });

        if (!mountedRef.current) {
          await unloadSound(sound);
          return null;
        }

        tickRef.current = sound;
        return sound;
      } catch (error) {
        await unloadSound(sound);
        throw error;
      } finally {
        tickLoadRef.current = null;
      }
    })();

    tickLoadRef.current = loadPromise;
    return loadPromise;
  }

  function attachToneWatcher(sessionId: number, playerIndex: 0 | 1) {
    const session = toneSessionRef.current;
    if (!session || session.id !== sessionId) {
      return;
    }

    const player = session.pair.players[playerIndex];
    player.setOnPlaybackStatusUpdate((status) => {
      const currentSession = toneSessionRef.current;
      if (!currentSession || currentSession.id !== sessionId) {
        return;
      }

      if (currentSession.activePlayerIndex !== playerIndex || currentSession.isCrossfading) {
        return;
      }

      if (!status.isLoaded || !status.isPlaying) {
        return;
      }

      const durationMs = status.durationMillis ?? currentSession.pair.durationMs;
      const remainingMs = durationMs - status.positionMillis;

      if (remainingMs <= TONE_LOOP_TRIGGER_MS || status.didJustFinish) {
        void startToneCrossfade(sessionId);
      }
    });
  }

  async function stopTonePair(pair: ToneSoundPair) {
    clearToneWatchers(pair);

    const statuses = await Promise.all(
      pair.players.map(async (player) => {
        try {
          return await player.getStatusAsync();
        } catch {
          return null;
        }
      })
    );

    await Promise.all(
      pair.players.map(async (player, index) => {
        const status = statuses[index];
        const currentVolume = status && status.isLoaded ? status.volume : TONE_VOLUME;

        if (status && status.isLoaded && status.isPlaying) {
          await fadeSound(player, currentVolume, 0, FADE_DURATION);
        }

        await resetSound(player);
      })
    );
  }

  async function startToneCrossfade(sessionId: number) {
    const session = toneSessionRef.current;
    if (!session || session.id !== sessionId || session.isCrossfading) {
      return;
    }

    session.isCrossfading = true;
    const currentIndex = session.activePlayerIndex;
    const nextIndex = currentIndex === 0 ? 1 : 0;
    const currentPlayer = session.pair.players[currentIndex];
    const nextPlayer = session.pair.players[nextIndex];

    currentPlayer.setOnPlaybackStatusUpdate(null);
    nextPlayer.setOnPlaybackStatusUpdate(null);

    try {
      await nextPlayer.setPositionAsync(0);
      await nextPlayer.setVolumeAsync(0);
      await nextPlayer.playAsync();

      if (!isToneSessionActive(sessionId)) {
        await resetSound(nextPlayer);
        return;
      }

      await Promise.all([
        fadeSound(currentPlayer, TONE_VOLUME, 0, TONE_LOOP_CROSSFADE_MS, () => isToneSessionActive(sessionId)),
        fadeSound(nextPlayer, 0, TONE_VOLUME, TONE_LOOP_CROSSFADE_MS, () => isToneSessionActive(sessionId)),
      ]);

      if (!isToneSessionActive(sessionId)) {
        await Promise.all([resetSound(currentPlayer), resetSound(nextPlayer)]);
        return;
      }

      await resetSound(currentPlayer);

      const nextSession = toneSessionRef.current;
      if (!nextSession || nextSession.id !== sessionId) {
        return;
      }

      nextSession.activePlayerIndex = nextIndex;
      nextSession.isCrossfading = false;
      attachToneWatcher(sessionId, nextIndex);
    } catch (error) {
      console.warn('Tone loop crossfade failed', error);

      if (isToneSessionActive(sessionId)) {
        toneSessionRef.current!.isCrossfading = false;
        attachToneWatcher(sessionId, currentIndex);
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function preloadAudio() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          staysActiveInBackground: false,
        });

        await Promise.all([ensureTickLoaded(), ensureToneLoaded(DEFAULT_FREQUENCY)]);

        if (!cancelled && mountedRef.current) {
          setIsReady(true);
        }
      } catch (error) {
        console.warn('Audio preload failed', error);
      }
    }

    void preloadAudio();

    return () => {
      cancelled = true;
      mountedRef.current = false;

      const loadedTonePairs = Array.from(tonePairsRef.current.values());
      const loadedAmbientSounds = Array.from(ambientRef.current.values());
      const tickSound = tickRef.current;

      toneSessionRef.current = null;
      currentAmbientRef.current = null;
      tonePairsRef.current.clear();
      ambientRef.current.clear();
      toneLoadRef.current.clear();
      ambientLoadRef.current.clear();
      tickRef.current = null;
      tickLoadRef.current = null;

      void Promise.all([
        ...loadedTonePairs.flatMap((pair) => pair.players.map((player) => unloadSound(player))),
        ...loadedAmbientSounds.map((sound) => unloadSound(sound)),
        unloadSound(tickSound),
      ]);
    };
  }, []);

  async function playFrequency(frequency: FrequencyValue) {
    if (!isReady) {
      return;
    }

    return queueFrequencyOperation(async (token) => {
      const nextPair = await ensureToneLoaded(frequency);
      if (!nextPair) {
        return;
      }

      const currentSession = toneSessionRef.current;
      if (currentSession && currentSession.frequency === frequency) {
        return;
      }

      toneSessionRef.current = null;

      if (currentSession) {
        await stopTonePair(currentSession.pair);
      }

      const session: ToneSession = {
        activePlayerIndex: 0,
        frequency,
        id: token,
        isCrossfading: false,
        pair: nextPair,
      };

      toneSessionRef.current = session;
      clearToneWatchers(nextPair);
      await Promise.all(nextPair.players.map((player) => resetSound(player)));

      const activePlayer = nextPair.players[0];
      await activePlayer.setPositionAsync(0);
      await activePlayer.setVolumeAsync(0);
      await activePlayer.playAsync();

      if (!isToneSessionActive(session.id)) {
        await resetSound(activePlayer);
        return;
      }

      await fadeSound(activePlayer, 0, TONE_VOLUME, FADE_DURATION, () => isToneSessionActive(session.id));

      if (!isToneSessionActive(session.id)) {
        await resetSound(activePlayer);
        return;
      }

      attachToneWatcher(session.id, 0);
    });
  }

  async function playAmbient(ambient: AmbientSoundKey) {
    if (!isReady) {
      return;
    }

    return queueAmbientOperation(async (token) => {
      const nextSound = await ensureAmbientLoaded(ambient);
      if (!nextSound) {
        return;
      }

      const isCurrent = () => token === ambientTokenRef.current;
      if (!isCurrent()) {
        return;
      }

      const previousAmbient = currentAmbientRef.current;
      const previousSound = previousAmbient == null ? null : ambientRef.current.get(previousAmbient) ?? null;

      if (previousSound && previousAmbient !== ambient) {
        const previousStatus = await previousSound.getStatusAsync();

        if (previousStatus.isLoaded && previousStatus.isPlaying) {
          await fadeSound(previousSound, previousStatus.volume, 0, FADE_DURATION / 2, isCurrent);
        }

        await resetSound(previousSound);

        if (!isCurrent()) {
          return;
        }
      }

      if (previousAmbient === ambient) {
        const status = await nextSound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          return;
        }
      }

      await nextSound.setPositionAsync(0);
      await nextSound.setVolumeAsync(0);
      await nextSound.playAsync();

      if (!isCurrent()) {
        await resetSound(nextSound);
        return;
      }

      await fadeSound(nextSound, 0, AMBIENT_VOLUME, FADE_DURATION, isCurrent);

      if (!isCurrent()) {
        await resetSound(nextSound);
        return;
      }

      currentAmbientRef.current = ambient;
    });
  }

  async function stopFrequency() {
    return queueFrequencyOperation(async () => {
      const currentSession = toneSessionRef.current;
      toneSessionRef.current = null;

      if (!currentSession) {
        return;
      }

      await stopTonePair(currentSession.pair);
    });
  }

  async function stopAmbient() {
    return queueAmbientOperation(async () => {
      const activeAmbient = currentAmbientRef.current;

      if (activeAmbient == null) {
        return;
      }

      const activeSound = ambientRef.current.get(activeAmbient);

      if (!activeSound) {
        currentAmbientRef.current = null;
        return;
      }

      const status = await activeSound.getStatusAsync();

      if (status.isLoaded && status.isPlaying) {
        await fadeSound(activeSound, status.volume, 0, FADE_DURATION);
      }

      await resetSound(activeSound);
      currentAmbientRef.current = null;
    });
  }

  async function stop() {
    await Promise.all([stopFrequency(), stopAmbient()]);
  }

  async function playTick() {
    try {
      const tickSound = await ensureTickLoaded();
      if (!tickSound) {
        return;
      }

      await tickSound.replayAsync();
    } catch (error) {
      console.warn('Tick playback failed', error);
    }
  }

  return {
    isReady,
    playAmbient,
    playFrequency,
    playTick,
    stop,
    stopAmbient,
  };
}

