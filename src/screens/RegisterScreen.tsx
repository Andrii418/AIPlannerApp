import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Błąd', 'Proszę wypełnić wszystkie pola');
      return;
    }
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      Alert.alert('Sukces', 'Konto zostało utworzone!');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Błąd', 'Ten e-mail jest już zajęty.');
      } else {
        Alert.alert('Błąd', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#F0FDF4', '#FFFFFF', '#F8FAFC']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(500)} style={styles.brandRow}>
            <LinearGradient colors={['#7B61FF', '#5152D6']} style={styles.brandIcon}>
              <Sparkles size={22} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.brandName}>SmartPlanner</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
            <Text style={styles.title}>Stwórz konto</Text>
            <Text style={styles.subtitle}>Dołącz do SmartPlanner i planuj z AI</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.formCard}>
            <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
              <Mail size={20} color={emailFocused ? '#7B61FF' : '#94A3B8'} />
              <TextInput
                placeholder="Adres e-mail"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <View style={[styles.inputWrapper, passwordFocused && styles.inputFocused]}>
              <Lock size={20} color={passwordFocused ? '#7B61FF' : '#94A3B8'} />
              <TextInput
                placeholder="Hasło (min. 6 znaków)"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>

            <TouchableOpacity onPress={handleRegister} activeOpacity={0.9}>
              <LinearGradient colors={['#7B61FF', '#5152D6']} style={styles.mainButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.buttonText}>Zarejestruj się</Text>
                <ArrowRight size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(320).springify()}>
            <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')} activeOpacity={0.8}>
              <Text style={styles.footerText}>
                Masz już konto? <Text style={styles.link}>Zaloguj się</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 40, justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 36 },
  brandIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  brandName: { fontSize: 20, fontWeight: '800', color: '#1E293B', letterSpacing: -0.3 },
  header: { marginBottom: 28 },
  title: { fontSize: 34, fontWeight: '800', color: '#0F172A', letterSpacing: -0.8 },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 10, lineHeight: 24 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    gap: 14,
    marginBottom: 28,
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24 },
      android: { elevation: 6 },
    }),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 58,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  inputFocused: { borderColor: '#7B61FF', backgroundColor: '#FFFFFF' },
  input: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  mainButton: {
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  buttonText: { color: 'white', fontSize: 17, fontWeight: '700' },
  footerText: { textAlign: 'center', color: '#64748B', fontSize: 15 },
  link: { color: '#7B61FF', fontWeight: '700' },
});

export default RegisterScreen;
