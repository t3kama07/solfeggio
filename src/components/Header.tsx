import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '../theme/colors';

export function Header() {
  const { width } = useWindowDimensions();
  const compact = width < 380;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, compact && styles.titleCompact]}>SOLFEGGIO DIAL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.highlightCyan,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 16,
    letterSpacing: 1.6,
  },
});
