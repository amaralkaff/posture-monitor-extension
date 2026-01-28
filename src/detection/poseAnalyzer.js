/**
 * Pose analysis and posture metrics calculation
 */

import { calculateAngle, calculateDistance, normalizeValue, exponentialSmoothing } from '../utils/mathUtils.js';
import { PostureStatus, ScoreThresholds, KeypointParts, SensitivityMultipliers } from '../utils/constants.js';

/**
 * PoseAnalyzer class for analyzing pose data and determining posture quality
 */
export class PoseAnalyzer {
  constructor(settings = {}) {
    this.settings = settings;
    this.metricsHistory = [];
    this.smoothedMetrics = null;
  }

  /**
   * Update settings
   * @param {Object} settings - New settings
   */
  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Analyze pose and return posture metrics
   * @param {Object} pose - Pose data with keypoints
   * @returns {Object|null} Posture analysis or null if insufficient data
   */
  analyzePose(pose) {
    if (!pose || !pose.keypoints || pose.keypoints.length === 0) {
      return null;
    }

    // Check minimum confidence
    const confidenceThreshold = this.settings.detection?.confidenceThreshold || 0.5;
    const avgConfidence = this.getAverageConfidence(pose.keypoints);
    
    if (avgConfidence < confidenceThreshold) {
      return null;
    }

    // Extract keypoints
    const keypoints = this.extractKeypoints(pose.keypoints);
    
    if (!this.hasRequiredKeypoints(keypoints)) {
      return null;
    }

    // Calculate metrics
    const metrics = {
      headForwardAngle: this.calculateHeadForwardAngle(keypoints),
      shoulderAsymmetry: this.calculateShoulderAsymmetry(keypoints),
      neckAngle: this.calculateNeckAngle(keypoints),
      confidence: avgConfidence,
      timestamp: Date.now()
    };

    // Apply calibration if available
    if (this.settings.calibration) {
      metrics.headForwardAngle = this.applyCalibration(
        metrics.headForwardAngle, 
        this.settings.calibration.headForwardAngle
      );
      metrics.shoulderAsymmetry = this.applyCalibration(
        metrics.shoulderAsymmetry,
        this.settings.calibration.shoulderAsymmetry
      );
    }

    // Smooth metrics over time
    this.smoothedMetrics = this.smoothMetrics(metrics);

    // Calculate posture score
    const score = this.calculatePostureScore(this.smoothedMetrics);
    
    // Classify posture
    const status = this.classifyPosture(score);

    return {
      metrics: this.smoothedMetrics,
      score,
      status,
      rawMetrics: metrics
    };
  }

  /**
   * Extract keypoints into a more accessible format
   * @param {Array} keypoints - Raw keypoints array
   * @returns {Object} Keypoints mapped by part name
   */
  extractKeypoints(keypoints) {
    const extracted = {};
    
    for (const kp of keypoints) {
      // Skip keypoints with missing or invalid data
      if (!kp.part || !kp.position || typeof kp.position.x !== 'number' || typeof kp.position.y !== 'number') {
        continue;
      }
      
      extracted[kp.part] = {
        x: kp.position.x,
        y: kp.position.y,
        score: kp.score || 0
      };
    }
    
    return extracted;
  }

  /**
   * Check if required keypoints are present
   * @param {Object} keypoints - Extracted keypoints
   * @returns {boolean} Whether required keypoints exist
   */
  hasRequiredKeypoints(keypoints) {
    const required = [
      KeypointParts.NOSE,
      KeypointParts.LEFT_SHOULDER,
      KeypointParts.RIGHT_SHOULDER
    ];
    
    return required.every(part => keypoints[part] && keypoints[part].score > 0.3);
  }

  /**
   * Calculate average confidence of keypoints
   * @param {Array} keypoints - Keypoints array
   * @returns {number} Average confidence
   */
  getAverageConfidence(keypoints) {
    if (!Array.isArray(keypoints) || keypoints.length === 0) return 0;
    
    const sum = keypoints.reduce((acc, kp) => acc + kp.score, 0);
    return sum / keypoints.length;
  }

  /**
   * Calculate head forward angle (forward head posture)
   * @param {Object} keypoints - Extracted keypoints
   * @returns {number} Angle in degrees
   */
  calculateHeadForwardAngle(keypoints) {
    const nose = keypoints[KeypointParts.NOSE];
    const leftShoulder = keypoints[KeypointParts.LEFT_SHOULDER];
    const rightShoulder = keypoints[KeypointParts.RIGHT_SHOULDER];
    
    if (!nose || !leftShoulder || !rightShoulder) return 0;

    // Calculate midpoint of shoulders
    const shoulderMid = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };

    // Calculate horizontal distance from shoulder midpoint to nose
    const horizontalDistance = Math.abs(nose.x - shoulderMid.x);
    
    // Calculate vertical distance
    const verticalDistance = Math.abs(shoulderMid.y - nose.y);
    
    // Avoid division by zero
    if (verticalDistance === 0) return 0;
    
    // Calculate angle from vertical
    const angle = Math.atan(horizontalDistance / verticalDistance) * (180 / Math.PI);
    
