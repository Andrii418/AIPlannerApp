import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Colors } from '../theme';
import {
  BarChart3,
  Target,
  BookOpen,
  CheckCircle2,
  Plane,
  Clock,
  Award,
  Activity,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Timer,
  Bell,
  LogOut,
  Settings,
  X,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';
import TopBar, { TOP_BAR_HEIGHT } from '../components/TopBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 76;
const CHART_HEIGHT = 120;

type RangeKey = 'day' | 'week' | 'month';
const RANGE_TABS: { key: RangeKey; label: string }[] = [
  { key: 'day', label: 'Dzień' },
  { key: 'week', label: 'Tydzień' },
  { key: 'month', label: 'Miesiąc' },
];
const RANGE_DAYS: Record<RangeKey, number> = { day: 1, week: 7, month: 30 };

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const cardShadow = Platform.select({
  ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
  android: { elevation: 4 },
});

const getCreatedDate = (item: any): Date | null => {
  const raw = item?.createdAt;
  if (!raw) return null;
  if (typeof raw.toDate === 'function') return raw.toDate();
  if (raw instanceof Date) return raw;
  return null;
};

const filterPlansByRange = (plans: any[], range: RangeKey): any[] => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const cutoff = new Date();
  if (range === 'day') {
    cutoff.setHours(0, 0, 0, 0);
  } else {
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range] + 1);
    cutoff.setHours(0, 0, 0, 0);
  }
  return plans.filter(plan => {
    const created = getCreatedDate(plan);
    if (!created) return range === 'month';
    return created >= cutoff && created <= now;
  });
};

const buildSmoothPath = (data: number[], w: number, h: number, maxVal: number) => {
  if (data.length === 0) return { linePath: '', areaPath: '', points: [] as { x: number; y: number }[] };
  const max = maxVal || Math.max(...data, 1);
  const step = w / Math.max(data.length - 1, 1);
  const points = data.map((v, i) => ({
    x: i * step,
    y: h - 12 - (Math.max(v, 0) / max) * (h - 28),
  }));

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    linePath += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;
  return { linePath, areaPath, points };
};

