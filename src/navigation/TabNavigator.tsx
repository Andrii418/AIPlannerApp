import React, { useRef, useEffect } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  Text,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';
import {
  LayoutDashboard,
  BookOpen,
  CheckCircle2,
  Plane,
  BarChart,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import Dashboard from '../screens/Dashboard';
import TaskScreen from '../screens/TaskScreen';
import StudyPlannerScreen from '../screens/StudyPlannerScreen';
import TravelPlannerScreen from '../screens/TravelPlannerScreen';
import StatsScreen from '../screens/StatsScreen';

const { width } = Dimensions.get('window');
const MARGIN = 0;
const TAB_BAR_WIDTH = width - MARGIN * 2;
const TAB_WIDTH = TAB_BAR_WIDTH / 5;

const BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 72;
const HOLE_RADIUS = 35;

const Tab = createBottomTabNavigator();
const AnimatedPath = Animated.createAnimatedComponent(Path);

const AI_MODE_MAP: any = {
  Nauka: 'study',
  Podróże: 'travel',
};

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const aiNavigation = useNavigation<any>();

  useEffect(() => {
    Animated.spring(scrollX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: false,
      friction: 10,
      tension: 50,
    }).start();
  }, [state.index]);

  const routeName = state.routes[state.index].name;

  const createPath = (x: number) => {
    const center = x + TAB_WIDTH / 2;
    const smoothRadius = 15;

    return `
      M 0,0
      L ${center - HOLE_RADIUS - smoothRadius},0
      Q ${center - HOLE_RADIUS},0 ${center - HOLE_RADIUS},${smoothRadius}
      A ${HOLE_RADIUS},${HOLE_RADIUS} 0 0 0 ${center + HOLE_RADIUS},${smoothRadius}
      Q ${center + HOLE_RADIUS},0 ${center + HOLE_RADIUS + smoothRadius},0
      L ${TAB_BAR_WIDTH},0
      L ${TAB_BAR_WIDTH},${BAR_HEIGHT}
      L 0,${BAR_HEIGHT}
      Z
    `;
  };

  const d = scrollX.interpolate({
    inputRange: state.routes.map((_: any, i: number) => i * TAB_WIDTH),
    outputRange: state.routes.map((_: any, i: number) => createPath(i * TAB_WIDTH)),
  });

  return (
    <View style={styles.tabBarContainer}>
      <Svg width={TAB_BAR_WIDTH} height={BAR_HEIGHT}>
        <AnimatedPath d={d} fill="#5152D6" />
      </Svg>

      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.contentContainer}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
                <View style={[styles.iconWrapper, isFocused && styles.activeIconWrapper]}>
                  <TabIcon
                    name={route.name}
                    color="#fff"
                    size={isFocused ? 28 : 24}
                  />
                </View>

                {!isFocused && (
                  <Text style={styles.label}>{route.name}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {['Dashboard', 'Nauka', 'Podróże'].includes(routeName) && (
        <Pressable
          style={styles.floatingAIButton}
          onPress={() => {
            const mode = AI_MODE_MAP[routeName];
            if (mode) {
              aiNavigation.navigate('AIPlanner', { mode });
            } else {
              aiNavigation.navigate('AIPlanner');
            }
          }}
        >
          <Sparkles color="#fff" size={26} />
        </Pressable>
      )}
    </View>
  );
};

const TabIcon = ({ name, color, size }: any) => {
  const icons: any = {
    Dashboard: LayoutDashboard,
    Nauka: BookOpen,
    Zadania: CheckCircle2,
    Podróże: Plane,
    Statystyki: BarChart,
  };

  const Icon = icons[name] || LayoutDashboard;
  return <Icon color={color} size={size} />;
};

// Props przekazywane z App.tsx
interface TabNavigatorProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const TabNavigator = ({ isDarkMode, toggleDarkMode }: TabNavigatorProps) => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Zadania">
        {() => <TaskScreen isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>

      <Tab.Screen name="Nauka">
        {() => <StudyPlannerScreen isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>

      <Tab.Screen name="Dashboard">
        {() => <Dashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>

      <Tab.Screen name="Podróże">
        {() => <TravelPlannerScreen isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>

      <Tab.Screen name="Statystyki">
        {() => <StatsScreen isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: MARGIN,
    right: MARGIN,
    height: BAR_HEIGHT,
    backgroundColor: 'transparent',
  },

  contentContainer: {
    flexDirection: 'row',
    height: 70,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrapper: {
    width: 45,
    height: 45,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeIconWrapper: {
    backgroundColor: '#5152D6',
    top: -18,
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },

  label: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },

  floatingAIButton: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 140 : 110,
    backgroundColor: '#5152D6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#5152D6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});