import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function SimpleFaceTest() {
  const [permission, requestPermission] = useCameraPermissions();
  const [faceCount, setFaceCount] = useState(0);
  const [lastFaceData, setLastFaceData] = useState<any>(null);

  const handleFacesDetected = ({ faces }: { faces: any[] }) => {
    setFaceCount(faces.length);
    if (faces.length > 0) {
      setLastFaceData(faces[0]);
    }
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
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Simple Face Test</Text>
            <Text style={styles.infoText}>
              Faces Detected: {faceCount}
            </Text>
            {lastFaceData && (
              <>
                <Text style={styles.infoText}>
                  Left Eye: {(lastFaceData.leftEyeOpenProbability * 100).toFixed(1)}%
                </Text>
                <Text style={styles.infoText}>
                  Right Eye: {(lastFaceData.rightEyeOpenProbability * 100).toFixed(1)}%
                </Text>
                <Text style={styles.infoText}>
                  Smile: {(lastFaceData.smilingProbability * 100).toFixed(1)}%
                </Text>
                <Text style={styles.infoText}>
                  Head Yaw: {lastFaceData.headEulerAngleY?.toFixed(1) || 'N/A'}°
                </Text>
                <Text style={styles.infoText}>
                  Head Pitch: {lastFaceData.headEulerAngleX?.toFixed(1) || 'N/A'}°
                </Text>
              </>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
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
