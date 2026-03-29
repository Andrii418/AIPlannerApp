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
  Settings as SettingsIcon
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

  const bgColor = isDarkMode ? Colors.darkBackground : '#F8FAFC';
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
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <View style={styles.bgContainer}>
         <View style={[styles.bgCircle, {
            top: -100, right: -80, width: 350, height: 350,
            backgroundColor: isDarkMode ? 'rgba(123, 97, 255, 0.12)' : 'rgba(123, 97, 255, 0.08)'
         }]} />
         <View style={[styles.bgCircle, {
            bottom: 100, left: -120, width: 400, height: 400,
            backgroundColor: isDarkMode ? 'rgba(46, 204, 113, 0.08)' : 'rgba(46, 204, 113, 0.04)'
         }]} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerLeft}
              activeOpacity={0.7}
              onPress={() => setShowSettings(true)}
            >
              <View style={styles.avatarContainer}>
                <Image source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }} style={styles.avatar} />
                <View style={styles.onlineDot} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: textColor }]}>Cześć, 👋</Text>
                <View style={styles.dateContainer}>
                  <Text style={styles.headerSub}>{today}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.headerIcons}>
               <TouchableOpacity
                style={[styles.blurButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', borderColor: borderColor }]}
                onPress={() => setShowNotifications(true)}
               >
                  <Bell size={20} color={textColor} />
                  <View style={styles.dotBadge} />
               </TouchableOpacity>
               <TouchableOpacity onPress={toggleDarkMode} style={styles.themeToggle}>
                             {isDarkMode ? (
                               <Sun size={24} color="#FFD700" />
                             ) : (
                               <Moon size={24} color="#64748B" />
                             )}
                           </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bentoGrid}>
            <TouchableOpacity style={[styles.bigCard, { backgroundColor: Colors.primary }]} activeOpacity={0.9} onPress={() => navigation.navigate('Nauka')}>
              <View style={styles.cardDecoration} />
              <View style={styles.glassIconContainer}>
                <Book color="white" size={28} />
              </View>
              <View>
                <Text style={styles.bigCardTitle}>Planuj Naukę</Text>
                <Text style={styles.bigCardSub}>3 aktywne kursy</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.rightColumn}>
              <TouchableOpacity style={[styles.smallCard, { backgroundColor: Colors.secondary }]} activeOpacity={0.9} onPress={() => navigation.navigate('Zadania')}>
                <Plus color="white" size={24} />
                <Text style={styles.smallCardText}>Zadanie</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallCard, { backgroundColor: Colors.tertiary }]} activeOpacity={0.9} onPress={() => navigation.navigate('Podróże')}>
                <Plane color="white" size={24} />
                <Text style={styles.smallCardText}>Podróż</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsRow}>
            {[
              { val: '3/8', label: 'Zadania', color: Colors.secondary, bg: 'rgba(255, 107, 107, 0.05)' },
              { val: '2', label: 'Egzaminy', color: Colors.primary, bg: 'rgba(123, 97, 255, 0.05)' },
              { val: '1', label: 'Podróże', color: Colors.tertiary, bg: 'rgba(46, 204, 113, 0.05)' }
            ].map((item, index) => (
              <View key={index} style={[styles.statCard, { backgroundColor: isDarkMode ? cardColor : item.bg, borderColor: isDarkMode ? borderColor : 'transparent' }]}>
                <Text style={[styles.statNumber, { color: item.color }]}>{item.val}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Dzisiejsze zadania</Text>
              <TouchableOpacity><Text style={styles.linkText}>Wszystkie</Text></TouchableOpacity>
          </View>
          <View style={[styles.emptyTasksCard, { borderColor: borderColor, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.4)' }]}>
              <View style={styles.emptyIconCircle}>
                <LayoutGrid size={24} color={isDarkMode ? '#475569' : '#94A3B8'} />
              </View>
              <Text style={styles.emptyText}>Brak zadań na dziś. Odpocznij! ✨</Text>
          </View>

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
                      <View style={[styles.progressBarFill, { width: '33%' }]} />
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

      <Modal
        visible={showSettings}
        transparent={true}
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
                   <TouchableOpacity
                    style={[styles.menuItem, styles.logoutItem]}
                    onPress={handleLogout}
                   >
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
  bgContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', zIndex: -1 },
  bgCircle: { position: 'absolute', borderRadius: 200, opacity: 0.6 },

  scrollContent: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 50 : 60, paddingBottom: 20 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 48, height: 48, borderRadius: 16 },
  onlineDot: { position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#2ECC71', borderWidth: 2, borderColor: '#FFF' },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 2 },
  dateContainer: { marginTop: 2 },

  headerIcons: { flexDirection: 'row', gap: 10 },
  blurButton: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  dotBadge: { position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF6B6B' },

  bentoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, height: 190 },
  bigCard: { width: '58%', borderRadius: 30, padding: 22, justifyContent: 'space-between', overflow: 'hidden' },
  cardDecoration: { position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' },
  glassIconContainer: { width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  bigCardTitle: { color: 'white', fontSize: 19, fontWeight: '800' },
  bigCardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  rightColumn: { width: '38%', justifyContent: 'space-between' },
  smallCard: { height: '47%', borderRadius: 24, padding: 15, justifyContent: 'center', alignItems: 'center' },
  smallCardText: { color: 'white', fontWeight: '700', fontSize: 12, marginTop: 8 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { width: (width - 60) / 3, borderRadius: 20, paddingVertical: 20, alignItems: 'center', borderWidth: 1 },
  statNumber: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  linkText: { color: '#7B61FF', fontSize: 14, fontWeight: '700' },

  emptyTasksCard: { borderRadius: 24, padding: 30, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1.5 },
  emptyIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(148, 163, 184, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  emptyText: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  card: { borderRadius: 28, padding: 22, borderWidth: 1 },
  cardInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  courseName: { fontSize: 17, fontWeight: '800' },
  courseSub: { fontSize: 13, color: '#64748B', marginTop: 3 },
  arrowCircle: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  progressSection: { marginTop: 5 },
  progressBarBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: 10, backgroundColor: '#7B61FF', borderRadius: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressPercentText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  progressPercentNumber: { fontSize: 12, fontWeight: '800' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '90%',
    borderRadius: 30,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800'
  },
  modalBody: {
    marginTop: 10
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 15,
    gap: 12
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginTop: 5
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B'
  }
});

export default Dashboard;