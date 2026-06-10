import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { hideBootSplash } from '../utils/bootSplash';

const LoginScreen = ({ navigation }: any) => {
  useEffect(() => {
    hideBootSplash();
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Błąd', 'Proszę wprowadzić adres e-mail i hasło');
      return;
    }
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      Alert.alert('Błąd', 'Nieprawidłowy adres e-mail lub hasło');
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(
        'Wpisz email',
        'Proszę najpierw wpisać swój adres e-mail w polu powyżej, abyśmy mogli wysłać link do resetowania hasła.',
      );
      return;
    }

    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        'Sprawdź e-mail',
        'Wysłaliśmy link do zresetowania hasła na Twój adres e-mail. Sprawdź również folder SPAM.',
      );
    } catch (error: any) {
      let errorMessage = 'Wystąpił błąd podczas wysyłania e-maila.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Nie znaleziono użytkownika o tym adresie e-mail.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Adres e-mail jest nieprawidłowy.';
      }
      Alert.alert('Błąd', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#EEF2FF', '#FFFFFF', '#F8FAFC']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
            <Text style={styles.title}>Witaj ponownie</Text>
            <Text style={styles.subtitle}>Zaloguj się, aby kontynuować planowanie</Text>
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
                placeholder="Hasło"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>

            <TouchableOpacity style={styles.forgotPasswordBtn} onPress={handleResetPassword} activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>Zapomniałeś hasła?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} activeOpacity={0.9}>
              <LinearGradient colors={['#7B61FF', '#5152D6']} style={styles.mainButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.buttonText}>Zaloguj się</Text>
                <LogIn size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(320).springify()}>
            <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')} activeOpacity={0.8}>
              <Text style={styles.footerText}>
                Nie masz konta? <Text style={styles.link}>Zarejestruj się</Text>
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
  forgotPasswordBtn: { alignSelf: 'flex-end', paddingVertical: 4 },
  forgotPasswordText: { color: '#7B61FF', fontSize: 14, fontWeight: '600' },
  mainButton: {
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  buttonText: { color: 'white', fontSize: 17, fontWeight: '700' },
  footerText: { textAlign: 'center', color: '#64748B', fontSize: 15 },
  link: { color: '#7B61FF', fontWeight: '700' },
});

export default LoginScreen;
