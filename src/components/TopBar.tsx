import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Moon, Sun, User } from 'lucide-react-native';

interface TopBarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  hasNotification?: boolean;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  title?: string;
}

const getFormattedDate = (): string => {
  const date = new Date();
  return date.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

const TopBar: React.FC<TopBarProps> = ({
  isDarkMode,
  toggleDarkMode,
  hasNotification = false,
  onNotificationPress,
  onAvatarPress,
  title,
}) => {
  const theme = {
    bg: isDarkMode ? '#0B0F19' : '#F8FAFC',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8FAFC' : '#0F172A',
    border: isDarkMode ? '#334155' : '#E2E8F0',
    accent: '#6366F1',
    warning: '#F59E0B',
  };

  return (
    // Dokładnie tak samo jak w Dashboard.tsx — SafeAreaView z position absolute
    <SafeAreaView
      style={[
        styles.fixedHeaderContainer,
        {
          backgroundColor: theme.bg,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.topBar}>
        {/* Avatar / Settings */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAvatarPress}
          style={[styles.avatarBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <User size={20} color={theme.text} />
        </TouchableOpacity>

        {/* Środek — data lub tytuł */}
        <View style={styles.topCenter}>
          <Text style={[styles.topDate, { color: theme.text }]} numberOfLines={1}>
            {title ?? getFormattedDate()}
          </Text>
        </View>

        {/* Prawa strona */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onNotificationPress}
            style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Bell size={20} color={theme.text} />
            {hasNotification && (
              <View style={[styles.badgeDot, { backgroundColor: theme.accent }]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleDarkMode}
            style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            {isDarkMode
              ? <Sun size={20} color={theme.warning} />
              : <Moon size={20} color={theme.text} />}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Taka sama wysokość jak w Dashboard
export const TOP_BAR_HEIGHT =
  Platform.OS === 'android'
    ? 60 + (StatusBar.currentHeight ?? 0)
    : 104; // 44 safe area + 60 topBar

const styles = StyleSheet.create({
  // Identyczny jak fixedHeaderContainer w Dashboard.tsx
  fixedHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 60,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  topDate: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default TopBar;