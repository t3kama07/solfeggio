import { colors } from '../theme/colors';

export const FREQUENCIES = [174, 285, 396, 417, 528, 639, 741, 852, 963] as const;

export type FrequencyValue = (typeof FREQUENCIES)[number];
export type AmbientSoundKey = 'rain' | 'fire' | 'singbowl' | 'om' | 'bird' | 'river';

export type TimerPreset = {
  label: string;
  ms: number;
};

export const TIMER_PRESETS: TimerPreset[] = [
  { label: '10 min', ms: 10 * 60 * 1000 },
  { label: '20 min', ms: 20 * 60 * 1000 },
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '1 hour', ms: 60 * 60 * 1000 },
];

export const DEFAULT_FREQUENCY: FrequencyValue = 741;
export const DIAL_STEP_ANGLE = 40;
export const MAX_DIAL_ROTATION = DIAL_STEP_ANGLE * (FREQUENCIES.length - 1);

export const FREQUENCY_DETAILS: Record<
  FrequencyValue,
  {
    color: string;
    label: string;
    tone: number;
  }
> = {
  174: {
    color: colors.highlightCyan,
    label: 'Grounding',
    tone: require('../assets/sounds/174hz.wav'),
  },
  285: {
    color: colors.accentPink,
    label: 'Healing Renewal',
    tone: require('../assets/sounds/285hz.wav'),
  },
  396: {
    color: colors.primaryGlow,
    label: 'Liberation',
    tone: require('../assets/sounds/396hz.wav'),
  },
  417: {
    color: colors.accentPink,
    label: 'Clearing Negativity',
    tone: require('../assets/sounds/417hz.wav'),
  },
  528: {
    color: colors.highlightCyan,
    label: 'Transformation',
    tone: require('../assets/sounds/528hz.wav'),
  },
  639: {
    color: colors.accentPink,
    label: 'Heart Connection',
    tone: require('../assets/sounds/639hz.wav'),
  },
  741: {
    color: colors.primaryGlow,
    label: 'Awaken Expression',
    tone: require('../assets/sounds/741hz.wav'),
  },
  852: {
    color: colors.highlightCyan,
    label: 'Inner Intuition',
    tone: require('../assets/sounds/852hz.wav'),
  },
  963: {
    color: colors.textWhite,
    label: 'Crown Alignment',
    tone: require('../assets/sounds/963hz.wav'),
  },
};

export const TICK_SOUND = require('../assets/tick.wav');

export const AMBIENT_SOUNDS: Record<
  AmbientSoundKey,
  {
    label: string;
    source: number;
  }
> = {
  rain: {
    label: 'Rain',
    source: require('../assets/rain.mp3'),
  },
  fire: {
    label: 'Fire',
    source: require('../assets/fire.mp3'),
  },
  singbowl: {
    label: 'Singing Bowl',
    source: require('../assets/singbowl.mp3'),
  },
  om: {
    label: 'Om',
    source: require('../assets/om.mp3'),
  },
  bird: {
    label: 'Bird',
    source: require('../assets/bird.mp3'),
  },
  river: {
    label: 'River',
    source: require('../assets/river.mp3'),
  },
};

export function getFrequencyIndex(frequency: FrequencyValue): number {
  return FREQUENCIES.indexOf(frequency);
}

export function getFrequencyFromIndex(index: number): FrequencyValue {
  return FREQUENCIES[Math.max(0, Math.min(FREQUENCIES.length - 1, index))];
}

export function formatDuration(ms: number | null): string | null {
  if (ms == null) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}



