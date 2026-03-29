import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { Mail, Lock, LogIn, RefreshCcw } from 'lucide-react-native';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Błąd", "Proszę wprowadzić adres e-mail i hasło");
      return;
    }
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      Alert.alert("Błąd", "Nieprawidłowy adres e-mail lub hasło");
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(
        "Wpisz email",
        "Proszę najpierw wpisać swój adres e-mail w polu powyżej, abyśmy mogli wysłać link do resetowania hasła."
      );
      return;
    }

    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        "Sprawdź e-mail",
        "Wysłaliśmy link do zresetowania hasła na Twój adres e-mail. Sprawdź również folder SPAM."
      );
    } catch (error: any) {
      let errorMessage = "Wystąpił błąd podczas wysyłania e-maila.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "Nie znaleziono użytkownika o tym adresie e-mail.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Adres e-mail jest nieprawidłowy.";
      }
      Alert.alert("Błąd", errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>Witaj ponownie! 👋</Text>
          <Text style={styles.subtitle}>Zaloguj się, aby kontynuować</Text>
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

          <TouchableOpacity
            style={styles.forgotPasswordBtn}
            onPress={handleResetPassword}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPasswordText}>Zapomniałeś hasła?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Zaloguj się</Text>
            <LogIn size={20} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')}>
          <Text style={styles.footerText}>
            Nie masz konta? <Text style={styles.link}>Zarejestruj się</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  inner: {
    flex: 1,
    padding: 25,
    justifyContent: 'center'
  },
  header: {
    marginBottom: 40
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B'
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 10
  },
  form: {
    gap: 15,
    marginBottom: 30
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 60,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B'
  },
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 5
  },
  forgotPasswordText: {
    color: '#7B61FF',
    fontSize: 14,
    fontWeight: '600'
  },
  mainButton: {
    backgroundColor: '#7B61FF',
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 5,
    shadowColor: '#7B61FF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700'
  },
  footerText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 15
  },
  link: {
    color: '#7B61FF',
    fontWeight: '700'
  }
});

export default LoginScreen;