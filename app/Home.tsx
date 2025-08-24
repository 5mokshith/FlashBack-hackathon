import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { SecureStorage } from '../utils/storage';
import { PhoneFormatter } from '../utils/phoneFormatter';

export default function Home() {
  const [userPhone, setUserPhone] = useState<string>('');
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const phone = await SecureStorage.getUserPhone();
      const selfie = await SecureStorage.getUserSelfie();
      
      if (phone) {
        setUserPhone(phone);
      }
      
      if (selfie) {
        setSelfieUrl(selfie);
      }
      
      // Show welcome message if user just completed registration
      if (phone && selfie) {
        setTimeout(() => {
          Alert.alert(
            'Welcome!',
            `Registration completed successfully for ${PhoneFormatter.formatForDisplay(phone)}`,
            [{ text: 'OK' }]
          );
        }, 500);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStorage.clearAll();
              router.replace('/');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1e3a8a', '#3b82f6', '#60a5fa']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header with Logout */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.appName}>FlashBack Labs</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeIconContainer}>
                <Text style={styles.welcomeEmoji}>👋</Text>
              </View>
              <Text style={styles.welcomeTitle}>Welcome Back!</Text>
              <Text style={styles.welcomeSubtitle}>
                Your account is verified and ready to use
              </Text>
            </View>

            {/* User Profile Card */}
            <View style={styles.profileCard}>
              {/* Profile Image */}
              <View style={styles.profileImageSection}>
                {selfieUrl ? (
                  <View style={styles.profileImageContainer}>
                    <Image
                      source={{ uri: selfieUrl }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedIcon}>✓</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.placeholderImageContainer}>
                    <Text style={styles.placeholderIcon}>👤</Text>
                  </View>
                )}
              </View>

              {/* User Info */}
              <View style={styles.userInfoSection}>
                <Text style={styles.userLabel}>Verified Phone Number</Text>
                <Text style={styles.userPhone}>
                  {PhoneFormatter.formatForDisplay(userPhone)}
                </Text>
                
                <View style={styles.statusContainer}>
                  <View style={styles.statusIndicator} />
                  <Text style={styles.statusText}>Account Active</Text>
                </View>
              </View>
            </View>

            {/* Success Message */}
            <View style={styles.successCard}>
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>🎉</Text>
              </View>
              <Text style={styles.successTitle}>Verification Complete!</Text>
              <Text style={styles.successMessage}>
                Your identity has been successfully verified. You can now access all features of FlashBack Labs.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Secure • Verified • Protected</Text>
            <Text style={styles.footerBrand}>Powered by FlashBack Labs</Text>
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
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeEmoji: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  profileImageSection: {
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#3b82f6',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  verifiedIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#d1d5db',
  },
  placeholderIcon: {
    fontSize: 48,
    color: '#9ca3af',
  },
  userInfoSection: {
    alignItems: 'center',
    width: '100%',
  },
  userLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  successIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 30,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  footerBrand: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
});
  
  