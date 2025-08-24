import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from 'react-native-paper';
import { SecureStorage } from '../utils/storage';
import { flashBackApiService } from '../services/api';

const { width, height } = Dimensions.get('window');

type LivenessStep = 'blink' | 'smile' | 'turn_left' | 'turn_right' | 'completed';

export default function LivenessCheck() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState<LivenessStep>('blink');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [error, setError] = useState('');
  const [livenessScore, setLivenessScore] = useState(0);
  const cameraRef = useRef<Camera>(null);

  const livenessSteps = {
    blink: {
      title: 'Blink Your Eyes',
      instruction: 'Please blink your eyes naturally',
      icon: '👁️',
    },
    smile: {
      title: 'Smile',
      instruction: 'Please smile for the camera',
      icon: '😊',
    },
    turn_left: {
      title: 'Turn Left',
      instruction: 'Slowly turn your head to the left',
      icon: '👈',
    },
    turn_right: {
      title: 'Turn Right',
      instruction: 'Slowly turn your head to the right',
      icon: '👉',
    },
    completed: {
      title: 'Liveness Check Complete',
      instruction: 'All checks passed successfully',
      icon: '✅',
    },
  };

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const simulateLivenessDetection = () => {
    setIsProcessing(true);
    setError('');

    // Simulate liveness detection processing
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate for demo
      
      if (success) {
        setStepCompleted(true);
        setLivenessScore(prev => prev + 25);
        
        setTimeout(() => {
          moveToNextStep();
        }, 1000);
      } else {
        setError('Liveness check failed. Please try again.');
      }
      
      setIsProcessing(false);
    }, 2000);
  };

  const moveToNextStep = () => {
    const steps: LivenessStep[] = ['blink', 'smile', 'turn_left', 'turn_right', 'completed'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      setStepCompleted(false);
    } else {
      // All steps completed, proceed to selfie capture
      handleLivenessComplete();
    }
  };

  const handleLivenessComplete = () => {
    if (livenessScore >= 80) {
      Alert.alert(
        'Liveness Check Passed!',
        'You can now capture your selfie.',
        [
          {
            text: 'Continue',
            onPress: () => router.push('./SelfieCapture'),
          },
        ]
      );
    } else {
      Alert.alert(
        'Liveness Check Failed',
        'Please try again to complete all liveness checks.',
        [
          {
            text: 'Retry',
            onPress: () => {
              setCurrentStep('blink');
              setLivenessScore(0);
              setStepCompleted(false);
              setError('');
            },
          },
        ]
      );
    }
  };

  const handleSkipForDemo = () => {
    Alert.alert(
      'Skip Liveness Check?',
      'This is for demo purposes only. In production, liveness check is mandatory.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          onPress: () => router.push('./SelfieCapture'),
        },
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.cardContainer}>
              <Text style={styles.title}>Camera Permission Required</Text>
              <Text style={styles.subtitle}>
                Please allow camera access to complete the liveness check.
              </Text>
              <Button
                mode="contained"
                onPress={getCameraPermissions}
                style={styles.button}
                buttonColor="#fbbf24"
                textColor="#111827"
              >
                Grant Permission
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const currentStepData = livenessSteps[currentStep];

  return (
    <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Camera View */}
          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={CameraType.front}
              ratio="16:9"
            >
              {/* Overlay */}
              <View style={styles.overlay}>
                <View style={styles.faceFrame} />
              </View>
            </Camera>
          </View>

          {/* Instructions Card */}
          <View style={styles.instructionCard}>
            <Text style={styles.stepIcon}>{currentStepData.icon}</Text>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepInstruction}>{currentStepData.instruction}</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${livenessScore}%` }]} />
            </View>
            <Text style={styles.progressText}>{livenessScore}% Complete</Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {currentStep !== 'completed' && (
                <Button
                  mode="contained"
                  onPress={simulateLivenessDetection}
                  loading={isProcessing}
                  disabled={isProcessing || stepCompleted}
                  style={styles.actionButton}
                  buttonColor={stepCompleted ? "#10b981" : "#fbbf24"}
                  textColor="#111827"
                >
                  {isProcessing ? 'Processing...' : stepCompleted ? 'Completed ✓' : 'Start Check'}
                </Button>
              )}
              
              <Button
                mode="outlined"
                onPress={handleSkipForDemo}
                style={styles.skipButton}
                textColor="#6b7280"
              >
                Skip (Demo Only)
              </Button>
            </View>
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
    paddingVertical: 20,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: 200,
    height: 250,
    borderWidth: 3,
    borderColor: '#fbbf24',
    borderRadius: 100,
    backgroundColor: 'transparent',
  },
  instructionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  stepIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepInstruction: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 20,
  },
  errorContainer: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    width: '100%',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    borderRadius: 10,
  },
  skipButton: {
    borderRadius: 10,
    borderColor: '#9ca3af',
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
    marginBottom: 20,
    lineHeight: 18,
  },
  button: {
    borderRadius: 10,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
});
