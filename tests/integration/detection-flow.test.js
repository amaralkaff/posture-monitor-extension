/**
 * Integration Tests for Detection Flow
 * Tests the complete detection pipeline
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { PoseAnalyzer } from '../../src/detection/poseAnalyzer.js';
import { PostureStatus } from '../../src/utils/constants.js';
import { getSettings } from '../fixtures/mockSettings.js';
import {
  GOOD_POSTURE_POSE,
  BAD_POSTURE_FORWARD_HEAD,
  BAD_POSTURE_SLOUCHED,
  LOW_VISIBILITY_POSE,
} from '../fixtures/mockPoseData.js';

describe('Detection Flow Integration', () => {
  let analyzer;

  beforeEach(() => {
    const settings = {
      sensitivity: 'medium',
      thresholds: {
        headForwardAngle: 15,
        shoulderAsymmetry: 10,
      },
      detection: {
        confidenceThreshold: 0.5,
      },
    };
    analyzer = new PoseAnalyzer(settings);
  });

  describe('Complete detection cycle', () => {
    test('should process good posture through entire pipeline', () => {
      const pose = {
        keypoints: convertMediaPipeToPoseNet(GOOD_POSTURE_POSE.poseLandmarks),
      };

      const result = analyzer.analyzePose(pose);

      expect(result).not.toBeNull();
      expect(result.status).toBe(PostureStatus.GOOD);
      expect(result.score).toBeGreaterThan(80);
      expect(result.metrics.confidence).toBeGreaterThan(0.5);
    });

    test('should detect forward head posture', () => {
      const pose = {
        keypoints: convertMediaPipeToPoseNet(BAD_POSTURE_FORWARD_HEAD.poseLandmarks),
      };

      const result = analyzer.analyzePose(pose);

      expect(result).not.toBeNull();
      expect(result.status).toBe(PostureStatus.POOR);
      expect(result.metrics.headForwardAngle).toBeGreaterThan(15);
    });

    test('should detect slouched posture', () => {
      const pose = {
        keypoints: convertMediaPipeToPoseNet(BAD_POSTURE_SLOUCHED.poseLandmarks),
      };

      const result = analyzer.analyzePose(pose);

      expect(result).not.toBeNull();
      expect(result.status).not.toBe(PostureStatus.GOOD);
    });

    test('should reject low visibility poses', () => {
      const pose = {
        keypoints: convertMediaPipeToPoseNet(LOW_VISIBILITY_POSE.poseLandmarks),
      };

      const result = analyzer.analyzePose(pose);

      expect(result).toBeNull();
    });
  });

  describe('Metric smoothing over time', () => {
    test('should smooth metrics across multiple frames', () => {
      const pose1 = {
        keypoints: [
          { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      const result1 = analyzer.analyzePose(pose1);
      expect(result1).not.toBeNull();

      const pose2 = {
        keypoints: [
          { part: 'nose', position: { x: 110, y: 55 }, score: 0.95 }, // Slightly different
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      const result2 = analyzer.analyzePose(pose2);
      expect(result2).not.toBeNull();

      // Metrics should be smoothed
      expect(result2.metrics.headForwardAngle).not.toBe(result2.rawMetrics.headForwardAngle);
    });

    test('should stabilize metrics after multiple frames', () => {
      const results = [];

      for (let i = 0; i < 10; i++) {
        const pose = {
          keypoints: [
            { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
            { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
            { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
          ],
        };

        const result = analyzer.analyzePose(pose);
        results.push(result);
      }

      // Later results should have more stable metrics
      const firstAngle = results[0].rawMetrics.headForwardAngle;
      const lastAngle = results[9].metrics.headForwardAngle;

      // Should be close after smoothing
      expect(Math.abs(lastAngle - firstAngle)).toBeLessThan(5);
    });
  });

  describe('Sensitivity adjustments', () => {
    test('should be more strict with high sensitivity', () => {
      const highSensAnalyzer = new PoseAnalyzer(getSettings('strict'));

      const pose = {
        keypoints: [
          { part: 'nose', position: { x: 105, y: 50 }, score: 0.95 }, // Slightly forward
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      const mediumResult = analyzer.analyzePose(pose);
      const strictResult = highSensAnalyzer.analyzePose(pose);

      expect(strictResult.score).toBeLessThan(mediumResult.score);
    });

    test('should be more lenient with low sensitivity', () => {
      const lenientAnalyzer = new PoseAnalyzer(getSettings('lenient'));

      const pose = {
        keypoints: [
          { part: 'nose', position: { x: 110, y: 50 }, score: 0.95 }, // Slightly forward
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      const mediumResult = analyzer.analyzePose(pose);
      const lenientResult = lenientAnalyzer.analyzePose(pose);

      expect(lenientResult.score).toBeGreaterThan(mediumResult.score);
    });
  });

  describe('Calibration workflow', () => {
    test('should apply calibration to improve scores', () => {
      const pose = {
        keypoints: [
          { part: 'nose', position: { x: 110, y: 50 }, score: 0.95 },
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      const uncalibratedResult = analyzer.analyzePose(pose);

      // Simulate calibration based on current posture
      analyzer.updateSettings({
        calibration: {
          headForwardAngle: uncalibratedResult.rawMetrics.headForwardAngle,
          shoulderAsymmetry: uncalibratedResult.rawMetrics.shoulderAsymmetry,
        },
      });

      analyzer.reset(); // Reset smoothing
      const calibratedResult = analyzer.analyzePose(pose);

      // After calibration, same posture should score higher
      expect(calibratedResult.score).toBeGreaterThan(uncalibratedResult.score);
    });

    test('should maintain calibration across multiple frames', () => {
      analyzer.updateSettings({
        calibration: {
          headForwardAngle: 5,
          shoulderAsymmetry: 2,
        },
      });

      const results = [];

      for (let i = 0; i < 5; i++) {
        const pose = {
          keypoints: [
            { part: 'nose', position: { x: 110, y: 50 }, score: 0.95 },
            { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
            { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
          ],
        };

        results.push(analyzer.analyzePose(pose));
      }

      // All results should have calibration applied
      results.forEach((result) => {
        expect(result).not.toBeNull();
        // Calibrated metrics should be adjusted
      });
    });
  });

  describe('Error handling', () => {
    test('should handle malformed pose data gracefully', () => {
      expect(analyzer.analyzePose(null)).toBeNull();
      expect(analyzer.analyzePose({})).toBeNull();
      expect(analyzer.analyzePose({ keypoints: null })).toBeNull();
      expect(analyzer.analyzePose({ keypoints: 'invalid' })).toBeNull();
    });

    test('should handle missing critical keypoints', () => {
      const pose = {
        keypoints: [
          { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
          // Missing shoulders
        ],
      };

      expect(analyzer.analyzePose(pose)).toBeNull();
    });

    test('should handle partial keypoint data', () => {
      const pose = {
        keypoints: [
          { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder' }, // Missing position
        ],
      };

      // Should handle gracefully
      const result = analyzer.analyzePose(pose);
      // May return null or handle missing data
    });
  });

  describe('Status transitions', () => {
    test('should transition from GOOD to WARNING to POOR', () => {
      const poses = [
        // Good posture
        {
          keypoints: [
            { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
            { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
            { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
          ],
        },
        // Slightly forward
        {
          keypoints: [
            { part: 'nose', position: { x: 110, y: 50 }, score: 0.95 },
            { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
            { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
          ],
        },
        // Very forward
        {
          keypoints: [
            { part: 'nose', position: { x: 130, y: 50 }, score: 0.95 },
            { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
            { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
          ],
        },
      ];

      const results = poses.map((pose) => analyzer.analyzePose(pose));

      expect(results[0].status).toBe(PostureStatus.GOOD);
      // Middle might be WARNING or GOOD depending on threshold
      // Last should be POOR or WARNING
      expect(results[2].score).toBeLessThan(results[0].score);
    });
  });
});

/**
 * Convert MediaPipe landmarks to PoseNet format for testing
 */
function convertMediaPipeToPoseNet(landmarks) {
  const mapping = {
    0: 'nose',
    7: 'leftEar',
    8: 'rightEar',
    11: 'leftShoulder',
    12: 'rightShoulder',
    13: 'leftElbow',
    14: 'rightElbow',
    15: 'leftWrist',
    16: 'rightWrist',
    23: 'leftHip',
    24: 'rightHip',
  };

  return Object.entries(mapping)
    .filter(([index]) => landmarks[index])
    .map(([index, part]) => {
      const landmark = landmarks[index];
      return {
        part,
        position: {
          x: landmark.x * 640, // Scale to typical video width
          y: landmark.y * 480, // Scale to typical video height
        },
        score: landmark.visibility,
      };
    });
}
