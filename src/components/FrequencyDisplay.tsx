import { StyleSheet, Text, View } from 'react-native';
import { FREQUENCY_DETAILS, type FrequencyValue } from '../utils/frequencyMap';

type FrequencyDisplayProps = {
  audioReady: boolean;
  frequency: FrequencyValue;
  isPlaying: boolean;
  timerText: string | null;
};

export function FrequencyDisplay({
  audioReady,
  frequency,
  isPlaying,
  timerText,
}: FrequencyDisplayProps) {
  const detail = FREQUENCY_DETAILS[frequency];
  const status = isPlaying ? 'Resonating' : audioReady ? 'Ready' : 'Loading audio';

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Solfeggio Frequency</Text>
      <Text style={[styles.value, { color: detail.color }]}>{frequency} Hz</Text>
      <Text style={styles.label}>{detail.label}</Text>
      <Text style={styles.status}>
        {timerText ? `${status} • ${timerText}` : status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    color: '#6A6E73',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.4,
  },
  label: {
    color: '#1E252B',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  status: {
    color: '#6A6E73',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
