import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  MLKitLivenessDetector,
  FallbackMotionDetector,
  BlinkDetectionResult,
  LivenessState,
} from '../utils/mlkitLivenessDetection';

const { width, height } = Dimensions.get('window');

interface MLKitLivenessCaptureProps {
  onSuccess: (result: BlinkDetectionResult) => void;
  onError: (error: string) => void;
  requiredBlinks?: number;
}

export default function MLKitLivenessCapture({
  onSuccess,
  onError,
  requiredBlinks = 2,
}: MLKitLivenessCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [livenessState, setLivenessState] = useState<LivenessState | null>(null);
  const [instruction, setInstruction] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [useExpoFaceDetector, setUseExpoFaceDetector] = useState<boolean>(true);

  const cameraRef = useRef<CameraView>(null);

  // Detectors
  const mlkitDetector = useRef(new MLKitLivenessDetector());
  const fallbackDetector = useRef(new FallbackMotionDetector());

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      startProgressAnimation();
      startPulseAnimation();
    }
  }, [isActive]);


  const startLivenessDetection = async () => {
    try {
      setIsActive(true);
      
      if (useExpoFaceDetector) {
        // Try Expo Face Detector first
        try {
          const challenge = mlkitDetector.current.startBlinkChallenge(requiredBlinks);
          setInstruction(challenge.instruction);
          setLivenessState(mlkitDetector.current.getCurrentState());
          startFrameProcessing();
        } catch (faceDetectorError) {
          console.log('Expo Face Detector not available, falling back to motion detection');
          setUseExpoFaceDetector(false);
          startFallbackDetection();
        }
      } else {
        startFallbackDetection();
      }
    } catch (error) {
      console.error('Liveness detection start error:', error);
      onError('Failed to start liveness detection');
    }
  };

  const startFallbackDetection = () => {
    const challenge = fallbackDetector.current.startMotionChallenge();
    setInstruction(challenge.instruction);
    startMotionProcessing();
  };

  const startFrameProcessing = () => {
    const processFrame = async () => {
      if (!isActive || !cameraRef.current) return;

      try {
        // Take a photo for processing
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: false,
          skipProcessing: true,
        });

        const result = await mlkitDetector.current.processFrame(photo.uri);
        
        if (result) {
          handleDetectionResult(result);
        } else {
          // Update UI state
          const currentState = mlkitDetector.current.getCurrentState();
          setLivenessState(currentState);
          setProgress(mlkitDetector.current.getProgress());
          
          // Continue processing
          setTimeout(processFrame, 100); // Process at ~10fps
        }
      } catch (error) {
        console.error('Frame processing error:', error);
        // Continue processing despite errors
        setTimeout(processFrame, 200);
      }
    };

    processFrame();
  };

  const startMotionProcessing = () => {
    const processMotion = async () => {
      if (!isActive || !cameraRef.current) return;

      try {
        // Simulate motion detection with periodic checks
        const mockBoundingBox = {
          x: Math.random() * 10,
          y: Math.random() * 10,
          width: 100 + Math.random() * 20,
          height: 120 + Math.random() * 20,
        };

        const result = fallbackDetector.current.processMotionFrame(mockBoundingBox);
        
        if (result) {
          handleDetectionResult(result);
        } else {
          setTimeout(processMotion, 200); // Process at 5fps for fallback
        }
      } catch (error) {
        console.error('Motion processing error:', error);
        setTimeout(processMotion, 300);
      }
    };

    processMotion();
  };

  const handleDetectionResult = (result: BlinkDetectionResult) => {
    setIsActive(false);
    
    if (result.success) {
      onSuccess(result);
    } else {
      onError(result.error || 'Liveness detection failed');
    }
    
    // Reset detectors
    mlkitDetector.current.reset();
    fallbackDetector.current.reset();
  };

  const startProgressAnimation = () => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 10000, // 10 seconds
      useNativeDriver: false,
    }).start();
  };

  const startPulseAnimation = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isActive) pulse();
      });
    };
    pulse();
  };

  const stopDetection = () => {
    setIsActive(false);
    mlkitDetector.current.reset();
    fallbackDetector.current.reset();
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Face Guide */}
        <View style={styles.faceGuideContainer}>
          <Animated.View
            style={[
              styles.faceGuide,
              {
                transform: [{ scale: pulseAnim }],
                borderColor: isActive ? '#00ff00' : '#ffffff',
              },
            ]}
          />
        </View>

        {/* Instructions */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            {instruction || 'Position your face in the circle'}
          </Text>
          
          {livenessState && (
            <Text style={styles.statusText}>
              Blinks: {livenessState.completedBlinks}/{requiredBlinks}
            </Text>
          )}
        </View>

        {/* Progress Bar */}
        {isActive && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {!isActive ? (
            <TouchableOpacity style={styles.startButton} onPress={startLivenessDetection}>
              <Text style={styles.startButtonText}>Start Liveness Check</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={stopDetection}>
              <Text style={styles.stopButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Detection Method Indicator */}
        <View style={styles.methodIndicator}>
          <Text style={styles.methodText}>
            {useExpoFaceDetector ? 'Expo Face Detection' : 'Motion Detection'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  faceGuideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 250,
    height: 300,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderStyle: 'dashed',
  },
  instructionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  statusText: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    width: width - 40,
    marginHorizontal: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff00',
    borderRadius: 2,
  },
  controlsContainer: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  methodIndicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 5,
  },
  methodText: {
    color: '#ffffff',
    fontSize: 12,
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 18,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});
