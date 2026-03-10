import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, BookOpen, CheckCircle2, Plane, BarChart } from 'lucide-react-native';
import Dashboard from '../screens/Dashboard';
import { Colors } from '../theme';

const Tab = createBottomTabNavigator();

export const TabNavigator = ({ isDarkMode, toggleDarkMode }: any) => {
  const barColor = isDarkMode ? Colors.darkCard : Colors.white;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          height: 65,
          borderRadius: 25,
          backgroundColor: barColor, // Dynamiczny kolor tła paska
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: isDarkMode ? 0.4 : 0.1,
          shadowRadius: 10,
          paddingBottom: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 5 }
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          tabBarLabel: 'Główna'
        }}
      >
        {() => <Dashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>

      {/* Inne zakładki również mogą korzystać z Dashboardu jako placeholder */}
      <Tab.Screen name="Nauka" options={{ tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />, tabBarLabel: 'Nauka' }}>
        {() => <Dashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>

      <Tab.Screen name="Zadania" options={{ tabBarIcon: ({ color, size }) => <CheckCircle2 color={color} size={size} />, tabBarLabel: 'Zadania' }}>
        {() => <Dashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>

      <Tab.Screen name="Podróże" options={{ tabBarIcon: ({ color, size }) => <Plane color={color} size={size} />, tabBarLabel: 'Podróże' }}>
        {() => <Dashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>

      <Tab.Screen name="Statystyki" options={{ tabBarIcon: ({ color, size }) => <BarChart color={color} size={size} />, tabBarLabel: 'Analiza' }}>
        {() => <Dashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};