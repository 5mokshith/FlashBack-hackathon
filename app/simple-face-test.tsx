import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import SimpleFaceTest from '../components/SimpleFaceTest';

export default function SimpleFaceTestScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <SimpleFaceTest />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