const AnimatedProgressBar = ({
  progress,
  colors = ['#7B61FF', '#A78BFA'],
  trackColor = 'rgba(0,0,0,0.06)',
  height = 4,
}: {
  progress: number;
  colors?: string[];
  trackColor?: string;
  height?: number;
}) => {
  const barWidth = useSharedValue(0);
  useEffect(() => {
    barWidth.value = withDelay(150, withTiming(progress, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [progress]);
  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value}%` as any }));
  return (
    <View style={[styles.progressBarBg, { backgroundColor: trackColor, height, borderRadius: height / 2 }]}>
      <Animated.View style={[styles.progressBarFill, barStyle, { height, borderRadius: height / 2 }]}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
};

const AnimatedNumber = ({ value, style, suffix = '' }: { value: number; style: any; suffix?: string }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const startTime = Date.now();
    const duration = 750;
    const update = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [value]);
  return <Text style={style}>{display}{suffix}</Text>;
};

const AnimatedDecimal = ({ value, style, decimals = 1, suffix = '' }: { value: number; style: any; decimals?: number; suffix?: string }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const startTime = Date.now();
    const duration = 800;
    const update = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Number((eased * value).toFixed(decimals)));
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [value, decimals]);
  return <Text style={style}>{display}{suffix}</Text>;
};

const TrendIndicator = ({ isUp, label }: { isUp: boolean; label: string }) => {
  const pulse = useSharedValue(1);
  const wobble = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      true,
    );
    wobble.value = withRepeat(
      withSequence(withTiming(isUp ? -6 : 6, { duration: 600 }), withTiming(isUp ? 4 : -4, { duration: 600 })),
      -1,
      true,
    );
  }, [isUp]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }, { rotate: `${wobble.value}deg` }],
  }));

  const color = isUp ? '#2ECC71' : '#FF6B6B';
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <View style={[styles.trendBadge, { backgroundColor: `${color}18` }]}>
      <Animated.View style={iconStyle}>
        <Icon size={16} color={color} />
      </Animated.View>
      <Text style={[styles.trendLabel, { color }]}>{label}</Text>
    </View>
  );
};

// Range Tabs (sliding pill)
const RangeTabs = ({
  active,
  onChange,
  isDarkMode,
}: {
  active: RangeKey;
  onChange: (k: RangeKey) => void;
  isDarkMode: boolean;
}) => {
  const tabWidth = (SCREEN_WIDTH - 40 - 8) / 3;
  const slideX = useSharedValue(RANGE_TABS.findIndex(t => t.key === active) * tabWidth);

  useEffect(() => {
    const idx = RANGE_TABS.findIndex(t => t.key === active);
    slideX.value = withSpring(idx * tabWidth, { damping: 20, stiffness: 220, mass: 0.8 });
  }, [active, tabWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
    width: tabWidth,
  }));

  const trackBg = isDarkMode ? '#1E293B' : '#F1F5F9';

  return (
    <View style={[styles.tabTrack, { backgroundColor: trackBg }]}>
      <Animated.View style={[styles.tabPill, pillStyle]}>
        <LinearGradient colors={['#7B61FF', '#5152D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {RANGE_TABS.map(tab => {
        const selected = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, { width: tabWidth }]}
            activeOpacity={0.85}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.tabLabel, { color: selected ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Insight Card
const InsightCard = ({
  index,
  icon,
  iconBg,
  title,
  value,
  subtitle,
  cardBg,
  textColor,
  subTextColor,
}: any) => (
  <Animated.View
    entering={FadeInDown.delay(180 + index * 90).springify()}
    style={[styles.insightCard, { backgroundColor: cardBg }, cardShadow]}
  >
    <View style={[styles.insightIcon, { backgroundColor: iconBg }]}>{icon}</View>
    <Text style={[styles.insightTitle, { color: subTextColor }]}>{title}</Text>
    <Text style={[styles.insightValue, { color: textColor }]} numberOfLines={1}>{value}</Text>
    <Text style={[styles.insightSub, { color: subTextColor }]} numberOfLines={1}>{subtitle}</Text>
  </Animated.View>
);

// Animated Line Chart
const AnimatedLineChart = ({
  data,
  labels,
  colors,
  maxVal,
  textColor,
}: {
  data: number[];
  labels: string[];
  colors: [string, string];
  maxVal: number;
  textColor: string;
}) => {
  const drawProgress = useSharedValue(0);
  const { linePath, areaPath, points } = useMemo(
    () => buildSmoothPath(data, CHART_WIDTH, CHART_HEIGHT, maxVal),
    [data, maxVal],
  );
  const pathLength = Math.max(linePath.length * 1.4, 320);

  useEffect(() => {
    drawProgress.value = 0;
    drawProgress.value = withDelay(200, withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
  }, [data]);

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: pathLength * (1 - drawProgress.value),
  }));

  const areaProps = useAnimatedProps(() => ({
    opacity: drawProgress.value * 0.35,
  }));

  if (data.length === 0) {
    return (
      <View style={[styles.lineChartEmpty, { height: CHART_HEIGHT }]}>
        <Text style={{ color: textColor, opacity: 0.5, fontSize: 13 }}>Brak danych w tym zakresie</Text>
      </View>
    );
  }

  return (
    <View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <SvgLinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors[0]} stopOpacity="1" />
            <Stop offset="1" stopColor={colors[1]} stopOpacity="1" />
          </SvgLinearGradient>
          <SvgLinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors[0]} stopOpacity="0.35" />
            <Stop offset="1" stopColor={colors[1]} stopOpacity="0.02" />
          </SvgLinearGradient>
        </Defs>
        <AnimatedPath d={areaPath} fill="url(#areaGrad)" animatedProps={areaProps} />
        <AnimatedPath
          d={linePath}
          stroke="url(#lineGrad)"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          animatedProps={lineProps}
        />
        {points.map((p, i) => (
          <AnimatedCircle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#FFFFFF"
            stroke={colors[0]}
            strokeWidth={2}
          />
        ))}
      </Svg>
      <View style={styles.lineLabelsRow}>
        {labels.map((lbl, i) => (
          <Text key={i} style={[styles.lineLabel, { color: textColor }]} numberOfLines={1}>
            {lbl}
          </Text>
        ))}
      </View>
    </View>
  );
};

// Gradient Bar Chart
const GradientBarChart = ({
  data,
  labels,
  colors,
  maxVal,
}: {
  data: number[];
  labels: string[];
  colors: [string, string];
  maxVal: number;
}) => {
  const max = maxVal || Math.max(...data, 1);
  return (
    <View style={styles.gradientBarRow}>
      {data.map((val, i) => (
        <GradientBar key={`${i}-${val}`} val={val} max={max} index={i} colors={colors} label={labels[i]} />
      ))}
    </View>
  );
};

const GradientBar = ({
  val,
  max,
  index,
  colors,
  label,
}: {
  val: number;
  max: number;
  index: number;
  colors: [string, string];
  label?: string;
}) => {
  const height = useSharedValue(4);
  useEffect(() => {
    const target = Math.max(6, (val / max) * 72);
    height.value = withDelay(index * 80, withSpring(target, { damping: 14, stiffness: 120 }));
  }, [val, max, index]);

  const barStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View style={styles.gradientBarCol}>
      <Animated.View style={[styles.gradientBar, barStyle]}>
        <LinearGradient colors={colors} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {label ? <Text style={styles.barLabel} numberOfLines={1}>{label}</Text> : null}
    </View>
  );
};

//  Circular Progress
const CircleProgress = ({ percent, color, size = 80 }: { percent: number; color: string; size?: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / 900, 1);
      setDisplay(Math.round((1 - Math.pow(1 - t, 3)) * percent));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [percent]);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 8, borderColor: color + '22' }} />
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 8,
          borderColor: 'transparent',
          borderTopColor: percent > 0 ? color : 'transparent',
          borderRightColor: percent > 25 ? color : 'transparent',
          borderBottomColor: percent > 50 ? color : 'transparent',
          borderLeftColor: percent > 75 ? color : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }}
      />
      <Text style={{ fontSize: 16, fontWeight: '900', color }}>{display}%</Text>
    </View>
  );
};

// Stat Tile
const StatTile = ({
  index,
  icon,
  iconBg,
  children,
  label,
  sub,
  subColor = '#7B61FF',
  progress,
  progressColors,
  cardBg,
  subTextColor,
}: any) => (
  <Animated.View entering={FadeInDown.delay(360 + index * 75).springify()} style={[styles.statTile, { backgroundColor: cardBg }, cardShadow]}>
    <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>{icon}</View>
    {children}
    <Text style={[styles.statTileLabel, { color: subTextColor }]}>{label}</Text>
    {sub ? <Text style={[styles.statTileSub, { color: subColor }]}>{sub}</Text> : null}
    {progress !== undefined ? (
      <View style={styles.smallProgressBg}>
        <AnimatedProgressBar progress={progress} colors={progressColors} height={5} />
      </View>
    ) : null}
  </Animated.View>
);

const StatsScreen = ({ isDarkMode, toggleDarkMode }: any) => {
  const screenBg = isDarkMode ? '#0B0F19' : '#FFFFFF';
  const textColor = isDarkMode ? Colors.darkText : '#1E293B';
  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = isDarkMode ? Colors.darkBorder : 'rgba(0,0,0,0.05)';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';
  const trackColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const [rangeTab, setRangeTab] = useState<RangeKey>('week');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // STAN DANYCH
  const [loading, setLoading] = useState(true);

  // Tasks
  const [tasksDone, setTasksDone] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [tasksByPriority, setTasksByPriority] = useState({ high: 0, medium: 0, low: 0 });

  // Study Plans
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [avgStudyProgress, setAvgStudyProgress] = useState(0);
  const [totalStudyHours, setTotalStudyHours] = useState(0);

  // Trips
  const [tripsTotal, setTripsTotal] = useState(0);
  const [tripsUpcoming, setTripsUpcoming] = useState(0);
  const [nextTrip, setNextTrip] = useState<any>(null);

  // POBIERANIE Z FIRESTORE

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubAuth = auth().onAuthStateChanged(user => {
      unsubs.forEach(u => u());
      unsubs = [];

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      let loadedCount = 0;
      const checkDone = () => {
        loadedCount++;
        if (loadedCount >= 3) setLoading(false);
      };

      // TASKS
      const unsubTasks = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('tasks')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => d.data());
          setTasksTotal(docs.length);
          setTasksDone(docs.filter(t => t.completed).length);
          setTasksByPriority({
            high: docs.filter(t => t.priority === 'Wysoki' || t.priority === 'high').length,
            medium: docs.filter(t => t.priority === 'Średni' || t.priority === 'medium').length,
            low: docs.filter(t => t.priority === 'Niski' || t.priority === 'low').length,
          });
          checkDone();
        }, () => checkDone());

      // STUDY PLANS
      const unsubStudy = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('studyPlans')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => d.data());
          setStudyPlans(docs);
          const avg = docs.length > 0
            ? Math.round(docs.reduce((acc, d) => acc + (d.progress || 0), 0) / docs.length)
            : 0;
          setAvgStudyProgress(avg);
          const hours = docs.reduce((acc, d) => acc + (Number(d.hours) || 0), 0);
          setTotalStudyHours(Math.round(hours * 10) / 10);
          checkDone();
        }, () => checkDone());

      // TRIPS
      const unsubTrips = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('trips')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setTripsTotal(docs.length);

          const now = new Date();
          now.setHours(0, 0, 0, 0);

          const upcoming = docs.filter(t => {
            const d = parseDate(t.startDate || t.date || '');
            return d && d >= now;
          });

          setTripsUpcoming(upcoming.length);

          // Najbliższa podróż
          const sorted = upcoming.sort((a, b) => {
            const da = parseDate(a.startDate || a.date || '');
            const db = parseDate(b.startDate || b.date || '');
            return (da?.getTime() || 0) - (db?.getTime() || 0);
          });
          setNextTrip(sorted[0] || null);
          checkDone();
        }, () => checkDone());

      unsubs = [unsubTasks, unsubStudy, unsubTrips];
    });

    return () => {
      unsubs.forEach(u => u());
      unsubAuth();
    };
  }, []);

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    let d: Date;
    if (dateStr.includes('.')) {
      const p = dateStr.split('.');
      d = new Date(`${p[2]}-${p[1]}-${p[0]}`);
    } else if (dateStr.includes('-')) {
      const p = dateStr.split('-');
      d = p[0].length === 4 ? new Date(dateStr) : new Date(`${p[2]}-${p[1]}-${p[0]}`);
    } else {
      return null;
    }
    return isNaN(d.getTime()) ? null : d;
  };

  const calcDaysLeft = (dateStr: string): number => {
    const d = parseDate(dateStr);
    if (!d) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const tasksPercent = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  const overallScore = Math.round((avgStudyProgress + tasksPercent) / 2);
  const pendingTasksCount = tasksTotal - tasksDone;
  const incompletePlans = studyPlans.filter(p => (p.progress || 0) < 100);
  const hasNotification = pendingTasksCount > 0 || !!nextTrip || incompletePlans.length > 0;

  const handleLogout = async () => {
    try {
      setShowSettings(false);
      await auth().signOut();
    } catch (error) {
      console.error('Błąd podczas wylogowywania:', error);
    }
  };

  // Dane do wykresu słupkowego — postępy planów nauki
  const studyChartData = studyPlans.slice(0, 6).map(p => p.progress || 0);
  const priorityData = [tasksByPriority.high, tasksByPriority.medium, tasksByPriority.low];

  // Derived UI data (z istniejących stanów — bez nowych zapytań)
  const rangeInsights = useMemo(() => {
    const filtered = filterPlansByRange(studyPlans, rangeTab);
    const scopedPlans = filtered.length > 0 ? filtered : studyPlans;

    const scopedProgress = scopedPlans.length > 0
      ? Math.round(scopedPlans.reduce((acc, p) => acc + (p.progress || 0), 0) / scopedPlans.length)
      : avgStudyProgress;

    const scopedHours = scopedPlans.reduce((acc, p) => acc + (Number(p.hours) || 0), 0);
    const avgHours = scopedPlans.length > 0 ? Math.round((scopedHours / scopedPlans.length) * 10) / 10 : 0;

    const bestPlan = scopedPlans.reduce<any | null>((best, plan) => {
      if (!best || (plan.progress || 0) > (best.progress || 0)) return plan;
      return best;
    }, null);

    const trendUp = scopedProgress >= tasksPercent || overallScore >= 55;
    const trendDelta = Math.abs(scopedProgress - tasksPercent);

    const lineData = scopedPlans.slice(0, 6).map(p => p.progress || 0);
    const lineLabels = scopedPlans.slice(0, 6).map(p =>
      p.name?.length > 8 ? `${p.name.slice(0, 8)}…` : p.name || 'Plan',
    );

    const fallbackLine = [tasksPercent, avgStudyProgress, overallScore, tripsUpcoming * 10].slice(0, 4);
    const fallbackLabels = ['Zadania', 'Nauka', 'Wynik', 'Podróże'];

    return {
      filteredPlans: scopedPlans,
      scopedProgress,
      scopedHours,
      avgHours,
      bestPlan,
      trendUp,
      trendDelta,
      lineData: lineData.length >= 2 ? lineData : fallbackLine,
      lineLabels: lineData.length >= 2 ? lineLabels : fallbackLabels,
      chartData: scopedPlans.slice(0, 6).map(p => p.progress || 0),
      chartLabels: scopedPlans.slice(0, 6).map(p =>
        p.name?.length > 6 ? `${p.name.slice(0, 6)}…` : p.name || '—',
      ),
    };
  }, [rangeTab, studyPlans, avgStudyProgress, tasksPercent, overallScore, tripsUpcoming]);

  const rangeLabel = RANGE_TABS.find(t => t.key === rangeTab)?.label ?? 'Tydzień';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      <TopBar
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        hasNotification={hasNotification}
        onNotificationPress={() => setShowNotifications(true)}
        onAvatarPress={() => setShowSettings(true)}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: TOP_BAR_HEIGHT + 16 }]}
        style={{ backgroundColor: screenBg }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.pageTitleRow}>
          <View style={styles.pageTitleLeft}>
            <Text style={[styles.pageTitle, { color: textColor }]}>Statystyki</Text>
            <Text style={[styles.pageSubtitle, { color: subTextColor }]}>
              Analiza Twojej produktywności
            </Text>
          </View>
          <TrendIndicator
            isUp={rangeInsights.trendUp}
            label={rangeInsights.trendUp ? `+${rangeInsights.trendDelta}%` : `-${rangeInsights.trendDelta}%`}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.tabSection}>
          <RangeTabs active={rangeTab} onChange={setRangeTab} isDarkMode={isDarkMode} />
        </Animated.View>

        {loading ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.loadingBox}>
            <Activity size={32} color={Colors.primary} />
            <Text style={[styles.loadingText, { color: subTextColor }]}>Ładowanie danych...</Text>
          </Animated.View>
        ) : (
          <>
            {/* SZYBKI WGLĄD */}
            <Text style={[styles.sectionEyebrow, { color: subTextColor }]}>Szybki wgląd · {rangeLabel}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.insightRow}>
              <InsightCard
                index={0}
                icon={<Sparkles size={18} color="#7B61FF" />}
                iconBg="rgba(123,97,255,0.12)"
                title="Najlepszy wynik"
                value={rangeInsights.bestPlan?.name || '—'}
                subtitle={`${rangeInsights.bestPlan?.progress ?? 0}% postępu`}
                cardBg={cardBg}
                textColor={textColor}
                subTextColor={subTextColor}
              />
              <InsightCard
                index={1}
                icon={<Timer size={18} color="#F59E0B" />}
                iconBg="rgba(245,158,11,0.12)"
                title="Średni czas"
                value={`${rangeInsights.avgHours}h`}
                subtitle="na plan nauki"
                cardBg={cardBg}
                textColor={textColor}
                subTextColor={subTextColor}
              />
              <InsightCard
                index={2}
                icon={rangeInsights.trendUp ? <TrendingUp size={18} color="#2ECC71" /> : <TrendingDown size={18} color="#FF6B6B" />}
                iconBg={rangeInsights.trendUp ? 'rgba(46,204,113,0.12)' : 'rgba(255,107,107,0.12)'}
                title="Trend"
                value={rangeInsights.trendUp ? 'Wzrost' : 'Spadek'}
                subtitle={`Nauka ${rangeInsights.scopedProgress}% · Zadania ${tasksPercent}%`}
                cardBg={cardBg}
                textColor={textColor}
                subTextColor={subTextColor}
              />
            </ScrollView>

            {/* HERO — OVERALL SCORE */}
            <Animated.View entering={FadeInDown.delay(450).springify()} style={[styles.heroWrapper, cardShadow]}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.heroContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroLabel}>Ogólny wynik · {rangeLabel}</Text>
                    <AnimatedNumber value={overallScore} style={styles.heroValue} suffix="%" />
                    <Text style={styles.heroSub}>
                      {overallScore >= 80 ? '🔥 Świetna robota!' : overallScore >= 50 ? '💪 Dobry postęp!' : '🚀 Do dzieła!'}
                    </Text>
                  </View>
                  <CircleProgress percent={overallScore} color="white" size={92} />
                </View>
                <View style={styles.heroDecor1} />
                <View style={styles.heroDecor2} />
              </LinearGradient>
            </Animated.View>

            {/* BENTO GRID */}
            <View style={styles.bentoGrid}>
              <StatTile
                index={0}
                icon={<CheckCircle2 color="#FF6B6B" size={20} />}
                iconBg="rgba(255,107,107,0.12)"
                label="Zadania"
                progress={tasksPercent}
                progressColors={['#FF6B6B', '#FF8787']}
                cardBg={cardBg}
                subTextColor={subTextColor}
              >
                <View style={styles.statValueRow}>
                  <AnimatedNumber value={tasksDone} style={[styles.statTileValue, { color: textColor }]} />
                  <Text style={[styles.statTileValue, { color: subTextColor, fontSize: 18 }]}>/{tasksTotal}</Text>
                </View>
              </StatTile>

              <StatTile
                index={1}
                icon={<Plane color="#2ECC71" size={20} />}
                iconBg="rgba(46,204,113,0.12)"
                label="Podróże"
                sub="nadchodzące"
                subColor="#2ECC71"
                cardBg={cardBg}
                subTextColor={subTextColor}
              >
                <View style={styles.statValueRow}>
                  <AnimatedNumber value={tripsUpcoming} style={[styles.statTileValue, { color: textColor }]} />
                  <Text style={[styles.statTileValue, { color: subTextColor, fontSize: 18 }]}>/{tripsTotal}</Text>
                </View>
              </StatTile>

              <StatTile
                index={2}
                icon={<Clock color="#7B61FF" size={20} />}
                iconBg="rgba(123,97,255,0.12)"
                label="Nauka"
                sub="łącznie"
                subColor="#7B61FF"
                cardBg={cardBg}
                subTextColor={subTextColor}
              >
                <AnimatedDecimal value={totalStudyHours} style={[styles.statTileValue, { color: textColor }]} suffix="h" />
              </StatTile>

              <StatTile
                index={3}
                icon={<BookOpen color="#FFD700" size={20} />}
                iconBg="rgba(255,215,0,0.12)"
                label="Plany"
                sub={`${avgStudyProgress}% śr.`}
                subColor="#FFD700"
                cardBg={cardBg}
                subTextColor={subTextColor}
              >
                <AnimatedNumber value={studyPlans.length} style={[styles.statTileValue, { color: textColor }]} />
              </StatTile>
            </View>

            {/* LINE CHART — trend postępu */}
            <Animated.View
              entering={FadeInDown.delay(520).springify()}
              style={[styles.chartCard, { backgroundColor: cardBg }, cardShadow]}
            >
              <View style={styles.chartHeader}>
                <View style={styles.chartIconWrap}>
                  <TrendingUp size={16} color="#7B61FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.chartTitle, { color: textColor }]}>Trend aktywności</Text>
                  <Text style={[styles.chartSubtitle, { color: subTextColor }]}>Zakres: {rangeLabel.toLowerCase()}</Text>
                </View>
              </View>
              <AnimatedLineChart
                data={rangeInsights.lineData}
                labels={rangeInsights.lineLabels}
                colors={['#7B61FF', '#A855F7']}
                maxVal={100}
                textColor={subTextColor}
              />
            </Animated.View>

            {/* BAR CHART — postępy planów */}
            {(rangeInsights.chartData.length > 0 || studyPlans.length > 0) && (
              <Animated.View
                entering={FadeInDown.delay(580).springify()}
                style={[styles.chartCard, { backgroundColor: cardBg }, cardShadow]}
              >
                <View style={styles.chartHeader}>
                  <View style={styles.chartIconWrap}>
                    <BookOpen size={16} color="#7B61FF" />
                  </View>
                  <Text style={[styles.chartTitle, { color: textColor }]}>Postępy planów nauki</Text>
                </View>
                <GradientBarChart
                  data={rangeInsights.chartData.length > 0 ? rangeInsights.chartData : studyChartData}
                  labels={rangeInsights.chartLabels.length > 0 ? rangeInsights.chartLabels : studyPlans.slice(0, 6).map(p => p.name?.slice(0, 6) || '—')}
                  colors={['#5152D6', '#A78BFA']}
                  maxVal={100}
                />
              </Animated.View>
            )}

            {/* BAR CHART — priorytety */}
            {tasksTotal > 0 && (
              <Animated.View
                entering={FadeInDown.delay(640).springify()}
                style={[styles.chartCard, { backgroundColor: cardBg }, cardShadow]}
              >
                <View style={styles.chartHeader}>
                  <View style={[styles.chartIconWrap, { backgroundColor: 'rgba(255,107,107,0.12)' }]}>
                    <Target size={16} color="#FF6B6B" />
                  </View>
                  <Text style={[styles.chartTitle, { color: textColor }]}>Zadania wg priorytetu</Text>
                </View>
                <GradientBarChart
                  data={priorityData}
                  labels={['Wysoki', 'Średni', 'Niski']}
                  colors={['#FF6B6B', '#FF8787']}
                  maxVal={Math.max(...priorityData, 1)}
                />
                <View style={[styles.chartLegend, { justifyContent: 'space-around' }]}>
                  {[
                    { label: 'Wysoki', count: tasksByPriority.high, color: '#FF6B6B' },
                    { label: 'Średni', count: tasksByPriority.medium, color: '#FFD700' },
                    { label: 'Niski', count: tasksByPriority.low, color: '#2ECC71' },
                  ].map((item, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={[styles.legendText, { color: subTextColor }]}>{item.label} ({item.count})</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* LISTA PLANÓW NAUKI */}
            {studyPlans.length > 0 && (
              <>
                <Animated.Text entering={FadeInDown.delay(700).springify()} style={[styles.sectionTitle, { color: textColor }]}>
                  Plany nauki
                </Animated.Text>
                <Animated.View entering={FadeInDown.delay(740).springify()} style={[styles.wideCard, { backgroundColor: cardBg }, cardShadow]}>
                  {studyPlans.map((plan, i) => (
                    <View
                      key={i}
                      style={[styles.planRow, i > 0 && { borderTopWidth: 1, borderTopColor: borderColor, paddingTop: 16, marginTop: 16 }]}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={styles.planHeaderRow}>
                          <Text style={[styles.planName, { color: textColor }]} numberOfLines={1}>{plan.name}</Text>
                          <Text style={[styles.planPercent, { color: plan.progress >= 100 ? '#2ECC71' : Colors.primary }]}>
                            {plan.progress || 0}%
                          </Text>
                        </View>
                        <AnimatedProgressBar
                          progress={plan.progress || 0}
                          colors={plan.progress >= 100 ? ['#11998e', '#38ef7d'] : ['#7B61FF', '#A78BFA']}
                          trackColor={trackColor}
                          height={6}
                        />
                        <Text style={[styles.planMeta, { color: subTextColor }]}>
                          {plan.topicsCompleted || 0}/{plan.totalTopics || 0} tematów · {Number(plan.hours || 0).toFixed(1)}h · Egzamin: {plan.date}
                        </Text>
                      </View>
                    </View>
                  ))}
                </Animated.View>
              </>
            )}

            {/* NAJBLIŻSZA PODRÓŻ */}
            {nextTrip && (
              <>
                <Animated.Text entering={FadeInDown.delay(780).springify()} style={[styles.sectionTitle, { color: textColor }]}>
                  Najbliższa podróż
                </Animated.Text>
                <Animated.View entering={FadeInDown.delay(820).springify()} style={[styles.tripBanner, { backgroundColor: cardBg }, cardShadow]}>
                  <LinearGradient colors={['#11998e', '#38ef7d']} style={styles.tripIconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Plane size={24} color="white" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tripDest, { color: textColor }]}>{nextTrip.destination}</Text>
                    <Text style={[styles.tripDate, { color: subTextColor }]}>{nextTrip.startDate || nextTrip.date}</Text>
                  </View>
                  <View style={styles.daysLeftBadge}>
                    <AnimatedNumber value={calcDaysLeft(nextTrip.startDate || nextTrip.date || '')} style={styles.daysLeftNum} />
                    <Text style={styles.daysLeftLabel}>dni</Text>
                  </View>
                </Animated.View>
              </>
            )}

            {/* MOTYWACJA */}
            <Animated.View
              entering={FadeInDown.delay(860).springify()}
              style={[
                styles.streakCard,
                { backgroundColor: isDarkMode ? '#1E293B' : 'rgba(255,140,0,0.06)', borderColor: isDarkMode ? 'rgba(255,140,0,0.2)' : 'rgba(255,140,0,0.15)' },
                cardShadow,
              ]}
            >
              <View style={styles.streakIconWrap}>
                <Award color="#FF8C00" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.streakTitle, { color: isDarkMode ? '#FFB366' : '#CC7000' }]}>
                  {tasksPercent >= 80 ? '🔥 Jesteś w świetnej formie!' : tasksPercent >= 50 ? '💪 Dobry postęp, tak trzymaj!' : '🚀 Czas wziąć się do roboty!'}
                </Text>
                <Text style={[styles.streakSub, { color: subTextColor }]}>
                  Ukończono {tasksDone} z {tasksTotal} zadań · {avgStudyProgress}% postępu w nauce
                </Text>
              </View>
            </Animated.View>

            {/* PUSTY STAN */}
            {tasksTotal === 0 && studyPlans.length === 0 && tripsTotal === 0 && (
              <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.emptyBox, { backgroundColor: cardBg }, cardShadow]}>
                <View style={styles.emptyIconWrap}>
                  <BarChart3 size={36} color="#7B61FF" />
                </View>
                <Text style={[styles.emptyTitle, { color: textColor }]}>Brak danych</Text>
                <Text style={[styles.emptyText, { color: subTextColor }]}>
                  Dodaj zadania, plany nauki lub podróże, aby zobaczyć statystyki.
                </Text>
              </Animated.View>
            )}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSettings(false)}>
          <View style={styles.topBarModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.topBarModalSheet, { backgroundColor: cardBg }]}>
                <View style={styles.topBarModalHeader}>
                  <View style={styles.topBarModalTitleRow}>
                    <Settings size={18} color={textColor} />
                    <Text style={[styles.topBarModalTitle, { color: textColor }]}>Ustawienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowSettings(false)} hitSlop={8}>
                    <X size={20} color={subTextColor} />
                  </TouchableOpacity>
                </View>
                <View style={styles.topBarModalContent}>
                  <TouchableOpacity
                    style={[styles.topBarModalAction, { backgroundColor: isDarkMode ? '#292524' : '#FEF2F2' }]}
                    onPress={handleLogout}
                  >
                    <LogOut size={18} color="#EF4444" />
                    <Text style={styles.topBarModalActionText}>Wyloguj się z konta</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <TouchableWithoutFeedback onPress={() => setShowNotifications(false)}>
          <View style={styles.topBarModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.topBarModalSheet, { backgroundColor: cardBg }]}>
                <View style={styles.topBarModalHeader}>
                  <View style={styles.topBarModalTitleRow}>
                    <Bell size={18} color={textColor} />
                    <Text style={[styles.topBarModalTitle, { color: textColor }]}>Powiadomienia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowNotifications(false)} hitSlop={8}>
                    <X size={20} color={subTextColor} />
                  </TouchableOpacity>
                </View>
                <View style={styles.topBarModalContent}>
                  {pendingTasksCount > 0 && (
                    <View style={[styles.notifRow, { borderBottomColor: borderColor }]}>
                      <View style={[styles.notifStatus, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[styles.notifBody, { color: textColor }]}>
                        Masz <Text style={{ fontWeight: '700' }}>{pendingTasksCount}</Text> nieukończone zadania.
                      </Text>
                    </View>
                  )}
                  {nextTrip && (
                    <View style={[styles.notifRow, { borderBottomColor: borderColor }]}>
                      <View style={[styles.notifStatus, { backgroundColor: '#2ECC71' }]} />
                      <Text style={[styles.notifBody, { color: textColor }]}>
                        Podróż do {nextTrip.destination} już za {calcDaysLeft(nextTrip.startDate || nextTrip.date || '')} dni!
                      </Text>
                    </View>
                  )}
                  {incompletePlans.slice(0, 2).map((plan, i) => (
                    <View key={i} style={[styles.notifRow, { borderBottomColor: borderColor }]}>
                      <View style={[styles.notifStatus, { backgroundColor: Colors.primary }]} />
                      <Text style={[styles.notifBody, { color: textColor }]}>
                        Plan &quot;{plan.name}&quot; jest ukończony w {plan.progress || 0}%.
                      </Text>
                    </View>
                  ))}
                  {!hasNotification && (
                    <Text style={[styles.notifEmpty, { color: subTextColor }]}>Brak nowych powiadomień 🎉</Text>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  pageTitleLeft: { flex: 1 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, marginTop: 4, fontWeight: '500' },

  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 4,
  },
  trendLabel: { fontSize: 12, fontWeight: '800' },

  tabSection: { paddingHorizontal: 20, marginBottom: 20 },
  tabTrack: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  tabPill: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabLabel: { fontSize: 13, fontWeight: '700' },

  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  insightRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 4, marginBottom: 20 },
  insightCard: {
    width: SCREEN_WIDTH * 0.42,
    borderRadius: 20,
    padding: 16,
    minHeight: 130,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  insightValue: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  insightSub: { fontSize: 11, fontWeight: '500' },

  loadingBox: { alignItems: 'center', marginTop: 80, gap: 16 },
  loadingText: { fontSize: 16, fontWeight: '600' },

  heroWrapper: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 20 },
  heroGradient: { padding: 24, overflow: 'hidden' },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  heroValue: { color: 'white', fontSize: 48, fontWeight: '900', lineHeight: 52 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700', marginTop: 6 },
  heroDecor1: { position: 'absolute', right: -30, bottom: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroDecor2: { position: 'absolute', right: 60, top: -40, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)' },

  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statTile: { width: (SCREEN_WIDTH - 52) / 2, borderRadius: 20, padding: 18 },
  iconCircle: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  statTileValue: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  statTileLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statTileSub: { fontSize: 11, fontWeight: '700' },
  smallProgressBg: { marginTop: 8 },

  progressBarBg: { overflow: 'hidden' },
  progressBarFill: { overflow: 'hidden', minWidth: 4 },

  chartCard: { marginHorizontal: 20, borderRadius: 24, padding: 18, marginBottom: 16 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  chartIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(123,97,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  chartSubtitle: { fontSize: 12, marginTop: 2, fontWeight: '500' },

  lineChartEmpty: { justifyContent: 'center', alignItems: 'center' },
  lineLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  lineLabel: { fontSize: 10, fontWeight: '600', flex: 1, textAlign: 'center' },

  gradientBarRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 88, paddingTop: 8 },
  gradientBarCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 88 },
  gradientBar: { width: '100%', borderRadius: 8, overflow: 'hidden', minHeight: 6 },
  barLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', marginTop: 6, textAlign: 'center' },

  chartLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, paddingHorizontal: 20, letterSpacing: -0.3 },
  wideCard: { marginHorizontal: 20, borderRadius: 24, padding: 18, marginBottom: 20 },
  planRow: {},
  planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  planName: { fontSize: 15, fontWeight: '700', flex: 1 },
  planPercent: { fontSize: 14, fontWeight: '800', marginLeft: 8 },
  planMeta: { fontSize: 12, fontWeight: '500', marginTop: 8 },

  tripBanner: { marginHorizontal: 20, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  tripIconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  tripDest: { fontSize: 17, fontWeight: '800' },
  tripDate: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  daysLeftBadge: { alignItems: 'center', padding: 10, borderRadius: 14, minWidth: 54, backgroundColor: 'rgba(46,204,113,0.12)' },
  daysLeftNum: { fontSize: 22, fontWeight: '900', color: '#2ECC71' },
  daysLeftLabel: { fontSize: 11, fontWeight: '700', color: '#2ECC71' },

  streakCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, gap: 14, marginHorizontal: 20, marginBottom: 16, borderWidth: 1 },
  streakIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,140,0,0.12)', justifyContent: 'center', alignItems: 'center' },
  streakTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  streakSub: { fontSize: 12, fontWeight: '500' },

  emptyBox: { marginHorizontal: 20, marginTop: 20, padding: 40, borderRadius: 24, alignItems: 'center', gap: 8 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(123,97,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '500' },

  topBarModalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  topBarModalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 24, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 90 : 75 },
  topBarModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  topBarModalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarModalTitle: { fontSize: 18, fontWeight: '800' },
  topBarModalContent: { marginTop: 4 },
  topBarModalAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16 },
  topBarModalActionText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  notifStatus: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  notifBody: { fontSize: 14, fontWeight: '400', flex: 1, lineHeight: 20 },
  notifEmpty: { fontSize: 14, textAlign: 'center', paddingVertical: 32, fontWeight: '500' },
});

export default StatsScreen;
