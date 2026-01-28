/**
 * Unit Tests for poseAnalyzer.js
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { PoseAnalyzer } from '../../src/detection/poseAnalyzer.js';
import { PostureStatus } from '../../src/utils/constants.js';
import { createGoodPosturePose, createBadPosturePose, createMockPose } from '../helpers/testUtils.js';

describe('PoseAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new PoseAnalyzer({
      sensitivity: 'medium',
      thresholds: {
        headForwardAngle: 15,
        shoulderAsymmetry: 10,
        poorPostureDuration: 30,
      },
      detection: {
        confidenceThreshold: 0.5,
      },
    });
  });

  describe('constructor', () => {
    test('should initialize with default settings', () => {
      const newAnalyzer = new PoseAnalyzer();
      expect(newAnalyzer.settings).toEqual({});
      expect(newAnalyzer.metricsHistory).toEqual([]);
      expect(newAnalyzer.smoothedMetrics).toBeNull();
    });

    test('should initialize with provided settings', () => {
      const settings = { sensitivity: 'high' };
      const newAnalyzer = new PoseAnalyzer(settings);
      expect(newAnalyzer.settings).toEqual(settings);
    });
  });

  describe('updateSettings', () => {
    test('should update settings', () => {
      analyzer.updateSettings({ sensitivity: 'high' });
      expect(analyzer.settings.sensitivity).toBe('high');
    });

    test('should merge with existing settings', () => {
      const originalThresholds = analyzer.settings.thresholds;
      analyzer.updateSettings({ sensitivity: 'low' });
      expect(analyzer.settings.thresholds).toEqual(originalThresholds);
      expect(analyzer.settings.sensitivity).toBe('low');
    });
  });

  describe('analyzePose', () => {
    test('should return null for null pose', () => {
      expect(analyzer.analyzePose(null)).toBeNull();
    });

    test('should return null for pose without keypoints', () => {
      expect(analyzer.analyzePose({})).toBeNull();
    });

    test('should return null for empty keypoints array', () => {
      expect(analyzer.analyzePose({ keypoints: [] })).toBeNull();
    });

    test('should return null for low confidence pose', () => {
      const lowConfidencePose = {
        keypoints: [
          { part: 'nose', position: { x: 100, y: 50 }, score: 0.1 },
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.1 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.1 },
        ],
      };

      expect(analyzer.analyzePose(lowConfidencePose)).toBeNull();
    });

    test('should return analysis for valid pose', () => {
      const validPose = {
        keypoints: [
          { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      const result = analyzer.analyzePose(validPose);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('rawMetrics');
    });

    test('should calculate metrics correctly', () => {
      const pose = {
        keypoints: [
          { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      const result = analyzer.analyzePose(pose);
      expect(result.metrics).toHaveProperty('headForwardAngle');
      expect(result.metrics).toHaveProperty('shoulderAsymmetry');
      expect(result.metrics).toHaveProperty('neckAngle');
      expect(result.metrics).toHaveProperty('confidence');
      expect(result.metrics).toHaveProperty('timestamp');
    });

    test('should classify posture status', () => {
      const pose = {
        keypoints: [
          { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      const result = analyzer.analyzePose(pose);
      expect([PostureStatus.GOOD, PostureStatus.WARNING, PostureStatus.POOR]).toContain(
        result.status
      );
    });

    test('should apply calibration if available', () => {
      analyzer.updateSettings({
        calibration: {
          headForwardAngle: 5,
          shoulderAsymmetry: 2,
        },
      });

      const pose = {
        keypoints: [
          { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      const result = analyzer.analyzePose(pose);
      expect(result).not.toBeNull();
      // Calibration should adjust the metrics
    });
  });

  describe('extractKeypoints', () => {
    test('should extract keypoints into accessible format', () => {
      const keypoints = [
        { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
        { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
      ];

      const extracted = analyzer.extractKeypoints(keypoints);
      expect(extracted.nose).toEqual({ x: 100, y: 50, score: 0.95 });
      expect(extracted.leftShoulder).toEqual({ x: 80, y: 120, score: 0.9 });
    });

    test('should handle empty array', () => {
      const extracted = analyzer.extractKeypoints([]);
      expect(extracted).toEqual({});
    });
  });

  describe('hasRequiredKeypoints', () => {
    test('should return true when all required keypoints present', () => {
      const keypoints = {
        nose: { x: 100, y: 50, score: 0.95 },
        leftShoulder: { x: 80, y: 120, score: 0.9 },
        rightShoulder: { x: 120, y: 120, score: 0.9 },
      };

      expect(analyzer.hasRequiredKeypoints(keypoints)).toBe(true);
    });

    test('should return false when missing required keypoints', () => {
      const keypoints = {
        nose: { x: 100, y: 50, score: 0.95 },
        leftShoulder: { x: 80, y: 120, score: 0.9 },
        // Missing rightShoulder
      };

      expect(analyzer.hasRequiredKeypoints(keypoints)).toBe(false);
    });

    test('should return false when keypoint score is too low', () => {
      const keypoints = {
        nose: { x: 100, y: 50, score: 0.95 },
        leftShoulder: { x: 80, y: 120, score: 0.2 }, // Low score
        rightShoulder: { x: 120, y: 120, score: 0.9 },
      };

      expect(analyzer.hasRequiredKeypoints(keypoints)).toBe(false);
    });
  });

  describe('getAverageConfidence', () => {
    test('should calculate average confidence', () => {
      const keypoints = [
        { part: 'nose', position: { x: 100, y: 50 }, score: 0.9 },
        { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.8 },
      ];

      expect(analyzer.getAverageConfidence(keypoints)).toBeCloseTo(0.85, 2);
    });

    test('should return 0 for empty array', () => {
      expect(analyzer.getAverageConfidence([])).toBe(0);
    });

    test('should handle single keypoint', () => {
      const keypoints = [{ part: 'nose', position: { x: 100, y: 50 }, score: 0.75 }];

      expect(analyzer.getAverageConfidence(keypoints)).toBe(0.75);
    });
  });

  describe('calculateHeadForwardAngle', () => {
    test('should calculate head forward angle', () => {
      const keypoints = {
        nose: { x: 100, y: 50, score: 0.95 },
        leftShoulder: { x: 80, y: 120, score: 0.9 },
        rightShoulder: { x: 120, y: 120, score: 0.9 },
      };

      const angle = analyzer.calculateHeadForwardAngle(keypoints);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThanOrEqual(90);
    });

    test('should return 0 when missing keypoints', () => {
      const keypoints = {
        nose: { x: 100, y: 50, score: 0.95 },
        // Missing shoulders
      };

      expect(analyzer.calculateHeadForwardAngle(keypoints)).toBe(0);
    });

    test('should return 0 for vertical distance of 0', () => {
      const keypoints = {
        nose: { x: 100, y: 120, score: 0.95 }, // Same Y as shoulders
        leftShoulder: { x: 80, y: 120, score: 0.9 },
        rightShoulder: { x: 120, y: 120, score: 0.9 },
      };

      expect(analyzer.calculateHeadForwardAngle(keypoints)).toBe(0);
    });
  });

  describe('calculateShoulderAsymmetry', () => {
    test('should calculate shoulder asymmetry', () => {
      const keypoints = {
        leftShoulder: { x: 80, y: 120, score: 0.9 },
        rightShoulder: { x: 120, y: 120, score: 0.9 },
      };

      const asymmetry = analyzer.calculateShoulderAsymmetry(keypoints);
      expect(asymmetry).toBeGreaterThanOrEqual(0);
    });

    test('should return 0 for level shoulders', () => {
      const keypoints = {
        leftShoulder: { x: 80, y: 100, score: 0.9 },
        rightShoulder: { x: 120, y: 100, score: 0.9 }, // Same Y
      };

      const asymmetry = analyzer.calculateShoulderAsymmetry(keypoints);
      expect(asymmetry).toBe(0);
    });

    test('should detect uneven shoulders', () => {
      const keypoints = {
        leftShoulder: { x: 80, y: 100, score: 0.9 },
        rightShoulder: { x: 120, y: 120, score: 0.9 }, // 20 pixels lower
      };

      const asymmetry = analyzer.calculateShoulderAsymmetry(keypoints);
      expect(asymmetry).toBeGreaterThan(0);
    });

    test('should return 0 when missing keypoints', () => {
      const keypoints = {
        leftShoulder: { x: 80, y: 120, score: 0.9 },
        // Missing right shoulder
      };

      expect(analyzer.calculateShoulderAsymmetry(keypoints)).toBe(0);
    });

    test('should return 0 for zero shoulder width', () => {
      const keypoints = {
        leftShoulder: { x: 100, y: 100, score: 0.9 },
        rightShoulder: { x: 100, y: 120, score: 0.9 }, // Same X
      };

      expect(analyzer.calculateShoulderAsymmetry(keypoints)).toBe(0);
    });
  });

  describe('calculateNeckAngle', () => {
    test('should calculate neck angle', () => {
      const keypoints = {
        nose: { x: 100, y: 50, score: 0.95 },
        leftShoulder: { x: 80, y: 120, score: 0.9 },
        rightShoulder: { x: 120, y: 120, score: 0.9 },
      };

      const angle = analyzer.calculateNeckAngle(keypoints);
      expect(angle).toBeGreaterThanOrEqual(0);
    });

    test('should prefer ears over nose when available', () => {
      const keypoints = {
        nose: { x: 100, y: 50, score: 0.95 },
        leftEar: { x: 90, y: 45, score: 0.9 },
        rightEar: { x: 110, y: 45, score: 0.9 },
        leftShoulder: { x: 80, y: 120, score: 0.9 },
        rightShoulder: { x: 120, y: 120, score: 0.9 },
      };

      const angle = analyzer.calculateNeckAngle(keypoints);
      expect(angle).toBeGreaterThanOrEqual(0);
    });

    test('should return 0 when missing required keypoints', () => {
      const keypoints = {
        nose: { x: 100, y: 50, score: 0.95 },
        // Missing shoulders
      };

      expect(analyzer.calculateNeckAngle(keypoints)).toBe(0);
    });
  });

  describe('applyCalibration', () => {
    test('should apply calibration offset', () => {
      expect(analyzer.applyCalibration(20, 5)).toBe(15);
    });

    test('should not go below 0', () => {
      expect(analyzer.applyCalibration(3, 5)).toBe(0);
    });

    test('should return original value if no baseline', () => {
      expect(analyzer.applyCalibration(20, null)).toBe(20);
      expect(analyzer.applyCalibration(20, undefined)).toBe(20);
    });
  });

  describe('smoothMetrics', () => {
    test('should return raw metrics on first call', () => {
      const metrics = {
        headForwardAngle: 10,
        shoulderAsymmetry: 5,
        neckAngle: 8,
        confidence: 0.9,
        timestamp: Date.now(),
      };

      const smoothed = analyzer.smoothMetrics(metrics);
      expect(smoothed).toEqual(metrics);
    });

    test('should smooth metrics on subsequent calls', () => {
      const metrics1 = {
        headForwardAngle: 10,
        shoulderAsymmetry: 5,
        neckAngle: 8,
        confidence: 0.9,
        timestamp: Date.now(),
      };

      analyzer.smoothedMetrics = metrics1;

      const metrics2 = {
        headForwardAngle: 20,
        shoulderAsymmetry: 10,
        neckAngle: 15,
        confidence: 0.85,
        timestamp: Date.now(),
      };

      const smoothed = analyzer.smoothMetrics(metrics2);
      
      // Should be between old and new values
      expect(smoothed.headForwardAngle).toBeGreaterThan(metrics1.headForwardAngle);
      expect(smoothed.headForwardAngle).toBeLessThan(metrics2.headForwardAngle);
    });
  });

  describe('calculatePostureScore', () => {
    test('should return score between 0 and 100', () => {
      const metrics = {
        headForwardAngle: 10,
        shoulderAsymmetry: 5,
        neckAngle: 8,
      };

      const score = analyzer.calculatePostureScore(metrics);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should return high score for good posture', () => {
      const metrics = {
        headForwardAngle: 2,
        shoulderAsymmetry: 1,
        neckAngle: 3,
      };

      const score = analyzer.calculatePostureScore(metrics);
      expect(score).toBeGreaterThan(80);
    });

    test('should return low score for poor posture', () => {
      const metrics = {
        headForwardAngle: 40,
        shoulderAsymmetry: 30,
        neckAngle: 35,
      };

      const score = analyzer.calculatePostureScore(metrics);
      expect(score).toBeLessThan(50);
    });

    test('should apply sensitivity multipliers', () => {
      const metrics = {
        headForwardAngle: 10,
        shoulderAsymmetry: 5,
        neckAngle: 8,
      };

      analyzer.updateSettings({ sensitivity: 'low' });
      const lowScore = analyzer.calculatePostureScore(metrics);

      analyzer.updateSettings({ sensitivity: 'high' });
      const highScore = analyzer.calculatePostureScore(metrics);

      // High sensitivity should penalize more
      expect(highScore).toBeLessThan(lowScore);
    });
  });

  describe('classifyPosture', () => {
    test('should classify as GOOD for high scores', () => {
      expect(analyzer.classifyPosture(85)).toBe(PostureStatus.GOOD);
      expect(analyzer.classifyPosture(100)).toBe(PostureStatus.GOOD);
    });

    test('should classify as WARNING for medium scores', () => {
      expect(analyzer.classifyPosture(60)).toBe(PostureStatus.WARNING);
      expect(analyzer.classifyPosture(75)).toBe(PostureStatus.WARNING);
    });

    test('should classify as POOR for low scores', () => {
      expect(analyzer.classifyPosture(30)).toBe(PostureStatus.POOR);
      expect(analyzer.classifyPosture(0)).toBe(PostureStatus.POOR);
    });

    test('should handle boundary values', () => {
      expect(analyzer.classifyPosture(80)).toBe(PostureStatus.GOOD);
      expect(analyzer.classifyPosture(79)).toBe(PostureStatus.WARNING);
      expect(analyzer.classifyPosture(50)).toBe(PostureStatus.WARNING);
      expect(analyzer.classifyPosture(49)).toBe(PostureStatus.POOR);
    });
  });

  describe('getPostureFeedback', () => {
    test('should provide feedback for good posture', () => {
      const analysis = {
        status: PostureStatus.GOOD,
        score: 90,
        metrics: { headForwardAngle: 5, shoulderAsymmetry: 3, neckAngle: 5 },
      };

      const feedback = analyzer.getPostureFeedback(analysis);
      expect(feedback).toContain('Excellent');
      expect(feedback).toContain('90');
    });

    test('should provide feedback for head forward posture', () => {
      const analysis = {
        status: PostureStatus.WARNING,
        score: 60,
        metrics: { headForwardAngle: 25, shoulderAsymmetry: 3, neckAngle: 5 },
      };

      const feedback = analyzer.getPostureFeedback(analysis);
      expect(feedback).toContain('head');
      expect(feedback).toContain('forward');
    });

    test('should provide feedback for shoulder asymmetry', () => {
      const analysis = {
        status: PostureStatus.WARNING,
        score: 65,
        metrics: { headForwardAngle: 5, shoulderAsymmetry: 15, neckAngle: 5 },
      };

      const feedback = analyzer.getPostureFeedback(analysis);
      expect(feedback).toContain('shoulders');
    });

    test('should provide feedback for neck angle', () => {
      const analysis = {
        status: PostureStatus.WARNING,
        score: 70,
        metrics: { headForwardAngle: 8, shoulderAsymmetry: 5, neckAngle: 25 },
      };

      const feedback = analyzer.getPostureFeedback(analysis);
      expect(feedback).toContain('neck');
    });

    test('should handle unknown status', () => {
      const analysis = {
        status: PostureStatus.UNKNOWN,
        score: 0,
        metrics: {},
      };

      const feedback = analyzer.getPostureFeedback(analysis);
      expect(feedback).toContain('Unable to detect');
    });

    test('should handle null analysis', () => {
      const feedback = analyzer.getPostureFeedback(null);
      expect(feedback).toContain('Unable to detect');
    });
  });

  describe('reset', () => {
    test('should reset analyzer state', () => {
      analyzer.metricsHistory = [1, 2, 3];
      analyzer.smoothedMetrics = { headForwardAngle: 10 };

      analyzer.reset();

      expect(analyzer.metricsHistory).toEqual([]);
      expect(analyzer.smoothedMetrics).toBeNull();
    });
  });
});
