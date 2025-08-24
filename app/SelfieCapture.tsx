import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from 'react-native-paper';
import { SecureStorage } from '../utils/storage';
import { flashBackApiService } from '../services/api';
import { PhoneFormatter } from '../utils/phoneFormatter';

export default function SelfieCapture() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setError('');
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });
        setCapturedImage(photo.uri);
      } catch (err) {
        console.error('Error taking picture:', err);
        setError('Failed to capture photo. Please try again.');
      }
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setError('');
    setSuccess('');
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
      // Get stored auth token and phone number
      const authToken = await SecureStorage.getAuthToken();
      const phoneNumber = await SecureStorage.getUserPhone();

      if (!authToken || !phoneNumber) {
        throw new Error('Authentication required. Please login again.');
      }

      // Convert image URI to blob for upload
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Upload selfie
      const uploadResponse = await flashBackApiService.uploadSelfie(
        blob,
        phoneNumber, // Using phone number as username in E.164 format
        authToken
      );

      if (uploadResponse.success) {
        setSuccess('Selfie uploaded successfully!');
        
        // Navigate to home page after successful upload
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
                Please allow camera access to capture your selfie.
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

  return (
    <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Capture Selfie</Text>
            <Text style={styles.headerSubtitle}>
              {capturedImage ? 'Review and upload your selfie' : 'Position your face in the frame'}
            </Text>
          </View>

          {/* Camera/Image View */}
          <View style={styles.cameraContainer}>
            {capturedImage ? (
              <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            ) : (
              <Camera
                ref={cameraRef}
                style={styles.camera}
                type={CameraType.front}
                ratio="4:3"
              >
                <View style={styles.overlay}>
                  <View style={styles.faceFrame} />
                </View>
              </Camera>
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

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {!capturedImage ? (
                <Button
                  mode="contained"
                  onPress={takePicture}
                  style={styles.captureButton}
                  buttonColor="#fbbf24"
                  textColor="#111827"
                  icon="camera"
                >
                  Capture Selfie
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
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </View>
              )}
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Tips for a good selfie:</Text>
              <Text style={styles.instructionItem}>• Look directly at the camera</Text>
              <Text style={styles.instructionItem}>• Ensure good lighting</Text>
              <Text style={styles.instructionItem}>• Keep your face centered</Text>
              <Text style={styles.instructionItem}>• Remove glasses if possible</Text>
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fde68a',
    textAlign: 'center',
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
  buttonContainer: {
    marginBottom: 20,
  },
  captureButton: {
    borderRadius: 10,
    paddingVertical: 8,
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
