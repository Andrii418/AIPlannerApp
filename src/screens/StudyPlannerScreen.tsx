import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Pressable,
  StatusBar,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  BookOpen,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Target,
  Bell,
  LogOut,
  Settings,
  Calendar,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  FadeInDown,
  FadeIn,
  SlideInDown,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../theme';
import TopBar, { TOP_BAR_HEIGHT } from '../components/TopBar';

// ─── Animated Progress Bar ────────────────────────────────────────────────────
const AnimatedProgressBar = ({ progress }: { progress: number }) => {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withDelay(200, withTiming(progress, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [progress]);
  const barStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));
  return (
    <View style={styles.progressBarBg}>
      <Animated.View style={[styles.progressBarFill, barStyle]}>
        <LinearGradient colors={['#7B61FF', '#A78BFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
};

// ─── Animated Stat Number ────────────────────────────────────────────────────
const AnimatedNumber = ({ value, style }: { value: number; style: any }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const startTime = Date.now();
    const duration = 600;
    const update = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [value]);
  return <Text style={style}>{display}</Text>;
};

// ─── Animated Topic Row ───────────────────────────────────────────────────────
const TopicRow = ({ item, originalIndex, onToggle, textColor, isDarkMode }: any) => {
  const scale = useSharedValue(1);
  const handlePress = () => {
    scale.value = withSequence(withSpring(0.95), withSpring(1.04), withSpring(1));
    onToggle(originalIndex);
  };
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          styles.topicRow,
          {
            backgroundColor: isDarkMode ? 'rgba(30,41,59,0.8)' : '#FFFFFF',
            borderLeftColor: item.completed ? '#2ECC71' : '#7B61FF',
          },
        ]}
      >
        {item.completed ? (
          <Animated.View entering={FadeIn.springify()}>
            <CheckCircle2 size={22} color="#2ECC71" />
          </Animated.View>
        ) : (
          <View style={styles.topicUnchecked} />
        )}
        <Text style={[styles.topicText, { color: textColor }, item.completed && styles.topicTextDone]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Course Card ──────────────────────────────────────────────────────────────
const CourseCard = ({ course, index, textColor, isDarkMode, onView, onDelete }: any) => {
  const getStatusColors = (c: any) =>
    (c.progress || 0) === 100 ? ['#11998e', '#38ef7d'] : ['#7B61FF', '#A855F7'];
  const statusLabel = (c: any) => ((c.progress || 0) === 100 ? 'Gotowe' : 'W trakcie');

  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={styles.cardWrapper}>
      <View style={[styles.courseCard, { backgroundColor: cardBg }]}>
        {/* Left accent bar */}
        <LinearGradient
          colors={getStatusColors(course)}
          style={styles.cardAccentBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.cardInner}>
          <View style={styles.cardTop}>
            <View style={styles.cardTitleRow}>
              <View style={styles.courseIconCircle}>
                <BookOpen size={16} color="#7B61FF" />
              </View>
              <Text style={[styles.courseTitle, { color: textColor }]} numberOfLines={1}>
                {course.name}
              </Text>
            </View>
            <LinearGradient
              colors={getStatusColors(course)}
              style={styles.statusBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.statusText}>{statusLabel(course)}</Text>
            </LinearGradient>
          </View>

          <View style={styles.infoRow}>
            <BookOpen size={14} color="#94A3B8" />
            <Text style={styles.infoLabel}>Egzamin: {course.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={14} color="#94A3B8" />
            <Text style={styles.infoLabel}>
              {Number(course.hours || 0).toFixed(1)} godzin nauki
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <AnimatedProgressBar progress={course.progress || 0} />
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressText}>
                {course.topicsCompleted || 0}/{course.totalTopics || 0} tematów
              </Text>
              <Text style={[styles.progressText, { color: '#7B61FF', fontWeight: '700' }]}>
                {course.progress || 0}%
              </Text>
            </View>
          </View>

          <View style={[styles.cardActions, { borderTopColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onView(course)}>
              <Eye size={16} color={textColor} />
              <Text style={[styles.actionBtnText, { color: textColor }]}>Szczegóły</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(course.id)}>
              <Trash2 size={16} color="#FF6B6B" />
              <Text style={[styles.actionBtnText, { color: '#FF6B6B' }]}>Usuń</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Clock Button ─────────────────────────────────────────────────────────────
const ClockButton = ({ onPress }: { onPress: () => void }) => {
  const rotate = useSharedValue(0);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const handlePress = () => {
    rotate.value = withTiming(360, { duration: 500, easing: Easing.out(Easing.cubic) }, () => { rotate.value = 0; });
    onPress();
  };
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
      <LinearGradient colors={['#7B61FF', '#A855F7']} style={styles.addHoursBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Animated.View style={iconStyle}><Clock size={20} color="white" /></Animated.View>
        <Text style={styles.addHoursText}>Dodaj godzinę nauki</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ─── Study Form Field ─────────────────────────────────────────────────────────
const StudyFormField = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  textColor,
  isDarkMode,
  keyboardType,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  textColor: string;
  isDarkMode: boolean;
  keyboardType?: 'default' | 'numeric';
}) => {
  const [focused, setFocused] = useState(false);
  const borderColor = focused ? '#7B61FF' : isDarkMode ? '#334155' : '#E2E8F0';
  const bg = isDarkMode ? 'rgba(15,23,42,0.5)' : '#F8FAFC';

  return (
    <View style={formStyles.field}>
      <Text style={[formStyles.label, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{label}</Text>
      <View
        style={[
          formStyles.inputWrap,
          {
            borderColor,
            backgroundColor: bg,
            ...(focused
              ? Platform.select({
                  ios: { shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 },
                  android: {},
                })
              : {}),
          },
        ]}
      >
        <View style={[formStyles.iconWrap, focused && formStyles.iconWrapActive]}>{icon}</View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          style={[formStyles.input, { color: textColor }]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
};

// ─── Animated Submit Button ───────────────────────────────────────────────────
const SubmitStudyButton = ({
  onPress,
  label,
  loading,
}: {
  onPress: () => void;
  label: string;
  loading?: boolean;
}) => {
  const scale = useSharedValue(1);
  const brightness = useSharedValue(1);

  const handlePress = () => {
    if (loading) return;
    scale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1.02, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
    brightness.value = withSequence(withTiming(0.85, { duration: 100 }), withTiming(1, { duration: 200 }));
    onPress();
  };

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: brightness.value,
  }));

  return (
    <Animated.View style={btnStyle}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.92} disabled={loading}>
        <LinearGradient colors={['#7B61FF', '#5152D6']} style={formStyles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {loading ? (
            <View style={formStyles.shimmerRow}>
              <View style={formStyles.shimmerDot} />
              <View style={[formStyles.shimmerDot, { opacity: 0.6 }]} />
              <View style={[formStyles.shimmerDot, { opacity: 0.3 }]} />
            </View>
          ) : (
            <>
              <BookOpen size={18} color="#FFFFFF" />
              <Text style={formStyles.submitBtnText}>{label}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Add Plan FAB ─────────────────────────────────────────────────────────────
const FAB_BOTTOM = Platform.OS === 'ios' ? 140 : 110;

const AddPlanFAB = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={[styles.fab, { bottom: FAB_BOTTOM }]} onPress={onPress} activeOpacity={0.9}>
    <LinearGradient colors={['#7B61FF', '#5152D6']} style={styles.fabGradient}>
      <Plus size={26} color="#FFFFFF" />
    </LinearGradient>
  </TouchableOpacity>
);

const formStyles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    minHeight: 54,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(123,97,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: { backgroundColor: 'rgba(123,97,255,0.18)' },
  input: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: Platform.OS === 'ios' ? 12 : 10 },
  submitBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  shimmerRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  shimmerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
const StudyPlannerScreen = ({ isDarkMode, toggleDarkMode }: any) => {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({ 0: true });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDate, setNewCourseDate] = useState('');
  const [newCourseHours, setNewCourseHours] = useState('');
  const [newTopicsList, setNewTopicsList] = useState([{ name: '' }]);
  const [isSaving, setIsSaving] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const textColor = isDarkMode ? Colors.darkText : '#1E293B';
  const modalSurface = isDarkMode ? '#1E293B' : '#FFFFFF';
  const modalTextMuted = isDarkMode ? '#94A3B8' : '#64748B';
  const modalBorder = isDarkMode ? Colors.darkBorder : '#E2E8F0';

  const incompleteCourses = courses.filter(c => (c.progress || 0) < 100);
  const hasNotification = incompleteCourses.length > 0;

  const handleLogout = async () => {
    try {
      setShowSettings(false);
      await auth().signOut();
    } catch (error) {
      console.error('Błąd podczas wylogowywania:', error);
    }
  };

  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;
    const unsubAuth = auth().onAuthStateChanged(user => {
      if (!user) { unsubFirestore?.(); setCourses([]); setSelectedCourse(null); setLoading(false); return; }
      setLoading(true);
      unsubFirestore?.();
      unsubFirestore = firestore()
        .collection('users').doc(user.uid).collection('studyPlans')
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => {
            const raw = doc.data();
            return { id: doc.id, ...raw, createdAt: raw.createdAt?.toDate?.() ?? null };
          });
          const sorted = data.sort((a: any, b: any) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
          setCourses(sorted);
          setSelectedCourse((prev: any) => prev ? sorted.find((c: any) => c.id === prev.id) ?? null : null);
          setLoading(false);
        }, err => { if (err?.code !== 'firestore/permission-denied') console.error(err); setLoading(false); });
    });
    return () => { unsubFirestore?.(); unsubAuth(); };
  }, []);

  const handleAddTopicField = () => setNewTopicsList(prev => [...prev, { name: '' }]);
  const handleRemoveTopicField = (i: number) => setNewTopicsList(prev => prev.filter((_, idx) => idx !== i));
  const handleChangeTopicName = (i: number, val: string) =>
    setNewTopicsList(prev => prev.map((t, idx) => idx === i ? { ...t, name: val } : t));

  const handleAddCourse = async () => {
    const user = auth().currentUser;
    if (!user) { Alert.alert('Błąd', 'Użytkownik nie jest zalogowany.'); return; }
    if (!newCourseName.trim() || !newCourseDate.trim() || !newCourseHours.trim()) { Alert.alert('Uwaga', 'Uzupełnij wszystkie pola.'); return; }
    const hours = Number(newCourseHours);
    if (isNaN(hours) || hours < 0) { Alert.alert('Błąd', 'Podaj poprawną liczbę godzin.'); return; }
    const cleanedTopics = newTopicsList.map(t => ({ name: t.name.trim(), completed: false })).filter(t => t.name.length > 0);
    if (cleanedTopics.length === 0) { Alert.alert('Błąd', 'Dodaj przynajmniej 1 temat.'); return; }
    try {
      setIsSaving(true);
      await firestore().collection('users').doc(user.uid).collection('studyPlans').add({
        name: newCourseName.trim(), date: newCourseDate.trim(), hours, progress: 0,
        topicsCompleted: 0, totalTopics: cleanedTopics.length, topicsList: cleanedTopics,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setNewCourseName(''); setNewCourseDate(''); setNewCourseHours(''); setNewTopicsList([{ name: '' }]);
      setShowAddModal(false);
      Alert.alert('Sukces', 'Plan nauki dodany!');
    } catch (e) { Alert.alert('Błąd', 'Nie udało się dodać planu.'); }
    finally { setIsSaving(false); }
  };

  const handleDeleteCourse = (courseId: string) => {
    const user = auth().currentUser;
    if (!user) return;
    Alert.alert('Usuń plan', 'Na pewno chcesz usunąć ten plan?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: async () => {
        try {
          await firestore().collection('users').doc(user.uid).collection('studyPlans').doc(courseId).delete();
          if (selectedCourse?.id === courseId) setSelectedCourse(null);
        } catch { Alert.alert('Błąd', 'Nie udało się usunąć planu.'); }
      }},
    ]);
  };

  const handleAddStudyHour = async () => {
    const user = auth().currentUser;
    if (!user || !selectedCourse) return;
    try {
      const newHours = Number(selectedCourse.hours || 0) + 1;
      await firestore().collection('users').doc(user.uid).collection('studyPlans').doc(selectedCourse.id).update({ hours: newHours });
      setSelectedCourse({ ...selectedCourse, hours: newHours });
    } catch { Alert.alert('Błąd', 'Nie udało się dodać godziny.'); }
  };

  const handleToggleTopic = async (index: number) => {
    const user = auth().currentUser;
    if (!user || !selectedCourse) return;
    try {
      const updatedTopics = [...(selectedCourse.topicsList || [])];
      updatedTopics[index] = { ...updatedTopics[index], completed: !updatedTopics[index].completed };
      const topicsCompleted = updatedTopics.filter((t: any) => !t.isHeader && t.completed).length;
      const totalTopics = updatedTopics.filter((t: any) => !t.isHeader).length;
      const progress = totalTopics > 0 ? Math.round((topicsCompleted / totalTopics) * 100) : 0;
      await firestore().collection('users').doc(user.uid).collection('studyPlans').doc(selectedCourse.id)
        .update({ topicsList: updatedTopics, topicsCompleted, progress });
      setSelectedCourse({ ...selectedCourse, topicsList: updatedTopics, topicsCompleted, progress });
    } catch { Alert.alert('Błąd', 'Nie udało się zaktualizować tematu.'); }
  };

  const buildSections = (topicsList: any[]) => {
    const sections: { header: string; headerIndex: number; items: { item: any; originalIndex: number }[] }[] = [];
    topicsList.forEach((item, i) => {
      if (item.isHeader) { sections.push({ header: item.name, headerIndex: i, items: [] }); }
      else {
        if (sections.length === 0) sections.push({ header: '', headerIndex: -1, items: [] });
        sections[sections.length - 1].items.push({ item, originalIndex: i });
      }
    });
    return sections;
  };

  const toggleSection = (idx: number) => setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }));

  // ─── RENDER LIST ──────────────────────────────────────────
  const renderCourseList = () => (
    <View style={{ flex: 1 }}>
      <TopBar
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        hasNotification={hasNotification}
        onNotificationPress={() => setShowNotifications(true)}
        onAvatarPress={() => setShowSettings(true)}
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: TOP_BAR_HEIGHT + 16 }]}
        style={{ backgroundColor: isDarkMode ? '#0B0F19' : '#F8FAFC' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <View style={styles.pageTitleRow}>
          <Text style={[styles.pageTitle, { color: textColor }]}>Planer Nauki</Text>
          <Text style={[styles.pageSubtitle, { color: '#94A3B8' }]}>{courses.length} planów</Text>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: textColor }]}>Ładowanie…</Text>
          </View>
        ) : courses.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
            <BookOpen size={40} color="#7B61FF" style={{ marginBottom: 12 }} />
            <Text style={[styles.courseTitle, { color: textColor, textAlign: 'center' }]}>Brak planów nauki</Text>
            <Text style={styles.emptyText}>Dodaj pierwszy plan przyciskiem + w lewym dolnym rogu</Text>
          </View>
        ) : (
          courses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              index={index}
              textColor={textColor}
              isDarkMode={isDarkMode}
              onView={setSelectedCourse}
              onDelete={handleDeleteCourse}
            />
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
      <AddPlanFAB onPress={() => setShowAddModal(true)} />
    </View>
  );

  // ─── RENDER DETAILS ───────────────────────────────────────
  const renderDetails = () => {
    if (!selectedCourse) return null;
    const topicsList = selectedCourse.topicsList || [];
    const topicsCompleted = selectedCourse.topicsCompleted || 0;
    const totalTopics = selectedCourse.totalTopics || topicsList.length || 0;

    return (
      <View style={{ flex: 1 }}>
        <TopBar
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          title={selectedCourse.name}
          hasNotification={hasNotification}
          onNotificationPress={() => setShowNotifications(true)}
          onAvatarPress={() => setShowSettings(true)}
        />
        <ScrollView
          contentContainerStyle={{ paddingTop: TOP_BAR_HEIGHT + 16, paddingBottom: 40 }}
          style={{ backgroundColor: isDarkMode ? '#0B0F19' : '#F8FAFC' }}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity onPress={() => setSelectedCourse(null)} style={styles.backBtnRow}>
            <Text style={[styles.backBtn, { color: textColor }]}>← Powrót do listy</Text>
          </TouchableOpacity>

          {/* Progress hero */}
          <View style={[styles.detailHero, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.detailHeroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.heroTitle}>{selectedCourse.name}</Text>
              <Text style={styles.heroSubtitle}>Egzamin: {selectedCourse.date}</Text>
              <View style={styles.detailProgressWrap}>
                <AnimatedProgressBar progress={selectedCourse.progress || 0} />
                <Text style={styles.detailProgressLabel}>{selectedCourse.progress || 0}% ukończone</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.detailBody}>
            {/* Stats */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsGrid}>
              {[
                { icon: <Target size={18} color="#7B61FF" />, label: 'Tematy', value: topicsCompleted, suffix: `/${totalTopics}`, color: textColor },
                { icon: <Clock size={18} color="#F59E0B" />, label: 'Godziny', value: Math.floor(selectedCourse.hours || 0), suffix: '', color: textColor },
                { icon: <TrendingUp size={18} color="#2ECC71" />, label: 'Gotowe', value: selectedCourse.progress || 0, suffix: '%', color: '#2ECC71' },
              ].map((stat, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(120 + i * 60).springify()}
                  style={[styles.smallStat, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}
                >
                  <View style={styles.statIconRow}>{stat.icon}</View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <AnimatedNumber value={stat.value} style={[styles.statNum, { color: stat.color }]} />
                    <Text style={[styles.statNum, { color: stat.color, fontSize: 14 }]}>{stat.suffix}</Text>
                  </View>
                  <Text style={styles.statLab}>{stat.label}</Text>
                </Animated.View>
              ))}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250).springify()}>
              <ClockButton onPress={handleAddStudyHour} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(320).springify()}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Tematy ({topicsCompleted}/{totalTopics})
              </Text>
            </Animated.View>

            {topicsList.length === 0 ? (
              <Text style={[styles.infoLabel, { marginTop: 10, color: '#94A3B8' }]}>Brak tematów.</Text>
            ) : (
              buildSections(topicsList).map((section, sectionIndex) => {
                const isOpen = !!openSections[sectionIndex];
                const completedCount = section.items.filter(({ item }) => item.completed).length;
                return (
                  <Animated.View key={sectionIndex} entering={FadeInDown.delay(360 + sectionIndex * 40).springify()} style={styles.accordionSection}>
                    {section.header ? (
                      <TouchableOpacity
                        style={[styles.accordionHeader, { borderColor: isDarkMode ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)' }]}
                        onPress={() => toggleSection(sectionIndex)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.accordionLeft}>
                          <Text style={styles.accordionDayText}>{section.header}</Text>
                          <View style={styles.accordionBadge}>
                            <Text style={styles.accordionCount}>{completedCount}/{section.items.length}</Text>
                          </View>
                        </View>
                        {isOpen ? <ChevronUp size={16} color="#7B61FF" /> : <ChevronDown size={16} color="#7B61FF" />}
                      </TouchableOpacity>
                    ) : null}
                    {isOpen && section.items.map(({ item, originalIndex }) => (
                      <TopicRow
                        key={originalIndex}
                        item={item}
                        originalIndex={originalIndex}
                        onToggle={handleToggleTopic}
                        textColor={textColor}
                        isDarkMode={isDarkMode}
                      />
                    ))}
                  </Animated.View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  // ─── RENDER MODAL ─────────────────────────────────────────
  const renderModal = () => (
    <Modal
      visible={showAddModal}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => setShowAddModal(false)}
    >
      <KeyboardAvoidingView
        style={styles.addModalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.addModalInner}>
          <Pressable style={styles.addModalBackdrop} onPress={() => setShowAddModal(false)} />

          <Animated.View entering={SlideInDown.springify().damping(22).stiffness(140)} style={styles.addModalSheet}>
            <View style={styles.addModalHandle} />

            <View style={styles.addModalHeader}>
              <LinearGradient colors={['#7B61FF', '#5152D6']} style={styles.addModalHeaderIcon}>
                <BookOpen size={20} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.addModalTitle, { color: textColor }]}>Nowy plan nauki</Text>
                <Text style={styles.addModalSubtitle}>Utwórz plan i dodaj tematy</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.addModalClose}>
                <X size={20} color={modalTextMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.addModalScroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets
              nestedScrollEnabled
            >
            <StudyFormField
              label="Nazwa kursu"
              icon={<BookOpen size={18} color="#7B61FF" />}
              value={newCourseName}
              onChangeText={setNewCourseName}
              placeholder="np. Matematyka"
              textColor={textColor}
              isDarkMode={isDarkMode}
            />
            <StudyFormField
              label="Data egzaminu"
              icon={<Calendar size={18} color="#7B61FF" />}
              value={newCourseDate}
              onChangeText={setNewCourseDate}
              placeholder="np. 15 czerwca 2026"
              textColor={textColor}
              isDarkMode={isDarkMode}
            />
            <StudyFormField
              label="Godziny nauki"
              icon={<Clock size={18} color="#F59E0B" />}
              value={newCourseHours}
              onChangeText={setNewCourseHours}
              placeholder="np. 4"
              textColor={textColor}
              isDarkMode={isDarkMode}
              keyboardType="numeric"
            />

            <View style={styles.topicsSection}>
              <View style={styles.topicsSectionHeader}>
                <View style={styles.topicsSectionIcon}>
                  <Target size={16} color="#7B61FF" />
                </View>
                <Text style={[styles.topicsSectionTitle, { color: textColor }]}>Tematy do nauki</Text>
              </View>

              {newTopicsList.map((topic, index) => (
                <View key={index} style={styles.topicInputRow}>
                  <View style={[styles.topicInputWrap, { borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                    <BookOpen size={16} color="#94A3B8" />
                    <TextInput
                      placeholder={`Temat ${index + 1}`}
                      placeholderTextColor="#94A3B8"
                      value={topic.name}
                      onChangeText={val => handleChangeTopicName(index, val)}
                      style={[styles.topicInput, { color: textColor }]}
                    />
                  </View>
                  {newTopicsList.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveTopicField(index)} style={styles.removeTopicBtn}>
                      <Trash2 size={16} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.addTopicBtn} onPress={handleAddTopicField} activeOpacity={0.85}>
                <Plus size={16} color="#7B61FF" />
                <Text style={styles.addTopicBtnText}>Dodaj temat</Text>
              </TouchableOpacity>
            </View>

            <SubmitStudyButton onPress={handleAddCourse} label="Zapisz plan" loading={isSaving} />
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderTopBarModals = () => (
    <>
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSettings(false)}>
          <View style={styles.topBarModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.topBarModalSheet, { backgroundColor: modalSurface }]}>
                <View style={styles.topBarModalHeader}>
                  <View style={styles.topBarModalTitleRow}>
                    <Settings size={18} color={textColor} />
                    <Text style={[styles.topBarModalTitle, { color: textColor }]}>Ustawienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowSettings(false)} hitSlop={8}>
                    <X size={20} color={modalTextMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.topBarModalContent}>
                  <TouchableOpacity
                    style={[styles.topBarModalAction, { backgroundColor: isDarkMode ? '#292524' : '#FEF2F2' }]}
                    onPress={handleLogout}
                  >
                    <LogOut size={18} color="#EF4444" />
                    <Text style={styles.topBarModalActionText}>Wyloguj się z konta</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <TouchableWithoutFeedback onPress={() => setShowNotifications(false)}>
          <View style={styles.topBarModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.topBarModalSheet, { backgroundColor: modalSurface }]}>
                <View style={styles.topBarModalHeader}>
                  <View style={styles.topBarModalTitleRow}>
                    <Bell size={18} color={textColor} />
                    <Text style={[styles.topBarModalTitle, { color: textColor }]}>Powiadomienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowNotifications(false)} hitSlop={8}>
                    <X size={20} color={modalTextMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.topBarModalContent}>
                  {incompleteCourses.length > 0 ? (
                    incompleteCourses.slice(0, 3).map((course, i) => (
                      <View key={course.id ?? i} style={[styles.notifRow, { borderBottomColor: modalBorder }]}>
                        <View style={[styles.notifStatus, { backgroundColor: '#7B61FF' }]} />
                        <Text style={[styles.notifBody, { color: textColor }]}>
                          Plan &quot;{course.name}&quot; jest ukończony w {course.progress || 0}%.
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.notifEmpty, { color: modalTextMuted }]}>Brak nowych powiadomień 🎉</Text>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#0B0F19' : '#F8FAFC' }}>
      {selectedCourse ? renderDetails() : renderCourseList()}
      {renderModal()}
      {renderTopBarModals()}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 120, paddingHorizontal: 0 },

  pageTitleRow: { paddingHorizontal: 20, marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, marginTop: 2 },

  // Cards — czyste, bez krawędzi
  cardWrapper: { marginHorizontal: 20, marginBottom: 14 },
  courseCard: {
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    // Cień zamiast border
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  cardAccentBar: { width: 4 },
  cardInner: { flex: 1, padding: 18 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 },
  courseIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(123,97,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  courseTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { color: 'white', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  infoLabel: { color: '#94A3B8', fontSize: 13 },
  progressContainer: { marginTop: 14, marginBottom: 4 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: 6, borderRadius: 3, overflow: 'hidden', minWidth: 4 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 12, color: '#94A3B8' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 14, borderTopWidth: 1, paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionBtnText: { fontWeight: '700', fontSize: 13 },

  fab: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    ...Platform.select({
      ios: { shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 8 },
    }),
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  topBarModalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  topBarModalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 24, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 90 : 75 },
  topBarModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  topBarModalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarModalTitle: { fontSize: 18, fontWeight: '800' },
  topBarModalContent: { marginTop: 4 },
  topBarModalAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16 },
  topBarModalActionText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  notifStatus: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  notifBody: { fontSize: 14, fontWeight: '400', flex: 1, lineHeight: 20 },
  notifEmpty: { fontSize: 14, textAlign: 'center', paddingVertical: 32, fontWeight: '500' },

  // Empty
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center' },
  emptyCard: { margin: 20, padding: 40, borderRadius: 24, alignItems: 'center', elevation: 4 },

  // Detail
  backBtnRow: { paddingHorizontal: 20, marginBottom: 16 },
  backBtn: { fontWeight: '700', fontSize: 15 },
  detailHero: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 20, elevation: 4 },
  detailHeroGradient: { padding: 24 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: 'white', letterSpacing: -0.5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 4 },
  detailProgressWrap: { marginTop: 16 },
  detailProgressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 6, textAlign: 'right' },
  detailBody: { paddingHorizontal: 20 },

  // Stats
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  smallStat: { width: '31%', padding: 16, borderRadius: 18, alignItems: 'center', elevation: 3 },
  statIconRow: { marginBottom: 8 },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLab: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  // Add hours
  addHoursBtn: { height: 52, borderRadius: 26, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 28, elevation: 6 },
  addHoursText: { color: 'white', fontWeight: '700', fontSize: 15 },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14, letterSpacing: -0.3 },

  // Topics — czyste białe
  topicRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 15, borderRadius: 16, marginBottom: 10, gap: 14,
    borderLeftWidth: 3,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  topicUnchecked: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#7B61FF' },
  topicText: { fontSize: 15, fontWeight: '600', flex: 1 },
  topicTextDone: { textDecorationLine: 'line-through', opacity: 0.6 },

  // Accordion
  accordionSection: { marginBottom: 4 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(81,82,214,0.06)', marginBottom: 8, borderWidth: 1 },
  accordionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accordionDayText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: '#5152D6', textTransform: 'uppercase' },
  accordionBadge: { backgroundColor: 'rgba(123,97,255,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  accordionCount: { fontSize: 11, fontWeight: '700', color: '#7B61FF' },

  addModalRoot: { flex: 1 },
  addModalInner: { flex: 1, justifyContent: 'flex-end' },
  addModalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.5)' },
  addModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
    maxHeight: '90%',
    flexShrink: 1,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.12, shadowRadius: 20 },
      android: { elevation: 16 },
    }),
  },
  addModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  addModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  addModalHeaderIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  addModalTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  addModalSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  addModalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addModalScroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },

  topicsSection: {
    marginBottom: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topicsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  topicsSectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(123,97,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicsSectionTitle: { fontSize: 15, fontWeight: '800' },
  topicInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  topicInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
  },
  topicInput: { flex: 1, fontSize: 14, fontWeight: '500', paddingVertical: 10 },
  addTopicBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(123,97,255,0.25)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(123,97,255,0.04)',
  },
  addTopicBtnText: { color: '#7B61FF', fontWeight: '700', fontSize: 14 },
  removeTopicBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FF6B6B', justifyContent: 'center', alignItems: 'center' },
});

export default StudyPlannerScreen;