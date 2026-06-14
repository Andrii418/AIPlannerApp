import React, { useEffect, useState } from 'react';
import { TripAIPlan, AnimatedCheckRow } from './components/TripAIPlan';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Pressable,
  ImageStyle,
  StyleProp,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Colors } from '../theme';
import {
  Plane,
  Calendar,
  Plus,
  Navigation,
  Clock,
  Palmtree,
  Trash2,
  X,
  ChevronLeft,
  DollarSign,
  Info,
  Bell,
  LogOut,
  Settings,
  MapPin,
  FileText,
  Briefcase,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import TopBar, { TOP_BAR_HEIGHT } from '../components/TopBar';

const IMG_PARAMS = 'auto=format&fit=crop&w=800&q=80';

const TRAVEL_IMAGES = [
  `https://images.unsplash.com/photo-1488646953014-85cb44e25828?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1506929562879-bb697efea9e2?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1469854523086-cc02afe5c88f?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1476514525535-07fb3b4eae5f?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1501785888041-af3ef285b470?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1528127269322-539801943592?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1530789253388-582c481c54b0?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1502602898657-3e91760cbb34?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1555881400-74d7acaacd8b?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1544551763-46a013bb70d5?${IMG_PARAMS}`,
  `https://images.unsplash.com/photo-1503220317375-aaad61436b7b?${IMG_PARAMS}`,
];

const DEFAULT_TRIP_IMAGE = TRAVEL_IMAGES[0];

const resolveTripImageUri = (trip: { id?: string }, index: number): string => {
  const safeId = trip?.id && String(trip.id).length > 0 ? String(trip.id) : `trip-${index}`;
  let slot = index % TRAVEL_IMAGES.length;
  for (let i = 0; i < safeId.length; i++) {
    slot = (slot + safeId.charCodeAt(i)) % TRAVEL_IMAGES.length;
  }
  return TRAVEL_IMAGES[slot] ?? DEFAULT_TRIP_IMAGE;
};

const TripCoverImage = ({
  trip,
  index,
  style,
  imageStyle,
  children,
}: {
  trip: { id?: string };
  index: number;
  style: StyleProp<any>;
  imageStyle?: StyleProp<ImageStyle>;
  children?: React.ReactNode;
}) => {
  const [uri, setUri] = useState(() => resolveTripImageUri(trip, index));
  const [fallbackStep, setFallbackStep] = useState(0);

  useEffect(() => {
    setUri(resolveTripImageUri(trip, index));
    setFallbackStep(0);
  }, [trip?.id, index]);

  const handleImageError = () => {
    const nextStep = fallbackStep + 1;
    if (nextStep >= TRAVEL_IMAGES.length) {
      setUri(DEFAULT_TRIP_IMAGE);
      return;
    }
    const nextUri = TRAVEL_IMAGES[(index + nextStep) % TRAVEL_IMAGES.length] ?? DEFAULT_TRIP_IMAGE;
    setFallbackStep(nextStep);
    setUri(nextUri);
  };

  return (
    <ImageBackground
      source={{ uri }}
      style={style}
      imageStyle={imageStyle}
      resizeMode="cover"
      onError={handleImageError}
    >
      {children}
    </ImageBackground>
  );
};

const cardShadow = Platform.select({
  ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
  android: { elevation: 4 },
});

// ─── Trip Form Field ──────────────────────────────────────────────────────────
const TripFormField = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  textColor,
  isDarkMode,
  multiline,
  numberOfLines,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  textColor: string;
  isDarkMode: boolean;
  multiline?: boolean;
  numberOfLines?: number;
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
          style={[formStyles.input, { color: textColor }, multiline && formStyles.inputMultiline]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );
};

