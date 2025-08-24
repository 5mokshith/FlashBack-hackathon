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
    <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>FlashBack Labs</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeIcon}>
              <Text style={styles.welcomeIconText}>🎉</Text>
            </View>
            
            <Text style={styles.welcomeTitle}>Welcome!</Text>
            <Text style={styles.welcomeSubtitle}>
              You have successfully completed the verification process
            </Text>
            
            <View style={styles.userInfoContainer}>
              <Text style={styles.userInfoLabel}>Phone Number:</Text>
              <Text style={styles.userInfoValue}>
                {PhoneFormatter.formatForDisplay(userPhone)}
              </Text>
            </View>
          </View>

          {/* Selfie Display */}
          {selfieUrl ? (
            <View style={styles.selfieCard}>
              <Text style={styles.selfieTitle}>Your Selfie</Text>
              <View style={styles.selfieContainer}>
                <Image
                  source={{ uri: selfieUrl }}
                  style={styles.selfieImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.selfieSubtitle}>
                Successfully uploaded and verified
              </Text>
            </View>
          ) : (
            <View style={styles.selfieCard}>
              <Text style={styles.selfieTitle}>Selfie Status</Text>
              <View style={styles.noSelfieContainer}>
                <Text style={styles.noSelfieIcon}>📷</Text>
                <Text style={styles.noSelfieText}>No selfie uploaded</Text>
              </View>
            </View>
          )}

          {/* Verification Steps */}
          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>Verification Steps Completed</Text>
            
            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepIconText}>✓</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Phone Verification</Text>
                <Text style={styles.stepDescription}>OTP successfully verified</Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepIconText}>✓</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Identity Verification</Text>
                <Text style={styles.stepDescription}>Phone number verified successfully</Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepIconText}>✓</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Selfie Upload</Text>
                <Text style={styles.stepDescription}>Selfie captured and uploaded successfully</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              onPress={() => Alert.alert('Info', 'This is the home screen after successful verification.')}
              style={styles.actionButton}
              buttonColor="#fbbf24"
              textColor="#111827"
            >
              Get Started
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => router.push('/')}
              style={[styles.actionButton, styles.secondaryButton]}
              textColor="white"
            >
              Start Over
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure • Fast • Reliable
            </Text>
            <Text style={styles.footerSubtext}>
              Powered by FlashBack Labs
            </Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutButton: {
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeIconText: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  userInfoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  userInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  selfieCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  selfieTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  selfieContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#fbbf24',
  },
  selfieImage: {
    width: '100%',
    height: '100%',
  },
  selfieSubtitle: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  noSelfieContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noSelfieIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  noSelfieText: {
    fontSize: 14,
    color: '#6b7280',
  },
  stepsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  stepsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepIconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 25,
    paddingVertical: 12,
  },
  secondaryButton: {
    borderColor: 'white',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#fde68a',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  footerSubtext: {
    color: '#fde68a',
    fontSize: 12,
    opacity: 0.8,
  },
});
  
  