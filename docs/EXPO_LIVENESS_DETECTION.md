# Expo Face Detection Liveness System

## Overview

This implementation uses **Expo Face Detector** for real-time face detection with eye open probability tracking to detect blinks for liveness verification. The system follows your specified approach:

1. **Face Detection**: Uses `expo-face-detector` (already installed)
2. **Blink Detection**: Tracks `leftEyeOpenProbability` and `rightEyeOpenProbability`
3. **Validation Logic**: Confirms blink when probability drops below 0.3 and returns above 0.7
4. **Fallback**: Motion detection for devices without face detection support

## Key Features

### ✅ Real Blink Detection
- Monitors eye open probabilities in real-time
- Detects complete blink cycles: open → closed → open
- Configurable thresholds (default: closed < 0.3, open > 0.7)
- Natural timing validation (100ms - 1000ms per blink)

### ✅ Anti-Spoofing Measures
- Requires multiple blinks (default: 2)
- Timing analysis to detect automated responses
- Confidence scoring based on natural patterns
- Fallback motion detection for edge cases

### ✅ Production Ready
- Error handling and graceful degradation
- Progress tracking and user feedback
- Configurable parameters
- Clean TypeScript interfaces

## Implementation Files

### Core Detection Logic
- **`utils/mlkitLivenessDetection.ts`**: Main detection algorithms
  - `MLKitLivenessDetector`: Primary blink detection class
  - `FallbackMotionDetector`: Motion-based fallback
  - Complete TypeScript interfaces

### UI Component
- **`components/MLKitLivenessCapture.tsx`**: React Native camera component
  - Expo Camera integration
  - Real-time visual feedback
  - Progress indicators and animations
  - Permission handling

### Integration
- **`app/SelfieCapture.tsx`**: Updated to use new system
  - Success/error handling
  - Result display with confidence scores

## Usage Example

```typescript
import MLKitLivenessCapture from '../components/MLKitLivenessCapture';

<MLKitLivenessCapture
  onSuccess={(result) => {
    console.log(`Blinks: ${result.completedBlinks}`);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Time: ${result.timeElapsed}ms`);
  }}
  onError={(error) => {
    console.error('Liveness failed:', error);
  }}
  requiredBlinks={2}
/>
```

## Detection Flow

1. **Start Challenge**: User taps "Start Liveness Check"
2. **Instructions**: Shows "Please blink 2 times to continue"
3. **Camera Activation**: Front camera starts with face guide overlay
4. **Real-time Processing**: 
   - Takes photos at ~10fps
   - Runs Expo face detection on each frame
   - Tracks eye open probabilities
5. **Blink Detection**:
   - Monitors for probability drops below 0.3 (eyes closed)
   - Waits for probability to rise above 0.7 (eyes open)
   - Validates timing (100-1000ms per blink cycle)
6. **Success**: After required blinks, shows success with confidence score
7. **Fallback**: If face detection fails, uses motion detection

## Configuration

### Blink Thresholds
```typescript
eyeOpenThreshold: {
  closed: 0.3,  // Below this = eyes closed
  open: 0.7     // Above this = eyes open
}
```

### Timing Parameters
- **Timeout**: 10 seconds per challenge
- **Processing Rate**: ~10fps for face detection
- **Blink Timing**: 100-1000ms per complete blink
- **Frame Buffer**: 30 frames (~1 second history)

## Dependencies

All required dependencies are already installed:
- ✅ `expo-face-detector`: Face detection and eye tracking
- ✅ `expo-camera`: Camera access and photo capture
- ✅ `react-native-reanimated`: Smooth animations

## Security Features

1. **Multiple Verification Points**:
   - Requires 2+ successful blinks
   - Validates natural timing patterns
   - Confidence scoring system

2. **Anti-Automation**:
   - Timing analysis detects scripted responses
   - Random challenge variations
   - Natural movement validation

3. **Fallback Protection**:
   - Motion detection when face detection unavailable
   - Graceful error handling
   - User feedback for all states

## Testing

The system is ready for testing. Key test scenarios:

1. **Normal Usage**: 2 natural blinks should pass
2. **Too Fast**: Rapid blinking should be rejected
3. **Too Slow**: No blinking should timeout
4. **Partial Blinks**: Incomplete eye closures should not count
5. **No Face**: Should gracefully handle no face detected
6. **Multiple Faces**: Should use first detected face

## Performance

- **Processing**: ~10fps face detection
- **Memory**: Efficient frame buffer management
- **Battery**: Optimized for mobile devices
- **Accuracy**: High confidence with natural blink patterns

This implementation provides production-quality liveness detection using the exact approach you specified, with robust fallback mechanisms and comprehensive error handling.
