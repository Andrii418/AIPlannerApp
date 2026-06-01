import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  SafeAreaView, // Dodany import SafeAreaView
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Colors } from '../theme';
import {
  BookOpen,
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
  Sparkles,
  Clock,
  Calendar,
  User,
  ArrowUpRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const getFormattedDate = (): string => {
  const date = new Date();
  return date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
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

interface DashboardProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ isDarkMode, toggleDarkMode }) => {
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const today = getFormattedDate();
  const navigation = useNavigation<any>();

  const theme = {
    bg: isDarkMode ? '#0B0F19' : '#F8FAFC',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8FAFC' : '#0F172A',
    textMuted: isDarkMode ? '#64748B' : '#94A3B8',
    border: isDarkMode ? '#334155' : '#E2E8F0',
    accent: '#6366F1',
    accentLight: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
    success: '#10B981',
    successLight: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
    warning: '#F59E0B',
    danger: '#EF4444',
  };

  const [tasksDone, setTasksDone] = useState<number>(0);
  const [tasksTotal, setTasksTotal] = useState<number>(0);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [tripsUpcoming, setTripsUpcoming] = useState<number>(0);
  const [nextTrip, setNextTrip] = useState<any>(null);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubAuth = auth().onAuthStateChanged(user => {
      unsubs.forEach(u => u());
      unsubs = [];

      if (!user) return;

      const unsubTasks = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('tasks')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setTasksTotal(docs.length);
          setTasksDone(docs.filter((t: any) => t.completed).length);

          const pending = docs
            .filter((t: any) => !t.completed)
            .slice(0, 3);
          setTodayTasks(pending);
        }, err => console.error('tasks error', err));

