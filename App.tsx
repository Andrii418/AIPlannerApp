import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';

import { TabNavigator } from './src/navigation/TabNavigator';
import AIPlannerScreen from './src/screens/AIPlannerScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { Colors } from './src/theme';

const Stack = createStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((userState) => {
      setUser(userState);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={[styles.full, styles.center, { backgroundColor: isDarkMode ? Colors.darkBackground : '#F8F9FE' }]}>
        <ActivityIndicator size="large" color="#7B61FF" />
      </View>
    );
  }

  // Tworzymy komponenty z zamkniętymi props – unikamy re-renderów i problemów z undefined
  const MainAppScreen = () => (
    <TabNavigator
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
    />
  );

  return (
    <SafeAreaProvider>
      <View style={styles.full}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Globalne tło */}
        <View style={StyleSheet.absoluteFill}>
          {isDarkMode ? (
            <View style={[styles.full, { backgroundColor: Colors.darkBackground }]} />
          ) : (
            <LinearGradient
              colors={['#BFD3FF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.full}
            />
          )}
        </View>

        {/* Nawigacja bez własnego tła */}
        <NavigationContainer theme={MyTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: 'transparent' },
              detachPreviousScreen: false,
              cardStyleInterpolator: ({ current }) => ({
                cardStyle: {
                  opacity: current.progress,
                },
              }),
            }}
          >
            {user ? (
              <>
                {/* KLUCZOWA ZMIANA: komponent jako zmienna, nie inline render prop */}
                <Stack.Screen
                  name="MainApp"
                  component={MainAppScreen}
                />
                <Stack.Screen name="AIPlanner" component={AIPlannerScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="LoginScreen" component={LoginScreen} />
                <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  full: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
});

export default App;