import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '../theme/colors';
import { FREQUENCY_DETAILS, type FrequencyValue } from '../utils/frequencyMap';

type FrequencyInfoProps = {
  audioReady: boolean;
  frequency: FrequencyValue;
  isPlaying: boolean;
  soundscapeText: string | null;
  timerText: string | null;
};

export function FrequencyInfo({
  audioReady,
  frequency,
  isPlaying,
  soundscapeText,
  timerText,
}: FrequencyInfoProps) {
  const { height, width } = useWindowDimensions();
  const compact = width < 380 || height < 720;
  const detail = FREQUENCY_DETAILS[frequency];
  const status = isPlaying ? 'Session active' : audioReady ? 'Tap START to begin' : 'Loading audio';
  const metaParts = [status, timerText, soundscapeText].filter(Boolean);

  return (
    <View style={styles.container}>
      <Text style={[styles.value, compact && styles.valueCompact]}>{frequency} Hz</Text>
      <Text style={[styles.label, compact && styles.labelCompact]}>{detail.label}</Text>
      <Text style={[styles.status, compact && styles.statusCompact]}>{metaParts.join(' | ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  value: {
    color: colors.textWhite,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: colors.highlightCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  valueCompact: {
    fontSize: 40,
  },
  label: {
    color: colors.softText,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  labelCompact: {
    fontSize: 16,
  },
  status: {
    color: colors.softText,
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 360,
    opacity: 0.92,
    textAlign: 'center',
  },
  statusCompact: {
    fontSize: 12,
  },
});
