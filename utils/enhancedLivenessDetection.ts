/**
 * Enhanced Local Liveness Detection System
 * 
 * Implements real-time face detection with:
 * - Blink detection using eye aspect ratio
 * - Head turn detection (left/right)
 * - Local processing only (no backend calls)
 * - Comprehensive error handling
 */

export interface LivenessChallenge {
  id: string;
  type: 'blink' | 'turn_left' | 'turn_right';
  instruction: string;
  duration: number;
  completed: boolean;
  startTime: number;
}

export interface FaceData {
  faceDetected: boolean;
  eyeAspectRatio: number;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
  headYaw: number; // -90 to +90 degrees (left to right)
  headPitch: number; // -90 to +90 degrees (up to down)
  faceArea: number;
  brightness: number;
  timestamp: number;
}

export interface LivenessResult {
  challengeId: string;
  challengeType: 'blink' | 'turn_left' | 'turn_right';
  success: boolean;
  confidence: number;
  completionTime: number;
  errorMessage?: string;
}

export interface LivenessSession {
  sessionId: string;
  challenges: LivenessChallenge[];
  results: LivenessResult[];
  currentChallengeIndex: number;
  isActive: boolean;
  startTime: number;
}

export class EnhancedLivenessDetector {
  private session: LivenessSession | null = null;
  private faceDataHistory: FaceData[] = [];
  private readonly HISTORY_SIZE = 30; // Keep last 30 frames (~1 second at 30fps)
  private readonly BLINK_THRESHOLD = 0.25; // Eye aspect ratio threshold for blink
  private readonly HEAD_TURN_THRESHOLD = 25; // Degrees for head turn detection
  
  /**
   * Start a new liveness detection session
   */
  startSession(): LivenessSession {
    const sessionId = `session_${Date.now()}`;
    const challenges: LivenessChallenge[] = [
      {
        id: `blink_${Date.now()}`,
        type: 'blink',
        instruction: 'Please blink your eyes naturally',
        duration: 5000,
        completed: false,
        startTime: 0
      },
      {
        id: `turn_left_${Date.now() + 1}`,
        type: 'turn_left',
        instruction: 'Turn your head to the left',
        duration: 4000,
        completed: false,
        startTime: 0
      },
      {
        id: `turn_right_${Date.now() + 2}`,
        type: 'turn_right',
        instruction: 'Turn your head to the right',
        duration: 4000,
        completed: false,
        startTime: 0
      }
    ];

    this.session = {
      sessionId,
      challenges,
      results: [],
      currentChallengeIndex: 0,
      isActive: true,
      startTime: Date.now()
    };

    // Start first challenge
    this.session.challenges[0].startTime = Date.now();
    this.faceDataHistory = [];

    return this.session;
  }

  /**
   * Process face data from camera frame
   */
  processFaceData(faceData: FaceData): LivenessResult | null {
    if (!this.session || !this.session.isActive) return null;

    // Add to history
    this.faceDataHistory.push(faceData);
    if (this.faceDataHistory.length > this.HISTORY_SIZE) {
      this.faceDataHistory.shift();
    }

    const currentChallenge = this.getCurrentChallenge();
    if (!currentChallenge) return null;

    // Check if challenge timed out
    const elapsed = Date.now() - currentChallenge.startTime;
    if (elapsed > currentChallenge.duration) {
      return this.failChallenge(currentChallenge, 'Challenge timed out');
    }

    // Process based on challenge type
    switch (currentChallenge.type) {
      case 'blink':
        return this.processBlinkChallenge(currentChallenge, faceData);
      case 'turn_left':
        return this.processHeadTurnChallenge(currentChallenge, faceData, 'left');
      case 'turn_right':
        return this.processHeadTurnChallenge(currentChallenge, faceData, 'right');
      default:
        return null;
    }
  }

