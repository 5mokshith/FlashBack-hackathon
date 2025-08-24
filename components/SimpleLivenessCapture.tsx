import React, { useState, useReducer, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FaceDetection,
  Rect,
  detectionReducer,
  getInitialState,
  EnhancedLivenessDetector,
  instructionsText,
} from '../utils/enhancedLivenessDetection';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const PREVIEW_SIZE = Math.min(windowWidth * 0.8, 350);
const PREVIEW_RECT: Rect = {
  minX: (windowWidth - PREVIEW_SIZE) / 2,
  minY: windowHeight * 0.15,
  width: PREVIEW_SIZE,
  height: PREVIEW_SIZE,
};

interface SimpleLivenessCaptureProps {
  onSuccess: (result: { 
    success: boolean; 
    completedActions: number; 
    timeElapsed: number;
    livenessData: any;
  }) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  requiredActions?: number;
}

export default function SimpleLivenessCapture({
  onSuccess,
  onError,
  onCancel,
  requiredActions = 4,
}: SimpleLivenessCaptureProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [state, dispatch] = useReducer(detectionReducer, getInitialState());
  const [instruction, setInstruction] = useState(instructionsText.initialPrompt);
  const [currentAction, setCurrentAction] = useState('');
  const [actionProgress, setActionProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const detectorRef = useRef<EnhancedLivenessDetector | null>(null);
  const startTimeRef = useRef<number>(0);
  const completedActionsRef = useRef<number>(0);

  // Initialize detector
  useEffect(() => {
    detectorRef.current = new EnhancedLivenessDetector(dispatch);
  }, []);

  // Update detector state when state changes
  useEffect(() => {
    if (detectorRef.current) {
      detectorRef.current.updateState(state);
    }
  }, [state]);

  // Handle process completion
  useEffect(() => {
    if (state.processComplete && detectorRef.current) {
      const timeElapsed = Date.now() - startTimeRef.current;
      const livenessData = detectorRef.current.getLivenessData();
      
      onSuccess({
        success: true,
        completedActions: completedActionsRef.current,
        timeElapsed,
        livenessData,
      });
    }
  }, [state.processComplete, onSuccess]);

  // Request camera permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          onError('Camera permission is required for liveness detection');
        }
      } catch (error) {
        console.error('Permission request error:', error);
        onError('Failed to request camera permissions');
      }
    };

    requestPermissions();
  }, [onError]);

  // Handle face detection
  const onFacesDetected = ({ faces }: { faces: FaceDetection[] }) => {
    if (!detectorRef.current || !isProcessing) return;

    try {
      const result = detectorRef.current.processFaceDetection(faces, PREVIEW_RECT);
      
      setInstruction(result.instruction);
      
      if (result.action) {
        setCurrentAction(result.action);
      }

      if (result.actionProgress !== undefined) {
        setActionProgress(result.actionProgress);
      }

      // Update completed actions count
      completedActionsRef.current = state.currentDetectionIndex;

    } catch (error) {
      console.error('Face detection processing error:', error);
      onError('Error processing face detection');
    }
  };

  // Start processing when face is properly positioned
  useEffect(() => {
    if (state.faceDetected === 'yes' && 
        state.faceTooBig === 'no' && 
        state.faceTooSmall === 'no' && 
        !isProcessing) {
      setIsProcessing(true);
      startTimeRef.current = Date.now();
      setInstruction(instructionsText.performActions);
    } else if (state.faceDetected === 'no' || 
               state.faceTooBig === 'yes' || 
               state.faceTooSmall === 'yes') {
      setIsProcessing(false);
      setCurrentAction('');
      setActionProgress(0);
    }
  }, [state.faceDetected, state.faceTooBig, state.faceTooSmall, isProcessing]);

  // Handle camera errors
  const onCameraError = (error: any) => {
    console.error('Camera error:', error);
    onError('Camera error occurred. Please try again.');
  };

  // Handle cancel
  const handleCancel = () => {
    Alert.alert(
      'Cancel Liveness Check',
      'Are you sure you want to cancel? You will need to start over.',
      [
        { text: 'Continue', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: onCancel 
        },
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <LinearGradient
        colors={['#f59e0b', '#d97706', '#92400e']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Requesting camera permissions...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (hasPermission === false) {
    return (
      <LinearGradient
        colors={['#f59e0b', '#d97706', '#92400e']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Camera Permission Required</Text>
            <Text style={styles.errorText}>
              Camera access is required for liveness detection. Please enable camera access in your device settings.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#f59e0b', '#d97706', '#92400e']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Liveness Check</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Camera View */}
        <View style={styles.cameraContainer}>
          <Camera
            style={styles.camera}
            type={Camera.Constants.Type.front}
            onFacesDetected={onFacesDetected}
            onCameraReady={() => console.log('Camera ready')}
            onMountError={onCameraError}
            faceDetectorSettings={{
              mode: FaceDetector.Constants.Mode.fast,
              detectLandmarks: FaceDetector.Constants.Landmarks.none,
              runClassifications: FaceDetector.Constants.Classifications.all,
              minDetectionInterval: 100,
              tracking: true,
            }}
          >
            {/* Simple Progress Circle */}
            <View style={styles.progressCircle}>
              <View style={[styles.progressFill, { width: `${state.progressFill}%` }]} />
            </View>

            {/* Action Progress */}
            {isProcessing && actionProgress > 0 && (
              <View style={styles.actionProgressContainer}>
                <View style={styles.actionProgressCircle}>
                  <View style={[styles.actionProgressFill, { width: `${actionProgress}%` }]} />
                </View>
              </View>
            )}
          </Camera>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>{instruction}</Text>
          
          {currentAction && (
            <View style={styles.actionContainer}>
              <Text style={styles.action}>{currentAction}</Text>
              {isProcessing && (
                <Text style={styles.progress}>
                  Step {state.currentDetectionIndex + 1} of {state.detectionsList.length}
                </Text>
              )}
            </View>
          )}

          {/* Face Position Indicators */}
          <View style={styles.indicatorsContainer}>
            <View style={styles.indicatorRow}>
              <View style={[styles.indicator, state.faceDetected === 'yes' && styles.indicatorSuccess]}>
                <Text style={styles.indicatorText}>Face Detected</Text>
              </View>
              <View style={[styles.indicator, state.faceTooBig === 'no' && state.faceTooSmall === 'no' && styles.indicatorSuccess]}>
                <Text style={styles.indicatorText}>Position</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressBarFill, { width: `${state.progressFill}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(state.progressFill)}% Complete</Text>
          </View>
        </View>

        {/* Debug info in development */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Face: {state.faceDetected} | Too Big: {state.faceTooBig} | Too Small: {state.faceTooSmall}
            </Text>
            <Text style={styles.debugText}>
              Processing: {isProcessing ? 'Yes' : 'No'} | Progress: {Math.round(state.progressFill)}%
            </Text>
            <Text style={styles.debugText}>
              Action Progress: {Math.round(actionProgress)}%
            </Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  progressCircle: {
    position: 'absolute',
    top: PREVIEW_RECT.minY,
    left: PREVIEW_RECT.minX,
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: PREVIEW_SIZE / 2,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: PREVIEW_SIZE / 2,
  },
  actionProgressContainer: {
    position: 'absolute',
    top: PREVIEW_RECT.minY + PREVIEW_SIZE - 80,
    left: PREVIEW_RECT.minX + PREVIEW_SIZE - 80,
  },
  actionProgressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  actionProgressFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 30,
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
    color: 'white',
    marginBottom: 15,
    fontWeight: '500',
    lineHeight: 24,
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  action: {
    fontSize: 22,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 8,
  },
  progress: {
    fontSize: 14,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  indicatorsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 15,
  },
  indicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  indicatorSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
  },
  indicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  errorText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
  },
  debugText: {
    color: 'white',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 2,
  },
});
