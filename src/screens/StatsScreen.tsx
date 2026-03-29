import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform
} from 'react-native';
import { Colors } from '../theme';
import {
  BarChart3,
  Target,
  Zap,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Plane,
  Sun,
  Moon
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const StatsScreen = ({ isDarkMode, toggleDarkMode }: any) => {

  // ZMIANA: bgColor ustawiamy na transparent, aby nie zasłaniał gradientu z App.tsx
  const bgColor = 'transparent';
  const textColor = isDarkMode ? Colors.darkText : '#1E293B';
  // Karty w trybie jasnym dostają lekką przezroczystość (Glassmorphism), by lepiej wyglądały na gradiencie
  const cardColor = isDarkMode ? Colors.darkCard : 'rgba(255, 255, 255, 0.8)';
  const borderColor = isDarkMode ? Colors.darkBorder : 'rgba(255, 255, 255, 0.5)';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';

  const stats = {
    studyProgress: 65,
    tasksDone: 12,
    tasksTotal: 20,
    tripsPlanned: 3,
    streak: 5,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }} // Wymuszenie przezroczystości ScrollView
      >

        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={[styles.title, { color: textColor }]}>Twoje Statystyki 📊</Text>
            <TouchableOpacity onPress={toggleDarkMode} style={styles.themeToggle}>
              {isDarkMode ? (
                <Sun size={24} color="#FFD700" />
              ) : (
                <Moon size={24} color="#64748B" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            Analiza Twojej produktywności
          </Text>
        </View>

        <View style={[styles.mainChartCard, { backgroundColor: Colors.primary }]}>
            <View>
                <Text style={styles.mainChartLabel}>Ogólny Postęp</Text>
                <Text style={styles.mainChartValue}>{stats.studyProgress}%</Text>
            </View>
            <Zap color="white" size={40} opacity={0.8} />
            <View style={styles.chartDecor} />
        </View>

        <View style={styles.bentoGrid}>
            <View style={[styles.statBox, { backgroundColor: cardColor, borderColor: borderColor }]}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                    <CheckCircle2 color={Colors.secondary} size={20} />
                </View>
                <Text style={[styles.statNum, { color: textColor }]}>{stats.tasksDone}/{stats.tasksTotal}</Text>
                <Text style={styles.statLabel}>Zadania</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: cardColor, borderColor: borderColor }]}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
                    <Plane color={Colors.tertiary} size={20} />
                </View>
                <Text style={[styles.statNum, { color: textColor }]}>{stats.tripsPlanned}</Text>
                <Text style={styles.statLabel}>Podróże</Text>
            </View>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>Postępy w nauce</Text>
        <View style={[styles.wideCard, { backgroundColor: cardColor, borderColor: borderColor }]}>
            <View style={styles.courseRow}>
                <BookOpen color={Colors.primary} size={20} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.courseName, { color: textColor }]}>Matematyka Dyskretna</Text>
                    <View style={[styles.progressBg, { backgroundColor: isDarkMode ? '#2A2A3C' : '#F1F5F9' }]}>
                        <View style={[styles.progressFill, { width: '65%', backgroundColor: Colors.primary }]} />
                    </View>
                </View>
                <Text style={[styles.percentText, { color: Colors.primary }]}>65%</Text>
            </View>

            <View style={[styles.courseRow, { marginTop: 20 }]}>
                <TrendingUp color={Colors.tertiary} size={20} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.courseName, { color: textColor }]}>Język Angielski</Text>
                    <View style={[styles.progressBg, { backgroundColor: isDarkMode ? '#2A2A3C' : '#F1F5F9' }]}>
                        <View style={[styles.progressFill, { width: '40%', backgroundColor: Colors.tertiary }]} />
                    </View>
                </View>
                <Text style={[styles.percentText, { color: Colors.tertiary }]}>40%</Text>
            </View>
        </View>

        <View style={[styles.streakCard, { backgroundColor: isDarkMode ? '#2D2D44' : 'rgba(255, 140, 0, 0.1)' }]}>
            <Target color="#FF8C00" size={24} />
            <Text style={[styles.streakText, { color: isDarkMode ? '#FFB366' : '#CC7000' }]}>
                Utrzymujesz streak przez <Text style={{ fontWeight: '900' }}>{stats.streak} dni!</Text> 🔥
            </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    marginBottom: 25
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  themeToggle: {
    padding: 8,
    borderRadius: 12
  },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 16, marginTop: 5 },

  mainChartCard: {
    height: 140,
    borderRadius: 30,
    padding: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 5,
  },
  mainChartLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  mainChartValue: { color: 'white', fontSize: 42, fontWeight: '900' },
  chartDecor: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  bentoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statBox: {
    width: (width - 55) / 2,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#64748B', fontSize: 12, fontWeight: '600', marginTop: 2 },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  wideCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1
  },
  courseRow: { flexDirection: 'row', alignItems: 'center' },
  courseName: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  percentText: { fontSize: 14, fontWeight: '800', marginLeft: 15 },

  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    gap: 12,
  },
  streakText: { fontSize: 14, fontWeight: '600' }
});

export default StatsScreen;