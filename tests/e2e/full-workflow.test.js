/**
 * End-to-End Tests for Complete Workflow
 * Tests the entire application workflow from initialization to alerts
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { PoseAnalyzer } from '../../src/detection/poseAnalyzer.js';
import { PostureStatus, DetectionState, StorageKeys } from '../../src/utils/constants.js';
import { getDefaultSettings } from '../../src/utils/validators.js';
import {
  GOOD_POSTURE_POSE,
  BAD_POSTURE_FORWARD_HEAD,
} from '../fixtures/mockPoseData.js';

describe('Full Workflow E2E Tests', () => {
  let app;
  let mockBrowser;
  let mockStorage;
  let storageData;

  beforeEach(() => {
    // Setup storage
    storageData = {};
    mockStorage = {
      local: {
        get: jest.fn((keys) => {
          if (typeof keys === 'string') {
            return Promise.resolve({ [keys]: storageData[keys] });
          }
          const result = {};
          (keys || []).forEach((key) => {
            if (storageData[key]) result[key] = storageData[key];
          });
          return Promise.resolve(result);
        }),
        set: jest.fn((data) => {
          Object.assign(storageData, data);
          return Promise.resolve();
        }),
      },
    };

    mockBrowser = {
      storage: mockStorage,
      notifications: {
        create: jest.fn().mockResolvedValue('notif-id'),
        clear: jest.fn(),
      },
      runtime: {
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn(),
        },
      },
    };

    global.browser = mockBrowser;

    app = new PostureMonitorApp();
  });

  describe('Application lifecycle', () => {
    test('should complete full initialization flow', async () => {
      await app.initialize();

      expect(app.state).toBe(DetectionState.IDLE);
      expect(app.settings).toBeDefined();
      expect(app.analyzer).toBeDefined();
    });

    test('should load settings on initialization', async () => {
      const customSettings = {
        sensitivity: 'high',
        thresholds: { headForwardAngle: 20 },
      };

      storageData[StorageKeys.SETTINGS] = customSettings;

      await app.initialize();

      expect(app.settings.sensitivity).toBe('high');
    });

    test('should start detection workflow', async () => {
      await app.initialize();
      await app.startDetection();

      expect(app.state).toBe(DetectionState.RUNNING);
    });

    test('should stop detection cleanly', async () => {
      await app.initialize();
      await app.startDetection();
      await app.stopDetection();

      expect(app.state).toBe(DetectionState.IDLE);
    });
  });

  describe('Detection and analysis flow', () => {
    test('should process good posture through complete pipeline', async () => {
      await app.initialize();
      await app.startDetection();

      const pose = convertMediaPipeToPoseNet(GOOD_POSTURE_POSE.poseLandmarks);
      const result = await app.processPose({ keypoints: pose });

      expect(result).not.toBeNull();
      expect(result.status).toBe(PostureStatus.GOOD);
      expect(mockBrowser.notifications.create).not.toHaveBeenCalled();
    });

    test('should detect and alert on poor posture', async () => {
      await app.initialize();
      await app.startDetection();

      const pose = convertMediaPipeToPoseNet(BAD_POSTURE_FORWARD_HEAD.poseLandmarks);

      // Process poor posture frame
      const result = await app.processPose({ keypoints: pose });

      // Should detect poor posture and trigger alert
      expect(result.status).toBe(PostureStatus.POOR);
      expect(mockBrowser.notifications.create).toHaveBeenCalled();
    });

    test('should update statistics', async () => {
      await app.initialize();
      await app.startDetection();

      const goodPose = convertMediaPipeToPoseNet(GOOD_POSTURE_POSE.poseLandmarks);
      const badPose = convertMediaPipeToPoseNet(BAD_POSTURE_FORWARD_HEAD.poseLandmarks);

      // Reset between frames to ensure accurate classification without smoothing effects
      app.analyzer.reset();
      await app.processPose({ keypoints: goodPose });

      app.analyzer.reset();
      await app.processPose({ keypoints: badPose });

      app.analyzer.reset();
      await app.processPose({ keypoints: goodPose });

      const stats = app.getStatistics();

      expect(stats.totalFrames).toBe(3);
      expect(stats.goodPostureFrames).toBe(2);
      expect(stats.poorPostureFrames).toBe(1);
    });
  });

  describe('Settings changes during operation', () => {
    test('should apply settings changes immediately', async () => {
      await app.initialize();
      await app.startDetection();

      // Create a pose with some posture issues
      const pose = [
        { part: 'nose', position: { x: 330, y: 120 }, score: 0.95 },
        { part: 'leftShoulder', position: { x: 256, y: 230 }, score: 0.9 },
        { part: 'rightShoulder', position: { x: 384, y: 230 }, score: 0.9 },
      ];

      // Reset analyzer to clear smoothing
      app.analyzer.reset();
      await app.updateSettings({ sensitivity: 'low' });
      const result1 = await app.processPose({ keypoints: pose });

      // Change sensitivity and reset
      app.analyzer.reset();
      await app.updateSettings({ sensitivity: 'high' });
      const result2 = await app.processPose({ keypoints: pose });

      // Same pose should get different scores with different sensitivity
      expect(result1.score).not.toBe(result2.score);
      expect(result2.score).toBeLessThan(result1.score); // High sensitivity = lower score
    });

    test('should persist settings changes', async () => {
      await app.initialize();

      await app.updateSettings({ sensitivity: 'high' });

      const stored = await mockStorage.local.get(StorageKeys.SETTINGS);
      expect(stored[StorageKeys.SETTINGS].sensitivity).toBe('high');
    });
  });

  describe('Calibration workflow', () => {
    test('should calibrate based on current posture', async () => {
      await app.initialize();
      await app.startDetection();

      const pose = convertMediaPipeToPoseNet(GOOD_POSTURE_POSE.poseLandmarks);
      await app.processPose({ keypoints: pose });

      await app.calibrate();

      expect(app.settings.calibration).toBeDefined();
      expect(app.settings.calibration.headForwardAngle).toBeGreaterThanOrEqual(0);
    });

    test('should improve scores after calibration', async () => {
      await app.initialize();
      await app.startDetection();

      const pose = convertMediaPipeToPoseNet(BAD_POSTURE_FORWARD_HEAD.poseLandmarks);

      // Reset to ensure no smoothing
      app.analyzer.reset();
      const beforeCalibration = await app.processPose({ keypoints: pose });

      await app.calibrate();

      // Reset again for fair comparison
      app.analyzer.reset();
      const afterCalibration = await app.processPose({ keypoints: pose });

      // After calibration, the bad posture becomes the baseline (score should be 100)
      expect(afterCalibration.score).toBeGreaterThan(beforeCalibration.score);
      expect(afterCalibration.score).toBe(100); // Should be perfect after calibration to this pose
    });

    test('should persist calibration data', async () => {
      await app.initialize();
      await app.startDetection();

      const pose = convertMediaPipeToPoseNet(GOOD_POSTURE_POSE.poseLandmarks);
      await app.processPose({ keypoints: pose });

      await app.calibrate();

      const stored = await mockStorage.local.get(StorageKeys.CALIBRATION);
      expect(stored[StorageKeys.CALIBRATION]).toBeDefined();
    });
  });

  describe('Error handling and recovery', () => {
    test('should handle camera errors gracefully', async () => {
      await app.initialize();

      // Simulate camera error
      app.cameraError = new Error('Camera not found');

      await expect(app.startDetection()).rejects.toThrow('Camera not found');
      expect(app.state).toBe(DetectionState.ERROR);
    });

    test('should recover from temporary errors', async () => {
      await app.initialize();
      await app.startDetection();

      // Simulate temporary error
      app.handleError(new Error('Temporary error'));

      // Should still be able to process poses
      const pose = convertMediaPipeToPoseNet(GOOD_POSTURE_POSE.poseLandmarks);
      const result = await app.processPose({ keypoints: pose });

      expect(result).not.toBeNull();
    });

    test('should clear error state on successful detection', async () => {
      await app.initialize();

      app.state = DetectionState.ERROR;

      await app.startDetection();

      const pose = convertMediaPipeToPoseNet(GOOD_POSTURE_POSE.poseLandmarks);
      await app.processPose({ keypoints: pose });

      expect(app.state).toBe(DetectionState.RUNNING);
    });
  });

  describe('Statistics and history', () => {
    test('should track session statistics', async () => {
      await app.initialize();
      await app.startDetection();

      const goodPose = convertMediaPipeToPoseNet(GOOD_POSTURE_POSE.poseLandmarks);
      const badPose = convertMediaPipeToPoseNet(BAD_POSTURE_FORWARD_HEAD.poseLandmarks);

      // Process multiple poses with reset to avoid smoothing affecting classification
      for (let i = 0; i < 5; i++) {
        app.analyzer.reset();
        await app.processPose({ keypoints: goodPose });
      }

      for (let i = 0; i < 3; i++) {
        app.analyzer.reset();
        await app.processPose({ keypoints: badPose });
      }

      const stats = app.getStatistics();

      expect(stats.totalFrames).toBe(8);
      expect(stats.goodPostureFrames).toBe(5);
      expect(stats.poorPostureFrames).toBe(3);
      expect(stats.goodPosturePercentage).toBeCloseTo(62.5, 1);
    });

    test('should save session data on stop', async () => {
      await app.initialize();
      await app.startDetection();

      const goodPose = convertMediaPipeToPoseNet(GOOD_POSTURE_POSE.poseLandmarks);
      await app.processPose({ keypoints: goodPose });

      await app.stopDetection();

      const stored = await mockStorage.local.get(StorageKeys.SESSION_DATA);
      expect(stored[StorageKeys.SESSION_DATA]).toBeDefined();
    });
  });
});

/**
 * Mock PostureMonitorApp for E2E testing
 */
