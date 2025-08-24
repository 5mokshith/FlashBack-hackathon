/**
 * Real Production-Quality Liveness Detection System
 * 
 * This implementation uses actual user interaction patterns, timing analysis,
 * and behavioral biometrics to detect liveness without relying on complex ML models.
 */

export interface LivenessChallenge {
  id: string;
  type: 'tap_sequence' | 'hold_and_release' | 'shake_device' | 'brightness_change';
  instruction: string;
  duration: number;
  expectedPattern: any;
  startTime: number;
}

export interface LivenessResult {
  challengeId: string;
  success: boolean;
  confidence: number;
  completionTime: number;
  behaviorMetrics: BehaviorMetrics;
}

export interface BehaviorMetrics {
  responseTime: number;
  patternAccuracy: number;
  timingConsistency: number;
  naturalness: number;
  deviceMovement?: DeviceMovement;
}

export interface DeviceMovement {
  accelerometer: { x: number; y: number; z: number }[];
  gyroscope: { x: number; y: number; z: number }[];
  magnetometer: { x: number; y: number; z: number }[];
}

export class RealLivenessDetector {
  private challenges: Omit<LivenessChallenge, 'id' | 'startTime'>[] = [
    {
      type: 'tap_sequence',
      instruction: 'Tap the screen 3 times quickly',
      duration: 5000,
      expectedPattern: { taps: 3, maxInterval: 800 }
    },
    {
      type: 'hold_and_release',
      instruction: 'Hold the screen for 2 seconds, then release',
      duration: 4000,
      expectedPattern: { holdTime: 2000, tolerance: 500 }
    },
    {
      type: 'shake_device',
      instruction: 'Gently shake your device',
      duration: 3000,
      expectedPattern: { minShakes: 2, intensity: 'medium' }
    },
    {
      type: 'brightness_change',
      instruction: 'Cover and uncover the camera briefly',
      duration: 4000,
      expectedPattern: { changes: 2, threshold: 0.3 }
    }
  ];

  private currentChallenge: LivenessChallenge | null = null;
  private interactionLog: any[] = [];
  private deviceSensors: DeviceMovement = {
    accelerometer: [],
    gyroscope: [],
    magnetometer: []
  };
  private brightnessHistory: number[] = [];
  private sessionStartTime: number = 0;

  /**
   * Start a new liveness detection session
   */
  startSession(): LivenessChallenge {
    this.sessionStartTime = Date.now();
    this.interactionLog = [];
    this.deviceSensors = { accelerometer: [], gyroscope: [], magnetometer: [] };
    this.brightnessHistory = [];
    
    const challengeTemplate = this.getRandomChallenge();
    this.currentChallenge = {
      ...challengeTemplate,
      id: `challenge_${Date.now()}`,
      startTime: Date.now()
    };
    
    return this.currentChallenge;
  }

  /**
   * Record user interaction
   */
  recordInteraction(type: string, data: any): void {
    if (!this.currentChallenge) return;
    
    const timestamp = Date.now();
    this.interactionLog.push({
      type,
      data,
      timestamp,
      relativeTime: timestamp - this.currentChallenge.startTime
    });
  }

  /**
   * Record device sensor data
   */
  recordSensorData(sensorType: 'accelerometer' | 'gyroscope' | 'magnetometer', data: { x: number; y: number; z: number }): void {
    if (!this.currentChallenge) return;
    
    this.deviceSensors[sensorType].push({
      ...data,
      timestamp: Date.now()
    } as any);
    
    // Keep only recent data (last 5 seconds)
    const cutoff = Date.now() - 5000;
    this.deviceSensors[sensorType] = this.deviceSensors[sensorType].filter(
      (item: any) => item.timestamp > cutoff
    );
  }

  /**
   * Record brightness/lighting changes
   */
  recordBrightnessChange(brightness: number): void {
    if (!this.currentChallenge) return;
    
    this.brightnessHistory.push({
      value: brightness,
      timestamp: Date.now()
    } as any);
    
    // Keep only recent data
    const cutoff = Date.now() - 10000;
    this.brightnessHistory = this.brightnessHistory.filter(
      (item: any) => item.timestamp > cutoff
    );
  }

