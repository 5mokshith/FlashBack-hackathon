/**
 * Face-based Liveness Detection System
 * Based on Expo FaceDetector implementation from https://osamaqarem.com/blog/intro-to-liveness-detection-with-react-native
 */

export interface FaceDetection {
  rollAngle: number;
  yawAngle: number;
  smilingProbability: number;
  leftEyeOpenProbability: number;
  rightEyeOpenProbability: number;
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
}

export interface Rect {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export type DetectionActions = 'BLINK' | 'TURN_HEAD_LEFT' | 'TURN_HEAD_RIGHT' | 'NOD' | 'SMILE';

export interface DetectionConfig {
  instruction: string;
  minProbability?: number;
  maxAngle?: number;
  minAngle?: number;
  minDiff?: number;
}

export interface LivenessState {
  faceDetected: 'yes' | 'no';
  faceTooBig: 'yes' | 'no';
  detectionsList: DetectionActions[];
  currentDetectionIndex: number;
  progressFill: number;
  processComplete: boolean;
}

export interface LivenessAction {
  type: 'FACE_DETECTED' | 'FACE_TOO_BIG' | 'NEXT_DETECTION' | 'RESET_PROCESS';
  payload: any;
}

// Detection configurations with thresholds
export const detections: Record<DetectionActions, DetectionConfig> = {
  BLINK: { instruction: 'Blink both eyes', minProbability: 0.3 },
  TURN_HEAD_LEFT: { instruction: 'Turn head left', maxAngle: -15 },
  TURN_HEAD_RIGHT: { instruction: 'Turn head right', minAngle: 15 },
  NOD: { instruction: 'Nod', minDiff: 1.5 },
  SMILE: { instruction: 'Smile', minProbability: 0.7 },
};

// Instructions text
export const instructionsText = {
  initialPrompt: 'Position your face in the circle',
  performActions: 'Keep the device still and perform the following actions:',
  tooClose: "You're too close. Hold the device further.",
  noFace: 'No face detected. Please position your face in the circle.',
  multipleFaces: 'Multiple faces detected. Please ensure only one face is visible.',
};

// Detection actions list
export const detectionsList: DetectionActions[] = [
  'BLINK',
  'TURN_HEAD_LEFT', 
  'TURN_HEAD_RIGHT',
  'NOD',
  'SMILE',
];

// Initial state
export const initialState: LivenessState = {
  faceDetected: 'no',
  faceTooBig: 'no',
  detectionsList,
  currentDetectionIndex: 0,
  progressFill: 0,
  processComplete: false,
};

/**
 * Check if one rectangle contains another
 */
export function contains({ outside, inside }: { outside: Rect; inside: Rect }): boolean {
  const outsideMaxX = outside.minX + outside.width;
  const insideMaxX = inside.minX + inside.width;
  const outsideMaxY = outside.minY + outside.height;
  const insideMaxY = inside.minY + inside.height;

  if (inside.minX < outside.minX) return false;
  if (insideMaxX > outsideMaxX) return false;
  if (inside.minY < outside.minY) return false;
  if (insideMaxY > outsideMaxY) return false;

  return true;
}

/**
 * Reducer for managing liveness detection state
 */
export function detectionReducer(state: LivenessState, action: LivenessAction): LivenessState {
  switch (action.type) {
    case 'FACE_DETECTED':
      return {
        ...state,
        faceDetected: action.payload ? 'yes' : 'no',
      };

    case 'FACE_TOO_BIG':
      return {
        ...state,
        faceTooBig: action.payload ? 'yes' : 'no',
      };

    case 'NEXT_DETECTION':
      const nextIndex = state.currentDetectionIndex + 1;
      const isComplete = nextIndex >= state.detectionsList.length;
      
      return {
        ...state,
        currentDetectionIndex: nextIndex,
        progressFill: (nextIndex / state.detectionsList.length) * 100,
        processComplete: isComplete,
      };

    case 'RESET_PROCESS':
      return {
        ...initialState,
      };

    default:
      return state;
  }
}

/**
 * Face-based Liveness Detector Class
 */
export class FaceBasedLivenessDetector {
  private rollAngles: number[] = [];
  private state: LivenessState = initialState;
  private dispatch: (action: LivenessAction) => void;

  constructor(dispatch: (action: LivenessAction) => void) {
    this.dispatch = dispatch;
  }

