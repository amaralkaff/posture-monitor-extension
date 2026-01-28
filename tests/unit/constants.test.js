/**
 * Unit Tests for constants.js
 */

import { describe, test, expect } from '@jest/globals';
import {
  PostureStatus,
  DetectionState,
  MessageType,
  StorageKeys,
  SensitivityMultipliers,
  ScoreThresholds,
  KeypointParts,
  NotificationIds,
  Time,
  StatsPeriod,
  ErrorCode,
  VideoConstraints,
  PoseNetConfig,
  MaxHistory,
  UpdateIntervals,
} from '../../src/utils/constants.js';

describe('constants', () => {
  describe('PostureStatus', () => {
    test('should have correct status values', () => {
      expect(PostureStatus.GOOD).toBe('good');
      expect(PostureStatus.WARNING).toBe('warning');
      expect(PostureStatus.POOR).toBe('poor');
      expect(PostureStatus.UNKNOWN).toBe('unknown');
    });

    test('should have all required statuses', () => {
      const statuses = Object.keys(PostureStatus);
      expect(statuses).toContain('GOOD');
      expect(statuses).toContain('WARNING');
      expect(statuses).toContain('POOR');
      expect(statuses).toContain('UNKNOWN');
    });

    test('should have unique values', () => {
      const values = Object.values(PostureStatus);
      const uniqueValues = [...new Set(values)];
      expect(values.length).toBe(uniqueValues.length);
    });
  });

  describe('DetectionState', () => {
    test('should have correct state values', () => {
      expect(DetectionState.IDLE).toBe('idle');
      expect(DetectionState.STARTING).toBe('starting');
      expect(DetectionState.RUNNING).toBe('running');
      expect(DetectionState.STOPPING).toBe('stopping');
      expect(DetectionState.ERROR).toBe('error');
    });

    test('should have all required states', () => {
      const states = Object.keys(DetectionState);
      expect(states.length).toBe(5);
    });
  });

  describe('MessageType', () => {
    test('should have worker message types', () => {
      expect(MessageType.INIT).toBe('init');
      expect(MessageType.START_DETECTION).toBe('start_detection');
      expect(MessageType.STOP_DETECTION).toBe('stop_detection');
      expect(MessageType.UPDATE_SETTINGS).toBe('update_settings');
      expect(MessageType.PROCESS_FRAME).toBe('process_frame');
    });

    test('should have main message types', () => {
      expect(MessageType.READY).toBe('ready');
      expect(MessageType.POSE_RESULT).toBe('pose_result');
      expect(MessageType.ERROR).toBe('error');
      expect(MessageType.STATUS).toBe('status');
    });

    test('should have unique message types', () => {
      const values = Object.values(MessageType);
      const uniqueValues = [...new Set(values)];
      expect(values.length).toBe(uniqueValues.length);
    });
  });

  describe('StorageKeys', () => {
    test('should have all storage keys', () => {
      expect(StorageKeys.SETTINGS).toBe('settings');
      expect(StorageKeys.STATISTICS).toBe('statistics');
      expect(StorageKeys.CALIBRATION).toBe('calibration');
      expect(StorageKeys.LAST_ALERT).toBe('lastAlert');
      expect(StorageKeys.SESSION_DATA).toBe('sessionData');
    });

    test('should have string values', () => {
      Object.values(StorageKeys).forEach((key) => {
        expect(typeof key).toBe('string');
      });
    });
  });

  describe('SensitivityMultipliers', () => {
    test('should have multipliers for all sensitivity levels', () => {
      expect(SensitivityMultipliers.low).toBe(0.7);
      expect(SensitivityMultipliers.medium).toBe(1.0);
      expect(SensitivityMultipliers.high).toBe(1.5);
    });

    test('should have increasing multipliers from low to high', () => {
      // High sensitivity = higher multiplier (more strict)
      expect(SensitivityMultipliers.high).toBeGreaterThan(
        SensitivityMultipliers.medium
      );
      expect(SensitivityMultipliers.medium).toBeGreaterThan(
        SensitivityMultipliers.low
      );
    });

    test('should have numeric values', () => {
      Object.values(SensitivityMultipliers).forEach((multiplier) => {
        expect(typeof multiplier).toBe('number');
        expect(multiplier).toBeGreaterThan(0);
      });
    });
  });

  describe('ScoreThresholds', () => {
    test('should have correct threshold values', () => {
      expect(ScoreThresholds.GOOD).toBe(80);
      expect(ScoreThresholds.WARNING).toBe(50);
      expect(ScoreThresholds.POOR).toBe(0);
    });

    test('should have descending threshold values', () => {
      expect(ScoreThresholds.GOOD).toBeGreaterThan(ScoreThresholds.WARNING);
      expect(ScoreThresholds.WARNING).toBeGreaterThan(ScoreThresholds.POOR);
    });

    test('should be in valid score range (0-100)', () => {
      Object.values(ScoreThresholds).forEach((threshold) => {
        expect(threshold).toBeGreaterThanOrEqual(0);
        expect(threshold).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('KeypointParts', () => {
    test('should have all required keypoints', () => {
      const requiredParts = [
        'NOSE',
        'LEFT_SHOULDER',
        'RIGHT_SHOULDER',
        'LEFT_EAR',
        'RIGHT_EAR',
      ];

      requiredParts.forEach((part) => {
        expect(KeypointParts).toHaveProperty(part);
      });
    });

    test('should have string values', () => {
      Object.values(KeypointParts).forEach((part) => {
        expect(typeof part).toBe('string');
      });
    });

    test('should have camelCase values', () => {
      Object.values(KeypointParts).forEach((part) => {
        expect(part).toMatch(/^[a-z][a-zA-Z]*$/);
      });
    });
  });

  describe('NotificationIds', () => {
    test('should have all notification IDs', () => {
      expect(NotificationIds.POOR_POSTURE).toBe('poor-posture-alert');
      expect(NotificationIds.WARNING_POSTURE).toBe('warning-posture-alert');
      expect(NotificationIds.CAMERA_ERROR).toBe('camera-error');
      expect(NotificationIds.PERMISSION_DENIED).toBe('permission-denied');
    });

    test('should have kebab-case values', () => {
      Object.values(NotificationIds).forEach((id) => {
        expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      });
    });
  });

  describe('Time', () => {
    test('should have correct time conversions', () => {
      expect(Time.SECOND).toBe(1000);
      expect(Time.MINUTE).toBe(60000);
      expect(Time.HOUR).toBe(3600000);
      expect(Time.DAY).toBe(86400000);
    });

    test('should have correct time relationships', () => {
      expect(Time.MINUTE).toBe(Time.SECOND * 60);
      expect(Time.HOUR).toBe(Time.MINUTE * 60);
      expect(Time.DAY).toBe(Time.HOUR * 24);
    });

    test('should be in milliseconds', () => {
      Object.values(Time).forEach((time) => {
        expect(time).toBeGreaterThanOrEqual(1000);
      });
    });
  });

  describe('StatsPeriod', () => {
    test('should have all period types', () => {
      expect(StatsPeriod.SESSION).toBe('session');
      expect(StatsPeriod.DAILY).toBe('daily');
      expect(StatsPeriod.WEEKLY).toBe('weekly');
      expect(StatsPeriod.MONTHLY).toBe('monthly');
    });
  });

  describe('ErrorCode', () => {
    test('should have all error codes', () => {
      const expectedCodes = [
        'CAMERA_PERMISSION_DENIED',
        'CAMERA_NOT_FOUND',
        'MODEL_LOAD_FAILED',
        'DETECTION_FAILED',
        'INVALID_SETTINGS',
        'STORAGE_ERROR',
      ];

      expectedCodes.forEach((code) => {
        expect(ErrorCode).toHaveProperty(code);
      });
    });

    test('should have UPPER_SNAKE_CASE values', () => {
      Object.values(ErrorCode).forEach((code) => {
        expect(code).toMatch(/^[A-Z_]+$/);
      });
    });
  });

  describe('VideoConstraints', () => {
    test('should have resolution constraints', () => {
      expect(VideoConstraints.width).toEqual({ ideal: 640 });
      expect(VideoConstraints.height).toEqual({ ideal: 480 });
    });

    test('should have frameRate constraint', () => {
      expect(VideoConstraints.frameRate).toEqual({ ideal: 30 });
    });

    test('should have facingMode', () => {
      expect(VideoConstraints.facingMode).toBe('user');
    });

    test('should have reasonable resolution values', () => {
      expect(VideoConstraints.width.ideal).toBeGreaterThan(0);
      expect(VideoConstraints.height.ideal).toBeGreaterThan(0);
      expect(VideoConstraints.frameRate.ideal).toBeGreaterThan(0);
    });
  });

  describe('PoseNetConfig', () => {
    test('should have all required config properties', () => {
      expect(PoseNetConfig).toHaveProperty('architecture');
      expect(PoseNetConfig).toHaveProperty('outputStride');
      expect(PoseNetConfig).toHaveProperty('inputResolution');
      expect(PoseNetConfig).toHaveProperty('multiplier');
      expect(PoseNetConfig).toHaveProperty('quantBytes');
    });

    test('should have valid architecture', () => {
      expect(PoseNetConfig.architecture).toBe('MobileNetV1');
    });

    test('should have valid numeric values', () => {
      expect(PoseNetConfig.outputStride).toBeGreaterThan(0);
      expect(PoseNetConfig.multiplier).toBeGreaterThan(0);
      expect(PoseNetConfig.multiplier).toBeLessThanOrEqual(1);
      expect(PoseNetConfig.quantBytes).toBeGreaterThan(0);
    });

    test('should have valid input resolution', () => {
      expect(PoseNetConfig.inputResolution.width).toBeGreaterThan(0);
      expect(PoseNetConfig.inputResolution.height).toBeGreaterThan(0);
    });
  });

  describe('MaxHistory', () => {
    test('should have all history limits', () => {
      expect(MaxHistory.METRICS).toBe(30);
      expect(MaxHistory.STATISTICS).toBe(90);
      expect(MaxHistory.NOTIFICATIONS).toBe(100);
    });

    test('should have positive values', () => {
      Object.values(MaxHistory).forEach((max) => {
        expect(max).toBeGreaterThan(0);
      });
    });
  });

  describe('UpdateIntervals', () => {
    test('should have all intervals', () => {
      expect(UpdateIntervals.POPUP).toBe(500);
      expect(UpdateIntervals.STATISTICS).toBe(60000);
    });

    test('should have positive values in milliseconds', () => {
      Object.values(UpdateIntervals).forEach((interval) => {
        expect(interval).toBeGreaterThan(0);
      });
    });

    test('should have reasonable intervals', () => {
      expect(UpdateIntervals.POPUP).toBeLessThan(UpdateIntervals.STATISTICS);
    });
  });

  describe('Constant immutability', () => {
    test('should not be able to add new properties to PostureStatus', () => {
      expect(() => {
        PostureStatus.NEW_STATUS = 'new';
      }).toThrow();
    });

    test('should not be able to modify existing DetectionState values', () => {
      const original = DetectionState.IDLE;
      expect(() => {
        DetectionState.IDLE = 'modified';
      }).toThrow();
      expect(DetectionState.IDLE).toBe(original);
    });
  });
});
