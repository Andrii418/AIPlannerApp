import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GROQ_API_KEY } from '@env';
import {
  ChevronLeft,
  Send,
  Plane,
  GraduationCap,
  Sparkles,
  Save,
  MapPin,
  DollarSign,
  Calendar
} from 'lucide-react-native';

import { getAuth } from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');
const API_KEY = GROQ_API_KEY;
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const AIPlannerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scrollViewRef = useRef<ScrollView>(null);

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  // Pobieramy tryb początkowy
  const initialMode = route.params?.mode ?? 'selection';
  const isLocked = initialMode === 'study' || initialMode === 'travel';

  const [mode, setMode] = useState<'study' | 'travel'>(
    initialMode === 'selection' ? 'travel' : initialMode
  );

  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [tempPlanText, setTempPlanText] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formDate, setFormDate] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [chatHistory, loading]);

  const askAI = async () => {
    if (!userInput.trim() || loading || !user) return;

    const textToSubmit = userInput;
    setChatHistory(prev => [...prev, { role: 'user', text: textToSubmit }]);
    setUserInput('');
    setLoading(true);

    const prompt = mode === 'study'
      ? "Jesteś generatorem planów nauki. ODPOWIADAJ WYŁĄCZNIE W FORMACIE: 'DZIEŃ X' a pod nim lista zadań od myślników (-). Zakaz pisania wstępów, powitań i podsumowań."
      : "Jesteś generatorem planów podróży. ODPOWIADAJ WYŁĄCZNIE W FORMACIE: 'DZIEŃ X' a pod nim lista atrakcji od myślników (-). Zakaz pisania wstępów i zbędnych zdań.";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "system", content: prompt }, { role: "user", content: textToSubmit }],
          temperature: 0.6
        })
      });
      const data = await response.json();
      const aiText = data.choices[0]?.message?.content || "Błąd komunikacji.";
      setChatHistory(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (e) {
      Alert.alert("Błąd", "Brak połączenia z AI.");
    } finally {
      setLoading(false);
    }
  };

  const openSaveForm = (aiText: string) => {
    setTempPlanText(aiText);
    setFormDestination('');
    setFormBudget('');
    setFormDate('');
    setShowModal(true);
  };

  const handleFinalSave = async () => {
    if (!user) return;
    if (!formDestination.trim()) {
      Alert.alert("Błąd", mode === 'travel' ? "Wpisz cel podróży!" : "Wpisz nazwę planu!");
      return;
    }

    try {
      setLoading(true);
      const items: any[] = [];
      let topicsCounter = 0;

      tempPlanText.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 2) return;
        if (trimmed.toLowerCase().includes('dzień') || trimmed.toLowerCase().includes('tydzień')) {
          items.push({ name: trimmed.toUpperCase(), completed: false, isHeader: true });
        } else {
          const clean = trimmed.replace(/^[-*•\d.)]+\s*/, '').trim();
          items.push({ name: clean, completed: false });
          topicsCounter++;
        }
      });

      const collectionName = mode === 'study' ? 'studyPlans' : 'trips';
      const payload = {
        createdAt: serverTimestamp(),
        ...(mode === 'study' ? {
          name: formDestination,
          date: formDate || new Date().toLocaleDateString('pl-PL'),
          topicsList: items,
          totalTopics: topicsCounter,
          topicsCompleted: 0,
          progress: 0,
        } : {
          destination: formDestination,
          startDate: formDate || new Date().toLocaleDateString('pl-PL'),
          budget: formBudget ? formBudget + " PLN" : "Do ustalenia",
          checkpoints: items,
          status: "Nadchodząca",
          image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=500'
        })
      };

      const userDocRef = collection(db, 'users', user.uid, collectionName);
      await addDoc(userDocRef, payload);
      setShowModal(false);
      Alert.alert("Sukces!", "Plan został dodany.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Błąd", "Nie udało się zapisać.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#5152D6" size={28} />
        </TouchableOpacity>

        {isLocked ? (

          <View style={styles.headerTitleContainer}>
            {mode === 'travel' ? <Plane size={20} color="#5152D6" /> : <GraduationCap size={20} color="#5152D6" />}
            <Text style={styles.headerTitle}>
              {mode === 'travel' ? "Planer Podróży AI" : "Planer Nauki AI"}
            </Text>
          </View>
        ) : (

          <View style={styles.modeSwitcher}>
            <TouchableOpacity
              style={[styles.modeItem, mode === 'study' && styles.modeActive]}
              onPress={() => { setMode('study'); setChatHistory([]); }}
            >
              <GraduationCap size={18} color={mode === 'study' ? "#FFF" : "#64748B"} />
              <Text style={[styles.modeText, mode === 'study' && styles.modeTextActive]}>Nauka</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeItem, mode === 'travel' && styles.modeActive]}
              onPress={() => { setMode('travel'); setChatHistory([]); }}
            >
              <Plane size={18} color={mode === 'travel' ? "#FFF" : "#64748B"} />
              <Text style={[styles.modeText, mode === 'travel' && styles.modeTextActive]}>Podróż</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          {chatHistory.length === 0 && (
            <View style={styles.welcome}>
              <Sparkles color="#5152D6" size={45} />
              <Text style={styles.welcomeTitle}>Asystent {mode === 'travel' ? 'Podróży' : 'Nauki'}</Text>
              <Text style={styles.welcomeSubtitle}>
                {mode === 'travel'
                  ? "Stworzę  dla Ciebie plan wycieczki."
                  : "Przygotuję dla Ciebie harmonogram."}
              </Text>
            </View>
          )}

          {chatHistory.map((msg, i) => (
            <View key={i} style={{ marginBottom: 20 }}>
              <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={msg.role === 'user' ? styles.uText : styles.aText}>{msg.text}</Text>
              </View>

              {msg.role === 'ai' && !loading && (
                <TouchableOpacity style={styles.inlineSaveBtn} onPress={() => openSaveForm(msg.text)}>
                  <Save color="#FFF" size={16} />
                  <Text style={styles.inlineSaveText}>DODAJ DO PLANERA</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {loading && <ActivityIndicator color="#5152D6" style={{ margin: 20 }} />}
        </ScrollView>

        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder={mode === 'travel' ? "Np. Plan podróży do Rzymu na 3 dni" : "Np. Harmonogram nauki do matury z biologii"}
              value={userInput}
              onChangeText={setUserInput}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={askAI} disabled={!userInput.trim() || loading}>
              <Send color="#FFF" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>


      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconCircle}>
              <Sparkles color="#5152D6" size={30} />
            </View>
            <Text style={styles.modalTitle}>Ostatni krok</Text>
            <Text style={styles.modalSub}>Uzupełnij dane dla Twojego planu</Text>

            <View style={styles.modalInputWrapper}>
              <MapPin size={20} color="#94A3B8" style={{ marginRight: 10 }} />
              <TextInput
                placeholder={mode === 'travel' ? "Dokąd lecisz?" : "Nazwa przedmiotu / egzaminu"}
                placeholderTextColor="#94A3B8"
                value={formDestination}
                onChangeText={setFormDestination}
                style={styles.modalInput}
              />
            </View>

            <View style={styles.modalInputWrapper}>
              <Calendar size={20} color="#94A3B8" style={{ marginRight: 10 }} />
              <TextInput
                placeholder={mode === 'travel' ? "Data (np. 15.06.2024)" : "Data (np. 20.05.2024)"}
                placeholderTextColor="#94A3B8"
                value={formDate}
                onChangeText={setFormDate}
                style={styles.modalInput}
              />
            </View>

            {mode === 'travel' && (
              <View style={styles.modalInputWrapper}>
                <DollarSign size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Budżet (opcjonalnie)"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={formBudget}
                  onChangeText={setFormBudget}
                  style={styles.modalInput}
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setShowModal(false)}>
                <Text style={{ color: '#64748B', fontWeight: '700' }}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#5152D6' }]} onPress={handleFinalSave}>
                <Text style={{ color: 'white', fontWeight: '700' }}>Zapisz plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    paddingBottom: 10,
    paddingTop: Platform.OS === 'android' ? 45 : 10
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E293B' },
  modeSwitcher: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 20, flex: 1, marginHorizontal: 15, padding: 3 },
  modeItem: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, borderRadius: 18, gap: 5 },
  modeActive: { backgroundColor: '#5152D6' },
  modeText: { fontSize: 12, fontWeight: 'bold', color: '#64748B' },
  modeTextActive: { color: '#FFF' },
  backBtn: { padding: 5 },
  chatArea: { flex: 1, backgroundColor: '#F9FAFB' },
  welcome: { alignItems: 'center', marginTop: 50, paddingHorizontal: 40 },
  welcomeTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 15 },
  welcomeSubtitle: { color: '#666', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  bubble: { padding: 14, borderRadius: 18, maxWidth: '85%', marginBottom: 5 },
  userBubble: { backgroundColor: '#5152D6', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  aiBubble: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#EEE' },
  uText: { color: '#FFF', fontSize: 15 },
  aText: { color: '#333', fontSize: 15, lineHeight: 22 },
  inlineSaveBtn: { flexDirection: 'row', backgroundColor: '#10B981', alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12, alignItems: 'center', marginLeft: 5, marginBottom: 15 },
  inlineSaveText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, marginLeft: 6 },
  inputArea: { padding: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE', marginBottom: 20  },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 25, paddingHorizontal: 15 },
  textInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#000' },
  sendBtn: { backgroundColor: '#5152D6', padding: 10, borderRadius: 20, marginLeft: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.88, backgroundColor: 'white', borderRadius: 28, padding: 25, alignItems: 'center' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(81, 82, 214, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  modalSub: { color: '#64748B', marginBottom: 20, textAlign: 'center', fontSize: 14 },
  modalInputWrapper: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 15, marginBottom: 12 },
  modalInput: { flex: 1, height: 55, color: '#1E293B', fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 10 },
  modalBtn: { flex: 1, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }
});

export default AIPlannerScreen;