import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from 'react-native-paper';
import { SecureStorage } from '../utils/storage';
import { PhoneFormatter } from '../utils/phoneFormatter';

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedPhone = await SecureStorage.getUserPhone();
      const storedToken = await SecureStorage.getAuthToken();
      
      if (storedPhone) setPhoneNumber(storedPhone);
      if (storedToken) setAuthToken(storedToken);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
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
          onPress: async () => {
            try {
              await SecureStorage.clearAll();
              router.replace('./PhoneInput');
            } catch (error) {
              console.error('Error during logout:', error);
              router.replace('./PhoneInput');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.welcomeTitle}>Welcome to FlashBack Labs!</Text>
              <Text style={styles.welcomeSubtitle}>Authentication Complete</Text>
            </View>

            {/* User Info Card */}
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userLabel}>Phone Number</Text>
                <Text style={styles.userValue}>
                  {phoneNumber ? PhoneFormatter.formatForDisplay(phoneNumber) : 'Not available'}
                </Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userLabel}>Status</Text>
                <View style={styles.statusContainer}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Verified</Text>
                </View>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userLabel}>Authentication</Text>
                <Text style={styles.userValue}>
                  {authToken ? 'Active Session' : 'No Token'}
                </Text>
              </View>
            </View>

            {/* Features Card */}
            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>What's Next?</Text>
              
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Phone Verification</Text>
                  <Text style={styles.featureDescription}>Successfully completed</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Liveness Check</Text>
                  <Text style={styles.featureDescription}>Passed all security checks</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Selfie Upload</Text>
                  <Text style={styles.featureDescription}>Profile image uploaded</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🚀</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Ready to Explore</Text>
                  <Text style={styles.featureDescription}>Your account is fully set up</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsCard}>
              <Button
                mode="outlined"
                onPress={handleLogout}
                style={styles.logoutButton}
                textColor="#ef4444"
                icon="logout"
              >
                Logout
              </Button>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                FlashBack Labs • Secure Authentication System
              </Text>
              <Text style={styles.footerSubtext}>
                Your data is protected with end-to-end encryption
              </Text>
            </View>
          </View>
        </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#fde68a',
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  userInfo: {
    marginBottom: 16,
  },
  userLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  featuresCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  logoutButton: {
    borderRadius: 10,
    borderColor: '#ef4444',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    color: '#fde68a',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 4,
  },
  footerSubtext: {
    color: '#fde68a',
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.7,
  },
});
  
  