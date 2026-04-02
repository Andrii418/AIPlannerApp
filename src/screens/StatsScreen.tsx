import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
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
  Moon,
  Clock,
  Calendar,
  Award,
  Activity,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// =========================
// Mini Bar Chart Component
// =========================
const MiniBarChart = ({ data, color, maxVal }: { data: number[]; color: string; maxVal: number }) => {
  const max = maxVal || Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 60 }}>
      {data.map((val, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: '100%',
              height: Math.max(4, (val / max) * 52),
              backgroundColor: color,
              borderRadius: 6,
              opacity: i === data.length - 1 ? 1 : 0.45 + (i / data.length) * 0.5,
            }}
          />
        </View>
      ))}
    </View>
  );
};

// =========================
// Circular Progress Component
// =========================
const CircleProgress = ({ percent, color, size = 80 }: { percent: number; color: string; size?: number }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * (percent / 100);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Background circle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 8,
          borderColor: color + '22',
        }}
      />
      {/* Foreground arc approximation using multiple segments */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 8,
          borderColor: 'transparent',
          borderTopColor: percent > 0 ? color : 'transparent',
          borderRightColor: percent > 25 ? color : 'transparent',
          borderBottomColor: percent > 50 ? color : 'transparent',
          borderLeftColor: percent > 75 ? color : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }}
      />
      <Text style={{ fontSize: 16, fontWeight: '900', color }}>{percent}%</Text>
    </View>
  );
};