class PostureMonitorApp {
  constructor() {
    this.state = DetectionState.IDLE;
    this.settings = null;
    this.analyzer = null;
    this.statistics = {
      totalFrames: 0,
      goodPostureFrames: 0,
      warningPostureFrames: 0,
      poorPostureFrames: 0,
    };
    this.lastAnalysis = null;
    this.cameraError = null;
  }

  async initialize() {
    const stored = await browser.storage.local.get(StorageKeys.SETTINGS);
    this.settings = stored[StorageKeys.SETTINGS] || getDefaultSettings();
    this.analyzer = new PoseAnalyzer(this.settings);
    this.state = DetectionState.IDLE;
  }

  async startDetection() {
    if (this.cameraError) {
      this.state = DetectionState.ERROR;
      throw this.cameraError;
    }

    this.state = DetectionState.RUNNING;
  }

  async stopDetection() {
    // Save session data
    await browser.storage.local.set({
      [StorageKeys.SESSION_DATA]: {
        endTime: Date.now(),
        statistics: this.statistics,
      },
    });

    this.state = DetectionState.IDLE;
  }

  async processPose(pose) {
    if (this.state !== DetectionState.RUNNING) {
      return null;
    }

    const result = this.analyzer.analyzePose(pose);

    if (result) {
      this.updateStatistics(result);
      this.lastAnalysis = result;

      // Check for alerts
      if (result.status === PostureStatus.POOR) {
        await this.checkAlert(result);
      }
    }

    return result;
  }

