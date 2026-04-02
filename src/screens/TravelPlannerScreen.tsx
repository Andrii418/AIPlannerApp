import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Colors } from '../theme';
import {
  Plane,
  MapPin,
  Calendar,
  Plus,
  Navigation,
  Clock,
  Palmtree,
  Sun,
  Moon,
  Trash2,
  X,
  ChevronLeft,
  DollarSign,
  Info,
  CheckCircle2,
  Circle,
  Edit2,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// =========================
// HELPER: Oblicz dni do daty
// =========================
const calcDaysLeft = (dateStr: string): number => {
  // Obsługuje formaty: "DD.MM.YYYY", "YYYY-MM-DD", "DD-MM-YYYY"
  if (!dateStr) return 0;

  let parts: string[] = [];
  let date: Date;

  if (dateStr.includes('.')) {
    parts = dateStr.split('.');
    if (parts.length === 3) {
      date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      return 0;
    }
  } else if (dateStr.includes('-')) {
    parts = dateStr.split('-');
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      date = new Date(dateStr);
    } else {
      // DD-MM-YYYY
      date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
  } else {
    return 0;
  }

  if (isNaN(date.getTime())) return 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const getDaysLabel = (days: number): string => {
  if (days < 0) return 'Już minęła';
  if (days === 0) return 'Dziś! 🎉';
  if (days === 1) return 'Jutro!';
  return `za ${days} dni`;
};

const getDaysColor = (days: number): string => {
  if (days < 0) return '#94A3B8';
  if (days <= 3) return '#FF6B6B';
  if (days <= 14) return '#FFD700';
  return '#2ECC71';
};

const TravelPlannerScreen = ({ isDarkMode, toggleDarkMode }: any) => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  // Pola nowego wyjazdu
  const [newDestination, setNewDestination] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPackingList, setNewPackingList] = useState([{ name: '', packed: false }]);

  // Stan trybu "Tryb Wakacyjny"
  const [vacationMode, setVacationMode] = useState(false);

  const textColor = isDarkMode ? Colors.darkText : '#1E293B';
  const cardColor = isDarkMode ? Colors.darkCard : 'rgba(255, 255, 255, 0.8)';
  const borderColor = isDarkMode ? Colors.darkBorder : 'rgba(255, 255, 255, 0.5)';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';

  // =========================
  // Pobieranie z Firestore
  // =========================
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = auth().onAuthStateChanged(user => {
      if (!user) {
        if (unsubscribeFirestore) unsubscribeFirestore();
        setTrips([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      unsubscribeFirestore = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('trips')
        .orderBy('createdAt', 'desc')
        .onSnapshot(
          snapshot => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTrips(data);
            setLoading(false);
          },
          error => {
            console.error('Błąd pobierania podróży:', error);
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
  // Dodawanie nowej podróży
  // =========================
  const handleAddTrip = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      if (!newDestination || !newStartDate || !newBudget) {
        Alert.alert('Uwaga', 'Uzupełnij przynajmniej cel, datę startu i budżet.');
        return;
      }

      const daysLeft = calcDaysLeft(newStartDate);

      const cleanedPacking = newPackingList
        .filter(item => item.name.trim().length > 0)
        .map(item => ({ name: item.name.trim(), packed: false }));

      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('trips')
        .add({
          destination: newDestination,
          startDate: newStartDate,
          endDate: newEndDate,
          budget: newBudget,
          notes: newNotes,
          packingList: cleanedPacking,
          status: daysLeft < 0 ? 'Zakończona' : 'Nadchodząca',
          image: 'https://images.unsplash.com/photo-1519738221187-3027626ff510?q=80&w=500',
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      setNewDestination('');
      setNewStartDate('');
      setNewEndDate('');
      setNewBudget('');
      setNewNotes('');
      setNewPackingList([{ name: '', packed: false }]);
      setShowAddModal(false);
      Alert.alert('Sukces', 'Podróż została dodana! ✈️');
    } catch (error) {
      console.error('Błąd dodawania podróży:', error);
      Alert.alert('Błąd', 'Nie udało się dodać podróży.');
    }
  };

  // =========================
  // Usuwanie podróży
  // =========================
  const handleDeleteTrip = async (tripId: string) => {
    const user = auth().currentUser;
    if (!user) return;

    Alert.alert('Usuń podróż', 'Czy na pewno chcesz usunąć tę podróż?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            await firestore()
              .collection('users')
              .doc(user.uid)
              .collection('trips')
              .doc(tripId)
              .delete();
            if (selectedTrip?.id === tripId) setSelectedTrip(null);
          } catch (error) {
            console.error('Błąd usuwania podróży:', error);
            Alert.alert('Błąd', 'Nie udało się usunąć podróży.');
          }
        },
      },
    ]);
  };

  // =========================
  // Toggle packing list item
  // =========================
  const handleTogglePacking = async (tripId: string, index: number) => {
    const user = auth().currentUser;
    if (!user || !selectedTrip) return;

    try {
      const updatedList = [...(selectedTrip.packingList || [])];
      updatedList[index] = { ...updatedList[index], packed: !updatedList[index].packed };

      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('trips')
        .doc(tripId)
        .update({ packingList: updatedList });

      setSelectedTrip({ ...selectedTrip, packingList: updatedList });
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, packingList: updatedList } : t));
    } catch (error) {
      console.error('Błąd aktualizacji listy:', error);
    }
  };

  // =========================
  // Packing list helpers w modalu
  // =========================
  const handleAddPackingField = () => {
    setNewPackingList(prev => [...prev, { name: '', packed: false }]);
  };

  const handleRemovePackingField = (index: number) => {
    setNewPackingList(prev => prev.filter((_, i) => i !== index));
  };

  const handleChangePackingName = (index: number, value: string) => {
    setNewPackingList(prev =>
      prev.map((item, i) => (i === index ? { ...item, name: value } : item))
    );
  };

  // =========================
  // WIDOK SZCZEGÓŁÓW
  // =========================
  const renderDetails = () => {
    if (!selectedTrip) return null;
    const daysLeft = calcDaysLeft(selectedTrip.startDate);
    const daysLabel = getDaysLabel(daysLeft);
    const daysColor = getDaysColor(daysLeft);
    const packingList = selectedTrip.packingList || [];
    const packedCount = packingList.filter((i: any) => i.packed).length;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <TouchableOpacity onPress={() => setSelectedTrip(null)} style={styles.backRow}>
            <ChevronLeft size={22} color="#5152D6" />
            <Text style={styles.backBtn}>Powrót</Text>
          </TouchableOpacity>

          {/* Hero image */}
          <ImageBackground
            source={{ uri: selectedTrip.image }}
            style={styles.detailHero}
            imageStyle={{ borderRadius: 28 }}
          >
            <View style={styles.detailOverlay}>
              <View style={[styles.badge, { backgroundColor: 'rgba(46,204,113,0.9)' }]}>
                <Text style={styles.badgeText}>{selectedTrip.status}</Text>
              </View>
              <View style={[styles.daysBadge, { backgroundColor: getDaysColor(daysLeft) + 'DD' }]}>
                <Clock size={13} color="white" />
                <Text style={styles.daysText}>{daysLabel}</Text>
              </View>
            </View>
          </ImageBackground>

          {/* Nazwa */}
          <Text style={[styles.detailTitle, { color: textColor }]}>{selectedTrip.destination}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
              <Calendar size={18} color="#5152D6" />
              <Text style={[styles.statValue, { color: textColor }]}>{selectedTrip.startDate}</Text>
              <Text style={styles.statLabel}>Start</Text>
            </View>
            {selectedTrip.endDate ? (
              <View style={[styles.statBox, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
                <Calendar size={18} color="#FF6B6B" />
                <Text style={[styles.statValue, { color: textColor }]}>{selectedTrip.endDate}</Text>
                <Text style={styles.statLabel}>Koniec</Text>
              </View>
            ) : null}
            <View style={[styles.statBox, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
              <DollarSign size={18} color="#2ECC71" />
              <Text style={[styles.statValue, { color: textColor }]}>{selectedTrip.budget}</Text>
              <Text style={styles.statLabel}>Budżet</Text>
            </View>
          </View>

          {/* Odliczanie */}
          <View style={[styles.countdownBox, { backgroundColor: daysColor + '22', borderColor: daysColor + '55', borderWidth: 1 }]}>
            <Clock size={20} color={daysColor} />
            <Text style={[styles.countdownText, { color: daysColor }]}>
              {daysLeft < 0
                ? `Podróż zakończona ${Math.abs(daysLeft)} dni temu`
                : daysLeft === 0
                  ? 'Dziś wyjeżdżasz! Powodzenia! 🎉'
                  : `Do wyjazdu pozostało ${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'}`}
            </Text>
          </View>

          {/* Notatki */}
          {selectedTrip.notes ? (
            <View style={[styles.notesBox, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
              <View style={styles.sectionHeader}>
                <Info size={18} color="#7B61FF" />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Notatki</Text>
              </View>
              <Text style={[styles.notesText, { color: subTextColor }]}>{selectedTrip.notes}</Text>
            </View>
          ) : null}

          {/* Packing list */}
          {packingList.length > 0 && (
            <View style={[styles.packingBox, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
              <View style={styles.sectionHeader}>
                <Palmtree size={18} color="#2ECC71" />
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Co spakować ({packedCount}/{packingList.length})
                </Text>
              </View>
              {/* Progress bar */}
              <View style={styles.packProgressBg}>
                <View style={[styles.packProgressFill, { width: packingList.length > 0 ? `${Math.round((packedCount / packingList.length) * 100)}%` : '0%' }]} />
              </View>
              {packingList.map((item: any, i: number) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.packingItem,
                    {
                      backgroundColor: item.packed ? 'rgba(46,204,113,0.1)' : 'rgba(0,0,0,0.03)',
                      borderColor: item.packed ? '#2ECC7155' : borderColor,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => handleTogglePacking(selectedTrip.id, i)}
                >
                  {item.packed
                    ? <CheckCircle2 size={20} color="#2ECC71" />
                    : <Circle size={20} color="#94A3B8" />}
                  <Text style={[
                    styles.packingText,
                    { color: item.packed ? '#2ECC71' : textColor, textDecorationLine: item.packed ? 'line-through' : 'none' }
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Usuń */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteTrip(selectedTrip.id)}
          >
            <Trash2 size={18} color="#FF6B6B" />
            <Text style={styles.deleteBtnText}>Usuń podróż</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  };

  // =========================
  // WIDOK LISTY
  // =========================
  const renderList = () => (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* Tryb wakacyjny overlay */}
      {vacationMode && (
        <View style={styles.vacationOverlay}>
          <Text style={styles.vacationEmoji}>🌴</Text>
          <Text style={styles.vacationTitle}>Tryb Wakacyjny</Text>
          <Text style={styles.vacationSub}>Relaksuj się, nie myśl o robocie! 😎</Text>
          <TouchableOpacity style={styles.vacationClose} onPress={() => setVacationMode(false)}>
            <Text style={styles.vacationCloseText}>Wróć do planowania</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={[styles.title, { color: textColor }]}>Planer Podróży ✈️</Text>
            <TouchableOpacity onPress={toggleDarkMode} style={styles.themeToggle}>
              {isDarkMode ? <Sun size={24} color="#FFD700" /> : <Moon size={24} color="#64748B" />}
            </TouchableOpacity>
          </View>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            {trips.length === 0 ? 'Zaplanuj swoją pierwszą przygodę' : `Masz ${trips.length} zaplanowane ${trips.length === 1 ? 'wyprawę' : 'wyprawy'}`}
          </Text>
        </View>

        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 50, color: subTextColor }}>Ładowanie podróży...</Text>
        ) : trips.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 50, color: subTextColor }}>Brak zaplanowanych podróży.</Text>
        ) : (
          trips.map(trip => {
            const daysLeft = calcDaysLeft(trip.startDate || '');
            const daysLabel = getDaysLabel(daysLeft);
            const daysColor = getDaysColor(daysLeft);

            return (
              <TouchableOpacity
                key={trip.id}
                activeOpacity={0.9}
                style={[styles.tripCard, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}
                onPress={() => setSelectedTrip(trip)}
              >
                <ImageBackground
                  source={{ uri: trip.image }}
                  style={styles.cardImage}
                  imageStyle={{ borderRadius: 24 }}
                >
                  <View style={styles.imageOverlay}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{trip.status}</Text>
                    </View>
                    <View style={[styles.daysBadge, { backgroundColor: daysColor + 'CC' }]}>
                      <Clock size={12} color="white" />
                      <Text style={styles.daysText}>{daysLabel}</Text>
                    </View>
                  </View>
                </ImageBackground>

                <View style={styles.cardDetails}>
                  <View style={styles.mainInfo}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.destText, { color: textColor }]}>{trip.destination}</Text>
                      <View style={styles.infoRow}>
                        <Calendar size={14} color={subTextColor} />
                        <Text style={[styles.infoText, { color: subTextColor }]}>
                          {trip.startDate}{trip.endDate ? ` → ${trip.endDate}` : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.arrowCircle, { backgroundColor: isDarkMode ? 'rgba(46, 204, 113, 0.15)' : 'rgba(46, 204, 113, 0.1)' }]}>
                      <Navigation color={Colors.tertiary} size={20} />
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: isDarkMode ? '#2A2A3C' : 'rgba(0,0,0,0.05)' }]} />

                  <View style={styles.footerRow}>
                    <View style={styles.budgetBox}>
                      <Text style={[styles.label, { color: isDarkMode ? '#64748B' : '#94A3B8' }]}>Budżet</Text>
                      <Text style={[styles.value, { color: Colors.tertiary }]}>{trip.budget}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={[styles.detailsBtn, { backgroundColor: '#5152D6' }]}
                        onPress={() => setSelectedTrip(trip)}
                      >
                        <Text style={[styles.detailsBtnText, { color: 'white' }]}>Szczegóły</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteTrip(trip.id)}>
                        <Trash2 size={22} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Dodaj nową */}
        <TouchableOpacity
          style={[
            styles.addCard,
            {
              borderColor: isDarkMode ? '#475569' : 'rgba(148, 163, 184, 0.5)',
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.3)',
            },
          ]}
          onPress={() => setShowAddModal(true)}
        >
          <View style={styles.addIconCircle}>
            <Plus color={isDarkMode ? '#94A3B8' : '#64748B'} size={30} />
          </View>
          <Text style={[styles.addText, { color: subTextColor }]}>Zaplanuj nową przygodę</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB - Tryb Wakacyjny */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: vacationMode ? '#FFD700' : Colors.tertiary }]}
        onPress={() => setVacationMode(true)}
      >
        <Palmtree color="white" size={28} />
      </TouchableOpacity>

      {/* Modal dodawania */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <ScrollView
                style={[styles.modalContent, { backgroundColor: isDarkMode ? Colors.darkCard : '#FFFFFF' }]}
                contentContainerStyle={{ padding: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Nowa podróż ✈️</Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <X size={24} color={textColor} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder="Cel podróży (np. Grecja, Ateny)"
                  placeholderTextColor="#94A3B8"
                  value={newDestination}
                  onChangeText={setNewDestination}
                  style={[styles.input, { color: textColor, borderColor }]}
                />
                <TextInput
                  placeholder="Data startu (np. 15.07.2025)"
                  placeholderTextColor="#94A3B8"
                  value={newStartDate}
                  onChangeText={setNewStartDate}
                  style={[styles.input, { color: textColor, borderColor }]}
                />
                <TextInput
                  placeholder="Data końca (opcjonalnie, np. 25.07.2025)"
                  placeholderTextColor="#94A3B8"
                  value={newEndDate}
                  onChangeText={setNewEndDate}
                  style={[styles.input, { color: textColor, borderColor }]}
                />
                <TextInput
                  placeholder="Budżet (np. 2500 PLN)"
                  placeholderTextColor="#94A3B8"
                  value={newBudget}
                  onChangeText={setNewBudget}
                  style={[styles.input, { color: textColor, borderColor }]}
                />
                <TextInput
                  placeholder="Notatki (opcjonalnie)"
                  placeholderTextColor="#94A3B8"
                  value={newNotes}
                  onChangeText={setNewNotes}
                  multiline
                  numberOfLines={3}
                  style={[styles.input, { color: textColor, borderColor, minHeight: 80, textAlignVertical: 'top' }]}
                />

                {/* Lista pakowania */}
                <Text style={[styles.sectionTitle, { color: textColor, fontSize: 16, marginBottom: 10 }]}>
                  Co spakować?
                </Text>

                {newPackingList.map((item, index) => (
                  <View key={index} style={styles.packingInputRow}>
                    <TextInput
                      placeholder={`Przedmiot ${index + 1}`}
                      placeholderTextColor="#94A3B8"
                      value={item.name}
                      onChangeText={(value) => handleChangePackingName(index, value)}
                      style={[styles.input, { color: textColor, borderColor, flex: 1, marginBottom: 0 }]}
                    />
                    {newPackingList.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleRemovePackingField(index)}
                        style={styles.removeBtn}
                      >
                        <Trash2 size={18} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.addPackingBtn} onPress={handleAddPackingField}>
                  <Plus size={18} color="white" />
                  <Text style={styles.addPackingBtnText}>Dodaj przedmiot</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleAddTrip}>
                  <Text style={styles.saveBtnText}>Zapisz podróż</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );

  return selectedTrip ? renderDetails() : renderList();
};

const styles = StyleSheet.create({
  scrollContent: { padding: 20 },
  header: { paddingTop: Platform.OS === 'android' ? 40 : 20, marginBottom: 25 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeToggle: { padding: 8, borderRadius: 12 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: 5, fontWeight: '500' },

  tripCard: { borderRadius: 30, padding: 12, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  cardImage: { height: 180, width: '100%', marginBottom: 15 },
  imageOverlay: { flex: 1, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { backgroundColor: 'rgba(46, 204, 113, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: 'white', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  daysBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  daysText: { color: 'white', fontWeight: '700', fontSize: 11 },

  cardDetails: { paddingHorizontal: 8, paddingBottom: 8 },
  mainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  destText: { fontSize: 20, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoText: { fontSize: 14, fontWeight: '600' },
  arrowCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  divider: { height: 1, marginVertical: 15 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetBox: { gap: 2 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '800' },
  detailsBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  detailsBtnText: { fontWeight: '700' },

  addCard: { height: 150, borderRadius: 30, borderStyle: 'dashed', borderWidth: 2, justifyContent: 'center', alignItems: 'center', gap: 10 },
  addIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(148, 163, 184, 0.1)', justifyContent: 'center', alignItems: 'center' },
  addText: { fontWeight: '700' },

  fab: { position: 'absolute', bottom: 100, right: 20, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#2ECC71', shadowOpacity: 0.3, shadowRadius: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 12, marginBottom: 14, fontSize: 15, backgroundColor: 'rgba(255,255,255,0.6)' },
  saveBtn: { backgroundColor: '#7B61FF', borderRadius: 18, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },

  // Packing list w modalu
  packingInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  addPackingBtn: { backgroundColor: '#5152D6', borderRadius: 16, height: 46, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16 },
  addPackingBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  removeBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FF6B6B', justifyContent: 'center', alignItems: 'center' },

  // Szczegóły
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  backBtn: { fontWeight: '700', color: '#5152D6', fontSize: 16 },
  detailHero: { height: 220, width: '100%', marginBottom: 20 },
  detailOverlay: { flex: 1, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailTitle: { fontSize: 30, fontWeight: '800', marginBottom: 16, letterSpacing: -0.5 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  statBox: { flex: 1, minWidth: 90, padding: 14, borderRadius: 18, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  countdownBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 18, marginBottom: 16 },
  countdownText: { fontSize: 15, fontWeight: '700', flex: 1 },

  notesBox: { padding: 16, borderRadius: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  notesText: { fontSize: 14, lineHeight: 22 },

  packingBox: { padding: 16, borderRadius: 20, marginBottom: 16 },
  packProgressBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: 3, marginBottom: 14 },
  packProgressFill: { height: 6, backgroundColor: '#2ECC71', borderRadius: 3 },
  packingItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, marginBottom: 8 },
  packingText: { fontSize: 15, fontWeight: '600', flex: 1 },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#FF6B6B33', backgroundColor: '#FF6B6B11', marginTop: 8 },
  deleteBtnText: { color: '#FF6B6B', fontWeight: '700', fontSize: 15 },

  // Tryb wakacyjny
  vacationOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(46,204,113,0.97)', zIndex: 999, justifyContent: 'center', alignItems: 'center', gap: 16 },
  vacationEmoji: { fontSize: 80 },
  vacationTitle: { fontSize: 32, fontWeight: '900', color: 'white' },
  vacationSub: { fontSize: 18, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  vacationClose: { marginTop: 20, backgroundColor: 'white', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30 },
  vacationCloseText: { color: '#2ECC71', fontWeight: '800', fontSize: 16 },
});

export default TravelPlannerScreen;