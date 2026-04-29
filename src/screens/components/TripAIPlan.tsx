import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Navigation, CheckCircle2, Circle } from 'lucide-react-native';

interface Checkpoint {
  name: string;
  completed: boolean;
}

interface TripAIPlanProps {
  checkpoints: Checkpoint[];
  onToggle: (index: number) => void;
  isDarkMode: boolean;
  textColor: string;
  cardColor: string;
  borderColor: string;
}

export const TripAIPlan = ({
  checkpoints,
  onToggle,
  isDarkMode,
  textColor,
  cardColor,
  borderColor
}: TripAIPlanProps) => {
  if (!checkpoints || checkpoints.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
      <View style={styles.header}>
        <Navigation size={18} color="#5152D6" />
        <Text style={[styles.title, { color: textColor }]}>Plan zwiedzania (AI)</Text>
      </View>

      {checkpoints.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={styles.row}
          onPress={() => onToggle(i)}
        >
          <View style={styles.timeline}>
            {item.completed ? (
              <CheckCircle2 size={20} color="#10B981" />
            ) : (
              <Circle size={20} color="#94A3B8" />
            )}
            {i !== checkpoints.length - 1 && (
              <View style={[styles.line, { backgroundColor: isDarkMode ? '#2D3748' : '#E2E8F0' }]} />
            )}
          </View>

          <Text style={[
            styles.text,
            {
              color: item.completed ? '#94A3B8' : textColor,
              textDecorationLine: item.completed ? 'line-through' : 'none'
            }
          ]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 20, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  title: { fontSize: 16, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 50 },
  timeline: { alignItems: 'center', width: 20 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  text: { fontSize: 15, fontWeight: '500', flex: 1, paddingBottom: 15, lineHeight: 20 },
});