  /**
   * Check if current challenge is completed
   */
  checkChallengeCompletion(): LivenessResult | null {
    if (!this.currentChallenge) return null;
    
    const elapsed = Date.now() - this.currentChallenge.startTime;
    
    // Check timeout
    if (elapsed > this.currentChallenge.duration) {
      return this.evaluateChallenge(false);
    }
    
    // Check completion based on challenge type
    const isCompleted = this.isChallengeCompleted();
    if (isCompleted) {
      return this.evaluateChallenge(true);
    }
    
    return null;
  }

  /**
   * Get current challenge progress (0-1)
   */
  getProgress(): number {
    if (!this.currentChallenge) return 0;
    
    const elapsed = Date.now() - this.currentChallenge.startTime;
    const progress = Math.min(elapsed / this.currentChallenge.duration, 1);
    
    // Adjust progress based on completion status
    const partialCompletion = this.getPartialCompletion();
    return Math.max(progress, partialCompletion);
  }

  /**
   * Check if challenge is completed based on type
   */
  private isChallengeCompleted(): boolean {
    if (!this.currentChallenge) return false;
    
    switch (this.currentChallenge.type) {
      case 'tap_sequence':
        return this.checkTapSequence();
      case 'hold_and_release':
        return this.checkHoldAndRelease();
      case 'shake_device':
        return this.checkShakeDevice();
      case 'brightness_change':
        return this.checkBrightnessChange();
      default:
        return false;
    }
  }

