# FlashBack Labs - Mobile Authentication App

A React Native mobile application that implements a complete authentication flow with OTP verification, face-based liveness detection, and selfie upload functionality.

## Features

### 🔐 Authentication Flow
- **Phone Number Input**: E.164 format phone number validation
- **OTP Verification**: 6-digit OTP sent via SMS and verified
- **Secure Token Storage**: JWT tokens stored securely using AsyncStorage

### 👁️ Liveness Detection
- **Face-based Liveness Check**: Uses device front camera for real-time face detection
- **Gesture Recognition**: Detects multiple liveness actions:
  - Blink detection (eye closure)
  - Head nodding (up/down movement)
  - Head turning (left/right)
  - Smile detection
- **On-device Processing**: All liveness logic runs locally using expo-face-detector
- **Progress Tracking**: Visual progress indicator for each detection step

### 📸 Selfie Capture & Upload
- **Camera Integration**: Front camera for selfie capture
- **Image Preview**: Preview captured selfie before upload
- **Secure Upload**: Multipart form data upload with liveness verification data
- **Error Handling**: Comprehensive error handling for upload failures

### 🎨 User Experience
- **Modern UI**: Beautiful gradient design with smooth transitions
- **Responsive Design**: Compatible with all screen resolutions
- **Loading States**: Proper loading indicators and progress feedback
- **Error Messages**: User-friendly error messages and recovery options

## Technical Architecture

### Frontend Stack
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and build tools
- **TypeScript**: Type-safe JavaScript development
- **Expo Router**: File-based navigation system

### Key Dependencies
- `expo-camera`: Camera access and photo capture
- `expo-face-detector`: Real-time face detection and analysis
- `react-native-paper`: Material Design components
- `expo-linear-gradient`: Beautiful gradient backgrounds
- `@react-native-async-storage/async-storage`: Secure data storage

### API Integration
- **RESTful APIs**: Integration with FlashBack Labs backend services
- **Authentication**: JWT token-based authentication
- **File Upload**: Multipart form data for selfie uploads
- **Error Handling**: Comprehensive API error handling

## Liveness Detection Implementation

### Detection Algorithm
The liveness detection system implements a multi-step verification process:

1. **Face Positioning**: Ensures user's face is properly positioned within the camera frame
2. **Gesture Sequence**: Guides user through specific actions:
   - **Blink**: Detects eye closure using `leftEyeOpenProbability` and `rightEyeOpenProbability`
   - **Nod**: Tracks head roll angle changes for up/down movement
   - **Turn Left/Right**: Monitors yaw angle for horizontal head movement
   - **Smile**: Uses `smilingProbability` to detect facial expression

### Technical Details
- **Real-time Processing**: Face detection runs at 100ms intervals
- **Threshold-based Detection**: Configurable sensitivity thresholds for each gesture
- **Data Collection**: Stores detection timestamps and face data for verification
- **Device Information**: Captures platform, version, and model information

### Security Features
- **On-device Processing**: No external API calls for liveness detection
- **Data Integrity**: Comprehensive logging of detection events
- **Spoofing Prevention**: Multiple gesture requirements reduce spoofing risk

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flashBackLabs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoints**
   - Update `services/api.ts` with your backend API URLs
   - Set the appropriate refresh token for API authentication

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   ```

## API Configuration

### Required Environment Variables
Update the API configuration in `services/api.ts`:

```typescript
const API_BASE_URL = 'https://flashback.inc:9000';
const REFRESH_TOKEN = 'your_refresh_token_here';
```

### API Endpoints
- `POST /api/mobile/sendOTP` - Send OTP to phone number
- `POST /api/mobile/verifyOTP` - Verify OTP and get JWT token
- `POST /api/mobile/uploadUserPortrait` - Upload selfie with liveness data

## Project Structure

```
flashBackLabs/
├── app/                    # Main application screens
│   ├── index.tsx          # Entry point with auth check
│   ├── PhoneInput.tsx     # Phone number input screen
│   ├── OtpVerification.tsx # OTP verification screen
│   ├── LivenessCheck.tsx  # Liveness detection screen
│   ├── SelfieCapture.tsx  # Selfie capture and upload
│   └── Home.tsx           # Welcome screen after completion
├── services/
│   └── api.ts             # API service layer
├── utils/
│   ├── storage.ts         # Secure storage utilities
│   └── phoneFormatter.ts  # Phone number formatting
├── components/            # Reusable UI components
└── constants/
    └── Colors.ts          # Color definitions
```

## Usage Flow

1. **Phone Input**: User enters phone number in E.164 format
2. **OTP Request**: App sends OTP request to backend
3. **OTP Verification**: User enters 6-digit OTP for verification
4. **Liveness Check**: User completes face-based liveness detection
5. **Selfie Capture**: User captures selfie using front camera
6. **Upload**: Selfie uploaded with liveness verification data
7. **Welcome**: User redirected to home screen with success message

## Security Considerations

### Data Protection
- **Local Storage**: Sensitive data stored using AsyncStorage
- **Token Management**: JWT tokens handled securely
- **Camera Permissions**: Proper permission handling for camera access

### Liveness Detection Security
- **Multi-factor Verification**: Multiple gesture requirements
- **Real-time Processing**: No external dependencies for detection
- **Data Logging**: Comprehensive audit trail of detection events

### API Security
- **HTTPS**: All API calls use secure HTTPS protocol
- **Token Authentication**: JWT-based API authentication
- **Error Handling**: Secure error handling without data leakage

## Testing

### Manual Testing
1. Test phone number validation with various formats
2. Verify OTP flow with valid/invalid codes
3. Test liveness detection with different gestures
4. Verify selfie capture and upload functionality
5. Test error scenarios and recovery flows

### Device Testing
- Test on both iOS and Android devices
- Verify camera permissions and functionality
- Test on different screen sizes and resolutions
- Verify performance on lower-end devices

## Build & Deployment

### Android APK Build
```bash
npm run build:apk
```

### iOS Build
```bash
npm run build:ios
```

### Expo Build
```bash
expo build:android
expo build:ios
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common issues

## Acknowledgments

- **Expo Team**: For the excellent development platform
- **React Native Community**: For the robust ecosystem
- **FlashBack Labs Team**: For the backend API integration

---

**Note**: This application is designed for educational and demonstration purposes. For production use, additional security measures and testing should be implemented.
