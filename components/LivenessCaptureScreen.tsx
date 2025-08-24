import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from 'react-native-paper';
import { SecureStorage } from '../utils/storage';
import { flashBackApiService } from '../services/api';
import { 
  LivenessDetector, 
  LivenessChallenge, 
  LivenessResult,
  AntiSpoofingDetector 
} from '../utils/livenessDetection';

const { width, height } = Dimensions.get('window');

export default function LivenessCaptureScreen() {
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
  const [isProcessing, setIsProcessing] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const livenessDetector = useRef(new LivenessDetector());
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const frameProcessingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getCameraPermissions();
    return () => {
      if (frameProcessingInterval.current) {
        clearInterval(frameProcessingInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isLivenessActive && currentChallenge) {
      startProgressAnimation();
      startPulseAnimation();
      startFrameProcessing();
    } else {
      stopAnimations();
      stopFrameProcessing();
    }
  }, [isLivenessActive, currentChallenge]);

  const getCameraPermissions = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
  };

  const startLivenessDetection = () => {
    setError('');
    setSuccess('');
    setIsLivenessActive(true);
    setLivenessResults([]);
    
    const challenge = livenessDetector.current.startSession();
    setCurrentChallenge(challenge);
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

  const startFrameProcessing = () => {
    frameProcessingInterval.current = setInterval(async () => {
      if (!isLivenessActive || !cameraRef.current) return;

      try {
        // Capture frame for processing
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3,
          base64: false,
          skipProcessing: true,
        });

        if (photo?.uri) {
          const result = await livenessDetector.current.processFrame(photo.uri);
          
          if (result) {
            // Challenge completed
            handleLivenessResult(result);
          } else {
            // Update progress
            const progress = livenessDetector.current.getProgress();
            setChallengeProgress(progress);
          }
        }
      } catch (err) {
        console.error('Frame processing error:', err);
      }
    }, 100); // Process at ~10fps
  };

  const stopFrameProcessing = () => {
    if (frameProcessingInterval.current) {
      clearInterval(frameProcessingInterval.current);
      frameProcessingInterval.current = null;
    }
  };

  const handleLivenessResult = async (result: LivenessResult) => {
    setLivenessResults(prev => [...prev, result]);
    
    if (result.success) {
      // Challenge passed, check if we need more challenges
      if (livenessResults.length < 2) { // Require 2 successful challenges
        // Start next challenge
        setTimeout(() => {
          const nextChallenge = livenessDetector.current.startSession();
          setCurrentChallenge(nextChallenge);
          setChallengeProgress(0);
        }, 1000);
      } else {
        // All challenges completed successfully
        setIsLivenessActive(false);
        setCurrentChallenge(null);
        await captureVerifiedSelfie();
      }
    } else {
      // Challenge failed
      setError(`Liveness check failed: ${result.challenge.type}. Please try again.`);
      setIsLivenessActive(false);
      setCurrentChallenge(null);
      livenessDetector.current.reset();
    }
  };

  const captureVerifiedSelfie = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      setError('');

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo?.uri) {
        // Run anti-spoofing analysis
        const spoofingAnalysis = await AntiSpoofingDetector.analyzeForSpoofing(photo.uri);
        const qualityAnalysis = await AntiSpoofingDetector.verifyImageQuality(photo.uri);

        if (spoofingAnalysis.isSpoofed) {
          setError(`Spoofing detected: ${spoofingAnalysis.reasons.join(', ')}`);
          return;
        }

        if (!qualityAnalysis.isValid) {
          setError(`Image quality issues: ${qualityAnalysis.issues.join(', ')}`);
          return;
        }

        setCapturedImage(photo.uri);
        setSuccess('Liveness verification successful! Review your photo.');
      }
    } catch (err: any) {
      console.error('Capture error:', err);
      setError(`Failed to capture photo: ${err.message || 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
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
          <View style={styles.cameraContainer}>
            {capturedImage ? (
              <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            ) : (
              <CameraView
                style={styles.camera}
                facing={facing}
                ref={cameraRef}
              >
                <View style={styles.overlay}>
                  {isLivenessActive ? (
                    <Animated.View 
                      style={[
                        styles.livenessFrame,
                        {
                          transform: [{ scale: pulseAnimation }],
                          borderColor: currentChallenge?.type === 'blink' ? '#10b981' :
                                     currentChallenge?.type === 'smile' ? '#f59e0b' :
                                     currentChallenge?.type === 'turn_head' ? '#3b82f6' :
                                     '#8b5cf6'
                        }
                      ]}
                    />
                  ) : (
                    <View style={styles.faceFrame} />
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
                    </View>
                  )}
                </View>
              </CameraView>
            )}
          </View>

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
                    <Text style={[
                      styles.resultText,
                      { color: result.success ? '#10b981' : '#ef4444' }
                    ]}>
                      {result.challenge.type}: {result.success ? '✓' : '✗'} 
                      ({Math.round(result.confidence * 100)}%)
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
                  buttonColor="#10b981"
                  textColor="white"
                  icon="shield-check"
                >
                  Start Liveness Detection
                </Button>
              ) : isLivenessActive ? (
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsLivenessActive(false);
                    setCurrentChallenge(null);
                    livenessDetector.current.reset();
                  }}
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
                {isLivenessActive ? 'Follow the instructions above' : 'Liveness Detection Features:'}
              </Text>
              {!isLivenessActive && (
                <>
                  <Text style={styles.instructionItem}>• Blink detection prevents photo spoofing</Text>
                  <Text style={styles.instructionItem}>• Head movement verification</Text>
                  <Text style={styles.instructionItem}>• Anti-spoofing analysis</Text>
                  <Text style={styles.instructionItem}>• Real-time face tracking</Text>
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
});
