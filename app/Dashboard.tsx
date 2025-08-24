import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SecureStorage } from '../utils/storage';

export default function Dashboard() {
  const handleLogout = async () => {
    try {
      // Clear all stored authentication data
      await SecureStorage.clearAll();
      // Navigate back to phone input
      router.replace('./PhoneInput');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still navigate even if clearing storage fails
      router.replace('./PhoneInput');
    }
  };

  return (
    <LinearGradient
      colors={['#f59e0b', '#d97706', '#92400e']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Welcome to FlashBack Labs</Text>
            <Text style={styles.headerSubtitle}>Authentication Successful!</Text>
          </View>

          {/* Main Content */}
          <View style={styles.cardContainer}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>
              You have successfully logged in. This is a placeholder screen.
            </Text>
            
            <View style={styles.featureContainer}>
              <Text style={styles.featureTitle}>Next Steps:</Text>
              <Text style={styles.featureItem}>• Upload your selfie</Text>
              <Text style={styles.featureItem}>• Complete profile setup</Text>
              <Text style={styles.featureItem}>• Explore FlashBack features</Text>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              FlashBack Labs • Secure Authentication
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fde68a',
    textAlign: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  featureContainer: {
    width: '100%',
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#fde68a',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
});
