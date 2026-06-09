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
  Dimensions,
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
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  FadeInDown,
  FadeIn,
  interpolate,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../theme';
import TopBar, { TOP_BAR_HEIGHT } from '../components/TopBar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// ─── FAB ─────────────────────────────────────────────────────────────────────
const PulseFAB = ({ onPress }: { onPress: () => void }) => {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    pulseScale.value = withRepeat(withSequence(withTiming(1.6, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, false);
    pulseOpacity.value = withRepeat(withSequence(withTiming(0, { duration: 1000 }), withTiming(0.4, { duration: 1000 })), -1, false);
    scale.value = withRepeat(withSequence(withTiming(1, { duration: 1000 }), withTiming(1.08, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, false);
    return () => { cancelAnimation(scale); cancelAnimation(pulseScale); cancelAnimation(pulseOpacity); };
  }, []);

  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }], opacity: pulseOpacity.value }));

  return (
    <View style={styles.fabContainer}>
      <Animated.View style={[styles.fabPulse, pulseStyle]}>
        <LinearGradient colors={['#A78BFA', '#7B61FF']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={fabStyle}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <LinearGradient colors={['#7B61FF', '#5152D6']} style={styles.fab}>
            <Plus size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
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

// ─── Floating Label Input ─────────────────────────────────────────────────────
const FloatingInput = ({ label, placeholder, value, onChangeText, keyboardType, textColor, isDarkMode }: any) => {
  const [focused, setFocused] = useState(false);
  const labelAnim = useSharedValue(value ? 1 : 0);
  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(labelAnim.value, [0, 1], [14, -4]) },
      { scale: interpolate(labelAnim.value, [0, 1], [1, 0.82]) },
    ],
    color: interpolate(labelAnim.value, [0, 1], [0.5, 1]) > 0.5 ? '#7B61FF' : '#94A3B8',
  }));

  const inputBg = isDarkMode ? 'rgba(15,23,42,0.6)' : '#F8FAFC';
  const borderCol = focused ? '#7B61FF' : (isDarkMode ? 'rgba(99,102,241,0.2)' : '#E2E8F0');

  return (
    <View style={styles.floatingWrapper}>
      <Animated.Text style={[styles.floatingLabel, labelStyle]}>{label}</Animated.Text>
      <TextInput
        placeholder={focused || value ? '' : placeholder}
        placeholderTextColor="#CBD5E1"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        onFocus={() => { setFocused(true); labelAnim.value = withTiming(1, { duration: 180 }); }}
        onBlur={() => { setFocused(false); if (!value) labelAnim.value = withTiming(0, { duration: 180 }); }}
        style={[styles.floatingInput, { color: textColor, borderColor: borderCol, backgroundColor: inputBg, borderWidth: focused ? 1.5 : 1 }]}
      />
    </View>
  );
};

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

  const modalTranslateY = useSharedValue(SCREEN_HEIGHT);
  const modalStyle = useAnimatedStyle(() => ({ transform: [{ translateY: modalTranslateY.value }] }));

  useEffect(() => {
    modalTranslateY.value = showAddModal
      ? withSpring(0, { damping: 18, stiffness: 120 })
      : withTiming(SCREEN_HEIGHT, { duration: 300 });
  }, [showAddModal]);

  const textColor = isDarkMode ? Colors.darkText : '#1E293B';

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
            <Text style={styles.emptyText}>Dodaj pierwszy plan klikając +</Text>
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
      <PulseFAB onPress={() => setShowAddModal(true)} />
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
    <Modal visible={showAddModal} transparent animationType="none" onRequestClose={() => setShowAddModal(false)}>
      <TouchableWithoutFeedback onPress={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.modalSheet, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }, modalStyle]}>
              <View style={styles.modalHandle} />
              <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Nowy plan nauki</Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                    <X size={20} color={textColor} />
                  </TouchableOpacity>
                </View>

                <FloatingInput label="Nazwa kursu" placeholder="np. Matematyka" value={newCourseName} onChangeText={setNewCourseName} textColor={textColor} isDarkMode={isDarkMode} />
                <FloatingInput label="Data egzaminu" placeholder="np. 15 czerwca 2026" value={newCourseDate} onChangeText={setNewCourseDate} textColor={textColor} isDarkMode={isDarkMode} />
                <FloatingInput label="Godziny nauki" placeholder="np. 4" value={newCourseHours} onChangeText={setNewCourseHours} keyboardType="numeric" textColor={textColor} isDarkMode={isDarkMode} />

                <Text style={[styles.sectionTitle, { color: textColor, fontSize: 16, marginBottom: 12 }]}>Tematy do nauki</Text>

                {newTopicsList.map((topic, index) => (
                  <View key={index} style={styles.topicInputRow}>
                    <TextInput
                      placeholder={`Temat ${index + 1}`}
                      placeholderTextColor="#94A3B8"
                      value={topic.name}
                      onChangeText={val => handleChangeTopicName(index, val)}
                      style={[styles.input, { color: textColor, borderColor: isDarkMode ? 'rgba(99,102,241,0.2)' : '#E2E8F0', backgroundColor: isDarkMode ? 'rgba(15,23,42,0.6)' : '#F8FAFC', flex: 1, marginBottom: 0 }]}
                    />
                    {newTopicsList.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveTopicField(index)} style={styles.removeTopicBtn}>
                        <Trash2 size={16} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.addTopicBtn} onPress={handleAddTopicField}>
                  <LinearGradient colors={['#5152D6', '#7B61FF']} style={styles.addTopicBtnGradient}>
                    <Plus size={16} color="white" />
                    <Text style={styles.addTopicBtnText}>Dodaj temat</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleAddCourse} activeOpacity={0.85} disabled={isSaving}>
                  <LinearGradient colors={['#7B61FF', '#5152D6']} style={styles.saveBtn}>
                    {isSaving ? (
                      <View style={styles.shimmerRow}>
                        <View style={styles.shimmerDot} /><View style={[styles.shimmerDot, { opacity: 0.6 }]} /><View style={[styles.shimmerDot, { opacity: 0.3 }]} />
                      </View>
                    ) : <Text style={styles.saveBtnText}>Zapisz plan</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#0B0F19' : '#F8FAFC' }}>
      {selectedCourse ? renderDetails() : renderCourseList()}
      {renderModal()}
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

  // FAB
  fabContainer: { position: 'absolute', bottom: 90, right: 20, alignItems: 'center', justifyContent: 'center' },
  fabPulse: { position: 'absolute', width: 60, height: 60, borderRadius: 30 },
  fab: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 10 },

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

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: SCREEN_HEIGHT * 0.9, elevation: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },

  floatingWrapper: { marginBottom: 16, position: 'relative', paddingTop: 10 },
  floatingLabel: { position: 'absolute', left: 16, top: 10, fontSize: 15, zIndex: 1 },
  floatingInput: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingTop: 22, paddingBottom: 12, fontSize: 15 },

  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 12, marginBottom: 14, fontSize: 15 },
  topicInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  addTopicBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  addTopicBtnGradient: { height: 46, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  addTopicBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  removeTopicBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FF6B6B', justifyContent: 'center', alignItems: 'center' },

  saveBtn: { borderRadius: 18, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 8, elevation: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  shimmerRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  shimmerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
});

export default StudyPlannerScreen;