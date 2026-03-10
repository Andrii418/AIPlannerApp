import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabNavigator } from './src/navigation/TabNavigator';
import { StatusBar } from 'react-native';
import { Colors } from './src/theme';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? Colors.darkBackground : Colors.background}
      />
      <NavigationContainer>
        <TabNavigator isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;