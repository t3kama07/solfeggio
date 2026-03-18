import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TIMER_PRESETS } from '../utils/frequencyMap';

type ControlPanelProps = {
  accentColor: string;
  isPlaying: boolean;
  isReady: boolean;
  remainingText: string | null;
  selectedTimerMs: number | null;
  onSelectTimer: (timerMs: number | null) => void;
  onTogglePlay: () => void;
};

export function ControlPanel({
  accentColor,
  isPlaying,
  isReady,
  remainingText,
  selectedTimerMs,
  onSelectTimer,
  onTogglePlay,
}: ControlPanelProps) {
  const buttonColor = accentColor === '#F5F5F2' ? '#E2DED5' : accentColor;
  const buttonTextColor = accentColor === '#F5F5F2' ? '#23282E' : '#FFFDF7';

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        disabled={!isReady}
        onPress={onTogglePlay}
        style={[
          styles.playButton,
          {
            backgroundColor: buttonColor,
            opacity: isReady ? 1 : 0.48,
          },
        ]}
      >
        <Text style={[styles.playButtonText, { color: buttonTextColor }]}>
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </Text>
      </Pressable>

      <View style={styles.timerRow}>
        {TIMER_PRESETS.map((preset) => {
          const selected = selectedTimerMs === preset.ms;

          return (
            <Pressable
              accessibilityRole="button"
              key={preset.ms}
              onPress={() => onSelectTimer(selected ? null : preset.ms)}
              style={[
                styles.timerButton,
                selected && {
                  borderColor: buttonColor,
                  backgroundColor: `${buttonColor}18`,
                },
              ]}
            >
              <Text
                style={[
                  styles.timerButtonText,
                  selected && { color: '#1E252B', fontWeight: '700' },
                ]}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.timerText}>{remainingText ?? 'No timer selected'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 18,
    width: '100%',
  },
  playButton: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 164,
    paddingHorizontal: 28,
    paddingVertical: 18,
  },
  playButtonText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  timerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    maxWidth: 320,
  },
  timerButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFFB8',
    borderColor: '#D9DBDD',
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  timerButtonText: {
    color: '#586069',
    fontSize: 13,
    fontWeight: '600',
  },
  timerText: {
    color: '#6A6E73',
    fontSize: 14,
    fontWeight: '500',
  },
});