  /**
   * Process blink detection challenge
   */
  private processBlinkChallenge(challenge: LivenessChallenge, faceData: FaceData): LivenessResult | null {
    if (!faceData.faceDetected) {
      return this.failChallenge(challenge, 'Face not detected');
    }

    // Need at least 10 frames to detect blink
    if (this.faceDataHistory.length < 10) return null;

    // Look for blink pattern: eyes open -> closed -> open
    const recentFrames = this.faceDataHistory.slice(-10);
    const blinkDetected = this.detectBlink(recentFrames);

    if (blinkDetected) {
      return this.completeChallenge(challenge, 0.9);
    }

    return null;
  }

  /**
   * Process head turn challenge
   */
  private processHeadTurnChallenge(
    challenge: LivenessChallenge, 
    faceData: FaceData, 
    direction: 'left' | 'right'
  ): LivenessResult | null {
    if (!faceData.faceDetected) {
      return this.failChallenge(challenge, 'Face not detected');
    }

    // Need baseline and current position
    if (this.faceDataHistory.length < 5) return null;

    const baseline = this.getBaselineHeadPosition();
    const currentYaw = faceData.headYaw;
    const yawDifference = currentYaw - baseline.yaw;

    let turnDetected = false;
    if (direction === 'left') {
      // Left turn means negative yaw
      turnDetected = yawDifference < -this.HEAD_TURN_THRESHOLD;
    } else {
      // Right turn means positive yaw
      turnDetected = yawDifference > this.HEAD_TURN_THRESHOLD;
    }

    if (turnDetected) {
      const confidence = Math.min(Math.abs(yawDifference) / 45, 1); // Normalize to 45 degrees
      return this.completeChallenge(challenge, confidence);
    }

    return null;
  }

  /**
   * Detect blink pattern in frame history
   */
  private detectBlink(frames: FaceData[]): boolean {
    if (frames.length < 6) return false;

    // Look for pattern: open -> closed -> open
    let openCount = 0;
    let closedCount = 0;
    let lastState = 'unknown';

    for (const frame of frames) {
      const eyesOpen = frame.leftEyeOpen && frame.rightEyeOpen;
      
      if (eyesOpen && lastState !== 'open') {
        openCount++;
        lastState = 'open';
      } else if (!eyesOpen && lastState !== 'closed') {
        closedCount++;
        lastState = 'closed';
      }
    }

    // Valid blink: at least 2 open states and 1 closed state
    return openCount >= 2 && closedCount >= 1;
  }

  /**
   * Get baseline head position from first few frames
   */
  private getBaselineHeadPosition(): { yaw: number; pitch: number } {
    if (this.faceDataHistory.length < 3) {
      return { yaw: 0, pitch: 0 };
    }

    const firstFrames = this.faceDataHistory.slice(0, 5);
    const avgYaw = firstFrames.reduce((sum, frame) => sum + frame.headYaw, 0) / firstFrames.length;
    const avgPitch = firstFrames.reduce((sum, frame) => sum + frame.headPitch, 0) / firstFrames.length;

    return { yaw: avgYaw, pitch: avgPitch };
  }

  /**
   * Complete current challenge successfully
   */
  private completeChallenge(challenge: LivenessChallenge, confidence: number): LivenessResult {
    challenge.completed = true;
    
    const result: LivenessResult = {
      challengeId: challenge.id,
      challengeType: challenge.type,
      success: true,
      confidence,
      completionTime: Date.now() - challenge.startTime
    };

    this.session!.results.push(result);
    this.moveToNextChallenge();

    return result;
  }

  /**
   * Fail current challenge
   */
  private failChallenge(challenge: LivenessChallenge, errorMessage: string): LivenessResult {
    const result: LivenessResult = {
      challengeId: challenge.id,
      challengeType: challenge.type,
      success: false,
      confidence: 0,
      completionTime: Date.now() - challenge.startTime,
      errorMessage
    };

    this.session!.results.push(result);
    this.session!.isActive = false;

    return result;
  }