  /**
   * Process face detection results
   */
  processFaceDetection(faces: FaceDetection[], previewRect: Rect): {
    canProcess: boolean;
    instruction: string;
    action?: string;
  } {
    // Check if no faces detected
    if (faces.length === 0) {
      this.dispatch({ type: 'FACE_DETECTED', payload: false });
      return {
        canProcess: false,
        instruction: instructionsText.noFace,
      };
    }

    // Check if multiple faces detected
    if (faces.length > 1) {
      return {
        canProcess: false,
        instruction: instructionsText.multipleFaces,
      };
    }

    const face = faces[0];
    
    // Convert face bounds to our Rect format
    const faceRect: Rect = {
      minX: face.bounds.origin.x,
      minY: face.bounds.origin.y,
      width: face.bounds.size.width,
      height: face.bounds.size.height,
    };

    // Check if face is contained within preview
    const faceInPreview = contains({ outside: previewRect, inside: faceRect });
    this.dispatch({ type: 'FACE_DETECTED', payload: faceInPreview });

    if (!faceInPreview) {
      return {
        canProcess: false,
        instruction: instructionsText.initialPrompt,
      };
    }

    // Check if face is too big (user too close)
    const faceArea = faceRect.width * faceRect.height;
    const previewArea = previewRect.width * previewRect.height;
    const faceTooBig = faceArea > previewArea * 0.8; // Face takes up more than 80% of preview
    
    this.dispatch({ type: 'FACE_TOO_BIG', payload: faceTooBig });

    if (faceTooBig) {
      return {
        canProcess: false,
        instruction: instructionsText.tooClose,
      };
    }

    // Face is properly positioned, process gestures
    return this.processGestures(face);
  }

  /**
   * Process gesture detection
   */
  private processGestures(face: FaceDetection): {
    canProcess: boolean;
    instruction: string;
    action: string;
  } {
    const currentAction = this.state.detectionsList[this.state.currentDetectionIndex];
    const detection = detections[currentAction];

    let gestureDetected = false;

    switch (currentAction) {
      case 'BLINK':
        const leftEyeClosed = face.leftEyeOpenProbability <= detection.minProbability!;
        const rightEyeClosed = face.rightEyeOpenProbability <= detection.minProbability!;
        gestureDetected = leftEyeClosed && rightEyeClosed;
        break;

      case 'TURN_HEAD_LEFT':
        gestureDetected = face.yawAngle <= detection.maxAngle!;
        break;

      case 'TURN_HEAD_RIGHT':
        gestureDetected = face.yawAngle >= detection.minAngle!;
        break;

      case 'NOD':
        gestureDetected = this.processNodGesture(face.rollAngle);
        break;

      case 'SMILE':
        gestureDetected = face.smilingProbability >= detection.minProbability!;
        break;
    }

    if (gestureDetected) {
      this.dispatch({ type: 'NEXT_DETECTION', payload: null });
    }

    return {
      canProcess: true,
      instruction: instructionsText.performActions,
      action: detection.instruction,
    };
  }

  /**
   * Process nod gesture with roll angle normalization
   */
  private processNodGesture(rollAngle: number): boolean {
    // Collect roll angle data
    this.rollAngles.push(rollAngle);

    // Don't keep more than 10 roll angles (10 detection frames)
    if (this.rollAngles.length > 10) {
      this.rollAngles.shift();
    }

    // If not enough roll angle data, don't process
    if (this.rollAngles.length < 10) return false;

    // Calculate average from collected data, except current angle
    const rollAnglesExceptCurrent = [...this.rollAngles].slice(0, this.rollAngles.length - 1);
    const rollAnglesSum = rollAnglesExceptCurrent.reduce((prev, curr) => prev + Math.abs(curr), 0);
    const avgAngle = rollAnglesSum / rollAnglesExceptCurrent.length;

    // If the difference between current angle and average is above threshold, pass
    const diff = Math.abs(avgAngle - Math.abs(rollAngle));
    return diff >= detections.NOD.minDiff!;
  }

  /**
   * Update internal state
   */
  updateState(newState: LivenessState): void {
    this.state = newState;
  }

  /**
   * Reset detector
   */
  reset(): void {
    this.rollAngles = [];
    this.state = initialState;
    this.dispatch({ type: 'RESET_PROCESS', payload: null });
  }

  /**
   * Get current progress percentage
   */
  getProgress(): number {
    return this.state.progressFill;
  }

  /**
   * Check if process is complete
   */
  isComplete(): boolean {
    return this.state.processComplete;
  }
}
