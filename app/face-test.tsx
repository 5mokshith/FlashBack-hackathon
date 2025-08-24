import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import FaceDetectionTest from '../components/FaceDetectionTest';

export default function FaceTestScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <FaceDetectionTest />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