  /**
   * Move to next challenge or end session
   */
  private moveToNextChallenge(): void {
    if (!this.session) return;

    this.session.currentChallengeIndex++;
    
    if (this.session.currentChallengeIndex >= this.session.challenges.length) {
      // All challenges completed
      this.session.isActive = false;
    } else {
      // Start next challenge
      const nextChallenge = this.session.challenges[this.session.currentChallengeIndex];
      nextChallenge.startTime = Date.now();
      this.faceDataHistory = []; // Reset history for new challenge
    }
  }

  /**
   * Get current active challenge
   */
  getCurrentChallenge(): LivenessChallenge | null {
    if (!this.session || !this.session.isActive) return null;
    
    if (this.session.currentChallengeIndex >= this.session.challenges.length) {
      return null;
    }

    return this.session.challenges[this.session.currentChallengeIndex];
  }

  /**
   * Get session progress (0-1)
   */
  getProgress(): number {
    if (!this.session) return 0;
    
    const completedChallenges = this.session.results.filter(r => r.success).length;
    return completedChallenges / this.session.challenges.length;
  }

  /**
   * Check if all challenges are completed successfully
   */
  isSessionComplete(): boolean {
    if (!this.session) return false;
    
    const successfulResults = this.session.results.filter(r => r.success);
    return successfulResults.length === this.session.challenges.length;
  }

  /**
   * Check if session failed
   */
  isSessionFailed(): boolean {
    if (!this.session) return false;
    
    return !this.session.isActive && !this.isSessionComplete();
  }

  /**
   * Get session results summary
   */
  getSessionSummary(): {
    totalChallenges: number;
    completedChallenges: number;
    failedChallenges: number;
    overallSuccess: boolean;
    duration: number;
  } | null {
    if (!this.session) return null;

    const successfulResults = this.session.results.filter(r => r.success);
    const failedResults = this.session.results.filter(r => !r.success);

    return {
      totalChallenges: this.session.challenges.length,
      completedChallenges: successfulResults.length,
      failedChallenges: failedResults.length,
      overallSuccess: this.isSessionComplete(),
      duration: Date.now() - this.session.startTime
    };
  }

  /**
   * Reset detector state
   */
  reset(): void {
    this.session = null;
    this.faceDataHistory = [];
  }

  /**
   * Check if detector is active
   */
  isActive(): boolean {
    return this.session?.isActive ?? false;
  }
}

/**
 * Simulate face detection data (in production, this would come from actual face detection)
 */
export class FaceDetectionSimulator {
  private blinkState = false;
  private headYaw = 0;
  private lastBlinkTime = 0;
  private targetYaw = 0;

  /**
   * Generate simulated face data for testing
   */
  generateFaceData(): FaceData {
    const now = Date.now();
    
    // Simulate natural blinking every 3-5 seconds
    if (now - this.lastBlinkTime > 3000 + Math.random() * 2000) {
      this.blinkState = true;
      this.lastBlinkTime = now;
      setTimeout(() => {
        this.blinkState = false;
      }, 150); // Blink duration
    }

    // Simulate head movement
    this.headYaw += (this.targetYaw - this.headYaw) * 0.1;

    return {
      faceDetected: Math.random() > 0.05, // 95% detection rate
      eyeAspectRatio: this.blinkState ? 0.15 : 0.3,
      leftEyeOpen: !this.blinkState,
      rightEyeOpen: !this.blinkState,
      headYaw: this.headYaw + (Math.random() - 0.5) * 2, // Add small random movement
      headPitch: (Math.random() - 0.5) * 10,
      faceArea: 8000 + Math.random() * 2000,
      brightness: 120 + Math.random() * 20,
      timestamp: now
    };
  }

  /**
   * Simulate user turning head left
   */
  simulateHeadTurnLeft(): void {
    this.targetYaw = -35;
  }

  /**
   * Simulate user turning head right
   */
  simulateHeadTurnRight(): void {
    this.targetYaw = 35;
  }

  /**
   * Reset head to center
   */
  resetHeadPosition(): void {
    this.targetYaw = 0;
  }

  /**
   * Simulate deliberate blink
   */
  simulateBlink(): void {
    this.blinkState = true;
    setTimeout(() => {
      this.blinkState = false;
    }, 200);
  }
}