      const unsubStudy = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('studyPlans')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const sorted = docs.sort((a: any, b: any) => (a.progress || 0) - (b.progress || 0));
          setStudyPlans(sorted);
        }, err => console.error('studyPlans error', err));

      unsubs = [unsubTasks, unsubStudy];
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

  const getPriorityColor = (priority: string): string => {
    const p = priority?.toLowerCase() || '';
    if (p === 'wysoki' || p === 'high') return theme.danger;
    if (p === 'średni' || p === 'medium') return theme.warning;
    return theme.success;
  };

  const avgStudyProgress = studyPlans.length > 0
    ? Math.round(studyPlans.reduce((acc, p) => acc + (p.progress || 0), 0) / studyPlans.length)
    : 0;

  const nextExam = studyPlans.find(p => p.progress < 100) || studyPlans[0] || null;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} transparent={true} />

      {/* ZMIANA: Bezpieczny nagłówek dla iOS i Android za pomocą SafeAreaView i absolutnego pozycjonowania */}
      <SafeAreaView style={[styles.fixedHeaderContainer, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowSettings(true)}
            style={[styles.avatarBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <User size={20} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={[styles.topDate, { color: theme.text }]} numberOfLines={1}>{today}</Text>
          </View>

          <View style={styles.actionGroup}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setShowNotifications(true)}
            >
              <Bell size={20} color={theme.text} />
              {(tasksTotal - tasksDone > 0 || tripsUpcoming > 0) && (
                <View style={[styles.badgeDot, { backgroundColor: theme.accent }]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleDarkMode}
              style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              {isDarkMode ? <Sun size={20} color={theme.warning} /> : <Moon size={20} color={theme.text} />}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* PRZEWIJANA LISTA ELEMENTÓW */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.heroSection}>
          <Text style={[styles.heroGreeting, { color: theme.text }]}>Cześć! 👋</Text>
          <Text style={[styles.heroSub, { color: theme.textMuted }]}>
            {tasksTotal - tasksDone > 0
              ? `Masz dzisiaj ${tasksTotal - tasksDone} nieukończone sprawy.`
              : 'Wszystkie zadania zrobione! Czysta karta na dziś ✨'}
          </Text>
        </View>

        <View style={styles.bentoGrid}>
          <TouchableOpacity
            style={[styles.bentoMain, { backgroundColor: theme.accent }]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Nauka')}
          >
            <View style={styles.bentoMainTop}>
              <View style={styles.bentoBadge}>
                <Sparkles color="#FFFFFF" size={12} />
                <Text style={styles.bentoBadgeText}>EDUKACJA</Text>
              </View>
              <View style={styles.bentoActionIcon}>
                <ArrowUpRight color="#FFFFFF" size={22} />
              </View>
            </View>
            <View>
              <Text style={styles.bentoMainTitle}>Planuj{'\n'}Naukę</Text>
              <Text style={styles.bentoMainSub}>
                {studyPlans.length > 0 ? `${studyPlans.length} aktywne kursy` : 'Brak planów'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.bentoColumn}>
            <TouchableOpacity
              style={[styles.bentoSecondary, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Zadania')}
            >
              <View style={[styles.iconWrapper, { backgroundColor: theme.accentLight }]}>
                <Plus color={theme.accent} size={20} />
              </View>
              <Text style={[styles.bentoSecondaryTitle, { color: theme.text }]}>Zadanie</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bentoSecondary, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Podróże')}
            >
              <View style={[styles.iconWrapper, { backgroundColor: theme.successLight }]}>
                <Plane color={theme.success} size={20} />
              </View>
              <Text style={[styles.bentoSecondaryTitle, { color: theme.text }]}>Podróż</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.metricsRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.text }]}>{tasksDone}/{tasksTotal}</Text>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Zadania</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.text }]}>{studyPlans.length}</Text>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Kursy</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.text }]}>{tripsUpcoming}</Text>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Wyprawy</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Zadania na dziś</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Zadania')} hitSlop={12}>
            <Text style={[styles.sectionLink, { color: theme.accent }]}>Zobacz wszystkie</Text>
          </TouchableOpacity>
        </View>

        {todayTasks.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <LayoutGrid size={24} color={theme.textMuted} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
              {tasksTotal === 0 ? 'Brak zadań na dziś. Dodaj coś nowego!' : 'Wszystko zrobione! Czas na relaks. 🎉'}
            </Text>
          </View>
        ) : (
          todayTasks.map((task: any) => (
            <TouchableOpacity
              key={task.id}
              activeOpacity={0.7}
              style={[styles.taskCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('Zadania')}
            >
              <View style={[styles.taskIndicator, { backgroundColor: getPriorityColor(task.priority || '') }]} />
              <View style={styles.taskMeta}>
                <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={1}>
                  {task.title || task.name || 'Zadanie'}
                </Text>
                {task.dueDate && (
                  <View style={styles.taskTimeRow}>
                    <Clock size={12} color={theme.textMuted} />
                    <Text style={[styles.taskDate, { color: theme.textMuted }]}>{task.dueDate}</Text>
                  </View>
                )}
              </View>
              <ChevronRight size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ))
        )}

        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Postępy w nauce</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Nauka')} hitSlop={12}>
            <Text style={[styles.sectionLink, { color: theme.accent }]}>Szczegóły</Text>
          </TouchableOpacity>
        </View>

        {studyPlans.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <BookOpen size={24} color={theme.textMuted} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>Brak aktywnych planów nauki.</Text>
          </View>
        ) : (
          studyPlans.slice(0, 2).map((plan: any) => {
            const progress = plan.progress || 0;
            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.7}
                style={[styles.studyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => navigation.navigate('Nauka')}
              >
                <View style={styles.studyTop}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.studyName, { color: theme.text }]} numberOfLines={1}>
                      {plan.name}
                    </Text>
                    <Text style={[styles.studyDetails, { color: theme.textMuted }]}>
                      Egzamin: {plan.date || 'brak daty'} • {plan.topicsCompleted || 0}/{plan.totalTopics || 0} tematów
                    </Text>
                  </View>
                  <Text style={[styles.studyPercent, { color: theme.accent }]}>{progress}%</Text>
                </View>

                <View style={[styles.trackBg, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                  <View
                    style={[
                      styles.trackFill,
                      { width: `${progress}%`, backgroundColor: progress >= 100 ? theme.success : theme.accent }
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {nextTrip && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 28 }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Najbliższa podróż</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Podróże')} hitSlop={12}>
                <Text style={[styles.sectionLink, { color: theme.accent }]}>Wszystkie</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.tripCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('Podróże')}
            >
              <View style={[styles.tripIconContainer, { backgroundColor: theme.successLight }]}>
                <Plane size={22} color={theme.success} />
              </View>
              <View style={styles.tripInfo}>
                <Text style={[styles.tripDestination, { color: theme.text }]} numberOfLines={1}>
                  {nextTrip.destination}
                </Text>
                <View style={styles.tripDateRow}>
                  <Calendar size={12} color={theme.textMuted} />
                  <Text style={[styles.tripDateText, { color: theme.textMuted }]}>
                    {nextTrip.startDate || nextTrip.date}
                    {nextTrip.endDate ? ` — ${nextTrip.endDate}` : ''}
                  </Text>
                </View>
              </View>
              <View style={[styles.countdownBadge, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC' }]}>
                <Text style={[styles.countdownValue, { color: theme.text }]}>
                  {calcDaysLeft(nextTrip.startDate || nextTrip.date || '')}
                </Text>
                <Text style={[styles.countdownLabel, { color: theme.textMuted }]}>dni</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* MODAL SETTINGS */}
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSettings(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <SettingsIcon size={18} color={theme.text} />
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Ustawienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowSettings(false)} hitSlop={8}>
                    <X size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <TouchableOpacity
                    style={[styles.modalActionItem, { backgroundColor: isDarkMode ? '#292524' : '#FEF2F2' }]}
                    onPress={handleLogout}
                  >
                    <LogOut size={18} color={theme.danger} />
                    <Text style={[styles.modalActionText, { color: theme.danger }]}>Wyloguj się z konta</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL NOTIFICATIONS */}
      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <TouchableWithoutFeedback onPress={() => setShowNotifications(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Bell size={18} color={theme.text} />
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Powiadomienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowNotifications(false)} hitSlop={8}>
                    <X size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  {tasksTotal - tasksDone > 0 && (
                    <View style={[styles.notifRow, { borderBottomColor: theme.border }]}>
                      <View style={[styles.notifStatus, { backgroundColor: theme.warning }]} />
                      <Text style={[styles.notifBody, { color: theme.text }]}>
                        Masz <Text style={{ fontWeight: '700' }}>{tasksTotal - tasksDone}</Text> nieukończone zadania.
                      </Text>
                    </View>
                  )}
                  {nextTrip && (
                    <View style={[styles.notifRow, { borderBottomColor: theme.border }]}>
                      <View style={[styles.notifStatus, { backgroundColor: theme.success }]} />
                      <Text style={[styles.notifBody, { color: theme.text }]}>
                        Podróż do {nextTrip.destination} już za {calcDaysLeft(nextTrip.startDate || nextTrip.date || '')} dni!
                      </Text>
                    </View>
                  )}
                  {nextExam && avgStudyProgress < 100 && (
                    <View style={[styles.notifRow, { borderBottomColor: theme.border }]}>
                      <View style={[styles.notifStatus, { backgroundColor: theme.accent }]} />
                      <Text style={[styles.notifBody, { color: theme.text }]}>
                        Plan "{nextExam.name}" jest ukończony w {nextExam.progress || 0}%.
                      </Text>
                    </View>
                  )}
                  {tasksTotal - tasksDone === 0 && !nextTrip && avgStudyProgress >= 100 && (
                    <Text style={[styles.notifEmpty, { color: theme.textMuted }]}>
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
  container: {
    flex: 1
  },
  // POPRAWKA: Usunięte sztywne marginesy, dodane pozycjonowanie absolutne typu 'fixed'
  fixedHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 60,
  },
  // POPRAWKA: scrollContainer zaczyna się teraz zaraz pod paskiem (60px paska + zapas na safe area)
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 140 : 125,
    paddingBottom: 40,
  },
  heroSection: {
    marginTop: 0,
    marginBottom: 20,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  topDate: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 10
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroGreeting: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8
  },
  heroSub: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: '400',
    lineHeight: 22
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 14,
    height: 180,
    marginBottom: 24
  },
  bentoMain: {
    flex: 1.25,
    borderRadius: 28,
    padding: 22,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bentoMainTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  bentoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  bentoMainTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 4,
  },
  bentoMainSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '500'
  },
  bentoActionIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoColumn: {
    flex: 1,
    gap: 14
  },
  bentoSecondary: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bentoSecondaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2
  },
  metricsRow: {
    flexDirection: 'row',
    borderRadius: 24,
    paddingVertical: 20,
    borderWidth: 1,
    marginBottom: 32,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4
  },
  metricDivider: {
    width: 1,
    height: '60%',
    alignSelf: 'center'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '700'
  },
  emptyState: {
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  taskIndicator: {
    width: 5,
    height: 28,
    borderRadius: 2.5,
    marginRight: 14
  },
  taskMeta: {
    flex: 1,
    paddingRight: 8
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1
  },
  taskTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4
  },
  taskDate: {
    fontSize: 12,
    fontWeight: '500'
  },
  studyCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 12
  },
  studyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  studyName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2
  },
  studyDetails: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '400'
  },
  studyPercent: {
    fontSize: 16,
    fontWeight: '800'
  },
  trackBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden'
  },
  trackFill: {
    height: '100%',
    borderRadius: 4
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
  },
  tripIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tripInfo: {
    flex: 1,
    marginLeft: 14,
    paddingRight: 8
  },
  tripDestination: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2
  },
  tripDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4
  },
  tripDateText: {
    fontSize: 13,
    fontWeight: '400'
  },
  countdownBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    width: 52,
    height: 52
  },
  countdownValue: {
    fontSize: 18,
    fontWeight: '800'
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  modalContent: {
    marginTop: 4
  },
  modalActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: '700'
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  notifStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12
  },
  notifBody: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    lineHeight: 20
  },
  notifEmpty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
    fontWeight: '500'
  },
});

export default Dashboard;