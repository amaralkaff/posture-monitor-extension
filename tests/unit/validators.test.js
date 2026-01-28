/**
 * Unit Tests for validators.js
 */

import { describe, test, expect } from '@jest/globals';
import {
  validateSettings,
  validatePoseData,
  sanitizeSettings,
  getDefaultSettings,
} from '../../src/utils/validators.js';

describe('validators', () => {
  describe('validateSettings', () => {
    test('should validate correct settings', () => {
      const settings = {
        sensitivity: 'medium',
        thresholds: {
          headForwardAngle: 15,
          shoulderAsymmetry: 10,
          poorPostureDuration: 30,
        },
        alerts: {
          enabled: true,
          cooldown: 300,
          sound: false,
        },
        detection: {
          fps: 5,
          confidenceThreshold: 0.5,
        },
      };

      const result = validateSettings(settings);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject null settings', () => {
      const result = validateSettings(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Settings must be an object');
    });

    test('should reject non-object settings', () => {
      const result = validateSettings('invalid');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Settings must be an object');
    });

    test('should validate sensitivity values', () => {
      const valid = validateSettings({ sensitivity: 'high' });
      expect(valid.valid).toBe(true);

      const invalid = validateSettings({ sensitivity: 'extreme' });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors[0]).toContain('Invalid sensitivity');
    });

    test('should validate headForwardAngle range', () => {
      const tooLow = validateSettings({
        thresholds: { headForwardAngle: -5 },
      });
      expect(tooLow.valid).toBe(false);

      const tooHigh = validateSettings({
        thresholds: { headForwardAngle: 100 },
      });
      expect(tooHigh.valid).toBe(false);

      const valid = validateSettings({
        thresholds: { headForwardAngle: 45 },
      });
      expect(valid.valid).toBe(true);
    });

    test('should validate shoulderAsymmetry range', () => {
      const invalid = validateSettings({
        thresholds: { shoulderAsymmetry: -10 },
      });
      expect(invalid.valid).toBe(false);

      const valid = validateSettings({
        thresholds: { shoulderAsymmetry: 15 },
      });
      expect(valid.valid).toBe(true);
    });

    test('should validate poorPostureDuration range', () => {
      const tooLow = validateSettings({
        thresholds: { poorPostureDuration: 0 },
      });
      expect(tooLow.valid).toBe(false);

      const tooHigh = validateSettings({
        thresholds: { poorPostureDuration: 1000 },
      });
      expect(tooHigh.valid).toBe(false);

      const valid = validateSettings({
        thresholds: { poorPostureDuration: 60 },
      });
      expect(valid.valid).toBe(true);
    });

    test('should validate alerts.enabled as boolean', () => {
      const invalid = validateSettings({
        alerts: { enabled: 'yes' },
      });
      expect(invalid.valid).toBe(false);

      const valid = validateSettings({
        alerts: { enabled: true },
      });
      expect(valid.valid).toBe(true);
    });

    test('should validate alerts.cooldown range', () => {
      const invalid = validateSettings({
        alerts: { cooldown: 5000 },
      });
      expect(invalid.valid).toBe(false);

      const valid = validateSettings({
        alerts: { cooldown: 600 },
      });
      expect(valid.valid).toBe(true);
    });

    test('should validate detection.fps range', () => {
      const tooLow = validateSettings({
        detection: { fps: 0 },
      });
      expect(tooLow.valid).toBe(false);

      const tooHigh = validateSettings({
        detection: { fps: 60 },
      });
      expect(tooHigh.valid).toBe(false);

      const valid = validateSettings({
        detection: { fps: 15 },
      });
      expect(valid.valid).toBe(true);
    });

    test('should validate detection.confidenceThreshold range', () => {
      const invalid = validateSettings({
        detection: { confidenceThreshold: 1.5 },
      });
      expect(invalid.valid).toBe(false);

      const valid = validateSettings({
        detection: { confidenceThreshold: 0.7 },
      });
      expect(valid.valid).toBe(true);
    });

    test('should accumulate multiple errors', () => {
      const settings = {
        sensitivity: 'invalid',
        thresholds: {
          headForwardAngle: 100,
          shoulderAsymmetry: -5,
        },
        alerts: {
          enabled: 'yes',
        },
      };

      const result = validateSettings(settings);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });

    test('should accept empty object as valid', () => {
      const result = validateSettings({});
      expect(result.valid).toBe(true);
    });
  });

  describe('validatePoseData', () => {
    test('should validate correct pose data', () => {
      const poseData = {
        keypoints: [
          { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      expect(validatePoseData(poseData)).toBe(true);
    });

    test('should reject null pose data', () => {
      expect(validatePoseData(null)).toBe(false);
    });

    test('should reject non-object pose data', () => {
      expect(validatePoseData('invalid')).toBe(false);
    });

    test('should reject missing keypoints array', () => {
      expect(validatePoseData({ something: 'else' })).toBe(false);
    });

    test('should reject non-array keypoints', () => {
      expect(validatePoseData({ keypoints: 'not-array' })).toBe(false);
    });

    test('should reject missing required keypoints', () => {
      const poseData = {
        keypoints: [
          { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
          // Missing shoulders
        ],
      };

      expect(validatePoseData(poseData)).toBe(false);
    });

    test('should reject malformed keypoint structure', () => {
      const poseData = {
        keypoints: [
          { part: 'nose' }, // Missing position and score
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      expect(validatePoseData(poseData)).toBe(false);
    });

    test('should reject invalid score values', () => {
      const poseData = {
        keypoints: [
          { part: 'nose', position: { x: 100, y: 50 }, score: 1.5 }, // Invalid score
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      expect(validatePoseData(poseData)).toBe(false);
    });

    test('should reject non-numeric positions', () => {
      const poseData = {
        keypoints: [
          { part: 'nose', position: { x: '100', y: 50 }, score: 0.95 },
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
        ],
      };

      expect(validatePoseData(poseData)).toBe(false);
    });

    test('should accept additional keypoints', () => {
      const poseData = {
        keypoints: [
          { part: 'nose', position: { x: 100, y: 50 }, score: 0.95 },
          { part: 'leftShoulder', position: { x: 80, y: 120 }, score: 0.9 },
          { part: 'rightShoulder', position: { x: 120, y: 120 }, score: 0.9 },
          { part: 'leftElbow', position: { x: 70, y: 180 }, score: 0.85 },
          { part: 'rightElbow', position: { x: 130, y: 180 }, score: 0.85 },
        ],
      };

      expect(validatePoseData(poseData)).toBe(true);
    });
  });

  describe('sanitizeSettings', () => {
    test('should sanitize sensitivity to valid value', () => {
      const result = sanitizeSettings({ sensitivity: 'extreme' });
      expect(result.sensitivity).toBe('medium');
    });

    test('should preserve valid sensitivity', () => {
      const result = sanitizeSettings({ sensitivity: 'high' });
      expect(result.sensitivity).toBe('high');
    });

    test('should clamp headForwardAngle to valid range', () => {
      const result = sanitizeSettings({
        thresholds: { headForwardAngle: 100 },
      });
      expect(result.thresholds.headForwardAngle).toBe(90);
    });

    test('should use default for invalid headForwardAngle', () => {
      const result = sanitizeSettings({
        thresholds: { headForwardAngle: 'invalid' },
      });
      expect(result.thresholds.headForwardAngle).toBe(15);
    });

    test('should clamp shoulderAsymmetry to valid range', () => {
      const result = sanitizeSettings({
        thresholds: { shoulderAsymmetry: -5 },
      });
      expect(result.thresholds.shoulderAsymmetry).toBe(0);
    });

    test('should clamp poorPostureDuration to valid range', () => {
      const result = sanitizeSettings({
        thresholds: { poorPostureDuration: 1000 },
      });
      expect(result.thresholds.poorPostureDuration).toBe(600);
    });

    test('should convert alerts.enabled to boolean', () => {
      const result1 = sanitizeSettings({
        alerts: { enabled: 'yes' },
      });
      expect(result1.alerts.enabled).toBe(true);

      const result2 = sanitizeSettings({
        alerts: { enabled: 0 },
      });
      expect(result2.alerts.enabled).toBe(false);
    });

    test('should clamp alerts.cooldown to valid range', () => {
      const result = sanitizeSettings({
        alerts: { cooldown: 5000 },
      });
      expect(result.alerts.cooldown).toBe(3600);
    });

    test('should clamp detection.fps to valid range', () => {
      const result = sanitizeSettings({
        detection: { fps: 60 },
      });
      expect(result.detection.fps).toBe(30);
    });

    test('should clamp detection.confidenceThreshold to valid range', () => {
      const result = sanitizeSettings({
        detection: { confidenceThreshold: 1.5 },
      });
      expect(result.detection.confidenceThreshold).toBe(1);
    });

    test('should handle empty object', () => {
      const result = sanitizeSettings({});
      expect(result).toEqual({});
    });

    test('should sanitize multiple fields', () => {
      const result = sanitizeSettings({
        sensitivity: 'invalid',
        thresholds: {
          headForwardAngle: -10,
          shoulderAsymmetry: 100,
          poorPostureDuration: 0,
        },
        alerts: {
          enabled: 'yes',
          cooldown: 10000,
        },
      });

      expect(result.sensitivity).toBe('medium');
      expect(result.thresholds.headForwardAngle).toBe(0);
      expect(result.thresholds.shoulderAsymmetry).toBe(90);
      expect(result.thresholds.poorPostureDuration).toBe(1);
      expect(result.alerts.enabled).toBe(true);
      expect(result.alerts.cooldown).toBe(3600);
    });
  });

  describe('getDefaultSettings', () => {
    test('should return default settings object', () => {
      const defaults = getDefaultSettings();

      expect(defaults).toHaveProperty('sensitivity', 'medium');
      expect(defaults).toHaveProperty('thresholds');
      expect(defaults).toHaveProperty('alerts');
      expect(defaults).toHaveProperty('detection');
      expect(defaults).toHaveProperty('calibration');
    });

    test('should return valid settings', () => {
      const defaults = getDefaultSettings();
      const validation = validateSettings(defaults);

      expect(validation.valid).toBe(true);
    });

    test('should return new object each time', () => {
      const defaults1 = getDefaultSettings();
      const defaults2 = getDefaultSettings();

      expect(defaults1).not.toBe(defaults2);
      expect(defaults1).toEqual(defaults2);
    });

    test('should have reasonable threshold values', () => {
      const defaults = getDefaultSettings();

      expect(defaults.thresholds.headForwardAngle).toBeGreaterThan(0);
      expect(defaults.thresholds.headForwardAngle).toBeLessThan(90);
      expect(defaults.thresholds.shoulderAsymmetry).toBeGreaterThan(0);
      expect(defaults.thresholds.shoulderAsymmetry).toBeLessThan(90);
      expect(defaults.thresholds.poorPostureDuration).toBeGreaterThan(0);
    });

    test('should have reasonable alert settings', () => {
      const defaults = getDefaultSettings();

      expect(defaults.alerts.enabled).toBe(true);
      expect(defaults.alerts.cooldown).toBeGreaterThan(0);
      expect(typeof defaults.alerts.sound).toBe('boolean');
    });

    test('should have reasonable detection settings', () => {
      const defaults = getDefaultSettings();

      expect(defaults.detection.fps).toBeGreaterThan(0);
      expect(defaults.detection.fps).toBeLessThanOrEqual(30);
      expect(defaults.detection.confidenceThreshold).toBeGreaterThan(0);
      expect(defaults.detection.confidenceThreshold).toBeLessThanOrEqual(1);
    });
  });
});
