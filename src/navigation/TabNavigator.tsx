import React, { useRef, useEffect } from 'react';
import { View, Pressable, StyleSheet, Dimensions, Animated, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';
import { LayoutDashboard, BookOpen, CheckCircle2, Plane, BarChart } from 'lucide-react-native';


import Dashboard from '../screens/Dashboard';
import TaskScreen from '../screens/TaskScreen';
import StudyPlannerScreen from '../screens/StudyPlannerScreen';
import TravelPlannerScreen from '../screens/TravelPlannerScreen';
import StatsScreen from '../screens/StatsScreen';

const { width } = Dimensions.get('window');
const MARGIN = 0;
const TAB_BAR_WIDTH = width - MARGIN * 2;
const TAB_WIDTH = TAB_BAR_WIDTH / 5;
const BAR_HEIGHT = 70;
const HOLE_RADIUS = 35;

const Tab = createBottomTabNavigator();
const AnimatedPath = Animated.createAnimatedComponent(Path);

const CustomTabBar = ({ state, descriptors, navigation, isDarkMode }: any) => {
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scrollX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: false,
      friction: 10,
      tension: 50,
    }).start();
  }, [state.index]);

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
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || route.name;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
                <View style={[
                  styles.iconWrapper,
                  isFocused && styles.activeIconWrapper
                ]}>
                  <TabIcon
                    name={route.name}
                    color="#FFFFFF"
                    size={isFocused ? 28 : 24}
                  />
                </View>
                {!isFocused && <Text style={styles.label}>{label}</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>
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

export const TabNavigator = ({ isDarkMode, toggleDarkMode }: any) => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard" // Dashboard активний при вході
      tabBar={(props) => <CustomTabBar {...props} isDarkMode={isDarkMode} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Zadania" options={{ tabBarLabel: 'Zadania' }}>
        {() => <TaskScreen isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>

      <Tab.Screen name="Nauka" options={{ tabBarLabel: 'Nauka' }}>
        {() => <StudyPlannerScreen isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>

      <Tab.Screen name="Dashboard" options={{ tabBarLabel: 'Główna' }}>
        {() => <Dashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>

      <Tab.Screen name="Podróże" options={{ tabBarLabel: 'Podróże' }}>
        {() => <TravelPlannerScreen isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>

      <Tab.Screen name="Statystyki" options={{ tabBarLabel: 'Analiza' }}>
        {() => <StatsScreen isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: MARGIN,
    right: MARGIN,
    height: BAR_HEIGHT,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  contentContainer: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
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
    top: -20,
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  }
});