import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  StatusBar,
  Platform
} from 'react-native';
import { Colors } from '../theme';
import {
  Plane,
  MapPin,
  Calendar,
  Plus,
  Navigation,
  Clock,
  ChevronRight,
  Palmtree,
  Sun,
  Moon
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TravelPlannerScreen = ({ isDarkMode, toggleDarkMode }: any) => {

  // ZMIANA: bgColor na transparent, aby widzieć gradient z App.tsx
  const bgColor = 'transparent';
  const textColor = isDarkMode ? Colors.darkText : '#1E293B';
  // ZMIANA: Karty z lekką przezroczystością (Glassmorphism)
  const cardColor = isDarkMode ? Colors.darkCard : 'rgba(255, 255, 255, 0.8)';
  const borderColor = isDarkMode ? Colors.darkBorder : 'rgba(255, 255, 255, 0.5)';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';

  const trips = [
    {
      id: '1',
      destination: 'Zakopane, Polska',
      date: '12 - 15 Kwietnia',
      status: 'Nadchodząca',
      image: 'https://images.unsplash.com/photo-1519738221187-3027626ff510?q=80&w=500',
      budget: '1200 PLN',
      daysLeft: 14
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }} // Wymuszenie przezroczystości ScrollView
      >

        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={[styles.title, { color: textColor }]}>Planer Podróży ✈️</Text>
            <TouchableOpacity onPress={toggleDarkMode} style={styles.themeToggle}>
              {isDarkMode ? (
                <Sun size={24} color="#FFD700" />
              ) : (
                <Moon size={24} color="#64748B" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            Masz {trips.length} zaplanowane wyprawy
          </Text>
        </View>


        {trips.map((trip) => (
          <TouchableOpacity
            key={trip.id}
            activeOpacity={0.9}
            style={[styles.tripCard, { backgroundColor: cardColor, borderColor: borderColor, borderWidth: 1 }]}
          >
            <ImageBackground
              source={{ uri: trip.image }}
              style={styles.cardImage}
              imageStyle={{ borderRadius: 24 }}
            >
              <View style={styles.imageOverlay}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{trip.status}</Text>
                </View>
                <View style={styles.daysBadge}>
                  <Clock size={12} color="white" />
                  <Text style={styles.daysText}>za {trip.daysLeft} dni</Text>
                </View>
              </View>
            </ImageBackground>

            <View style={styles.cardDetails}>
              <View style={styles.mainInfo}>
                <View>
                  <Text style={[styles.destText, { color: textColor }]}>{trip.destination}</Text>
                  <View style={styles.infoRow}>
                    <Calendar size={14} color={subTextColor} />
                    <Text style={[styles.infoText, { color: subTextColor }]}>{trip.date}</Text>
                  </View>
                </View>
                <View style={[styles.arrowCircle, { backgroundColor: isDarkMode ? 'rgba(46, 204, 113, 0.15)' : 'rgba(46, 204, 113, 0.1)' }]}>
                  <Navigation color={Colors.tertiary} size={20} />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: isDarkMode ? '#2A2A3C' : 'rgba(0,0,0,0.05)' }]} />

              <View style={styles.footerRow}>
                <View style={styles.budgetBox}>
                  <Text style={[styles.label, { color: isDarkMode ? '#64748B' : '#94A3B8' }]}>Budżet</Text>
                  <Text style={[styles.value, { color: Colors.tertiary }]}>{trip.budget}</Text>
                </View>
                <TouchableOpacity style={[styles.detailsBtn, { backgroundColor: isDarkMode ? '#2A2A3C' : 'rgba(0,0,0,0.05)' }]}>
                  <Text style={[styles.detailsBtnText, { color: isDarkMode ? Colors.darkText : '#475569' }]}>Szczegóły</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.addCard, { borderColor: isDarkMode ? '#475569' : 'rgba(148, 163, 184, 0.5)', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.3)' }]}>
            <View style={styles.addIconCircle}>
                <Plus color={isDarkMode ? '#94A3B8' : '#64748B'} size={30} />
            </View>
            <Text style={[styles.addText, { color: subTextColor }]}>Zaplanuj nową przygodę</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: Colors.tertiary }]}>
        <Palmtree color="white" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    marginBottom: 25
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  themeToggle: { padding: 8, borderRadius: 12 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: 5, fontWeight: '500' },

  tripCard: {
    borderRadius: 30,
    padding: 12,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  cardImage: { height: 180, width: '100%', marginBottom: 15 },
  imageOverlay: {
    flex: 1,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  badge: { backgroundColor: 'rgba(46, 204, 113, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: 'white', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  daysBadge: { backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  daysText: { color: 'white', fontWeight: '700', fontSize: 11 },

  cardDetails: { paddingHorizontal: 8, paddingBottom: 8 },
  mainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  destText: { fontSize: 20, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoText: { fontSize: 14, fontWeight: '600' },
  arrowCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  divider: { height: 1, marginVertical: 15 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetBox: { gap: 2 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '800' },
  detailsBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  detailsBtnText: { fontWeight: '700' },

  addCard: { height: 150, borderRadius: 30, borderStyle: 'dashed', borderWidth: 2, justifyContent: 'center', alignItems: 'center', gap: 10 },
  addIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(148, 163, 184, 0.1)', justifyContent: 'center', alignItems: 'center' },
  addText: { fontWeight: '700' },

  fab: { position: 'absolute', bottom: 100, right: 20, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#2ECC71', shadowOpacity: 0.3, shadowRadius: 10 }
});

export default TravelPlannerScreen;