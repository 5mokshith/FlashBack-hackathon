import React, { useState, useReducer, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import MaskedView from '@react-native-community/masked-view';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import {
  FaceDetection,
  Rect,
  detectionReducer,
  initialState,
  FaceBasedLivenessDetector,
  instructionsText,
} from '../utils/faceBasedLivenessDetection';

const { width: windowWidth } = Dimensions.get('window');
const PREVIEW_SIZE = 325;
const PREVIEW_RECT: Rect = {
  minX: (windowWidth - PREVIEW_SIZE) / 2,
  minY: 50,
  width: PREVIEW_SIZE,
  height: PREVIEW_SIZE,
};

interface FaceBasedLivenessCaptureProps {
  onSuccess: (result: { success: boolean; completedActions: number; timeElapsed: number }) => void;
  onError: (error: string) => void;
  requiredActions?: number;
}

export default function FaceBasedLivenessCapture({
  onSuccess,
  onError,
  requiredActions = 5,
}: FaceBasedLivenessCaptureProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [state, dispatch] = useReducer(detectionReducer, initialState);
  const [instruction, setInstruction] = useState(instructionsText.initialPrompt);
  const [currentAction, setCurrentAction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const detectorRef = useRef<FaceBasedLivenessDetector | null>(null);
  const startTimeRef = useRef<number>(0);
  const completedActionsRef = useRef<number>(0);

  // Initialize detector
  useEffect(() => {
    detectorRef.current = new FaceBasedLivenessDetector(dispatch);
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
      onSuccess({
        success: true,
        completedActions: completedActionsRef.current,
        timeElapsed,
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

      // Update completed actions count
      completedActionsRef.current = state.currentDetectionIndex;

    } catch (error) {
      console.error('Face detection processing error:', error);
      onError('Error processing face detection');
    }
  };

  // Start processing when face is properly positioned
  useEffect(() => {
    if (state.faceDetected === 'yes' && state.faceTooBig === 'no' && !isProcessing) {
      setIsProcessing(true);
      startTimeRef.current = Date.now();
      setInstruction(instructionsText.performActions);
    } else if (state.faceDetected === 'no' || state.faceTooBig === 'yes') {
      setIsProcessing(false);
      setCurrentAction('');
    }
  }, [state.faceDetected, state.faceTooBig, isProcessing]);

  // Handle camera errors
  const onCameraError = (error: any) => {
    console.error('Camera error:', error);
    onError('Camera error occurred');
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission denied</Text>
        <Text style={styles.errorSubtext}>
          Please enable camera access in your device settings to use liveness detection.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={StyleSheet.absoluteFill}>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={<View style={styles.mask} />}
      >
        <Camera
          style={StyleSheet.absoluteFill}
          type={Camera.Constants.Type.front}
          onFacesDetected={onFacesDetected}
          onCameraReady={() => console.log('Camera ready')}
          onMountError={onCameraError}
          faceDetectorSettings={{
            mode: FaceDetector.Constants.Mode.fast,
            detectLandmarks: FaceDetector.Constants.Landmarks.none,
            runClassifications: FaceDetector.Constants.Classifications.all,
            minDetectionInterval: 125,
            tracking: false,
          }}
        >
          <AnimatedCircularProgress
            style={styles.circularProgress}
            size={PREVIEW_SIZE}
            width={5}
            backgroundWidth={7}
            fill={state.progressFill}
            tintColor="#3485FF"
            backgroundColor="#e8e8e8"
            duration={300}
          />
        </Camera>
      </MaskedView>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>{instruction}</Text>
        {currentAction && (
          <Text style={styles.action}>{currentAction}</Text>
        )}
        {isProcessing && (
          <Text style={styles.progress}>
            Step {state.currentDetectionIndex + 1} of {state.detectionsList.length}
          </Text>
        )}
      </View>

      {/* Debug info in development */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Face: {state.faceDetected} | Too Big: {state.faceTooBig}
          </Text>
          <Text style={styles.debugText}>
            Processing: {isProcessing ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.debugText}>
            Progress: {Math.round(state.progressFill)}%
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  mask: {
    borderRadius: PREVIEW_SIZE / 2,
    height: PREVIEW_SIZE,
    width: PREVIEW_SIZE,
    marginTop: PREVIEW_RECT.minY,
    alignSelf: 'center',
    backgroundColor: 'white',
  },
  circularProgress: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    marginTop: PREVIEW_RECT.minY,
    marginLeft: PREVIEW_RECT.minX,
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: PREVIEW_RECT.minY + PREVIEW_SIZE + 20,
    paddingHorizontal: 20,
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
    fontWeight: '500',
  },
  action: {
    fontSize: 22,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#3485FF',
    marginBottom: 10,
  },
  progress: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  debugContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
});