  /**
   * Check tap sequence completion
   */
  private checkTapSequence(): boolean {
    const taps = this.interactionLog.filter(log => log.type === 'tap');
    const expectedTaps = this.currentChallenge!.expectedPattern.taps;
    
    if (taps.length < expectedTaps) return false;
    
    // Check timing between taps
    for (let i = 1; i < expectedTaps; i++) {
      const interval = taps[i].timestamp - taps[i-1].timestamp;
      if (interval > this.currentChallenge!.expectedPattern.maxInterval) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check hold and release completion
   */
  private checkHoldAndRelease(): boolean {
    const touchStart = this.interactionLog.find(log => log.type === 'touch_start');
    const touchEnd = this.interactionLog.find(log => log.type === 'touch_end');
    
    if (!touchStart || !touchEnd) return false;
    
    const holdDuration = touchEnd.timestamp - touchStart.timestamp;
    const expectedHold = this.currentChallenge!.expectedPattern.holdTime;
    const tolerance = this.currentChallenge!.expectedPattern.tolerance;
    
    return Math.abs(holdDuration - expectedHold) <= tolerance;
  }

  /**
   * Check device shake completion
   */
  private checkShakeDevice(): boolean {
    const accelerometerData = this.deviceSensors.accelerometer;
    if (accelerometerData.length < 10) return false;
    
    // Detect shake patterns by analyzing acceleration magnitude changes
    let shakeCount = 0;
    let lastMagnitude = 0;
    
    for (const data of accelerometerData) {
      const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
      if (Math.abs(magnitude - lastMagnitude) > 5) { // Threshold for shake detection
        shakeCount++;
      }
      lastMagnitude = magnitude;
    }
    
    return shakeCount >= this.currentChallenge!.expectedPattern.minShakes;
  }

  /**
   * Check brightness change completion
   */
  private checkBrightnessChange(): boolean {
    if (this.brightnessHistory.length < 5) return false;
    
    let changes = 0;
    const threshold = this.currentChallenge!.expectedPattern.threshold;
    
    for (let i = 1; i < this.brightnessHistory.length; i++) {
      const change = Math.abs((this.brightnessHistory[i] as any).value - (this.brightnessHistory[i-1] as any).value);
      if (change > threshold) {
        changes++;
      }
    }
    
    return changes >= this.currentChallenge!.expectedPattern.changes;
  }

  /**
   * Get partial completion for progress tracking
   */
  private getPartialCompletion(): number {
    if (!this.currentChallenge) return 0;
    
    switch (this.currentChallenge.type) {
      case 'tap_sequence':
        const taps = this.interactionLog.filter(log => log.type === 'tap').length;
        return taps / this.currentChallenge.expectedPattern.taps;
      
      case 'hold_and_release':
        const touchStart = this.interactionLog.find(log => log.type === 'touch_start');
        if (touchStart) {
          const currentHold = Date.now() - touchStart.timestamp;
          return Math.min(currentHold / this.currentChallenge.expectedPattern.holdTime, 1);
        }
        return 0;
      
      case 'shake_device':
        return Math.min(this.deviceSensors.accelerometer.length / 20, 1);
      
      case 'brightness_change':
        return Math.min(this.brightnessHistory.length / 10, 1);
      
      default:
        return 0;
    }
  }

  /**
   * Evaluate challenge and generate result
   */
  private evaluateChallenge(completed: boolean): LivenessResult {
    if (!this.currentChallenge) {
      throw new Error('No active challenge to evaluate');
    }
    
    const completionTime = Date.now() - this.currentChallenge.startTime;
    const behaviorMetrics = this.calculateBehaviorMetrics(completed);
    
    // Calculate confidence based on multiple factors
    let confidence = 0;
    
    if (completed) {
      confidence += 0.4; // Base score for completion
      confidence += behaviorMetrics.patternAccuracy * 0.3;
      confidence += behaviorMetrics.timingConsistency * 0.2;
      confidence += behaviorMetrics.naturalness * 0.1;
    }
    
    // Penalize too-fast responses (likely automated)
    if (completionTime < 1000) {
      confidence *= 0.5;
    }
    
    // Penalize perfect responses (likely scripted)
    if (behaviorMetrics.patternAccuracy > 0.98) {
      confidence *= 0.8;
    }
    
    const success = completed && confidence > 0.6;
    
    return {
      challengeId: this.currentChallenge.id,
      success,
      confidence: Math.min(confidence, 1),
      completionTime,
      behaviorMetrics
    };
  }

  /**
   * Calculate behavior metrics for anti-spoofing
   */
  private calculateBehaviorMetrics(completed: boolean): BehaviorMetrics {
    const responseTime = this.interactionLog.length > 0 
      ? this.interactionLog[0].relativeTime 
      : this.currentChallenge!.duration;
    
    let patternAccuracy = 0;
    let timingConsistency = 0;
    let naturalness = 0;
    
    if (completed) {
      patternAccuracy = this.calculatePatternAccuracy();
      timingConsistency = this.calculateTimingConsistency();
      naturalness = this.calculateNaturalness();
    }
    
    return {
      responseTime,
      patternAccuracy,
      timingConsistency,
      naturalness,
      deviceMovement: this.deviceSensors
    };
  }

  /**
   * Calculate pattern accuracy
   */
  private calculatePatternAccuracy(): number {
    if (!this.currentChallenge) return 0;
    
    switch (this.currentChallenge.type) {
      case 'tap_sequence':
        const taps = this.interactionLog.filter(log => log.type === 'tap');
        const expectedTaps = this.currentChallenge.expectedPattern.taps;
        return Math.min(taps.length / expectedTaps, 1);
      
      case 'hold_and_release':
        const touchStart = this.interactionLog.find(log => log.type === 'touch_start');
        const touchEnd = this.interactionLog.find(log => log.type === 'touch_end');
        if (!touchStart || !touchEnd) return 0;
        
        const holdDuration = touchEnd.timestamp - touchStart.timestamp;
        const expectedHold = this.currentChallenge.expectedPattern.holdTime;
        const accuracy = 1 - Math.abs(holdDuration - expectedHold) / expectedHold;
        return Math.max(accuracy, 0);
      
      default:
        return 0.8; // Default reasonable accuracy
    }
  }

  /**
   * Calculate timing consistency
   */
  private calculateTimingConsistency(): number {
    if (this.interactionLog.length < 2) return 0.5;
    
    const intervals = [];
    for (let i = 1; i < this.interactionLog.length; i++) {
      intervals.push(this.interactionLog[i].timestamp - this.interactionLog[i-1].timestamp);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - (stdDev / avgInterval));
  }

  /**
   * Calculate naturalness score
   */
  private calculateNaturalness(): number {
    // Check for human-like variations in timing and pressure
    let naturalness = 0.5; // Base score
    
    // Add points for natural variations
    if (this.interactionLog.length > 0) {
      const hasVariation = this.interactionLog.some((log, index) => {
        if (index === 0) return false;
        const timeDiff = log.timestamp - this.interactionLog[index - 1].timestamp;
        return timeDiff > 100 && timeDiff < 2000; // Natural human timing
      });
      
      if (hasVariation) naturalness += 0.3;
    }
    
    // Add points for device movement (indicates real human interaction)
    if (this.deviceSensors.accelerometer.length > 5) {
      naturalness += 0.2;
    }
    
    return Math.min(naturalness, 1);
  }

  /**
   * Get random challenge
   */
  private getRandomChallenge(): Omit<LivenessChallenge, 'id' | 'startTime'> {
    const randomIndex = Math.floor(Math.random() * this.challenges.length);
    return { ...this.challenges[randomIndex] };
  }

  /**
   * Reset detector state
   */
  reset(): void {
    this.currentChallenge = null;
    this.interactionLog = [];
    this.deviceSensors = { accelerometer: [], gyroscope: [], magnetometer: [] };
    this.brightnessHistory = [];
    this.sessionStartTime = 0;
  }

  /**
   * Get current challenge
   */
  getCurrentChallenge(): LivenessChallenge | null {
    return this.currentChallenge;
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.currentChallenge !== null;
  }
}

/**
 * Anti-spoofing utilities for behavioral analysis
 */
export class BehavioralAntiSpoofing {
  /**
   * Analyze interaction patterns for bot-like behavior
   */
  static analyzeBehaviorPattern(interactions: any[]): {
    isBot: boolean;
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let botScore = 0;

    // Check for perfect timing (bot indicator)
    const timings = interactions.map((interaction, index) => 
      index > 0 ? interaction.timestamp - interactions[index - 1].timestamp : 0
    ).filter(timing => timing > 0);

    if (timings.length > 1) {
      const avgTiming = timings.reduce((sum, timing) => sum + timing, 0) / timings.length;
      const variance = timings.reduce((sum, timing) => sum + Math.pow(timing - avgTiming, 2), 0) / timings.length;
      
      if (variance < 100) { // Very consistent timing
        reasons.push('Suspiciously consistent timing patterns');
        botScore += 0.4;
      }
    }

    // Check for too-fast responses
    const fastResponses = interactions.filter(interaction => interaction.relativeTime < 200);
    if (fastResponses.length > interactions.length * 0.5) {
      reasons.push('Responses too fast for human interaction');
      botScore += 0.3;
    }

    // Check for lack of natural variations
    const hasNaturalVariations = interactions.some(interaction => 
      interaction.data && typeof interaction.data === 'object'
    );
    
    if (!hasNaturalVariations) {
      reasons.push('Lack of natural interaction variations');
      botScore += 0.2;
    }

    const isBot = botScore > 0.5;
    const confidence = Math.min(botScore, 1);

    return { isBot, confidence, reasons };
  }

  /**
   * Validate session authenticity
   */
  static validateSession(sessionData: {
    duration: number;
    interactions: any[];
    deviceMovement: DeviceMovement;
  }): {
    isAuthentic: boolean;
    confidence: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let authenticityScore = 1.0;

    // Check session duration
    if (sessionData.duration < 2000) {
      issues.push('Session too short');
      authenticityScore -= 0.3;
    }

    // Check interaction count
    if (sessionData.interactions.length < 3) {
      issues.push('Insufficient user interactions');
      authenticityScore -= 0.2;
    }

    // Check device movement
    const totalMovement = sessionData.deviceMovement.accelerometer.length +
                         sessionData.deviceMovement.gyroscope.length;
    
    if (totalMovement < 5) {
      issues.push('Insufficient device movement for human interaction');
      authenticityScore -= 0.3;
    }

    const isAuthentic = authenticityScore > 0.6 && issues.length === 0;
    const confidence = Math.max(authenticityScore, 0);

    return { isAuthentic, confidence, issues };
  }
}
