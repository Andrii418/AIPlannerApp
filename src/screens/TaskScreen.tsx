import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Trash2,
  Sun,
  Moon,
  Search,
  Calendar,
  Clock,
  Brain,
  Target,
  Crown,
  CheckCircle2,
  User,
  Bell,
  TrendingUp,
  Flame,
  Send,
  X,
  Home,
  Compass,
  BarChart3,
  Globe,
  LogOut,
  Settings,
} from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

import {
  subscribeToTasks,
  addTask,
  toggleTask as toggleTaskInFirebase,
  deleteTask as deleteTaskFromFirebase,
} from '../services/taskService';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: any;
  priority?: 'low' | 'medium' | 'high';
}

type FilterType = 'all' | 'pending' | 'completed';
const { height } = Dimensions.get('window');

const TaskScreen = ({ isDarkMode, toggleDarkMode }: any) => {
  const [task, setTask] = useState('');
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const navigation = useNavigation<any>();

  const colors = {
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    secondary: '#8B5CF6',
    accent: '#EC4899',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    dark: {
      background: '#09090B',
      surface: '#18181B',
      surfaceLight: '#27272A',
      text: '#FAFAFA',
      textSecondary: '#A1A1AA',
      border: '#27272A',
      card: '#18181B',
    },
    light: {
      background: '#FFFFFF',
      surface: '#F8FAFC',
      surfaceLight: '#F1F5F9',
      text: '#0F172A',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      card: '#FFFFFF',
    },
  };

  const theme = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setTaskList([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToTasks((tasksFromDb) => {
      setTaskList(tasksFromDb as Task[]);
      setLoading(false);
      setRefreshing(false);
    });

    const authUnsubscribe = auth().onAuthStateChanged(user => {
      if (!user) setTaskList([]);
    });

    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const handleAddTask = async () => {
    if (task.trim().length === 0) return;
    try {
      await addTask(task.trim());
      setTask('');
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się dodać zadania.');
    }
  };

  const handleToggleTask = async (item: Task) => {
    try {
      await toggleTaskInFirebase(item.id, item.completed);
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zaktualizować statusu.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    Alert.alert(
      'Usuń zadanie',
      'Czy na pewno chcesz usunąć to zadanie?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTaskFromFirebase(id);
            } catch (error) {
              Alert.alert('Błąd', 'Nie udało się usunąć elementu.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    try {
      setShowSettings(false);
      await auth().signOut();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Błąd podczas wylogowywania:', error);
    }
  };

  const filteredTasks = taskList.filter(t => {
    const matchesFilter =
      activeFilter === 'all' ? true :
      activeFilter === 'pending' ? !t.completed :
      t.completed;
    const matchesSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
        translucent={false}
      />

      {/* NAVBAR — kompaktowy */}
      <View style={[styles.navbar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.navbarLeft}>
          <View style={[styles.logoGradient, { backgroundColor: colors.primary }]}>
            <Crown size={14} color="#FFF" />
          </View>
          <Text style={[styles.navbarTitle, { color: theme.text }]}>TaskFlow</Text>
        </View>
        <View style={styles.navbarRight}>
          <TouchableOpacity onPress={toggleDarkMode} style={styles.navIconButton}>
            {isDarkMode ? <Sun size={18} color={theme.text} /> : <Moon size={18} color={theme.text} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.navIconButton}>
            <Bell size={18} color={theme.text} />
            {pendingTasks.length > 0 && (
              <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.navIconButton}>
            <User size={18} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View>
              <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>Witaj z powrotem,</Text>
              <Text style={[styles.userName, { color: theme.text }]}>Andri! 👋</Text>
            </View>
            <View style={[styles.streakBadge, { backgroundColor: colors.warning + '20' }]}>
              <Flame size={14} color={colors.warning} />
              <Text style={[styles.streakText, { color: colors.warning }]}>7 dni</Text>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.statIconBg, { backgroundColor: colors.primary + '20' }]}>
                <Target size={18} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{pendingTasks.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Aktywne</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.statIconBg, { backgroundColor: colors.success + '20' }]}>
                <CheckCircle2 size={18} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{completedTasks.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Ukończone</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.statIconBg, { backgroundColor: colors.warning + '20' }]}>
                <TrendingUp size={18} color={colors.warning} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {taskList.length > 0 ? Math.round((completedTasks.length / taskList.length) * 100) : 0}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Postęp</Text>
            </View>
          </View>

          {/* Search + Filters */}
          <View style={styles.searchSection}>
            <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Search size={16} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Szukaj zadań..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={14} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {(['all', 'pending', 'completed'] as FilterType[]).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    { borderColor: theme.border },
                    activeFilter === filter && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text style={[
                    styles.filterText,
                    { color: activeFilter === filter ? '#FFF' : theme.textSecondary },
                  ]}>
                    {filter === 'all' && 'Wszystkie'}
                    {filter === 'pending' && 'Do zrobienia'}
                    {filter === 'completed' && 'Zrobione'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tasks */}
          <View style={styles.tasksSection}>
            {pendingTasks.map((item) => (
              <View
                key={item.id}
                style={[styles.taskCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <TouchableOpacity style={styles.taskCheckbox} onPress={() => handleToggleTask(item)}>
                  <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                    {item.completed && <CheckCircle2 size={14} color="#FFF" />}
                  </View>
                </TouchableOpacity>
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, { color: theme.text }]}>{item.text}</Text>
                  <View style={styles.taskMeta}>
                    <View style={styles.metaItem}>
                      <Calendar size={10} color={theme.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                        {new Date().toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={10} color={theme.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDeleteTask(item.id)} style={styles.taskDelete}>
                  <Trash2 size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}

            {completedTasks.length > 0 && (activeFilter === 'all' || activeFilter === 'completed') && (
              <View style={styles.completedSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Ukończone</Text>
                  <Text style={[styles.sectionCount, { color: colors.success }]}>{completedTasks.length}</Text>
                </View>
                {completedTasks.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.completedTask, { backgroundColor: theme.surface }]}
                    onPress={() => handleToggleTask(item)}
                  >
                    <CheckCircle2 size={18} color={colors.success} />
                    <Text style={[styles.completedTaskText, { color: theme.textSecondary }]}>
                      {item.text}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteTask(item.id)}>
                      <Trash2 size={14} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {filteredTasks.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}>
                  <Brain size={48} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Brak zadań</Text>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Dodaj swoje pierwsze zadanie i zacznij działać!
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 160 }} />
        </ScrollView>

        {/* BOTTOM INPUT PANEL */}
        <View style={[styles.inputPanelWrapper, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <View style={[styles.inputContainer, {
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderWidth: 1,
          }]}>
            <TextInput
              style={[styles.taskInput, { color: theme.text }]}
              placeholder="Dodaj zadanie..."
              placeholderTextColor={theme.textSecondary}
              value={task}
              onChangeText={setTask}
              onSubmitEditing={handleAddTask}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                task.trim() ? { backgroundColor: colors.primary } : { backgroundColor: theme.border },
              ]}
              onPress={handleAddTask}
              disabled={!task.trim()}
            >
              <Send size={16} color={task.trim() ? '#FFF' : theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Bottom Navigation */}
          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
              <Home size={20} color={theme.textSecondary} />
              <Text style={[styles.navItemText, { color: theme.textSecondary }]}>Nauka</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
              <Compass size={20} color={theme.textSecondary} />
              <Text style={[styles.navItemText, { color: theme.textSecondary }]}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Podróże')}>
              <Globe size={20} color={theme.textSecondary} />
              <Text style={[styles.navItemText, { color: theme.textSecondary }]}>Podróże</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
              <BarChart3 size={20} color={theme.textSecondary} />
              <Text style={[styles.navItemText, { color: theme.textSecondary }]}>Statystyki</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* SETTINGS MODAL */}
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSettings(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Settings size={18} color={theme.text} />
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Ustawienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowSettings(false)} hitSlop={8}>
                    <X size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <TouchableOpacity
                    style={[styles.modalActionItem, { backgroundColor: isDarkMode ? '#292524' : '#FEF2F2' }]}
                    onPress={handleLogout}
                  >
                    <LogOut size={18} color={colors.danger} />
                    <Text style={[styles.modalActionText, { color: colors.danger }]}>Wyloguj się z konta</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* NOTIFICATIONS MODAL */}
      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <TouchableWithoutFeedback onPress={() => setShowNotifications(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Bell size={18} color={theme.text} />
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Powiadomienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowNotifications(false)} hitSlop={8}>
                    <X size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  {pendingTasks.length > 0 ? (
                    <View style={[styles.notifRow, { borderBottomColor: theme.border }]}>
                      <View style={[styles.notifStatus, { backgroundColor: colors.warning }]} />
                      <Text style={[styles.notifBody, { color: theme.text }]}>
                        Masz <Text style={{ fontWeight: '700' }}>{pendingTasks.length}</Text> nieukończonych zadań.
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.notifEmpty, { color: theme.textSecondary }]}>
                      Brak nowych powiadomień 🎉
                    </Text>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Navbar — kompaktowy
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 3,
  },
  navbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navbarTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  navbarRight: { flexDirection: 'row', gap: 4 },
  navIconButton: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  badgeDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 3.5,
  },
  logoGradient: {
    width: 26, height: 26, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },

  scrollContent: { paddingTop: 12, paddingBottom: 20 },

  welcomeSection: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, marginBottom: 16,
  },
  welcomeText: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  userName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  streakText: { fontSize: 12, fontWeight: '700' },

  statsContainer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  statCard: {
    flex: 1, padding: 12, borderRadius: 14, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statIconBg: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500' },

  searchSection: { paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  filterScroll: { flexGrow: 0 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, marginRight: 8,
  },
  filterText: { fontSize: 12, fontWeight: '600' },

  tasksSection: { paddingHorizontal: 20, gap: 10 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionCount: { fontSize: 13, fontWeight: '600' },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 14, borderWidth: 1, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  taskCheckbox: { marginRight: 12 },
  checkbox: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: '#94A3B8', justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  taskContent: { flex: 1, gap: 5 },
  taskTitle: { fontSize: 14, fontWeight: '600' },
  taskMeta: { flexDirection: 'row', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 10, fontWeight: '500' },
  taskDelete: { padding: 6 },

  completedSection: { marginTop: 12, gap: 8 },
  completedTask: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
  },
  completedTaskText: {
    flex: 1, fontSize: 13, fontWeight: '500', textDecorationLine: 'line-through',
  },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
  emptyIconBg: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },

  // Bottom input panel
  inputPanelWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 10,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, marginBottom: 10,
  },
  taskInput: { flex: 1, fontSize: 14, fontWeight: '500', paddingVertical: 6 },
  sendButton: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },

  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', paddingTop: 6,
  },
  navItem: { alignItems: 'center', gap: 3 },
  navItemText: { fontSize: 10, fontWeight: '600' },

  // Modals
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 24, paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  modalTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalContent: { marginTop: 4 },
  modalActionItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16,
  },
  modalActionText: { fontSize: 15, fontWeight: '700' },
  notifRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1,
  },
  notifStatus: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  notifBody: { fontSize: 14, fontWeight: '400', flex: 1, lineHeight: 20 },
  notifEmpty: { fontSize: 14, textAlign: 'center', paddingVertical: 32, fontWeight: '500' },
});

export default TaskScreen;