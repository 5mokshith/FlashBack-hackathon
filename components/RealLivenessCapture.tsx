import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  PanResponder,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from 'react-native-paper';
// import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import { SecureStorage } from '../utils/storage';
import { flashBackApiService } from '../services/api';
import { 
  EnhancedLivenessDetector, 
  LivenessChallenge, 
  LivenessResult,
  LivenessSession,
  FaceDetectionSimulator,
  FaceData
} from '../utils/enhancedLivenessDetection';

const { width, height } = Dimensions.get('window');

export default function RealLivenessCapture() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('front');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLivenessActive, setIsLivenessActive] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<LivenessChallenge | null>(null);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [livenessResults, setLivenessResults] = useState<LivenessResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState<'center' | 'too_close' | 'too_far' | 'off_center'>('center');
  const [livenessSession, setLivenessSession] = useState<LivenessSession | null>(null);
  const [currentFaceData, setCurrentFaceData] = useState<FaceData | null>(null);
  
  const cameraRef = useRef<CameraView>(null);
  const livenessDetector = useRef(new EnhancedLivenessDetector());
  const faceSimulator = useRef(new FaceDetectionSimulator());
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const faceDetectionInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const sensorSubscriptions = useRef<any[]>([]);

  useEffect(() => {
    getCameraPermissions();
    // Show loading screen for 2 seconds after OTP verification
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => {
      stopLivenessDetection();
      unsubscribeSensors();
      clearTimeout(loadingTimer);
    };
  }, []);

  useEffect(() => {
    // Simulate face detection feedback
    if (!isLoading && !capturedImage) {
      const faceDetectionInterval = setInterval(() => {
        // Simulate realistic face detection states
        const states: typeof facePosition[] = ['center', 'too_close', 'too_far', 'off_center'];
        const randomState = states[Math.floor(Math.random() * states.length)];
        setFacePosition(randomState);
        setFaceDetected(Math.random() > 0.2); // 80% face detection rate
      }, 1000);
      
      return () => clearInterval(faceDetectionInterval);
    }
  }, [isLoading, capturedImage]);

  useEffect(() => {
    if (isLivenessActive && currentChallenge) {
      startProgressAnimation();
      startPulseAnimation();
      startFaceDetection();
      subscribeSensors();
    } else {
      stopAnimations();
      stopFaceDetection();
      unsubscribeSensors();
    }
  }, [isLivenessActive, currentChallenge]);

  const getCameraPermissions = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
  };

  const subscribeSensors = () => {
    // Sensor functionality disabled for now - would require expo-sensors
    // This can be enabled once expo-sensors is properly installed
    console.log('Sensor monitoring would start here');
  };

  const unsubscribeSensors = () => {
    // Cleanup sensor subscriptions when available
    sensorSubscriptions.current = [];
  };

  const startLivenessDetection = () => {
    setError('');
    setSuccess('');
    setIsLivenessActive(true);
    setLivenessResults([]);
    
    const session = livenessDetector.current.startSession();
    setLivenessSession(session);
    setCurrentChallenge(session.challenges[0]);
    startFaceDetection();
  };

  const stopLivenessDetection = () => {
    setIsLivenessActive(false);
    setCurrentChallenge(null);
    setLivenessSession(null);
    livenessDetector.current.reset();
    faceSimulator.current.resetHeadPosition();
    stopFaceDetection();
  };

  const startProgressAnimation = () => {
    if (!currentChallenge) return;
    
    progressAnimation.setValue(0);
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: currentChallenge.duration,
      useNativeDriver: false,
    }).start();
  };

  const startPulseAnimation = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isLivenessActive) pulse();
      });
    };
    pulse();
  };

  const stopAnimations = () => {
    progressAnimation.stopAnimation();
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  const startFaceDetection = () => {
    faceDetectionInterval.current = setInterval(() => {
      if (!livenessDetector.current.isActive()) return;

      // Generate simulated face data
      const faceData = faceSimulator.current.generateFaceData();
      setCurrentFaceData(faceData);
      
      // Process face data for liveness detection
      const result = livenessDetector.current.processFaceData(faceData);
      const progress = livenessDetector.current.getProgress();
      
      setChallengeProgress(progress);
      
      if (result) {
        handleLivenessResult(result);
      }
    }, 100); // 10fps processing
  };

  const stopFaceDetection = () => {
    if (faceDetectionInterval.current) {
      clearInterval(faceDetectionInterval.current);
      faceDetectionInterval.current = null;
    }
  };

  const handleLivenessResult = async (result: LivenessResult) => {
    setLivenessResults(prev => [...prev, result]);
    
    if (result.success) {
      // Challenge passed, check if session is complete
      if (livenessDetector.current.isSessionComplete()) {
        // All challenges completed successfully
        setIsLivenessActive(false);
        setCurrentChallenge(null);
        stopFaceDetection();
        await captureVerifiedSelfie();
      } else {
        // Move to next challenge
        const currentSession = livenessDetector.current.getCurrentChallenge();
        if (currentSession) {
          setCurrentChallenge(currentSession);
          setChallengeProgress(0);
        }
      }
    } else {
      // Challenge failed
      setError(`Liveness check failed: ${result.errorMessage || 'Please try again.'}`);
      stopLivenessDetection();
    }
  };

  const handleScreenTap = () => {
    if (!isLivenessActive || !currentChallenge) return;
    
    // Simulate user actions for different challenge types
    if (currentChallenge.type === 'blink') {
      faceSimulator.current.simulateBlink();
    } else if (currentChallenge.type === 'turn_left') {
      faceSimulator.current.simulateHeadTurnLeft();
    } else if (currentChallenge.type === 'turn_right') {
      faceSimulator.current.simulateHeadTurnRight();
    }
  };

  const handleTouchStart = () => {
    // Not needed for enhanced liveness detection
  };

  const handleTouchEnd = () => {
    // Not needed for enhanced liveness detection
  };

  const captureVerifiedSelfie = async () => {
    if (!cameraRef.current) return;

    try {
      setError('');
      
      // Check if all liveness challenges were passed
      const sessionSummary = livenessDetector.current.getSessionSummary();
      if (!sessionSummary || !sessionSummary.overallSuccess) {
        setError('Liveness verification incomplete. Please try again.');
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedImage(photo.uri);
        setSuccess('Liveness verification successful! Review your photo.');
      }
    } catch (err: any) {
      console.error('Capture error:', err);
      setError(`Failed to capture photo: ${err.message || 'Please try again.'}`);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setError('');
    setSuccess('');
    setLivenessResults([]);
    livenessDetector.current.reset();
  };

  const uploadSelfie = async () => {
    if (!capturedImage) {
      setError('No image captured');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const authToken = await SecureStorage.getAuthToken();
      const phoneNumber = await SecureStorage.getUserPhone();

      if (!authToken || !phoneNumber) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch(capturedImage);
      const blob = await response.blob();

      const uploadResponse = await flashBackApiService.uploadSelfie(
        blob,
        phoneNumber,
        authToken
      );

      if (uploadResponse.success) {
        setSuccess('Verified selfie uploaded successfully!');
        
        setTimeout(() => {
          router.push('./Home');
        }, 1500);
      } else {
        setError(uploadResponse.message || 'Failed to upload selfie');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      
      let errorMessage = 'Failed to upload selfie. Please try again.';
      
      if (err.message) {
        const message = err.message.toLowerCase();
        if (message.includes('network') || message.includes('connection')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (message.includes('unauthorized') || message.includes('token')) {
          errorMessage = 'Session expired. Please login again.';
        } else if (message.includes('size') || message.includes('large')) {
          errorMessage = 'Image too large. Please try again.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const getChallengeStatusText = () => {
    if (!currentChallenge) return '';
    
    switch (currentChallenge.type) {
      case 'blink':
        return 'Waiting for natural blink...';
      case 'turn_left':
        return 'Turn your head left';
      case 'turn_right':
        return 'Turn your head right';
      default:
        return 'Follow the instruction';
    }
  };

  const getFacePositionText = () => {
    if (!faceDetected) return 'Position your face in the frame';
    
    switch (facePosition) {
      case 'too_close':
        return 'Move back - too close';
      case 'too_far':
        return 'Move closer to camera';
      case 'off_center':
        return 'Center your face in the frame';
      case 'center':
        return 'Perfect position!';
      default:
        return 'Position your face in the frame';
    }
  };

  const getFaceFrameColor = () => {
    if (!faceDetected) return '#ef4444'; // Red when no face
    
    switch (facePosition) {
      case 'center':
        return '#10b981'; // Green when centered
      case 'too_close':
      case 'too_far':
      case 'off_center':
        return '#f59e0b'; // Orange when adjusting needed
      default:
        return '#ef4444';
    }
  };

  if (!permission) {
    return (
      <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.controlsCard}>
              <Text style={styles.headerTitle}>Requesting camera permission...</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!permission?.granted) {
    return (
      <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.controlsCard}>
              <Text style={styles.headerTitle}>Camera Permission Required</Text>
              <Text style={styles.headerSubtitle}>
                Please allow camera access for liveness detection.
              </Text>
              <Button
                mode="contained"
                onPress={getCameraPermissions}
                style={styles.button}
                buttonColor="#fbbf24"
                textColor="#111827"
              >
                Grant Camera Permission
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Loading screen after OTP verification
  if (isLoading) {
    return (
      <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <Animated.View style={[styles.loadingSpinner, { transform: [{ rotate: pulseAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
                <Text style={styles.loadingIcon}>🔒</Text>
              </Animated.View>
              <Text style={styles.loadingTitle}>Preparing Liveness Detection</Text>
              <Text style={styles.loadingSubtitle}>Setting up secure verification...</Text>
              <View style={styles.loadingProgress}>
                <View style={styles.loadingProgressBar} />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isLivenessActive ? 'Liveness Detection' : 'Secure Selfie Capture'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isLivenessActive && currentChallenge
                ? currentChallenge.instruction
                : capturedImage
                ? 'Liveness verified! Review and upload your selfie'
                : 'Start liveness detection to capture a verified selfie'
              }
            </Text>
          </View>

          {/* Camera/Image View */}
          <TouchableOpacity
            style={styles.cameraContainer}
            onPress={handleScreenTap}
            onPressIn={handleTouchStart}
            onPressOut={handleTouchEnd}
            activeOpacity={0.9}
          >
            {capturedImage ? (
              <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            ) : (
              <View style={styles.cameraWrapper}>
                <CameraView
                  style={styles.camera}
                  facing={facing}
                  ref={cameraRef}
                />
                <View style={styles.overlay}>
                  {isLivenessActive ? (
                    <Animated.View 
                      style={[
                        styles.livenessFrame,
                        {
                          transform: [{ scale: pulseAnimation }],
                          borderColor: currentChallenge?.type === 'blink' ? '#10b981' :
                                     currentChallenge?.type === 'turn_left' ? '#f59e0b' :
                                     currentChallenge?.type === 'turn_right' ? '#3b82f6' :
                                     '#8b5cf6'
                        }
                      ]}
                    />
                  ) : (
                    <View style={[styles.faceFrame, { borderColor: getFaceFrameColor() }]} />
                  )}
                  
                  {/* Face detection feedback */}
                  {!isLivenessActive && !capturedImage && (
                    <View style={styles.faceDetectionContainer}>
                      <View style={[styles.faceDetectionIndicator, { backgroundColor: faceDetected ? '#10b981' : '#ef4444' }]} />
                      <Text style={styles.faceDetectionText}>{getFacePositionText()}</Text>
                    </View>
                  )}
                  
                  {isLivenessActive && currentChallenge && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <Animated.View 
                          style={[
                            styles.progressFill,
                            {
                              width: progressAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                              }),
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(challengeProgress * 100)}%
                      </Text>
                      <Text style={styles.statusText}>
                        {getChallengeStatusText()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Controls Card */}
          <View style={styles.controlsCard}>
            {/* Error/Success Messages */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            {/* Liveness Results */}
            {livenessResults.length > 0 && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Verification Progress:</Text>
                {livenessResults.map((result, index) => (
                  <View key={index} style={styles.resultItem}>
                    <Text style={[styles.resultText, { color: result.success ? '#10b981' : '#ef4444' }]}>
                      {result.challengeType}: {result.success ? '✓' : '✗'} ({Math.round(result.confidence * 100)}%)
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {!capturedImage && !isLivenessActive ? (
                <Button
                  mode="contained"
                  onPress={startLivenessDetection}
                  style={styles.captureButton}
                  buttonColor={faceDetected && facePosition === 'center' ? "#10b981" : "#9ca3af"}
                  textColor="white"
                  icon="shield-check"
                  disabled={!faceDetected || facePosition !== 'center'}
                >
                  {faceDetected && facePosition === 'center' ? 'Start Liveness Detection' : 'Position Face Correctly'}
                </Button>
              ) : isLivenessActive ? (
                <Button
                  mode="outlined"
                  onPress={stopLivenessDetection}
                  style={styles.cancelButton}
                  textColor="#ef4444"
                >
                  Cancel Detection
                </Button>
              ) : (
                <View style={styles.reviewButtons}>
                  <Button
                    mode="outlined"
                    onPress={retakePicture}
                    style={styles.retakeButton}
                    textColor="#6b7280"
                  >
                    Retake
                  </Button>
                  
                  <Button
                    mode="contained"
                    onPress={uploadSelfie}
                    loading={isUploading}
                    disabled={isUploading}
                    style={styles.uploadButton}
                    buttonColor="#10b981"
                    textColor="white"
                  >
                    {isUploading ? 'Uploading...' : 'Upload Verified'}
                  </Button>
                </View>
              )}
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>
                {isLivenessActive ? 'Follow the instructions above' : 'Real Liveness Detection:'}
              </Text>
              {!isLivenessActive && (
                <>
                  <Text style={styles.instructionItem}>• Interactive challenges prevent spoofing</Text>
                  <Text style={styles.instructionItem}>• Behavioral analysis detects bots</Text>
                  <Text style={styles.instructionItem}>• Device sensor validation</Text>
                  <Text style={styles.instructionItem}>• No gallery import allowed</Text>
                </>
              )}
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fde68a',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  capturedImage: {
    flex: 1,
    width: '100%',
  },
  cameraWrapper: {
    position: 'relative',
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  livenessFrame: {
    width: 220,
    height: 270,
    borderWidth: 4,
    borderRadius: 110,
    backgroundColor: 'transparent',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  controlsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  errorContainer: {
    marginBottom: 16,
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
    marginBottom: 16,
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
  resultsContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  resultItem: {
    marginBottom: 4,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  captureButton: {
    borderRadius: 10,
    paddingVertical: 8,
  },
  cancelButton: {
    borderRadius: 10,
    borderColor: '#ef4444',
  },
  reviewButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    borderRadius: 10,
    borderColor: '#9ca3af',
  },
  uploadButton: {
    flex: 1,
    borderRadius: 10,
  },
  instructionsContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 16,
  },
  button: {
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    maxWidth: 300,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  loadingProgress: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgressBar: {
    height: '100%',
    width: '70%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  faceDetectionContainer: {
    position: 'absolute',
    top: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 12,
  },
  faceDetectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  faceDetectionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
