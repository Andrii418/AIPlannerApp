import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import { Mail, Lock, User, ArrowRight } from 'lucide-react-native';
import { Colors } from '../theme';

const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Błąd", "Proszę wypełnić wszystkie pola");
      return;
    }
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      Alert.alert("Sukces", "Konto zostało utworzone!");
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Błąd', 'Ten e-mail jest już zajęty.');
      } else {
        Alert.alert('Błąd', error.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>Stwórz konto ✨</Text>
          <Text style={styles.subtitle}>Dołącz do Smart Planner</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Mail size={20} color="#64748B" style={styles.icon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock size={20} color="#64748B" style={styles.icon} />
            <TextInput
              placeholder="Hasło"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.mainButton} onPress={handleRegister}>
            <Text style={styles.buttonText}>Zarejestruj się</Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={styles.footerText}>Masz już konto? <Text style={styles.link}>Zaloguj się</Text></Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  inner: { flex: 1, padding: 25, justifyContent: 'center' },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 10 },
  form: { gap: 15, marginBottom: 30 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 60,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1E293B' },
  mainButton: {
    backgroundColor: '#7B61FF',
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '700' },
  footerText: { textAlign: 'center', color: '#64748B' },
  link: { color: '#7B61FF', fontWeight: '700' }
});

export default RegisterScreen;