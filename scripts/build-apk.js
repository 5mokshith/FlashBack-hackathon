#!/usr/bin/env node

/**
 * Build APK Script for FlashBack Labs
 * This script helps build the APK for testing and submission
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building FlashBack Labs APK...\n');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    console.error('❌ Error: package.json not found. Please run this script from the project root.');
    process.exit(1);
  }

  // Check if expo-cli is installed
  try {
    execSync('expo --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Error: Expo CLI not found. Please install it with: npm install -g @expo/cli');
    process.exit(1);
  }

  // Install dependencies if node_modules doesn't exist
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // Build the APK
  console.log('🔨 Building APK...');
  console.log('This may take several minutes...\n');
  
  execSync('expo build:android --type apk', { 
    stdio: 'inherit',
    env: { ...process.env, EXPO_DEBUG: '1' }
  });

  console.log('\n✅ APK build completed successfully!');
  console.log('📱 You can find the APK in the build output above.');
  console.log('🔗 Or download it from the Expo dashboard.');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  console.log('\n💡 Troubleshooting tips:');
  console.log('1. Make sure you have the latest Expo CLI installed');
  console.log('2. Check your internet connection');
  console.log('3. Verify your app.json configuration');
  console.log('4. Try running: expo doctor');
  process.exit(1);
}
