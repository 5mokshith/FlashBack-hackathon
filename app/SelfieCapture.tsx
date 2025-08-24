import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from 'react-native-paper';
import { flashBackApiService } from '../services/api';
import { SecureStorage } from '../utils/storage';

export default function SelfieCapture() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      // Request camera permissions if needed
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          setError('Camera permission is required to capture selfie');
          return;
        }
      }
    })();
  }, [permission, requestPermission]);

  const takePicture = async () => {
    if (!cameraRef.current || !permission?.granted) {
      setError('❌ Camera not ready. Please ensure camera permissions are granted and try again.');
      return;
    }

    setIsCapturing(true);
    setError('');
    setSuccessMessage('');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo && photo.uri) {
        setCapturedImage(photo.uri);
        setSuccessMessage('📸 Photo captured successfully!');
        console.log('Photo captured:', photo.uri);
      } else {
        throw new Error('Camera failed to capture image');
      }
    } catch (error: any) {
      console.error('Capture failed:', error);
      let errorMessage = '📷 Failed to capture photo. ';
      
      if (error.message?.includes('permission')) {
        errorMessage += 'Camera permission denied. Please enable camera access in settings.';
      } else if (error.message?.includes('busy')) {
        errorMessage += 'Camera is busy. Please wait a moment and try again.';
      } else if (error.message?.includes('hardware')) {
        errorMessage += 'Camera hardware issue. Please restart the app.';
      } else {
        errorMessage += 'Please ensure good lighting and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsCapturing(false);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setError('');
    setSuccessMessage('');
    setUploadProgress(0);
  };

  const uploadSelfie = async () => {
    if (!capturedImage) {
      setError('❌ No image to upload. Please capture a selfie first.');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccessMessage('');
    setUploadProgress(0);

    try {
      // Validate user authentication
      const phoneNumber = await SecureStorage.getUserPhone();
      const authToken = await SecureStorage.getAuthToken();
      
      if (!phoneNumber) {
        setError('❌ Phone number not found. Please restart the verification process.');
        setTimeout(() => router.replace('/'), 2000);
        return;
      }
      
      if (!authToken) {
        setError('❌ Authentication expired. Please verify your phone number again.');
        setTimeout(() => router.replace('/OtpVerification'), 2000);
        return;
      }

      setUploadProgress(25);
      setSuccessMessage('📤 Preparing image for upload...');

      // Create a blob from the image URI with validation
      const response = await fetch(capturedImage);
      if (!response.ok) {
        throw new Error('Failed to process captured image');
      }
      
      const blob = await response.blob();
      
      // Validate image size (max 5MB)
      if (blob.size > 5 * 1024 * 1024) {
        setError('❌ Image too large (max 5MB). Please retake the photo.');
        return;
      }
      
      setUploadProgress(50);
      setSuccessMessage('☁️ Uploading selfie...');
      
      // Upload selfie using the API
      const uploadResponse = await flashBackApiService.uploadSelfie(
        blob,
        phoneNumber,
        authToken
      );

      setUploadProgress(75);

      if (uploadResponse.success) {
        setUploadProgress(100);
        setSuccessMessage('✅ Selfie uploaded successfully!');
        
        // Store selfie URL if provided
        if (uploadResponse.imageUrl) {
          await SecureStorage.storeUserSelfie(uploadResponse.imageUrl);
        }
        
        // Store selfie completion status
        await SecureStorage.storeSelfieCompleted(true);
        
        // Show success message before navigation
        setTimeout(() => {
          router.replace('/Home');
        }, 1500);
      } else {
        throw new Error(uploadResponse.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadProgress(0);
      
      let errorMessage = '❌ Upload failed. ';
      
      if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage += 'Network error. Please check your internet connection and try again.';
      } else if (err.message?.includes('unauthorized') || err.message?.includes('401')) {
        errorMessage += 'Authentication expired. Redirecting to verification...';
        setTimeout(() => router.replace('/OtpVerification'), 2000);
      } else if (err.message?.includes('timeout')) {
        errorMessage += 'Upload timed out. Please try again with a better connection.';
      } else if (err.message?.includes('server') || err.message?.includes('500')) {
        errorMessage += 'Server error. Please try again in a few moments.';
      } else if (err.message?.includes('size') || err.message?.includes('large')) {
        errorMessage += 'Image too large. Please retake with lower quality.';
      } else {
        errorMessage += err.message || 'Please check your connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  if (permission === null) {
    return (
      <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!permission?.granted) {
    return (
      <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Camera permission required</Text>
          <Text style={styles.subErrorText}>We need camera access to capture your selfie</Text>
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={async () => {
                console.log('Manual permission request');
                const result = await requestPermission();
                if (!result.granted) {
                  Alert.alert(
                    'Permission Required',
                    'Camera permission is required to capture selfies. Please enable it in your device settings.',
                    [{ text: 'OK' }]
                  );
                }
              }}
              style={[styles.button, { marginBottom: 10 }]}
              buttonColor="#10b981"
              textColor="white"
            >
              Grant Camera Permission
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.button}
              textColor="white"
            >
              Go Back
            </Button>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f59e0b', '#d97706', '#92400e']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Selfie Capture</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {!capturedImage ? (
          // Camera view for capturing
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
              onCameraReady={() => {
                console.log('Camera is ready');
                setError(''); // Clear any errors when camera is ready
              }}
              onMountError={(error: any) => {
                console.error('Camera mount error:', error);
                setError(`Camera failed to initialize: ${error.message}`);
              }}
            />
            
            {/* Enhanced instructions overlay */}
            <View style={styles.instructionsOverlay}>
              <Text style={styles.instructionText}>📸 Take your selfie</Text>
              <Text style={styles.subInstructionText}>• Position your face in the center</Text>
              <Text style={styles.subInstructionText}>• Ensure good lighting</Text>
              <Text style={styles.subInstructionText}>• Look directly at the camera</Text>
              <Text style={styles.subInstructionText}>• Remove glasses if possible</Text>
            </View>

            {/* Capture button */}
            <View style={styles.captureButtonContainer}>
              <TouchableOpacity
                onPress={takePicture}
                disabled={isCapturing}
                style={[
                  styles.captureButton,
                  isCapturing && styles.captureButtonDisabled
                ]}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Preview captured image
          <View style={styles.previewContainer}>
            <View style={styles.imagePreview}>
              <Image
                source={{ uri: capturedImage }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            </View>
            
            <View style={styles.previewActions}>
              <Button
                mode="outlined"
                onPress={retakePicture}
                disabled={isUploading}
                style={[styles.button, styles.retakeButton]}
                textColor="white"
              >
                Retake
              </Button>
              
              <Button
                mode="contained"
                onPress={uploadSelfie}
                loading={isUploading}
                disabled={isUploading}
                style={[styles.button, styles.uploadButton]}
                buttonColor="#10b981"
                textColor="white"
              >
                {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Selfie'}
              </Button>
            </View>
          </View>
        )}
      </View>

      {/* Error and Success display */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      
      {successMessage ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{successMessage}</Text>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
            </View>
          )}
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
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
  content: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  instructionsOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  instructionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subInstructionText: {
    color: '#fde68a',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  previewContainer: {
    flex: 1,
    padding: 20,
  },
  imagePreview: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewImage: {
    flex: 1,
    borderRadius: 16,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  button: {
    flex: 1,
    borderRadius: 25,
    paddingVertical: 12,
  },
  retakeButton: {
    borderColor: 'white',
  },
  uploadButton: {
    // Default styles
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 15,
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  subErrorText: {
    color: '#fde68a',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  cameraFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  cameraFallbackText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  successContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
  },
  successText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
});
