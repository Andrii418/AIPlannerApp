import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Navigation, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolateColor,
  FadeInDown,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

interface Checkpoint {
  name: string;
  completed: boolean;
  isHeader?: boolean;
}

interface AnimatedCheckRowProps {
  completed: boolean;
  label: string;
  onPress: () => void;
  textColor: string;
  isDarkMode: boolean;
  isLast?: boolean;
}

export const AnimatedCheckRow = ({
  completed,
  label,
  onPress,
  textColor,
  isDarkMode,
  isLast = false,
}: AnimatedCheckRowProps) => {
  const scale = useSharedValue(1);
  const fill = useSharedValue(completed ? 1 : 0);
  const strike = useSharedValue(completed ? 1 : 0);

  useEffect(() => {
    fill.value = withSpring(completed ? 1 : 0, { damping: 14, stiffness: 200 });
    strike.value = withTiming(completed ? 1 : 0, { duration: 320 });
  }, [completed]);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 400 }),
      withSpring(1.06, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
    onPress();
  };

  const boxAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(fill.value, [0, 1], ['transparent', '#10B981']),
    borderColor: interpolateColor(fill.value, [0, 1], [isDarkMode ? '#475569' : '#CBD5E1', '#10B981']),
  }));

  const checkAnim = useAnimatedStyle(() => ({
    opacity: fill.value,
    transform: [{ scale: 0.4 + fill.value * 0.6 }],
  }));

  const textAnim = useAnimatedStyle(() => ({
    color: interpolateColor(fill.value, [0, 1], [textColor, '#94A3B8']),
  }));

  const strikeAnim = useAnimatedStyle(() => ({
    width: `${strike.value * 100}%`,
    opacity: strike.value * 0.55,
  }));

  const rowBg = isDarkMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress} style={styles.checkRowTouchable}>
      <View style={[styles.checkRow, { backgroundColor: completed ? 'rgba(16,185,129,0.06)' : rowBg }]}>
        <View style={styles.timelineCol}>
          <Animated.View style={[styles.checkBox, boxAnim]}>
            <Animated.View style={checkAnim}>
              <Check size={14} color="#FFFFFF" strokeWidth={3} />
            </Animated.View>
          </Animated.View>
          {!isLast && <View style={[styles.timelineLine, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]} />}
        </View>
        <View style={styles.labelCol}>
          <Animated.Text style={[styles.checkLabel, textAnim]}>{label}</Animated.Text>
          <View style={styles.strikeTrack}>
            <Animated.View style={[styles.strikeLine, strikeAnim]} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
  borderColor,
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

  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>(
    Object.fromEntries(sections.map((_, i) => [i, true])),
  );

  const toggleSection = (sectionIndex: number) => {
    setOpenSections(prev => ({ ...prev, [sectionIndex]: !prev[sectionIndex] }));
  };

  const cardShadow = Platform.select({
    ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14 },
    android: { elevation: 3 },
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(240).springify()}
      style={[styles.container, { backgroundColor: cardColor }, cardShadow]}
    >
      <View style={styles.header}>
        <LinearGradient colors={['#5152D6', '#7B61FF']} style={styles.headerIcon}>
          <Navigation size={16} color="#FFFFFF" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textColor }]}>Plan zwiedzania</Text>
          <Text style={styles.subtitle}>Podzielony na dni · AI</Text>
        </View>
      </View>

      <View style={[styles.headerDivider, { backgroundColor: borderColor }]} />

      {sections.map((section, sectionIndex) => {
        const isOpen = !!openSections[sectionIndex];
        const completedCount = section.items.filter(({ item }) => item.completed).length;
        const totalCount = section.items.length;
        const progress = totalCount > 0 ? completedCount / totalCount : 0;
        const dayNumber = String(sectionIndex + 1).padStart(2, '0');

        return (
          <Animated.View
            key={sectionIndex}
            entering={FadeInDown.delay(280 + sectionIndex * 70).springify()}
            style={styles.section}
          >
            {section.header ? (
              <TouchableOpacity
                style={[styles.dayHeader, { borderColor: isDarkMode ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.12)' }]}
                onPress={() => toggleSection(sectionIndex)}
                activeOpacity={0.8}
              >
                <View style={styles.dayHeaderLeft}>
                  <LinearGradient colors={['#7B61FF', '#5152D6']} style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>{dayNumber}</Text>
                  </LinearGradient>
                  <View style={styles.dayHeaderText}>
                    <Text style={[styles.dayTitle, { color: textColor }]}>{section.header}</Text>
                    <Text style={styles.dayMeta}>
                      {completedCount} z {totalCount} punktów
                    </Text>
                  </View>
                </View>
                <View style={styles.dayHeaderRight}>
                  <View style={[styles.miniProgressTrack, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                    <View style={[styles.miniProgressFill, { width: `${progress * 100}%` }]} />
                  </View>
                  {isOpen ? (
                    <ChevronUp size={18} color="#7B61FF" />
                  ) : (
                    <ChevronDown size={18} color="#7B61FF" />
                  )}
                </View>
              </TouchableOpacity>
            ) : null}

            {isOpen &&
              section.items.map(({ item, originalIndex }, itemIndex) => (
                <AnimatedCheckRow
                  key={originalIndex}
                  completed={item.completed}
                  label={item.name}
                  onPress={() => onToggle(originalIndex)}
                  textColor={textColor}
                  isDarkMode={isDarkMode}
                  isLast={itemIndex === section.items.length - 1}
                />
              ))}

            {sectionIndex < sections.length - 1 && (
              <View style={[styles.sectionDivider, { backgroundColor: borderColor }]} />
            )}
          </Animated.View>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 24,
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headerIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  headerDivider: { height: 1, marginBottom: 16 },

  section: { marginBottom: 4 },
  sectionDivider: { height: 1, marginVertical: 14 },

  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(123,97,255,0.04)',
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
  },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  dayHeaderText: { flex: 1 },
  dayTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dayMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  dayHeaderRight: { alignItems: 'flex-end', gap: 6 },
  miniProgressTrack: { width: 48, height: 4, borderRadius: 2, overflow: 'hidden' },
  miniProgressFill: { height: 4, borderRadius: 2, backgroundColor: '#10B981' },

  checkRowTouchable: { marginBottom: 6 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 12,
  },
  timelineCol: { alignItems: 'center', width: 28 },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: { width: 2, flex: 1, minHeight: 12, marginTop: 4, borderRadius: 1 },
  labelCol: { flex: 1, justifyContent: 'center', minHeight: 24 },
  checkLabel: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  strikeTrack: { height: 2, marginTop: 4, backgroundColor: 'transparent' },
  strikeLine: { height: 1.5, backgroundColor: '#94A3B8', borderRadius: 1 },
});
