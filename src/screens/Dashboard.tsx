import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Image,
  Platform,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import auth from '@react-native-firebase/auth';
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
  Smile
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const getFormattedDate = () => {
  const date = new Date();
  return date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
};

const Dashboard = ({ isDarkMode, toggleDarkMode }: any) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const today = getFormattedDate();
  const navigation = useNavigation<any>();

  const bgColor = isDarkMode ? Colors.darkBackground : '#F0F5FF';
  const textColor = isDarkMode ? Colors.darkText : '#1E293B';
  const cardColor = isDarkMode ? Colors.darkCard : Colors.white;
  const borderColor = isDarkMode ? Colors.darkBorder : '#E2E8F0';

  const handleLogout = async () => {
    try {
      setShowSettings(false);
      await auth().signOut();
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* NOWY HEADER: Data nad powitaniem, bez avataru */}
          <View style={styles.newHeader}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSettings(true)}
              style={styles.headerTextSection}
            >
              <Text style={[styles.mainDateText, { color: textColor }]}>
                {today}
              </Text>

              <Text style={styles.subDateText}>
                Twój plan na dziś
              </Text>
            </TouchableOpacity>

            <View style={styles.headerIcons}>
               <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: cardColor, borderColor: borderColor }]}
                onPress={() => setShowNotifications(true)}
               >
                  <Bell size={20} color={textColor} />
                  <View style={styles.dotBadge} />
               </TouchableOpacity>
               <TouchableOpacity onPress={toggleDarkMode} style={[styles.headerBtn, { backgroundColor: cardColor, borderColor: borderColor }]}>
                    {isDarkMode ? <Sun size={20} color="#FFD700" /> : <Moon size={20} color="#64748B" />}
               </TouchableOpacity>
            </View>
          </View>

          {/* Banner Humoru */}
          <View style={[styles.moodBanner, { backgroundColor: '#7B61FF' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.moodTitle}>Dzień dobry!</Text>
              <Text style={styles.moodSub}>Jaki masz dzisiaj humor?</Text>
            </View>
            <View style={styles.glassIconLarge}>
              <Smile color="white" size={32} />
            </View>
          </View>

          {/* Bento Grid */}
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
                <Text style={styles.bigCardSub}>3 aktywne kursy</Text>
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

          {/* Statystyki */}
          <View style={styles.statsRow}>
            {[
              { val: '3/8', label: 'Zadania', color: '#FF4D8D' },
              { val: '2', label: 'Egzaminy', color: '#7B61FF' },
              { val: '1', label: 'Podróże', color: '#2ECC71' }
            ].map((item, index) => (
              <View key={index} style={[styles.statCard, { backgroundColor: cardColor, borderColor: borderColor }]}>
                <Text style={[styles.statNumber, { color: item.color }]}>{item.val}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Sekcja Zadania */}
          <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Dzisiejsze zadania</Text>
              <TouchableOpacity><Text style={styles.linkText}>Wszystkie</Text></TouchableOpacity>
          </View>

          <View style={[styles.emptyTasksCard, { backgroundColor: cardColor, borderColor: borderColor }]}>
              <View style={styles.emptyIconCircle}>
                <LayoutGrid size={24} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyText}>Brak zadań na dziś. Odpocznij! ✨</Text>
          </View>

          {/* Sekcja Nauka (Matematyka) - TO MA ZOSTAĆ */}
          <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Twój plan nauki</Text>
              <TouchableOpacity><Text style={styles.linkText}>Szczegóły</Text></TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.9} style={[styles.card, { backgroundColor: cardColor, borderColor: borderColor }]}>
              <View style={styles.cardInfo}>
                  <View style={{ flex: 1 }}>
                      <Text style={[styles.courseName, { color: textColor }]}>Matematyka Dyskretna</Text>
                      <Text style={styles.courseSub}>Egzamin: 15 czerwca • 1/3 tematów</Text>
                  </View>
                  <View style={[styles.arrowCircle, { backgroundColor: isDarkMode ? '#2A2A40' : '#F1F5F9' }]}>
                    <ChevronRight color={Colors.primary} size={18} />
                  </View>
              </View>

              <View style={styles.progressSection}>
                  <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? '#1E1E2E' : '#F1F5F9' }]}>
                      <View style={[styles.progressBarFill, { width: '33%', backgroundColor: Colors.primary }]} />
                  </View>
                  <View style={styles.progressLabels}>
                      <Text style={styles.progressPercentText}>Postęp kursu</Text>
                      <Text style={[styles.progressPercentNumber, { color: Colors.primary }]}>33%</Text>
                  </View>
              </View>
          </TouchableOpacity>

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showSettings} transparent={true} animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSettings(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <SettingsIcon size={20} color={textColor} />
                    <Text style={[styles.modalTitle, { color: textColor }]}>Ustawienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowSettings(false)}><X size={24} color={textColor} /></TouchableOpacity>
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
    </View>
  );
};

const styles = StyleSheet.create({
    mainDateText: {
      fontSize: 26,
      fontWeight: '900',
      letterSpacing: -0.5
    },

    subDateText: {
      fontSize: 13,
      color: '#94A3B8',
      marginTop: 4,
      fontWeight: '600'
    },

  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  newHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30, marginTop: 10 },
  headerTextSection: { flex: 1 },
  newDateText: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  newWelcomeText: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  headerIcons: { flexDirection: 'row', gap: 10, paddingBottom: 2 },
  headerBtn: { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  dotBadge: { position: 'absolute', top: 11, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6', borderWidth: 1.5, borderColor: '#FFF' },
  moodBanner: { borderRadius: 28, padding: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  moodTitle: { color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  moodSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4, fontWeight: '600' },
  glassIconLarge: { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bentoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, height: 190 },
  bigCard: { width: '58%', borderRadius: 32, padding: 22, justifyContent: 'space-between' },
  glassIconContainer: { width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  bigCardTitle: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  bigCardSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  rightColumn: { width: '38%', justifyContent: 'space-between' },
  smallCard: { height: '47%', borderRadius: 26, padding: 15, justifyContent: 'center', alignItems: 'center' },
  glassIconSmall: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  smallCardText: { color: 'white', fontWeight: '800', fontSize: 13, marginTop: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { width: (width - 60) / 3, borderRadius: 22, paddingVertical: 20, alignItems: 'center', borderWidth: 1 },
  statNumber: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  statLabel: { fontSize: 10, fontWeight: '800', marginTop: 4, textTransform: 'none', color: '#64748B' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.5 },
  linkText: { color: '#7B61FF', fontSize: 14, fontWeight: '800' },
  emptyTasksCard: { borderRadius: 28, padding: 35, alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed' },
  emptyIconCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 32, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  logoutText: { fontSize: 16, fontWeight: '800', color: '#FF6B6B' }
});



export default Dashboard;