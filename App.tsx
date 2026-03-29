import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import auth from '@react-native-firebase/auth';

import { TabNavigator } from './src/navigation/TabNavigator';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { Colors } from './src/theme';

const Stack = createStackNavigator();

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((userState) => {
      setUser(userState);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#1E1E2E' : '#F8FAFC'
      }}>
        <ActivityIndicator size="large" color="#7B61FF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="MainApp">
              {(props) => (
                <TabNavigator
                  {...props}
                  isDarkMode={isDarkMode}
                  toggleDarkMode={toggleDarkMode}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="LoginScreen" component={LoginScreen} />
              <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;