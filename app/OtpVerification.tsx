import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { flashBackApiService } from '../services/api';
import { SecureStorage } from '../utils/storage';
import { PhoneFormatter } from '../utils/phoneFormatter';

export default function OtpVerification() {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const otpInputRef = useRef<any>(null);

  useEffect(() => {
    // Focus on OTP input when screen loads
    setTimeout(() => otpInputRef.current?.focus(), 500);
  }, []);

  // OTP validation
  const validateOtp = (otp: string): boolean => {
    return /^\d{6}$/.test(otp);
  };

  // Handle OTP input change
  const handleOtpChange = (text: string) => {
    // Only allow digits
    const cleanText = text.replace(/\D/g, '');
    setOtp(cleanText);
    setError('');
    setSuccess('');
    
    // Auto-submit when 6 digits are entered
    if (cleanText.length === 6) {
      setTimeout(() => {
        handleVerifyOtp();
      }, 300); // Small delay for better UX
    }
  };

  // Handle verify OTP
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (!validateOtp(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await flashBackApiService.verifyOtp(phoneNumber!, otp);
      
      if (response.success) {
        setSuccess('OTP verified successfully!');
        
        // Store the auth token if provided
        if (response.token) {
          console.log('Auth token received:', response.token);
          await SecureStorage.storeAuthToken(response.token);
          await SecureStorage.storeUserPhone(phoneNumber!);
        }
        
        // Navigate to selfie capture with liveness detection after successful verification
        setTimeout(() => {
          router.push('./SelfieCapture'); // Navigate directly to enhanced liveness detection
        }, 1500);
      } else {
        setError(response.message || 'Failed to verify OTP');
      }
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      
      // Handle specific OTP errors
      let errorMessage = 'Failed to verify OTP. Please try again.';
      
      if (err.message) {
        const message = err.message.toLowerCase();
        if (message.includes('invalid') || message.includes('incorrect')) {
          errorMessage = 'Invalid OTP. Please check and try again.';
        } else if (message.includes('expired') || message.includes('timeout')) {
          errorMessage = 'OTP has expired. Please request a new one.';
        } else if (message.includes('attempts') || message.includes('limit')) {
          errorMessage = 'Too many attempts. Please request a new OTP.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await flashBackApiService.sendOtp(phoneNumber!);
      
      if (response.success) {
        setSuccess('OTP resent successfully!');
      } else {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to phone input
  const handleBackToPhone = () => {
    router.back();
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
                    <Text style={styles.title}>Verify Code</Text>
                    <Text style={styles.subtitle}>
                      We've sent a 6-digit code to
                    </Text>
                    <Text style={styles.phoneNumber}>
                      {PhoneFormatter.formatForDisplay(phoneNumber!)}
                    </Text>
                  </View>
                  
                  <TextInput
                    ref={otpInputRef}
                    label="OTP Code"
                    value={otp}
                    onChangeText={handleOtpChange}
                    placeholder="123456"
                    keyboardType="numeric"
                    style={styles.textInput}
                    mode="outlined"
                    left={<TextInput.Icon icon="lock" color="#fbbf24" />}
                    disabled={isLoading}
                    maxLength={6}
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
                  
                  <View style={styles.buttonRow}>
                    <Button
                      mode="outlined"
                      onPress={handleBackToPhone}
                      disabled={isLoading}
                      style={[styles.button, styles.backButton]}
                      contentStyle={styles.buttonContent}
                      textColor="#6b7280"
                    >
                      Back
                    </Button>
                    
                    <Button
                      mode="contained"
                      onPress={handleVerifyOtp}
                      loading={isLoading}
                      disabled={isLoading || !otp.trim()}
                      style={[styles.button, styles.verifyButton]}
                      contentStyle={styles.buttonContent}
                      buttonColor="#fbbf24"
                      textColor="#111827"
                    >
                      {isLoading ? 'Verifying...' : 'Verify'}
                    </Button>
                  </View>
                  
                  <TouchableOpacity 
                    onPress={handleResendOtp}
                    disabled={isLoading}
                    style={styles.resendContainer}
                  >
                    <Text style={styles.resendText}>
                      Didn't receive code? Resend
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Error Message */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                
                {/* Success Message */}
                {success ? (
                  <View style={styles.successContainer}>
                    <Text style={styles.successText}>{success}</Text>
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
  phoneNumber: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  textInput: {
    backgroundColor: '#ffffff',
  },
  inputOutline: {
    borderRadius: 10,
    borderWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  backButton: {
    flex: 0.4,
    borderColor: '#9ca3af',
    borderWidth: 1,
  },
  verifyButton: {
    flex: 0.6,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  resendText: {
    fontSize: 13,
    color: '#fcd34d',
    fontWeight: '500',
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
  successContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 8,
  },
  successText: {
    color: '#166534',
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