// ─── Animated Submit Button ───────────────────────────────────────────────────
const SubmitTripButton = ({ onPress, label }: { onPress: () => void; label: string }) => {
  const scale = useSharedValue(1);
  const brightness = useSharedValue(1);

  const handlePress = () => {
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
      <TouchableOpacity onPress={handlePress} activeOpacity={0.92}>
        <LinearGradient colors={['#7B61FF', '#5152D6']} style={formStyles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Plane size={18} color="#FFFFFF" />
          <Text style={formStyles.submitBtnText}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

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
  inputMultiline: { minHeight: 88, paddingTop: 12 },
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
});

// =========================
// HELPER: Oblicz dni do daty
// =========================
const calcDaysLeft = (dateStr: string): number => {
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
      date = new Date(dateStr);
    } else {
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [newDestination, setNewDestination] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPackingList, setNewPackingList] = useState([{ name: '', packed: false }]);

  const screenBg = isDarkMode ? '#0B0F19' : '#FFFFFF';
  const textColor = isDarkMode ? Colors.darkText : '#1E293B';
  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = isDarkMode ? Colors.darkBorder : 'rgba(0,0,0,0.06)';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';

  const upcomingTrips = trips.filter(t => calcDaysLeft(t.startDate || '') >= 0);
  const hasNotification = upcomingTrips.length > 0;

  const handleLogout = async () => {
    try {
      setShowSettings(false);
      await auth().signOut();
    } catch (error) {
      console.error('Błąd podczas wylogowywania:', error);
    }
  };

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
          },
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
      setTrips(prev => prev.map(t => (t.id === tripId ? { ...t, packingList: updatedList } : t)));
    } catch (error) {
      console.error('Błąd aktualizacji listy:', error);
    }
  };

  const handleToggleCheckpoint = async (tripId: string, index: number) => {
    const user = auth().currentUser;
    if (!user || !selectedTrip) return;

    try {
      const updatedCheckpoints = [...(selectedTrip.checkpoints || [])];
      updatedCheckpoints[index] = {
        ...updatedCheckpoints[index],
        completed: !updatedCheckpoints[index].completed,
      };

      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('trips')
        .doc(tripId)
        .update({ checkpoints: updatedCheckpoints });

      setSelectedTrip({ ...selectedTrip, checkpoints: updatedCheckpoints });
    } catch (error) {
      console.error('Błąd aktualizacji planu AI:', error);
    }
  };

  const handleAddPackingField = () => {
    setNewPackingList(prev => [...prev, { name: '', packed: false }]);
  };

  const handleRemovePackingField = (index: number) => {
    setNewPackingList(prev => prev.filter((_, i) => i !== index));
  };

  const handleChangePackingName = (index: number, value: string) => {
    setNewPackingList(prev =>
      prev.map((item, i) => (i === index ? { ...item, name: value } : item)),
    );
  };

  const renderTopBarModals = () => (
    <>
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSettings(false)}>
          <View style={styles.topBarModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.topBarModalSheet, { backgroundColor: cardBg }]}>
                <View style={styles.topBarModalHeader}>
                  <View style={styles.topBarModalTitleRow}>
                    <Settings size={18} color={textColor} />
                    <Text style={[styles.topBarModalTitle, { color: textColor }]}>Ustawienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowSettings(false)} hitSlop={8}>
                    <X size={20} color={subTextColor} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.topBarModalAction, { backgroundColor: isDarkMode ? '#292524' : '#FEF2F2' }]}
                  onPress={handleLogout}
                >
                  <LogOut size={18} color="#EF4444" />
                  <Text style={styles.topBarModalActionText}>Wyloguj się z konta</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <TouchableWithoutFeedback onPress={() => setShowNotifications(false)}>
          <View style={styles.topBarModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.topBarModalSheet, { backgroundColor: cardBg }]}>
                <View style={styles.topBarModalHeader}>
                  <View style={styles.topBarModalTitleRow}>
                    <Bell size={18} color={textColor} />
                    <Text style={[styles.topBarModalTitle, { color: textColor }]}>Powiadomienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowNotifications(false)} hitSlop={8}>
                    <X size={20} color={subTextColor} />
                  </TouchableOpacity>
                </View>
                <View style={styles.topBarModalContent}>
                  {upcomingTrips.length > 0 ? (
                    upcomingTrips.slice(0, 4).map((trip, i) => (
                      <View key={trip.id ?? i} style={[styles.notifRow, { borderBottomColor: borderColor }]}>
                        <View style={[styles.notifStatus, { backgroundColor: '#2ECC71' }]} />
                        <Text style={[styles.notifBody, { color: textColor }]}>
                          {trip.destination} — {getDaysLabel(calcDaysLeft(trip.startDate || ''))}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.notifEmpty, { color: subTextColor }]}>Brak nadchodzących podróży 🎉</Text>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );

  const topBarProps = {
    isDarkMode,
    toggleDarkMode,
    hasNotification,
    onNotificationPress: () => setShowNotifications(true),
    onAvatarPress: () => setShowSettings(true),
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
    const detailIndex = Math.max(0, trips.findIndex(t => t.id === selectedTrip.id));

    return (
      <View style={{ flex: 1, backgroundColor: screenBg }}>
        <TopBar {...topBarProps} title={selectedTrip.destination} />
        <ScrollView
          contentContainerStyle={{ paddingTop: TOP_BAR_HEIGHT + 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => setSelectedTrip(null)} style={styles.backRow}>
            <ChevronLeft size={22} color="#5152D6" />
            <Text style={styles.backBtn}>Powrót do listy</Text>
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.springify()} style={[styles.detailHeroWrap, cardShadow]}>
            <TripCoverImage
              trip={selectedTrip}
              index={detailIndex}
              style={styles.detailHero}
              imageStyle={{ borderRadius: 24 }}
            >
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={styles.imageGradient}>
                <View style={styles.detailOverlay}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{selectedTrip.status}</Text>
                  </View>
                  <View style={[styles.daysBadge, { backgroundColor: daysColor + 'DD' }]}>
                    <Clock size={13} color="white" />
                    <Text style={styles.daysText}>{daysLabel}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TripCoverImage>
          </Animated.View>

          <Text style={[styles.detailTitle, { color: textColor }]}>{selectedTrip.destination}</Text>

          <View style={styles.statsRow}>
            {[
              { icon: <Calendar size={18} color="#5152D6" />, value: selectedTrip.startDate, label: 'Start' },
              ...(selectedTrip.endDate ? [{ icon: <Calendar size={18} color="#FF6B6B" />, value: selectedTrip.endDate, label: 'Koniec' }] : []),
              { icon: <DollarSign size={18} color="#2ECC71" />, value: selectedTrip.budget, label: 'Budżet' },
            ].map((stat, i) => (
              <Animated.View
                key={i}
                entering={FadeInDown.delay(80 + i * 60).springify()}
                style={[styles.statBox, { backgroundColor: cardBg }, cardShadow]}
              >
                {stat.icon}
                <Text style={[styles.statValue, { color: textColor }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </Animated.View>
            ))}
          </View>

          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={[styles.countdownBox, { backgroundColor: daysColor + '18', borderColor: daysColor + '44' }]}
          >
            <Clock size={20} color={daysColor} />
            <Text style={[styles.countdownText, { color: daysColor }]}>
              {daysLeft < 0
                ? `Podróż zakończona ${Math.abs(daysLeft)} dni temu`
                : daysLeft === 0
                  ? 'Dziś wyjeżdżasz! Powodzenia! 🎉'
                  : `Do wyjazdu pozostało ${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'}`}
            </Text>
          </Animated.View>

          <TripAIPlan
            checkpoints={selectedTrip.checkpoints}
            onToggle={index => handleToggleCheckpoint(selectedTrip.id, index)}
            isDarkMode={isDarkMode}
            textColor={textColor}
            cardColor={cardBg}
            borderColor={borderColor}
          />

          {selectedTrip.notes ? (
            <View style={[styles.notesBox, { backgroundColor: cardBg }, cardShadow]}>
              <View style={styles.sectionHeader}>
                <Info size={18} color="#7B61FF" />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Notatki</Text>
              </View>
              <Text style={[styles.notesText, { color: subTextColor }]}>{selectedTrip.notes}</Text>
            </View>
          ) : null}

          {packingList.length > 0 && (
            <Animated.View entering={FadeInDown.delay(320).springify()} style={[styles.packingBox, { backgroundColor: cardBg }, cardShadow]}>
              <View style={styles.packingHeader}>
                <LinearGradient colors={['#11998e', '#38ef7d']} style={styles.packingHeaderIcon}>
                  <Palmtree size={16} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Lista pakowania</Text>
                  <Text style={styles.packingSubtitle}>
                    {packedCount} z {packingList.length} gotowe
                  </Text>
                </View>
              </View>
              <View style={styles.packProgressBg}>
                <LinearGradient
                  colors={['#11998e', '#38ef7d']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.packProgressFill,
                    { width: packingList.length > 0 ? `${Math.round((packedCount / packingList.length) * 100)}%` : '0%' },
                  ]}
                />
              </View>
              <View style={styles.packingList}>
                {packingList.map((item: any, i: number) => (
                  <AnimatedCheckRow
                    key={i}
                    completed={!!item.packed}
                    label={item.name}
                    onPress={() => handleTogglePacking(selectedTrip.id, i)}
                    textColor={textColor}
                    isDarkMode={isDarkMode}
                    isLast={i === packingList.length - 1}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteTrip(selectedTrip.id)}>
            <Trash2 size={18} color="#FF6B6B" />
            <Text style={styles.deleteBtnText}>Usuń podróż</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // =========================
  // WIDOK LISTY
  // =========================
  const renderList = () => (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <TopBar {...topBarProps} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: TOP_BAR_HEIGHT + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.pageTitleRow}>
          <Text style={[styles.pageTitle, { color: textColor }]}>Planer Podróży</Text>
          <Text style={[styles.pageSubtitle, { color: subTextColor }]}>
            {trips.length === 0 ? 'Zaplanuj swoją pierwszą przygodę' : `${trips.length} zaplanowanych wypraw`}
          </Text>
        </Animated.View>

        {loading ? (
          <Text style={[styles.emptyHint, { color: subTextColor }]}>Ładowanie podróży...</Text>
        ) : trips.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.emptyCard, { backgroundColor: cardBg }, cardShadow]}>
            <Plane size={40} color="#7B61FF" />
            <Text style={[styles.emptyTitle, { color: textColor }]}>Brak podróży</Text>
            <Text style={[styles.emptyHint, { color: subTextColor }]}>Dodaj pierwszą wyprawę poniżej</Text>
          </Animated.View>
        ) : (
          trips.map((trip, index) => {
            const daysLeft = calcDaysLeft(trip.startDate || '');
            const daysLabel = getDaysLabel(daysLeft);
            const daysColor = getDaysColor(daysLeft);
            return (
              <Animated.View key={trip.id} entering={FadeInDown.delay(80 + index * 70).springify()}>
                <TouchableOpacity
                  activeOpacity={0.92}
                  style={[styles.tripCard, { backgroundColor: cardBg }, cardShadow]}
                  onPress={() => setSelectedTrip(trip)}
                >
                  <TripCoverImage
                    trip={trip}
                    index={index}
                    style={styles.cardImage}
                    imageStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
                  >
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={styles.cardImageGradient}>
                      <View style={styles.imageOverlay}>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{trip.status}</Text>
                        </View>
                        <View style={[styles.daysBadge, { backgroundColor: daysColor + 'CC' }]}>
                          <Clock size={12} color="white" />
                          <Text style={styles.daysText}>{daysLabel}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TripCoverImage>

                  <View style={styles.cardDetails}>
                    <View style={styles.mainInfo}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.destText, { color: textColor }]}>{trip.destination}</Text>
                        <View style={styles.infoRow}>
                          <MapPin size={14} color={subTextColor} />
                          <Text style={[styles.infoText, { color: subTextColor }]}>
                            {trip.startDate}{trip.endDate ? ` → ${trip.endDate}` : ''}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.arrowCircle}>
                        <Navigation color="#2ECC71" size={20} />
                      </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: borderColor }]} />

                    <View style={styles.footerRow}>
                      <View>
                        <Text style={styles.budgetLabel}>Budżet</Text>
                        <Text style={styles.budgetValue}>{trip.budget}</Text>
                      </View>
                      <View style={styles.cardActions}>
                        <TouchableOpacity style={styles.detailsBtn} onPress={() => setSelectedTrip(trip)}>
                          <LinearGradient colors={['#7B61FF', '#5152D6']} style={styles.detailsBtnGradient}>
                            <Text style={styles.detailsBtnText}>Szczegóły</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteTrip(trip.id)} style={styles.deleteIconBtn}>
                          <Trash2 size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <TouchableOpacity style={[styles.addCard, { borderColor: isDarkMode ? '#475569' : '#E2E8F0' }]} onPress={() => setShowAddModal(true)}>
            <View style={styles.addIconCircle}>
              <Plus color="#7B61FF" size={28} />
            </View>
            <Text style={[styles.addText, { color: subTextColor }]}>Zaplanuj nową przygodę</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );

  const renderAddModal = () => (
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
                <Plane size={20} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.addModalTitle, { color: textColor }]}>Nowa podróż</Text>
                <Text style={styles.addModalSubtitle}>Zaplanuj swoją następną przygodę</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.addModalClose}>
                <X size={20} color={subTextColor} />
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
              <TripFormField
                label="Cel podróży"
                icon={<MapPin size={18} color="#7B61FF" />}
                value={newDestination}
                onChangeText={setNewDestination}
                placeholder="np. Grecja, Ateny"
                textColor={textColor}
                isDarkMode={isDarkMode}
              />

              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <TripFormField
                    label="Data startu"
                    icon={<Calendar size={18} color="#7B61FF" />}
                    value={newStartDate}
                    onChangeText={setNewStartDate}
                    placeholder="15.07.2025"
                    textColor={textColor}
                    isDarkMode={isDarkMode}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TripFormField
                    label="Data końca"
                    icon={<Calendar size={18} color="#94A3B8" />}
                    value={newEndDate}
                    onChangeText={setNewEndDate}
                    placeholder="Opcjonalnie"
                    textColor={textColor}
                    isDarkMode={isDarkMode}
                  />
                </View>
              </View>

              <TripFormField
                label="Budżet"
                icon={<DollarSign size={18} color="#2ECC71" />}
                value={newBudget}
                onChangeText={setNewBudget}
                placeholder="np. 2500 PLN"
                textColor={textColor}
                isDarkMode={isDarkMode}
              />

              <TripFormField
                label="Notatki"
                icon={<FileText size={18} color="#7B61FF" />}
                value={newNotes}
                onChangeText={setNewNotes}
                placeholder="Dodatkowe informacje..."
                textColor={textColor}
                isDarkMode={isDarkMode}
                multiline
                numberOfLines={3}
              />

              <View style={styles.packingSection}>
                <View style={styles.packingSectionHeader}>
                  <View style={styles.packingSectionIcon}>
                    <Briefcase size={16} color="#7B61FF" />
                  </View>
                  <Text style={[styles.packingSectionTitle, { color: textColor }]}>Lista pakowania</Text>
                </View>

                {newPackingList.map((item, index) => (
                  <View key={index} style={styles.packingInputRow}>
                    <View style={[styles.packingInputWrap, { borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                      <Briefcase size={16} color="#94A3B8" />
                      <TextInput
                        placeholder={`Przedmiot ${index + 1}`}
                        placeholderTextColor="#94A3B8"
                        value={item.name}
                        onChangeText={value => handleChangePackingName(index, value)}
                        style={[styles.packingInput, { color: textColor }]}
                      />
                    </View>
                    {newPackingList.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemovePackingField(index)} style={styles.removeBtn}>
                        <Trash2 size={16} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.addPackingBtn} onPress={handleAddPackingField} activeOpacity={0.85}>
                  <Plus size={16} color="#7B61FF" />
                  <Text style={styles.addPackingBtnText}>Dodaj przedmiot</Text>
                </TouchableOpacity>
              </View>

              <SubmitTripButton onPress={handleAddTrip} label="Zapisz podróż" />
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      {selectedTrip ? renderDetails() : renderList()}
      {renderAddModal()}
      {renderTopBarModals()}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

  pageTitleRow: { marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, marginTop: 4, fontWeight: '500' },

  tripCard: { borderRadius: 24, marginBottom: 16, overflow: 'hidden' },
  cardImage: { height: 170, width: '100%', backgroundColor: '#E2E8F0', overflow: 'hidden' },
  cardImageGradient: { height: 170, width: '100%', justifyContent: 'flex-end' },
  imageGradient: { height: 220, width: '100%', justifyContent: 'flex-end' },
  imageOverlay: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { backgroundColor: 'rgba(46, 204, 113, 0.92)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: 'white', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  daysBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  daysText: { color: 'white', fontWeight: '700', fontSize: 11 },

  cardDetails: { padding: 16 },
  mainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  destText: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  infoText: { fontSize: 13, fontWeight: '600' },
  arrowCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(46,204,113,0.12)', justifyContent: 'center', alignItems: 'center' },

  divider: { height: 1, marginVertical: 14 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: '#94A3B8' },
  budgetValue: { fontSize: 16, fontWeight: '800', color: '#2ECC71', marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailsBtn: { borderRadius: 14, overflow: 'hidden' },
  detailsBtnGradient: { paddingHorizontal: 18, paddingVertical: 10 },
  detailsBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  deleteIconBtn: { padding: 8 },

  addCard: {
    height: 130,
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(123,97,255,0.04)',
  },
  addIconCircle: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(123,97,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  addText: { fontWeight: '700', fontSize: 14 },

  emptyCard: { padding: 40, borderRadius: 24, alignItems: 'center', gap: 12, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyHint: { textAlign: 'center', fontSize: 14 },

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
  dateRow: { flexDirection: 'row', gap: 12 },

  packingSection: {
    marginBottom: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  packingSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  packingSectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(123,97,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packingSectionTitle: { fontSize: 15, fontWeight: '800' },
  packingInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  packingInputWrap: {
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
  packingInput: { flex: 1, fontSize: 14, fontWeight: '500', paddingVertical: 10 },
  addPackingBtn: {
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
  addPackingBtnText: { color: '#7B61FF', fontWeight: '700', fontSize: 14 },
  removeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FF6B6B', justifyContent: 'center', alignItems: 'center' },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16, paddingHorizontal: 20 },
  backBtn: { fontWeight: '700', color: '#5152D6', fontSize: 15 },
  detailHeroWrap: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 16 },
  detailHero: { height: 220, width: '100%' },
  detailOverlay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14 },
  detailTitle: { fontSize: 28, fontWeight: '800', marginBottom: 16, paddingHorizontal: 20, letterSpacing: -0.5 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16, paddingHorizontal: 20, flexWrap: 'wrap' },
  statBox: { flex: 1, minWidth: 90, padding: 14, borderRadius: 18, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  countdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  countdownText: { fontSize: 15, fontWeight: '700', flex: 1 },

  notesBox: { padding: 16, borderRadius: 20, marginHorizontal: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  notesText: { fontSize: 14, lineHeight: 22 },

  packingBox: { padding: 18, borderRadius: 24, marginHorizontal: 20, marginBottom: 16 },
  packingHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  packingHeaderIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  packingSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  packProgressBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  packProgressFill: { height: 6, borderRadius: 3 },
  packingList: { marginTop: 4 },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FF6B6B33',
    backgroundColor: '#FF6B6B11',
    marginHorizontal: 20,
    marginTop: 8,
  },
  deleteBtnText: { color: '#FF6B6B', fontWeight: '700', fontSize: 15 },

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
});

export default TravelPlannerScreen;
