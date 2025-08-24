import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { flashBackApiService } from '../services/api';
import { PhoneFormatter } from '../utils/phoneFormatter';

export default function PhoneInput() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const phoneInputRef = useRef<any>(null);

  // Phone number validation (for +91 format)
  const validatePhoneNumber = (phone: string): boolean => {
    return PhoneFormatter.isValid(phone);
  };

  // Handle phone number input change - auto add +91
  const handlePhoneChange = (text: string) => {
    const formattedText = PhoneFormatter.formatForInput(text);
    setPhoneNumber(formattedText);
    setError('');
  };

  // Handle send OTP
  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await flashBackApiService.sendOtp(phoneNumber);
      
      if (response.success) {
        // Navigate to OTP verification screen
        router.push({
          pathname: './OtpVerification',
          params: { phoneNumber }
        });
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#f59e0b', '#d97706', '#92400e']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* App Logo/Brand */}
              <View style={styles.brandContainer}>
                <Text style={styles.brandTitle}>FlashBack</Text>
                <Text style={styles.brandSubtitle}>Labs</Text>
                <View style={styles.brandLine} />
              </View>

              {/* Main Card */}
              <View style={styles.cardContainer}>
                <View style={styles.inputContainer}>
                  <View style={styles.headerContainer}>
                    <Text style={styles.title}>Welcome</Text>
                    <Text style={styles.subtitle}>
                      Enter your phone number to continue
                    </Text>
                  </View>
                  
                  <TextInput
                    ref={phoneInputRef}
                    label="Phone Number"
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    style={styles.textInput}
                    mode="outlined"
                    left={<TextInput.Icon icon="phone" color="#fbbf24" />}
                    disabled={isLoading}
                    maxLength={13}
                    outlineStyle={styles.inputOutline}
                    activeOutlineColor="#fbbf24"
                    theme={{
                      colors: {
                        onSurfaceVariant: '#6b7280',
                        surface: '#ffffff',
                        outline: '#e5e7eb',
                      }
                    }}
                  />
                  
                  <Button
                    mode="contained"
                    onPress={handleSendOtp}
                    loading={isLoading}
                    disabled={isLoading || !phoneNumber.trim()}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    buttonColor="#fbbf24"
                    textColor="#111827"
                  >
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </Button>
                </View>
                
                {/* Error Message */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Secure • Fast • Reliable
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  brandSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fde68a',
    marginTop: -4,
  },
  brandLine: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
    marginTop: 10,
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
  },
  inputContainer: {
    gap: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: '#ffffff',
  },
  inputOutline: {
    borderRadius: 10,
    borderWidth: 1,
  },
  button: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  buttonContent: {
    paddingVertical: 10,
  },
  errorContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
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
