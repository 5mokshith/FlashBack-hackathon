import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface FaceData {
  faceDetected: boolean;
  leftEyeOpenProbability: number;
  rightEyeOpenProbability: number;
  smilingProbability: number;
  headEulerAngleY: number;
  headEulerAngleX: number;
  timestamp: number;
}

export default function FaceDetectionTest() {
  const [permission, requestPermission] = useCameraPermissions();
  const [faceData, setFaceData] = useState<FaceData | null>(null);
  const [isActive, setIsActive] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleFacesDetected = ({ faces }: { faces: any[] }) => {
    if (faces.length > 0) {
      const face = faces[0];
      const data: FaceData = {
        faceDetected: true,
        leftEyeOpenProbability: face.leftEyeOpenProbability || 0,
        rightEyeOpenProbability: face.rightEyeOpenProbability || 0,
        smilingProbability: face.smilingProbability || 0,
        headEulerAngleY: face.headEulerAngleY || 0,
        headEulerAngleX: face.headEulerAngleX || 0,
        timestamp: Date.now()
      };
      setFaceData(data);
    } else {
      setFaceData({
        faceDetected: false,
        leftEyeOpenProbability: 0,
        rightEyeOpenProbability: 0,
        smilingProbability: 0,
        headEulerAngleY: 0,
        headEulerAngleX: 0,
        timestamp: Date.now()
      });
    }
  };

  const startDetection = () => {
    setIsActive(true);
  };

  const stopDetection = () => {
    setIsActive(false);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required</Text>
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
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: 'fast',
          detectLandmarks: 'all',
          runClassifications: 'all',
          minDetectionInterval: 100,
          tracking: true,
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.faceFrame} />
          
          {/* Face Detection Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Face Detection Test</Text>
            <Text style={styles.infoText}>
              Face: {faceData?.faceDetected ? '✅ Detected' : '❌ Not Detected'}
            </Text>
            {faceData?.faceDetected && (
              <>
                <Text style={styles.infoText}>
                  Left Eye: {(faceData.leftEyeOpenProbability * 100).toFixed(1)}%
                </Text>
                <Text style={styles.infoText}>
                  Right Eye: {(faceData.rightEyeOpenProbability * 100).toFixed(1)}%
                </Text>
                <Text style={styles.infoText}>
                  Smile: {(faceData.smilingProbability * 100).toFixed(1)}%
                </Text>
                <Text style={styles.infoText}>
                  Head Yaw: {faceData.headEulerAngleY.toFixed(1)}°
                </Text>
                <Text style={styles.infoText}>
                  Head Pitch: {faceData.headEulerAngleX.toFixed(1)}°
                </Text>
              </>
            )}
          </View>

          {/* Controls */}
          <View style={styles.controlsContainer}>
            {!isActive ? (
              <TouchableOpacity style={styles.startButton} onPress={startDetection}>
                <Text style={styles.startButtonText}>Start Detection</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopButton} onPress={stopDetection}>
                <Text style={styles.stopButtonText}>Stop Detection</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>
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
  faceFrame: {
    width: 250,
    height: 300,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#00ff00',
    borderStyle: 'dashed',
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 5,
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
  text: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
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
