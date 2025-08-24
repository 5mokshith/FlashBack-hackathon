import React, { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SecureStorage } from '../utils/storage';
import PhoneInput from './PhoneInput';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const checkAuth = async () => {
        try {
          const token = await SecureStorage.getAuthToken();
          const phoneNumber = await SecureStorage.getUserPhone();
          
          if (isActive) {
            if (token && phoneNumber) {
              setIsAuthenticated(true);
              router.replace('/Home');
            } else {
              setIsAuthenticated(false);
            }
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          if (isActive) {
            setIsAuthenticated(false);
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };
      
      checkAuth();
      
      return () => {
        isActive = false;
      };
    }, [])
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return <PhoneInput />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 16,
  },
});
