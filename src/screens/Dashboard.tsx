import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Colors } from '../theme';
import {
  Book,
  Plus,
  Plane,
  ChevronRight,
  Moon,
  Sun,
  LayoutGrid,
  Bell,
  X,
  LogOut,
  Settings as SettingsIcon,
  Smile,
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const getFormattedDate = () => {
  const date = new Date();
  return date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return 'Dobranoc 🌙';
  if (h < 12) return 'Dzień dobry! ☀️';
  if (h < 18) return 'Dobry wieczór! 🌤️';
  return 'Dobry wieczór! 🌆';
};

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

const Dashboard = ({ isDarkMode, toggleDarkMode }: any) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const today = getFormattedDate();
  const navigation = useNavigation<any>();

  const textColor = isDarkMode ? Colors.darkText : '#1E293B';
  const cardColor = isDarkMode ? Colors.darkCard : Colors.white;
  const borderColor = isDarkMode ? Colors.darkBorder : '#E2E8F0';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';

  // =========================
  // STAN DANYCH
  // =========================
  const [tasksDone, setTasksDone] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);

  const [studyPlans, setStudyPlans] = useState<any[]>([]);

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

      if (!user) return;

      // ---- TASKS ----
      const unsubTasks = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('tasks')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setTasksTotal(docs.length);
          setTasksDone(docs.filter((t: any) => t.completed).length);

          // Zadania niezakończone — pokaż pierwsze 3
          const pending = docs
            .filter((t: any) => !t.completed)
            .slice(0, 3);
          setTodayTasks(pending);
        }, err => console.error('tasks error', err));

      // ---- STUDY PLANS ----
      const unsubStudy = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('studyPlans')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Sortuj: niedokończone pierwsze
          const sorted = docs.sort((a: any, b: any) => (a.progress || 0) - (b.progress || 0));
          setStudyPlans(sorted);
        }, err => console.error('studyPlans error', err));

      // ---- TRIPS ----
      const unsubTrips = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('trips')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const now = new Date();
          now.setHours(0, 0, 0, 0);

          const upcoming = docs.filter((t: any) => {
            const d = parseDate(t.startDate || t.date || '');
            return d && d >= now;
          });

          setTripsUpcoming(upcoming.length);

          const sorted = upcoming.sort((a: any, b: any) => {
            const da = parseDate(a.startDate || a.date || '');
            const db = parseDate(b.startDate || b.date || '');
            return (da?.getTime() || 0) - (db?.getTime() || 0);
          });
          setNextTrip(sorted[0] || null);
        }, err => console.error('trips error', err));

      unsubs = [unsubTasks, unsubStudy, unsubTrips];
    });

    return () => {
      unsubs.forEach(u => u());
      unsubAuth();
    };
  }, []);

  const handleLogout = async () => {
    try {
      setShowSettings(false);
      await auth().signOut();
    } catch (error) {
      console.error('Błąd podczas wylogowywania:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'Wysoki' || priority === 'high') return '#FF6B6B';
    if (priority === 'Średni' || priority === 'medium') return '#FFD700';
    return '#2ECC71';
  };

  const tasksPercent = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  const avgStudyProgress = studyPlans.length > 0
    ? Math.round(studyPlans.reduce((acc, p) => acc + (p.progress || 0), 0) / studyPlans.length)
    : 0;

  // Najbliższy plan nauki (najmniej ukończony i ma datę)
  const nextExam = studyPlans.find(p => p.progress < 100) || studyPlans[0] || null;

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* HEADER */}
          <View style={styles.newHeader}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSettings(true)}
              style={styles.headerTextSection}
            >
              <Text style={[styles.mainDateText, { color: textColor }]}>{today}</Text>
              <Text style={styles.subDateText}>Twój plan na dziś</Text>
            </TouchableOpacity>

            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: cardColor, borderColor }]}
                onPress={() => setShowNotifications(true)}
              >
                <Bell size={20} color={textColor} />
                {(tasksTotal - tasksDone > 0 || tripsUpcoming > 0) && (
                  <View style={styles.dotBadge} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleDarkMode}
                style={[styles.headerBtn, { backgroundColor: cardColor, borderColor }]}
              >
                {isDarkMode ? <Sun size={20} color="#FFD700" /> : <Moon size={20} color="#64748B" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* BANNER POWITANIA */}
          <View style={[styles.moodBanner, { backgroundColor: '#7B61FF' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.moodTitle}>{getGreeting()}</Text>
              <Text style={styles.moodSub}>
                {tasksTotal - tasksDone > 0
                  ? `Masz ${tasksTotal - tasksDone} zadań do zrobienia`
                  : 'Wszystkie zadania ukończone! 🎉'}
              </Text>
            </View>
            <View style={styles.glassIconLarge}>
              <Smile color="white" size={32} />
            </View>
          </View>

          {/* BENTO GRID */}
          <View style={styles.bentoGrid}>
            <TouchableOpacity
              style={[styles.bigCard, { backgroundColor: '#7B61FF' }]}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Nauka')}
            >
              <View style={styles.glassIconContainer}>
                <Book color="white" size={26} />
              </View>
              <View>
                <Text style={styles.bigCardTitle}>Planuj Naukę</Text>
                <Text style={styles.bigCardSub}>
                  {studyPlans.length > 0
                    ? `${studyPlans.length} aktywnych planów`
                    : 'Brak planów nauki'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.rightColumn}>
              <TouchableOpacity
                style={[styles.smallCard, { backgroundColor: '#8B5CF6' }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Zadania')}
              >
                <View style={styles.glassIconSmall}>
                  <Plus color="white" size={20} />
                </View>
                <Text style={styles.smallCardText}>Zadanie</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallCard, { backgroundColor: '#6366F1' }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Podróże')}
              >
                <View style={styles.glassIconSmall}>
                  <Plane color="white" size={20} />
                </View>
                <Text style={styles.smallCardText}>Podróż</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* STATYSTYKI — LIVE */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
              <Text style={[styles.statNumber, { color: '#FF4D8D' }]}>
                {tasksDone}/{tasksTotal}
              </Text>
              <Text style={styles.statLabel}>Zadania</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
              <Text style={[styles.statNumber, { color: '#7B61FF' }]}>
                {studyPlans.length}
              </Text>
              <Text style={styles.statLabel}>Plany nauki</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
              <Text style={[styles.statNumber, { color: '#2ECC71' }]}>
                {tripsUpcoming}
              </Text>
              <Text style={styles.statLabel}>Podróże</Text>
            </View>
          </View>

          {/* SEKCJA — ZADANIA */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Zadania do zrobienia</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Zadania')}>
              <Text style={styles.linkText}>Wszystkie</Text>
            </TouchableOpacity>
          </View>

          {todayTasks.length === 0 ? (
            <View style={[styles.emptyTasksCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.emptyIconCircle}>
                <LayoutGrid size={24} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyText}>
                {tasksTotal === 0
                  ? 'Brak zadań. Dodaj pierwsze!'
                  : 'Wszystkie zadania ukończone! 🎉'}
              </Text>
            </View>
          ) : (
            todayTasks.map((task: any) => (
              <TouchableOpacity
                key={task.id}
                activeOpacity={0.85}
                style={[styles.taskRow, { backgroundColor: cardColor, borderColor }]}
                onPress={() => navigation.navigate('Zadania')}
              >
                <View style={[styles.taskPriorityDot, { backgroundColor: getPriorityColor(task.priority || '') }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskName, { color: textColor }]} numberOfLines={1}>
                    {task.title || task.name || 'Zadanie'}
                  </Text>
                  {task.dueDate ? (
                    <Text style={[styles.taskSub, { color: subTextColor }]}>
                      Termin: {task.dueDate}
                    </Text>
                  ) : null}
                </View>
                <ChevronRight size={16} color={subTextColor} />
              </TouchableOpacity>
            ))
          )}

          {/* SEKCJA — PLAN NAUKI */}
          <View style={[styles.sectionHeader, { marginTop: 10 }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Twój plan nauki</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Nauka')}>
              <Text style={styles.linkText}>Szczegóły</Text>
            </TouchableOpacity>
          </View>

          {studyPlans.length === 0 ? (
            <View style={[styles.emptyTasksCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.emptyIconCircle}>
                <Book size={24} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyText}>Brak planów nauki. Dodaj pierwszy!</Text>
            </View>
          ) : (
            studyPlans.slice(0, 3).map((plan: any) => (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.9}
                style={[styles.card, { backgroundColor: cardColor, borderColor, marginBottom: 12 }]}
                onPress={() => navigation.navigate('Nauka')}
              >
                <View style={styles.cardInfo}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.courseName, { color: textColor }]}>{plan.name}</Text>
                    <Text style={styles.courseSub}>
                      Egzamin: {plan.date} · {plan.topicsCompleted || 0}/{plan.totalTopics || 0} tematów
                    </Text>
                  </View>
                  <View style={[styles.arrowCircle, { backgroundColor: isDarkMode ? '#2A2A40' : '#F1F5F9' }]}>
                    <ChevronRight color={Colors.primary} size={18} />
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? '#1E1E2E' : '#F1F5F9' }]}>
                    <View style={[styles.progressBarFill, {
                      width: `${plan.progress || 0}%`,
                      backgroundColor: (plan.progress || 0) >= 100 ? '#2ECC71' : Colors.primary,
                    }]} />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressPercentText}>Postęp kursu</Text>
                    <Text style={[styles.progressPercentNumber, { color: Colors.primary }]}>
                      {plan.progress || 0}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* SEKCJA — NAJBLIŻSZA PODRÓŻ */}
          {nextTrip && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 10 }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Najbliższa podróż</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Podróże')}>
                  <Text style={styles.linkText}>Wszystkie</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.tripCard, { backgroundColor: cardColor, borderColor }]}
                onPress={() => navigation.navigate('Podróże')}
              >
                <View style={[styles.tripIconBox, { backgroundColor: 'rgba(46,204,113,0.12)' }]}>
                  <Plane size={24} color="#2ECC71" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tripDest, { color: textColor }]}>{nextTrip.destination}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <Calendar size={12} color={subTextColor} />
                    <Text style={[styles.tripDate, { color: subTextColor }]}>
                      {nextTrip.startDate || nextTrip.date}
                      {nextTrip.endDate ? ` → ${nextTrip.endDate}` : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.tripDaysBox}>
                  <Text style={styles.tripDaysNum}>
                    {calcDaysLeft(nextTrip.startDate || nextTrip.date || '')}
                  </Text>
                  <Text style={styles.tripDaysLabel}>dni</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>

      {/* MODAL USTAWIEŃ */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSettings(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <SettingsIcon size={20} color={textColor} />
                    <Text style={[styles.modalTitle, { color: textColor }]}>Ustawienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowSettings(false)}>
                    <X size={24} color={textColor} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                    <LogOut size={20} color="#FF6B6B" />
                    <Text style={styles.logoutText}>Wyloguj się</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL POWIADOMIEŃ */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowNotifications(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <Bell size={20} color={textColor} />
                    <Text style={[styles.modalTitle, { color: textColor }]}>Powiadomienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowNotifications(false)}>
                    <X size={24} color={textColor} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  {tasksTotal - tasksDone > 0 && (
                    <View style={styles.notifItem}>
                      <View style={[styles.notifDot, { backgroundColor: '#FF6B6B' }]} />
                      <Text style={[styles.notifText, { color: textColor }]}>
                        Masz {tasksTotal - tasksDone} nieukończonych zadań
                      </Text>
                    </View>
                  )}
                  {nextTrip && (
                    <View style={styles.notifItem}>
                      <View style={[styles.notifDot, { backgroundColor: '#2ECC71' }]} />
                      <Text style={[styles.notifText, { color: textColor }]}>
                        Podróż do {nextTrip.destination} za {calcDaysLeft(nextTrip.startDate || nextTrip.date || '')} dni
                      </Text>
                    </View>
                  )}
                  {nextExam && avgStudyProgress < 100 && (
                    <View style={styles.notifItem}>
                      <View style={[styles.notifDot, { backgroundColor: '#7B61FF' }]} />
                      <Text style={[styles.notifText, { color: textColor }]}>
                        Plan "{nextExam.name}" — postęp {nextExam.progress || 0}%
                      </Text>
                    </View>
                  )}
                  {tasksTotal - tasksDone === 0 && !nextTrip && avgStudyProgress >= 100 && (
                    <Text style={[styles.notifText, { color: subTextColor, textAlign: 'center', paddingVertical: 20 }]}>
                      Brak nowych powiadomień 🎉
                    </Text>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },

  // Header
  newHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30, marginTop: 10 },
  headerTextSection: { flex: 1 },
  mainDateText: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  subDateText: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  headerIcons: { flexDirection: 'row', gap: 10, paddingBottom: 2 },
  headerBtn: { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  dotBadge: { position: 'absolute', top: 11, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6', borderWidth: 1.5, borderColor: '#FFF' },

  // Banner
  moodBanner: { borderRadius: 28, padding: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  moodTitle: { color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  moodSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4, fontWeight: '600' },
  glassIconLarge: { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  // Bento
  bentoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, height: 190 },
  bigCard: { width: '58%', borderRadius: 32, padding: 22, justifyContent: 'space-between' },
  glassIconContainer: { width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  bigCardTitle: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  bigCardSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  rightColumn: { width: '38%', justifyContent: 'space-between' },
  smallCard: { height: '47%', borderRadius: 26, padding: 15, justifyContent: 'center', alignItems: 'center' },
  glassIconSmall: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  smallCardText: { color: 'white', fontWeight: '800', fontSize: 13, marginTop: 8 },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { width: (width - 60) / 3, borderRadius: 22, paddingVertical: 20, alignItems: 'center', borderWidth: 1 },
  statNumber: { fontSize: 22, fontWeight: '900', letterSpacing: -1 },
  statLabel: { fontSize: 10, fontWeight: '800', marginTop: 4, color: '#64748B' },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.5 },
  linkText: { color: '#7B61FF', fontSize: 14, fontWeight: '800' },

  // Empty
  emptyTasksCard: { borderRadius: 28, padding: 35, alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 12 },
  emptyIconCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, fontWeight: '700', color: '#64748B', textAlign: 'center' },

  // Task row
  taskRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 10, gap: 12 },
  taskPriorityDot: { width: 10, height: 10, borderRadius: 5 },
  taskName: { fontSize: 15, fontWeight: '700' },
  taskSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  // Study card
  card: { borderRadius: 28, padding: 22, borderWidth: 1 },
  cardInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  courseName: { fontSize: 17, fontWeight: '800' },
  courseSub: { fontSize: 13, color: '#64748B', marginTop: 3 },
  arrowCircle: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  progressSection: { marginTop: 5 },
  progressBarBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: 10, borderRadius: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressPercentText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  progressPercentNumber: { fontSize: 12, fontWeight: '800' },

  // Trip card
  tripCard: { borderRadius: 24, padding: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  tripIconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  tripDest: { fontSize: 17, fontWeight: '800' },
  tripDate: { fontSize: 13, fontWeight: '600' },
  tripDaysBox: { alignItems: 'center', backgroundColor: 'rgba(46,204,113,0.12)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  tripDaysNum: { fontSize: 22, fontWeight: '900', color: '#2ECC71' },
  tripDaysLabel: { fontSize: 11, fontWeight: '700', color: '#2ECC71' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 32, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalBody: {},
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  logoutText: { fontSize: 16, fontWeight: '800', color: '#FF6B6B' },

  // Notifications
  notifItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  notifDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  notifText: { fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 20 },
});

export default Dashboard;