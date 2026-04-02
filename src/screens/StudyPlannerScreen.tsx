import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  Bell,
  Moon,
  Sun,
  BookOpen,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  Plus,
  X,
} from 'lucide-react-native';
import { Colors } from '../theme';

const StudyPlannerScreen = ({ isDarkMode, toggleDarkMode }: any) => {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);

  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDate, setNewCourseDate] = useState('');
  const [newCourseHours, setNewCourseHours] = useState('');
  const [newTopicsList, setNewTopicsList] = useState([{ name: '' }]);

  const bgColor = 'transparent';
  const textColor = isDarkMode ? Colors.darkText : '#1E293B';
  const cardColor = isDarkMode ? Colors.darkCard : 'rgba(255, 255, 255, 0.8)';
  const borderColor = isDarkMode ? Colors.darkBorder : 'rgba(255, 255, 255, 0.5)';

  // =========================
  // POBIERANIE Z FIRESTORE
  // =========================
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = auth().onAuthStateChanged(user => {
      if (!user) {
        console.log('Użytkownik wylogowany - czyszczę studyPlans listener');

        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }

        setCourses([]);
        setSelectedCourse(null);
        setLoading(false);
        return;
      }

      console.log('Zalogowany UID:', user.uid);
      console.log(`Nasłuchuję: users/${user.uid}/studyPlans`);

      setLoading(true);

      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }

      unsubscribeFirestore = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('studyPlans')
        .onSnapshot(
          snapshot => {
            console.log('Liczba planów ze snapshotu:', snapshot.docs.length);

            const data = snapshot.docs.map(doc => {
              const raw = doc.data();

              console.log('Pobrany dokument:', doc.id, raw);

              return {
                id: doc.id,
                ...raw,
                createdAt: raw.createdAt?.toDate ? raw.createdAt.toDate() : null,
              };
            });

            const sorted = data.sort((a: any, b: any) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeB - timeA;
            });

            setCourses(sorted);

            setSelectedCourse((prev: any) => {
              if (!prev) return null;
              const updatedSelected = sorted.find((c: any) => c.id === prev.id);
              return updatedSelected || null;
            });

            setLoading(false);
          },
          error => {
            if (error?.code !== 'firestore/permission-denied') {
              console.error('Błąd pobierania studyPlans:', error);
            }

            setLoading(false);
          }
        );
    });

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      unsubscribeAuth();
    };
  }, []);

  // =========================
  // OBSŁUGA TEMATÓW W MODALU
  // =========================
  const handleAddTopicField = () => {
    setNewTopicsList(prev => [...prev, { name: '' }]);
  };

  const handleRemoveTopicField = (index: number) => {
    setNewTopicsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleChangeTopicName = (index: number, value: string) => {
    setNewTopicsList(prev =>
      prev.map((topic, i) => (i === index ? { ...topic, name: value } : topic))
    );
  };

  // =========================
  // DODAWANIE NOWEGO PLANU
  // =========================
  const handleAddCourse = async () => {
    try {
      const user = auth().currentUser;

      if (!user) {
        Alert.alert('Błąd', 'Użytkownik nie jest zalogowany.');
        return;
      }

      if (!newCourseName.trim() || !newCourseDate.trim() || !newCourseHours.trim()) {
        Alert.alert('Uwaga', 'Uzupełnij wszystkie pola.');
        return;
      }

      const hours = Number(newCourseHours);

      if (isNaN(hours) || hours < 0) {
        Alert.alert('Błąd', 'Godziny nauki muszą być poprawną liczbą.');
        return;
      }

      const cleanedTopics = newTopicsList
        .map(topic => ({
          name: topic.name.trim(),
          completed: false,
        }))
        .filter(topic => topic.name.length > 0);

      if (cleanedTopics.length === 0) {
        Alert.alert('Błąd', 'Dodaj przynajmniej 1 temat.');
        return;
      }

      console.log(`Dodaję do: users/${user.uid}/studyPlans`);

      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('studyPlans')
        .add({
          name: newCourseName.trim(),
          date: newCourseDate.trim(),
          hours,
          progress: 0,
          topicsCompleted: 0,
          totalTopics: cleanedTopics.length,
          topicsList: cleanedTopics,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      setNewCourseName('');
      setNewCourseDate('');
      setNewCourseHours('');
      setNewTopicsList([{ name: '' }]);
      setShowAddModal(false);

      Alert.alert('Sukces', 'Plan nauki został dodany.');
    } catch (error) {
      console.error('Błąd dodawania planu nauki:', error);
      Alert.alert('Błąd', 'Nie udało się dodać planu nauki.');
    }
  };

  // =========================
  // USUWANIE PLANU
  // =========================
  const handleDeleteCourse = async (courseId: string) => {
    const user = auth().currentUser;
    if (!user) return;

    Alert.alert(
      'Usuń plan',
      'Czy na pewno chcesz usunąć ten plan nauki?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('studyPlans')
                .doc(courseId)
                .delete();

              if (selectedCourse?.id === courseId) {
                setSelectedCourse(null);
              }
            } catch (error) {
              console.error('Błąd usuwania planu:', error);
              Alert.alert('Błąd', 'Nie udało się usunąć planu.');
            }
          },
        },
      ]
    );
  };

  // =========================
  // DODANIE GODZIN
  // =========================
  const handleAddStudyHour = async () => {
    const user = auth().currentUser;
    if (!user || !selectedCourse) return;

    try {
      const newHours = Number(selectedCourse.hours || 0) + 1;

      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('studyPlans')
        .doc(selectedCourse.id)
        .update({
          hours: newHours,
        });

      setSelectedCourse({
        ...selectedCourse,
        hours: newHours,
      });
    } catch (error) {
      console.error('Błąd dodawania godzin:', error);
      Alert.alert('Błąd', 'Nie udało się dodać godziny nauki.');
    }
  };

  // =========================
  // ZMIANA STATUSU TEMATU
  // =========================
  const handleToggleTopic = async (index: number) => {
    const user = auth().currentUser;
    if (!user || !selectedCourse) return;

    try {
      const updatedTopics = [...(selectedCourse.topicsList || [])];

      updatedTopics[index] = {
        ...updatedTopics[index],
        completed: !updatedTopics[index].completed,
      };

      const topicsCompleted = updatedTopics.filter((t: any) => t.completed).length;
      const totalTopics = updatedTopics.length;
      const progress = totalTopics > 0 ? Math.round((topicsCompleted / totalTopics) * 100) : 0;

      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('studyPlans')
        .doc(selectedCourse.id)
        .update({
          topicsList: updatedTopics,
          topicsCompleted,
          progress,
        });

      setSelectedCourse({
        ...selectedCourse,
        topicsList: updatedTopics,
        topicsCompleted,
        progress,
      });
    } catch (error) {
      console.error('Błąd aktualizacji tematu:', error);
      Alert.alert('Błąd', 'Nie udało się zaktualizować tematu.');
    }
  };

  // =========================
  // STATUS KURSU
  // =========================
  const getStatus = (course: any) => {
    if ((course.progress || 0) === 100) return 'Gotowe';
    return 'W trakcie';
  };

  const getStatusColor = (course: any) => {
    if ((course.progress || 0) === 100) return '#2ECC71';
    return '#7B61FF';
  };

  const renderCourseList = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} style={{ backgroundColor: 'transparent' }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.mainTitle, { color: textColor }]}>Planer Nauki</Text>
          <Text style={styles.subTitleText}>{courses.length} planów nauki</Text>
        </View>
        <View style={styles.headerIcons}>
          <Bell size={24} color="#FFD700" />
          <TouchableOpacity onPress={toggleDarkMode}>
            {isDarkMode ? <Sun size={24} color="#FFD700" /> : <Moon size={24} color="#64748B" />}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <Text style={[styles.infoLabel, { textAlign: 'center', marginTop: 30 }]}>
          Ładowanie planów nauki...
        </Text>
      ) : courses.length === 0 ? (
        <View style={[styles.courseCard, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
          <Text style={[styles.courseTitle, { color: textColor, textAlign: 'center' }]}>
            Brak planów nauki
          </Text>
          <Text style={[styles.infoLabelCenter, { marginTop: 10 }]}>
            Dodaj pierwszy plan klikając +
          </Text>
        </View>
      ) : (
        courses.map(course => (
          <View
            key={course.id}
            style={[styles.courseCard, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.courseTitle, { color: textColor }]}>{course.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course) }]}>
                <Text style={styles.statusText}>{getStatus(course)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <BookOpen size={16} color="#64748B" />
              <Text style={styles.infoLabel}>Egzamin: {course.date}</Text>
            </View>

            <View style={styles.infoRow}>
              <Clock size={16} color="#64748B" />
              <Text style={styles.infoLabel}>
                {Number(course.hours || 0).toFixed(1)} godzin nauki
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${course.progress || 0}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {course.topicsCompleted || 0} z {course.totalTopics || 0} tematów ukończonych (
                {course.progress || 0}%)
              </Text>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setSelectedCourse(course)}>
                <Eye size={18} color={textColor} />
                <Text style={[styles.actionBtnText, { color: textColor }]}>Szczegóły</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteCourse(course.id)}>
                <Trash2 size={18} color="#FF6B6B" />
                <Text style={[styles.actionBtnText, { color: '#FF6B6B' }]}>Usuń</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Plus size={30} color="white" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderDetails = () => {
    if (!selectedCourse) return null;

    const topicsList = selectedCourse.topicsList || [];
    const topicsCompleted = selectedCourse.topicsCompleted || 0;
    const totalTopics = selectedCourse.totalTopics || topicsList.length || 0;

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} style={{ backgroundColor: 'transparent' }}>
        <TouchableOpacity onPress={() => setSelectedCourse(null)}>
          <Text style={styles.backBtn}>← Powrót</Text>
        </TouchableOpacity>

        <Text style={[styles.mainTitle, { color: textColor }]}>Szczegóły Kursu</Text>

        <View style={[styles.courseCard, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
          <View style={styles.cardTop}>
            <Text style={[styles.courseTitle, { color: textColor }]}>{selectedCourse.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedCourse) }]}>
              <Text style={styles.statusText}>{getStatus(selectedCourse)}</Text>
            </View>
          </View>

          <Text style={styles.infoLabelCenter}>Egzamin: {selectedCourse.date}</Text>
          <Text style={styles.infoLabelCenter}>
            {Number(selectedCourse.hours || 0).toFixed(1)} godzin nauki
          </Text>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${selectedCourse.progress || 0}%` }]} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.smallStat, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: textColor }]}>
              {topicsCompleted}/{totalTopics}
            </Text>
            <Text style={styles.statLab}>Tematów</Text>
          </View>

          <View style={[styles.smallStat, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: textColor }]}>
              {Number(selectedCourse.hours || 0).toFixed(1)}
            </Text>
            <Text style={styles.statLab}>Godziny</Text>
          </View>

          <View style={[styles.smallStat, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: '#2ECC71' }]}>{selectedCourse.progress || 0}%</Text>
            <Text style={styles.statLab}>Gotowe</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addHoursBtn} onPress={handleAddStudyHour}>
          <Clock size={20} color="white" />
          <Text style={styles.addHoursText}>Dodaj godzinę nauki</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Tematy ({topicsCompleted}/{totalTopics})
        </Text>

        {topicsList.length === 0 ? (
          <Text style={[styles.infoLabel, { marginTop: 10 }]}>Brak tematów w tym planie.</Text>
        ) : (
          topicsList.map((topic: any, i: number) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleToggleTopic(i)}
              style={[
                styles.topicRow,
                {
                  backgroundColor: topic.completed
                    ? 'rgba(209, 196, 233, 0.6)'
                    : 'rgba(243, 229, 245, 0.6)',
                  borderColor,
                  borderWidth: 1,
                },
              ]}
            >
              {topic.completed ? (
                <CheckCircle2 size={24} color="#4CAF50" />
              ) : (
                <CheckCircle2 size={24} color="#64748B" />
              )}
              <Text style={[styles.topicText, { color: textColor }]}>{topic.name}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      {selectedCourse ? renderDetails() : renderCourseList()}
      <View style={{ height: 80 }} />

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <ScrollView
                style={[styles.modalContent, { backgroundColor: isDarkMode ? Colors.darkCard : '#FFFFFF' }]}
                contentContainerStyle={{ padding: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Dodaj plan nauki</Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <X size={24} color={textColor} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder="Nazwa kursu (np. Matematyka)"
                  placeholderTextColor="#94A3B8"
                  value={newCourseName}
                  onChangeText={setNewCourseName}
                  style={[styles.input, { color: textColor, borderColor }]}
                />

                <TextInput
                  placeholder="Data egzaminu (np. 15 czerwca 2026)"
                  placeholderTextColor="#94A3B8"
                  value={newCourseDate}
                  onChangeText={setNewCourseDate}
                  style={[styles.input, { color: textColor, borderColor }]}
                />

                <TextInput
                  placeholder="Godziny nauki (np. 4)"
                  placeholderTextColor="#94A3B8"
                  value={newCourseHours}
                  onChangeText={setNewCourseHours}
                  keyboardType="numeric"
                  style={[styles.input, { color: textColor, borderColor }]}
                />

                <Text style={[styles.sectionTitle, { color: textColor, fontSize: 16, marginBottom: 10 }]}>
                  Tematy do nauki
                </Text>

                {newTopicsList.map((topic, index) => (
                  <View key={index} style={styles.topicInputRow}>
                    <TextInput
                      placeholder={`Temat ${index + 1}`}
                      placeholderTextColor="#94A3B8"
                      value={topic.name}
                      onChangeText={(value) => handleChangeTopicName(index, value)}
                      style={[styles.input, { color: textColor, borderColor, flex: 1, marginBottom: 0 }]}
                    />

                    {newTopicsList.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveTopicField(index)}
                        style={styles.removeTopicBtn}
                      >
                        <Trash2 size={18} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.addTopicBtn} onPress={handleAddTopicField}>
                  <Plus size={18} color="white" />
                  <Text style={styles.addTopicBtnText}>Dodaj temat</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleAddCourse}>
                  <Text style={styles.saveBtnText}>Zapisz plan</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingTop: 50 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  mainTitle: { fontSize: 26, fontWeight: '800' },
  subTitleText: { color: '#64748B', fontWeight: '600' },
  headerIcons: { flexDirection: 'row', gap: 15 },
  courseCard: { borderRadius: 25, padding: 20, marginBottom: 20, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  courseTitle: { fontSize: 20, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { color: 'white', fontSize: 12, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  infoLabel: { color: '#64748B', fontSize: 13 },
  progressContainer: { marginTop: 15 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, marginBottom: 8 },
  progressBarFill: { height: 6, backgroundColor: '#7B61FF', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#64748B', textAlign: 'right' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 10,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionBtnText: { fontWeight: '700', fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#5152D6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  backBtn: { marginBottom: 10, fontWeight: '700', color: '#5152D6' },
  infoLabelCenter: { textAlign: 'center', color: '#64748B', marginBottom: 5 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  smallStat: { width: '31%', padding: 15, borderRadius: 15, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLab: { fontSize: 11, color: '#64748B' },
  addHoursBtn: {
    backgroundColor: '#7B61FF',
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 25,
  },
  addHoursText: { color: 'white', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  topicRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10, gap: 15 },
  topicText: { fontSize: 16, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    marginBottom: 14,
    fontSize: 15,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  saveBtn: {
    backgroundColor: '#7B61FF',
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  topicInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  addTopicBtn: {
    backgroundColor: '#5152D6',
    borderRadius: 16,
    height: 46,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  addTopicBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  removeTopicBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StudyPlannerScreen;