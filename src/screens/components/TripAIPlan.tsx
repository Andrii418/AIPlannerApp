import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Navigation, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react-native';

interface Checkpoint {
  name: string;
  completed: boolean;
  isHeader?: boolean;
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


  const sections: { header: string; headerIndex: number; items: { item: Checkpoint; originalIndex: number }[] }[] = [];

  checkpoints.forEach((item, i) => {
    if (item.isHeader) {
      sections.push({ header: item.name, headerIndex: i, items: [] });
    } else {
      if (sections.length === 0) {
        sections.push({ header: '', headerIndex: -1, items: [] });
      }
      sections[sections.length - 1].items.push({ item, originalIndex: i });
    }
  });


  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({ 0: true });

  const toggleSection = (sectionIndex: number) => {
    setOpenSections(prev => ({ ...prev, [sectionIndex]: !prev[sectionIndex] }));
  };

  return (
    <View style={[styles.container, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
      <View style={styles.header}>
        <Navigation size={18} color="#5152D6" />
        <Text style={[styles.title, { color: textColor }]}>Plan zwiedzania (AI)</Text>
      </View>

      {sections.map((section, sectionIndex) => {
        const isOpen = !!openSections[sectionIndex];
        const completedCount = section.items.filter(({ item }) => item.completed).length;
        const totalCount = section.items.length;

        return (
          <View key={sectionIndex} style={styles.section}>

            {section.header ? (
              <TouchableOpacity
                style={[styles.accordionHeader, { borderColor: isDarkMode ? '#2D3748' : '#E2E8F0' }]}
                onPress={() => toggleSection(sectionIndex)}
                activeOpacity={0.7}
              >
                <View style={styles.accordionLeft}>
                  <Text style={styles.dayHeaderText}>{section.header}</Text>
                  <Text style={styles.dayCount}>{completedCount}/{totalCount}</Text>
                </View>
                {isOpen
                  ? <ChevronUp size={18} color="#5152D6" />
                  : <ChevronDown size={18} color="#5152D6" />
                }
              </TouchableOpacity>
            ) : null}


            {isOpen && section.items.map(({ item, originalIndex }, itemIndex) => (
              <TouchableOpacity
                key={originalIndex}
                style={styles.row}
                onPress={() => onToggle(originalIndex)}
              >
                <View style={styles.timeline}>
                  {item.completed ? (
                    <CheckCircle2 size={20} color="#10B981" />
                  ) : (
                    <Circle size={20} color="#94A3B8" />
                  )}
                  {itemIndex !== section.items.length - 1 && (
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
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 20, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  title: { fontSize: 16, fontWeight: '800' },

  section: { marginBottom: 4 },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(81, 82, 214, 0.07)',
    marginBottom: 8,
    borderWidth: 1,
  },
  accordionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#5152D6',
    textTransform: 'uppercase',
  },
  dayCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 50, paddingLeft: 6 },
  timeline: { alignItems: 'center', width: 20 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  text: { fontSize: 15, fontWeight: '500', flex: 1, paddingBottom: 15, lineHeight: 20 },
});