import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Bell, Moon, Sun, BookOpen, Trash2, Eye, Clock, CheckCircle2, Plus } from 'lucide-react-native';
import { Colors } from '../theme';

const StudyPlannerScreen = ({ isDarkMode, toggleDarkMode }: any) => {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const textColor = isDarkMode ? Colors.darkText : '#1E293B';
  const cardColor = isDarkMode ? Colors.darkCard : Colors.white;

  const courses = [
    { id: '1', name: 'Matematyka', date: '15 marca 2026', hours: '4.0', progress: 33, topics: '1 z 3' },
    { id: '2', name: 'Fizyka', date: '10 kwietnia 2026', hours: '8.0', progress: 50, topics: '2 z 4' },
  ];

  const renderCourseList = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
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

      {courses.map(course => (
        <View key={course.id} style={[styles.courseCard, { backgroundColor: cardColor }]}>
          <View style={styles.cardTop}>
            <Text style={[styles.courseTitle, { color: textColor }]}>{course.name}</Text>
            <View style={styles.statusBadge}><Text style={styles.statusText}>Minął</Text></View>
          </View>

          <View style={styles.infoRow}><BookOpen size={16} color="#64748B" /><Text style={styles.infoLabel}>Egzamin: {course.date}</Text></View>
          <View style={styles.infoRow}><Clock size={16} color="#64748B" /><Text style={styles.infoLabel}>{course.hours} godzin nauki</Text></View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${course.progress}%` }]} /></View>
            <Text style={styles.progressText}>{course.topics} tematów ukończonych ({course.progress}%)</Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setSelectedCourse(course)}>
              <Eye size={18} color="#1E293B" /><Text style={styles.actionBtnText}>Szczegóły</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Trash2 size={18} color="#FF6B6B" /><Text style={[styles.actionBtnText, { color: '#FF6B6B' }]}>Usuń</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.fab}><Plus size={30} color="white" /></TouchableOpacity>
    </ScrollView>
  );

  const renderDetails = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity onPress={() => setSelectedCourse(null)}><Text style={styles.backBtn}>← Powrót</Text></TouchableOpacity>
      <Text style={[styles.mainTitle, { color: textColor }]}>Planer Nauki</Text>

      <View style={[styles.courseCard, { backgroundColor: cardColor }]}>
         <View style={styles.cardTop}>
            <Text style={[styles.courseTitle, { color: textColor }]}>{selectedCourse.name}</Text>
            <View style={styles.statusBadge}><Text style={styles.statusText}>Minął</Text></View>
         </View>
         <Text style={styles.infoLabelCenter}>Egzamin: {selectedCourse.date}</Text>
         <Text style={styles.infoLabelCenter}>{selectedCourse.hours} godzin nauki</Text>
         <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${selectedCourse.progress}%` }]} /></View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.smallStat, { backgroundColor: cardColor }]}><Text style={styles.statNum}>1/3</Text><Text style={styles.statLab}>Tematów</Text></View>
        <View style={[styles.smallStat, { backgroundColor: cardColor }]}><Text style={styles.statNum}>4.0</Text><Text style={styles.statLab}>Godzin nauki</Text></View>
        <View style={[styles.smallStat, { backgroundColor: cardColor }]}><Text style={[styles.statNum, { color: '#2ECC71' }]}>33%</Text><Text style={styles.statLab}>Ukończono</Text></View>
      </View>

      <TouchableOpacity style={styles.addHoursBtn}><Clock size={20} color="white" /><Text style={styles.addHoursText}>Dodaj godziny nauki</Text></TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: textColor }]}>Tematy (0/3)</Text>
      {['Całki', 'Pochodne', 'Równania różniczkowe'].map((topic, i) => (
        <View key={i} style={[styles.topicRow, { backgroundColor: i === 0 ? '#D1C4E9' : '#F3E5F5' }]}>
          {i === 0 ? <CheckCircle2 size={24} color="#4CAF50" /> : <CheckCircle2 size={24} color="#64748B" />}
          <Text style={styles.topicText}>{topic}</Text>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? Colors.darkBackground : '#E8EAF6' }}>
      {selectedCourse ? renderDetails() : renderCourseList()}
      <View style={{ height: 80 }} />
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
  statusBadge: { backgroundColor: '#FF8A80', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { color: 'white', fontSize: 12, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  infoLabel: { color: '#64748B', fontSize: 13 },
  progressContainer: { marginTop: 15 },
  progressBarBg: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, marginBottom: 8 },
  progressBarFill: { height: 6, backgroundColor: '#7B61FF', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#64748B', textAlign: 'right' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionBtnText: { fontWeight: '700', fontSize: 14 },
  fab: { position: 'absolute', bottom: 20, right: 0, width: 60, height: 60, borderRadius: 30, backgroundColor: '#5152D6', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  backBtn: { marginBottom: 10, fontWeight: '700', color: '#5152D6' },
  infoLabelCenter: { textAlign: 'center', color: '#64748B', marginBottom: 5 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  smallStat: { width: '31%', padding: 15, borderRadius: 15, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLab: { fontSize: 11, color: '#64748B' },
  addHoursBtn: { backgroundColor: '#7B61FF', flexDirection: 'row', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 25 },
  addHoursText: { color: 'white', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  topicRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10, gap: 15 },
  topicText: { fontSize: 16, fontWeight: '600' }
});

export default StudyPlannerScreen;