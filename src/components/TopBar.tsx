import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
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
    warning: '#F59E0B',
  };

  const displayTitle = title || getFormattedDate();

  return (
    <View style={[styles.fixedHeaderContainer, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAvatarPress}
          style={[styles.avatarBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <User size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={[styles.topDate, { color: theme.text }]} numberOfLines={1}>
            {displayTitle}
          </Text>
        </View>

        <View style={styles.actionGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={onNotificationPress}
          >
            <Bell size={20} color={theme.text} />
            {hasNotification && (
              <View style={styles.badgeDot} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleDarkMode}
            style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            {isDarkMode ? <Sun size={20} color={theme.warning} /> : <Moon size={20} color={theme.text} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Stała eksportowana do kontenerów scrolla - dopasowana do nowej struktury bez SafeAreaView
export const TOP_BAR_HEIGHT = Platform.OS === 'ios' ? 104 : 60 + (StatusBar.currentHeight ?? 0);

const styles = StyleSheet.create({
  fixedHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    // Dynamiczny padding dopasowany dokładnie tak jak w Dashboard.tsx
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ?? 0,
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
    backgroundColor: '#6366F1',
  },
});

export default TopBar;