  updateStatistics(result) {
    this.statistics.totalFrames++;

    switch (result.status) {
      case PostureStatus.GOOD:
        this.statistics.goodPostureFrames++;
        break;
      case PostureStatus.WARNING:
        this.statistics.warningPostureFrames++;
        break;
      case PostureStatus.POOR:
        this.statistics.poorPostureFrames++;
        break;
    }
  }

  async checkAlert(result) {
    await browser.notifications.create('poor-posture', {
      type: 'basic',
      title: 'Poor Posture Detected',
      message: `Score: ${result.score}/100`,
    });
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.analyzer.updateSettings(this.settings);

    await browser.storage.local.set({
      [StorageKeys.SETTINGS]: this.settings,
    });
  }

  async calibrate() {
    if (!this.lastAnalysis) {
      throw new Error('No pose data available for calibration');
    }

    const calibration = {
      headForwardAngle: this.lastAnalysis.rawMetrics.headForwardAngle,
      shoulderAsymmetry: this.lastAnalysis.rawMetrics.shoulderAsymmetry,
    };

    await this.updateSettings({ calibration });

    await browser.storage.local.set({
      [StorageKeys.CALIBRATION]: calibration,
    });
  }

  getStatistics() {
    const total = this.statistics.totalFrames;
    return {
      ...this.statistics,
      goodPosturePercentage: total > 0 ? (this.statistics.goodPostureFrames / total) * 100 : 0,
      poorPosturePercentage: total > 0 ? (this.statistics.poorPostureFrames / total) * 100 : 0,
    };
  }

  handleError(error) {
    console.error('Error:', error);
    // Continue operation
  }
}

/**
 * Convert MediaPipe landmarks to PoseNet format
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
          x: landmark.x * 640,
          y: landmark.y * 480,
        },
        score: landmark.visibility,
      };
    });
}