const StatsScreen = ({ isDarkMode, toggleDarkMode }: any) => {
  const bgColor = 'transparent';
  const textColor = isDarkMode ? Colors.darkText : '#1E293B';
  const cardColor = isDarkMode ? Colors.darkCard : 'rgba(255, 255, 255, 0.8)';
  const borderColor = isDarkMode ? Colors.darkBorder : 'rgba(255, 255, 255, 0.5)';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';

  // =========================
  // STAN DANYCH
  // =========================
  const [loading, setLoading] = useState(true);

  // Tasks
  const [tasksDone, setTasksDone] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [tasksByPriority, setTasksByPriority] = useState({ high: 0, medium: 0, low: 0 });

  // Study Plans
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [avgStudyProgress, setAvgStudyProgress] = useState(0);
  const [totalStudyHours, setTotalStudyHours] = useState(0);

  // Trips
  const [tripsTotal, setTripsTotal] = useState(0);
  const [tripsUpcoming, setTripsUpcoming] = useState(0);
  const [nextTrip, setNextTrip] = useState<any>(null);

  // =========================
  // POBIERANIE Z FIRESTORE
  // =========================
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubAuth = auth().onAuthStateChanged(user => {
      unsubs.forEach(u => u());
      unsubs = [];

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      let loadedCount = 0;
      const checkDone = () => {
        loadedCount++;
        if (loadedCount >= 3) setLoading(false);
      };

      // ---- TASKS ----
      const unsubTasks = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('tasks')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => d.data());
          setTasksTotal(docs.length);
          setTasksDone(docs.filter(t => t.completed).length);
          setTasksByPriority({
            high: docs.filter(t => t.priority === 'Wysoki' || t.priority === 'high').length,
            medium: docs.filter(t => t.priority === 'Średni' || t.priority === 'medium').length,
            low: docs.filter(t => t.priority === 'Niski' || t.priority === 'low').length,
          });
          checkDone();
        }, () => checkDone());

      // ---- STUDY PLANS ----
      const unsubStudy = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('studyPlans')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => d.data());
          setStudyPlans(docs);
          const avg = docs.length > 0
            ? Math.round(docs.reduce((acc, d) => acc + (d.progress || 0), 0) / docs.length)
            : 0;
          setAvgStudyProgress(avg);
          const hours = docs.reduce((acc, d) => acc + (Number(d.hours) || 0), 0);
          setTotalStudyHours(Math.round(hours * 10) / 10);
          checkDone();
        }, () => checkDone());

      // ---- TRIPS ----
      const unsubTrips = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('trips')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setTripsTotal(docs.length);

          const now = new Date();
          now.setHours(0, 0, 0, 0);

          const upcoming = docs.filter(t => {
            const d = parseDate(t.startDate || t.date || '');
            return d && d >= now;
          });

          setTripsUpcoming(upcoming.length);

          // Najbliższa podróż
          const sorted = upcoming.sort((a, b) => {
            const da = parseDate(a.startDate || a.date || '');
            const db = parseDate(b.startDate || b.date || '');
            return (da?.getTime() || 0) - (db?.getTime() || 0);
          });
          setNextTrip(sorted[0] || null);
          checkDone();
        }, () => checkDone());

      unsubs = [unsubTasks, unsubStudy, unsubTrips];
    });

    return () => {
      unsubs.forEach(u => u());
      unsubAuth();
    };
  }, []);

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    let d: Date;
    if (dateStr.includes('.')) {
      const p = dateStr.split('.');
      d = new Date(`${p[2]}-${p[1]}-${p[0]}`);
    } else if (dateStr.includes('-')) {
      const p = dateStr.split('-');
      d = p[0].length === 4 ? new Date(dateStr) : new Date(`${p[2]}-${p[1]}-${p[0]}`);
    } else {
      return null;
    }
    return isNaN(d.getTime()) ? null : d;
  };

  const calcDaysLeft = (dateStr: string): number => {
    const d = parseDate(dateStr);
    if (!d) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const tasksPercent = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  const overallScore = Math.round((avgStudyProgress + tasksPercent) / 2);

  // Dane do wykresu słupkowego — postępy planów nauki
  const studyChartData = studyPlans.slice(0, 6).map(p => p.progress || 0);
  const priorityData = [tasksByPriority.high, tasksByPriority.medium, tasksByPriority.low];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={[styles.title, { color: textColor }]}>Statystyki 📊</Text>
            <TouchableOpacity onPress={toggleDarkMode} style={styles.themeToggle}>
              {isDarkMode ? <Sun size={24} color="#FFD700" /> : <Moon size={24} color="#64748B" />}
            </TouchableOpacity>
          </View>
          <Text style={[styles.subtitle, { color: subTextColor }]}>Analiza Twojej produktywności</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <Activity size={32} color={Colors.primary} />
            <Text style={[styles.loadingText, { color: subTextColor }]}>Ładowanie danych...</Text>
          </View>
        ) : (
          <>
            {/* GŁÓWNA KARTA — OVERALL SCORE */}
            <View style={[styles.mainCard, { backgroundColor: Colors.primary }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mainCardLabel}>Ogólny wynik</Text>
                <Text style={styles.mainCardValue}>{overallScore}%</Text>
                <Text style={styles.mainCardSub}>
                  {overallScore >= 80 ? '🔥 Świetna robota!' : overallScore >= 50 ? '💪 Dobry postęp!' : '🚀 Do dzieła!'}
                </Text>
              </View>
              <View>
                <CircleProgress percent={overallScore} color="white" size={90} />
              </View>
              <View style={styles.cardDecorCircle} />
              <View style={styles.cardDecorCircle2} />
            </View>

            {/* BENTO GRID — 4 kafelki */}
            <View style={styles.bentoGrid}>
              {/* Zadania */}
              <View style={[styles.bentoBox, { backgroundColor: cardColor, borderColor }]}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,107,107,0.12)' }]}>
                  <CheckCircle2 color="#FF6B6B" size={20} />
                </View>
                <Text style={[styles.bentoNum, { color: textColor }]}>{tasksDone}/{tasksTotal}</Text>
                <Text style={[styles.bentoLabel, { color: subTextColor }]}>Zadania</Text>
                <View style={styles.smallProgressBg}>
                  <View style={[styles.smallProgressFill, { width: `${tasksPercent}%`, backgroundColor: '#FF6B6B' }]} />
                </View>
              </View>

              {/* Podróże */}
              <View style={[styles.bentoBox, { backgroundColor: cardColor, borderColor }]}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(46,204,113,0.12)' }]}>
                  <Plane color="#2ECC71" size={20} />
                </View>
                <Text style={[styles.bentoNum, { color: textColor }]}>{tripsUpcoming}/{tripsTotal}</Text>
                <Text style={[styles.bentoLabel, { color: subTextColor }]}>Podróże</Text>
                <Text style={[styles.bentoSub, { color: '#2ECC71' }]}>nadchodzące</Text>
              </View>

              {/* Godziny nauki */}
              <View style={[styles.bentoBox, { backgroundColor: cardColor, borderColor }]}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(123,97,255,0.12)' }]}>
                  <Clock color="#7B61FF" size={20} />
                </View>
                <Text style={[styles.bentoNum, { color: textColor }]}>{totalStudyHours}h</Text>
                <Text style={[styles.bentoLabel, { color: subTextColor }]}>Nauka</Text>
                <Text style={[styles.bentoSub, { color: '#7B61FF' }]}>łącznie</Text>
              </View>

              {/* Plany nauki */}
              <View style={[styles.bentoBox, { backgroundColor: cardColor, borderColor }]}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,215,0,0.12)' }]}>
                  <BookOpen color="#FFD700" size={20} />
                </View>
                <Text style={[styles.bentoNum, { color: textColor }]}>{studyPlans.length}</Text>
                <Text style={[styles.bentoLabel, { color: subTextColor }]}>Plany</Text>
                <Text style={[styles.bentoSub, { color: '#FFD700' }]}>{avgStudyProgress}% śr.</Text>
              </View>
            </View>

            {/* WYKRES — Postępy planów nauki */}
            {studyPlans.length > 0 && (
              <View style={[styles.chartCard, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
                <View style={styles.chartHeader}>
                  <BookOpen size={18} color={Colors.primary} />
                  <Text style={[styles.chartTitle, { color: textColor }]}>Postępy planów nauki</Text>
                </View>
                <MiniBarChart data={studyChartData} color={Colors.primary} maxVal={100} />
                <View style={styles.chartLegend}>
                  {studyPlans.slice(0, 6).map((p, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: Colors.primary, opacity: 0.45 + (i / studyPlans.length) * 0.55 }]} />
                      <Text style={[styles.legendText, { color: subTextColor }]} numberOfLines={1}>
                        {p.name?.length > 10 ? p.name.slice(0, 10) + '…' : p.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* WYKRES — Priorytety zadań */}
            {tasksTotal > 0 && (
              <View style={[styles.chartCard, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
                <View style={styles.chartHeader}>
                  <Target size={18} color="#FF6B6B" />
                  <Text style={[styles.chartTitle, { color: textColor }]}>Zadania wg priorytetu</Text>
                </View>
                <MiniBarChart data={priorityData} color="#FF6B6B" maxVal={Math.max(...priorityData, 1)} />
                <View style={[styles.chartLegend, { justifyContent: 'space-around' }]}>
                  {[
                    { label: 'Wysoki', count: tasksByPriority.high, color: '#FF6B6B' },
                    { label: 'Średni', count: tasksByPriority.medium, color: '#FFD700' },
                    { label: 'Niski', count: tasksByPriority.low, color: '#2ECC71' },
                  ].map((item, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={[styles.legendText, { color: subTextColor }]}>{item.label} ({item.count})</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* LISTA PLANÓW NAUKI */}
            {studyPlans.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Plany nauki</Text>
                <View style={[styles.wideCard, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
                  {studyPlans.map((plan, i) => (
                    <View key={i} style={[styles.planRow, i > 0 && { borderTopWidth: 1, borderTopColor: borderColor, paddingTop: 14, marginTop: 14 }]}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={[styles.planName, { color: textColor }]} numberOfLines={1}>{plan.name}</Text>
                          <Text style={[styles.planPercent, { color: plan.progress >= 100 ? '#2ECC71' : Colors.primary }]}>
                            {plan.progress || 0}%
                          </Text>
                        </View>
                        <View style={[styles.progressBg, { backgroundColor: isDarkMode ? '#2A2A3C' : '#F1F5F9' }]}>
                          <View style={[styles.progressFill, {
                            width: `${plan.progress || 0}%`,
                            backgroundColor: plan.progress >= 100 ? '#2ECC71' : Colors.primary
                          }]} />
                        </View>
                        <Text style={[styles.planMeta, { color: subTextColor }]}>
                          {plan.topicsCompleted || 0}/{plan.totalTopics || 0} tematów · {Number(plan.hours || 0).toFixed(1)}h · Egzamin: {plan.date}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* NAJBLIŻSZA PODRÓŻ */}
            {nextTrip && (
              <>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Najbliższa podróż</Text>
                <View style={[styles.tripBanner, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
                  <View style={[styles.tripIconBox, { backgroundColor: '#2ECC7122' }]}>
                    <Plane size={26} color="#2ECC71" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tripDest, { color: textColor }]}>{nextTrip.destination}</Text>
                    <Text style={[styles.tripDate, { color: subTextColor }]}>
                      {nextTrip.startDate || nextTrip.date}
                    </Text>
                  </View>
                  <View style={[styles.daysLeftBadge, { backgroundColor: '#2ECC7122' }]}>
                    <Text style={styles.daysLeftNum}>
                      {calcDaysLeft(nextTrip.startDate || nextTrip.date || '')}
                    </Text>
                    <Text style={styles.daysLeftLabel}>dni</Text>
                  </View>
                </View>
              </>
            )}

            {/* STREAK / MOTYWACJA */}
            <View style={[styles.streakCard, { backgroundColor: isDarkMode ? '#2D2D44' : 'rgba(255,140,0,0.08)', borderColor: '#FF8C0033', borderWidth: 1 }]}>
              <Award color="#FF8C00" size={26} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.streakTitle, { color: isDarkMode ? '#FFB366' : '#CC7000' }]}>
                  {tasksPercent >= 80 ? '🔥 Jesteś w świetnej formie!' : tasksPercent >= 50 ? '💪 Dobry postęp, tak trzymaj!' : '🚀 Czas wziąć się do roboty!'}
                </Text>
                <Text style={[styles.streakSub, { color: subTextColor }]}>
                  Ukończono {tasksDone} z {tasksTotal} zadań · {avgStudyProgress}% postępu w nauce
                </Text>
              </View>
            </View>

            {/* PUSTY STAN */}
            {tasksTotal === 0 && studyPlans.length === 0 && tripsTotal === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={[styles.emptyText, { color: subTextColor }]}>
                  Brak danych do wyświetlenia.{'\n'}Dodaj zadania, plany nauki lub podróże!
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { paddingTop: Platform.OS === 'android' ? 40 : 20, marginBottom: 25 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeToggle: { padding: 8, borderRadius: 12 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: 5, fontWeight: '500' },

  loadingBox: { alignItems: 'center', marginTop: 80, gap: 16 },
  loadingText: { fontSize: 16, fontWeight: '600' },

  // Główna karta
  mainCard: {
    borderRadius: 30, padding: 24, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    overflow: 'hidden', marginBottom: 20, elevation: 6,
    shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 12,
  },
  mainCardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  mainCardValue: { color: 'white', fontSize: 48, fontWeight: '900', lineHeight: 52 },
  mainCardSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700', marginTop: 6 },
  cardDecorCircle: { position: 'absolute', right: -30, bottom: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
  cardDecorCircle2: { position: 'absolute', right: 60, top: -40, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)' },

  // Bento grid
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  bentoBox: {
    width: (width - 52) / 2,
    borderRadius: 22, padding: 18, borderWidth: 1,
  },
  iconCircle: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  bentoNum: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  bentoLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  bentoSub: { fontSize: 11, fontWeight: '700' },
  smallProgressBg: { height: 4, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 2, marginTop: 4 },
  smallProgressFill: { height: 4, borderRadius: 2 },

  // Wykres
  chartCard: { borderRadius: 24, padding: 18, marginBottom: 16 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: '800' },
  chartLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '600' },

  // Plany nauki
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  wideCard: { borderRadius: 24, padding: 18, marginBottom: 20 },
  planRow: {},
  planName: { fontSize: 15, fontWeight: '700', flex: 1 },
  planPercent: { fontSize: 14, fontWeight: '800', marginLeft: 8 },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 6, borderRadius: 3 },
  planMeta: { fontSize: 12, fontWeight: '500' },

  // Trip banner
  tripBanner: { borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  tripIconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  tripDest: { fontSize: 17, fontWeight: '800' },
  tripDate: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  daysLeftBadge: { alignItems: 'center', padding: 10, borderRadius: 14, minWidth: 54 },
  daysLeftNum: { fontSize: 22, fontWeight: '900', color: '#2ECC71' },
  daysLeftLabel: { fontSize: 11, fontWeight: '700', color: '#2ECC71' },

  // Streak
  streakCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, gap: 14, marginBottom: 16 },
  streakTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  streakSub: { fontSize: 12, fontWeight: '500' },

  // Empty
  emptyBox: { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 24, fontWeight: '500' },
});

export default StatsScreen;