    return angle;
  }

  /**
   * Calculate shoulder asymmetry (uneven shoulders)
   * @param {Object} keypoints - Extracted keypoints
   * @returns {number} Asymmetry in degrees
   */
  calculateShoulderAsymmetry(keypoints) {
    const leftShoulder = keypoints[KeypointParts.LEFT_SHOULDER];
    const rightShoulder = keypoints[KeypointParts.RIGHT_SHOULDER];
    
    if (!leftShoulder || !rightShoulder) return 0;

    // Calculate height difference
    const heightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    
    // Calculate shoulder width
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    
    // Avoid division by zero
    if (shoulderWidth === 0) return 0;
    
    // Calculate angle of shoulder line from horizontal
    const angle = Math.atan(heightDiff / shoulderWidth) * (180 / Math.PI);
    
    return angle;
  }

  /**
   * Calculate neck angle
   * @param {Object} keypoints - Extracted keypoints
   * @returns {number} Neck angle in degrees
   */
  calculateNeckAngle(keypoints) {
    const nose = keypoints[KeypointParts.NOSE];
    const leftEar = keypoints[KeypointParts.LEFT_EAR];
    const rightEar = keypoints[KeypointParts.RIGHT_EAR];
    const leftShoulder = keypoints[KeypointParts.LEFT_SHOULDER];
    const rightShoulder = keypoints[KeypointParts.RIGHT_SHOULDER];
    
    // Use ear if available, otherwise use nose
    let headPoint = nose;
    if (leftEar && rightEar) {
      headPoint = {
        x: (leftEar.x + rightEar.x) / 2,
        y: (leftEar.y + rightEar.y) / 2
      };
    }
    
    if (!headPoint || !leftShoulder || !rightShoulder) return 0;

    const shoulderMid = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };

    return calculateAngle(shoulderMid, headPoint);
  }

  /**
   * Apply calibration offset to metric
   * @param {number} value - Current metric value
   * @param {number} baseline - Calibrated baseline
   * @returns {number} Adjusted value
   */
  applyCalibration(value, baseline) {
    if (baseline === undefined || baseline === null) return value;
    
    // Subtract baseline so calibrated "good" posture = 0
    return Math.max(0, value - baseline);
  }

  /**
   * Smooth metrics using exponential moving average
   * @param {Object} metrics - Current metrics
   * @returns {Object} Smoothed metrics
   */
  smoothMetrics(metrics) {
    if (!this.smoothedMetrics) {
      return metrics;
    }

    const alpha = 0.3; // Smoothing factor
    
    return {
      headForwardAngle: exponentialSmoothing(
        metrics.headForwardAngle,
        this.smoothedMetrics.headForwardAngle,
        alpha
      ),
      shoulderAsymmetry: exponentialSmoothing(
        metrics.shoulderAsymmetry,
        this.smoothedMetrics.shoulderAsymmetry,
        alpha
      ),
      neckAngle: exponentialSmoothing(
        metrics.neckAngle,
        this.smoothedMetrics.neckAngle,
        alpha
      ),
      confidence: metrics.confidence,
      timestamp: metrics.timestamp
    };
  }

  /**
   * Calculate overall posture score (0-100)
   * @param {Object} metrics - Posture metrics
   * @returns {number} Score from 0-100
   */
  calculatePostureScore(metrics) {
    const sensitivity = this.settings.sensitivity || 'medium';
    const multiplier = SensitivityMultipliers[sensitivity];
    
    const thresholds = this.settings.thresholds || {
      headForwardAngle: 15,
      shoulderAsymmetry: 10
    };

    // Calculate individual scores (0-100, higher is better)
    const headScore = 100 - normalizeValue(
      metrics.headForwardAngle * multiplier,
      0,
      thresholds.headForwardAngle * 2
    ) * 100;
    
    const shoulderScore = 100 - normalizeValue(
      metrics.shoulderAsymmetry * multiplier,
      0,
      thresholds.shoulderAsymmetry * 2
    ) * 100;

    // Weighted average (head posture is more important)
    const totalScore = (headScore * 0.6 + shoulderScore * 0.4);
    
    return Math.round(Math.max(0, Math.min(100, totalScore)));
  }

  /**
   * Classify posture based on score
   * @param {number} score - Posture score
   * @returns {string} Posture status
   */
  classifyPosture(score) {
    if (score >= ScoreThresholds.GOOD) {
      return PostureStatus.GOOD;
    } else if (score >= ScoreThresholds.WARNING) {
      return PostureStatus.WARNING;
    } else {
      return PostureStatus.POOR;
    }
  }

  /**
   * Get detailed posture feedback
   * @param {Object} analysis - Posture analysis result
   * @returns {string} Human-readable feedback
   */
  getPostureFeedback(analysis) {
    if (!analysis || analysis.status === PostureStatus.UNKNOWN) {
      return 'Unable to detect posture. Please ensure you are visible to the camera.';
    }

    const { metrics, status, score } = analysis;
    const feedback = [];

    if (status === PostureStatus.GOOD) {
      return `Excellent posture! (Score: ${score}/100)`;
    }

    // Head forward posture feedback
    if (metrics.headForwardAngle > (this.settings.thresholds?.headForwardAngle || 15)) {
      feedback.push('Your head is too far forward. Bring your ears in line with your shoulders.');
    }

    // Shoulder asymmetry feedback
    if (metrics.shoulderAsymmetry > (this.settings.thresholds?.shoulderAsymmetry || 10)) {
      feedback.push('Your shoulders are uneven. Try to level them and relax.');
    }

    // Neck angle feedback
    if (metrics.neckAngle > 20) {
      feedback.push('Your neck angle suggests slouching. Sit up straighter.');
    }

    if (feedback.length === 0) {
      feedback.push('Your posture needs improvement.');
    }

    return `${feedback.join(' ')} (Score: ${score}/100)`;
  }

  /**
   * Reset analyzer state
   */
  reset() {
    this.metricsHistory = [];
    this.smoothedMetrics = null;
  }
}

export default PoseAnalyzer;
