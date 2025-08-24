import React from 'react';
import { View, Alert } from 'react-native';
import MLKitLivenessCapture from '../components/MLKitLivenessCapture';
import { BlinkDetectionResult } from '../utils/mlkitLivenessDetection';

function SelfieCapture() {
  const handleLivenessSuccess = (result: BlinkDetectionResult) => {
    Alert.alert(
      'Liveness Check Passed!',
      `Successfully completed ${result.completedBlinks} blinks with ${Math.round(result.confidence * 100)}% confidence in ${Math.round(result.timeElapsed / 1000)}s`,
      [
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to actual selfie capture or next step
            console.log('Proceeding to selfie capture...');
          },
        },
      ]
    );
  };

  const handleLivenessError = (error: string) => {
    Alert.alert(
      'Liveness Check Failed',
      error,
      [
        {
          text: 'Try Again',
          onPress: () => {
            // Restart the process
            console.log('Restarting liveness detection...');
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <MLKitLivenessCapture
        onSuccess={handleLivenessSuccess}
        onError={handleLivenessError}
        requiredBlinks={2}
      />
    </View>
  );
}

export default SelfieCapture;
