/**
 * Unit Tests for mathUtils.js
 */

import { describe, test, expect } from '@jest/globals';
import {
  calculateAngle,
  calculateDistance,
  normalizeValue,
  movingAverage,
  median,
  clamp,
  lerp,
  standardDeviation,
  exponentialSmoothing,
} from '../../src/utils/mathUtils.js';

describe('mathUtils', () => {
  describe('calculateAngle', () => {
    test('should calculate angle between two points', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 1, y: 1 };
      const angle = calculateAngle(point1, point2);
      expect(angle).toBeCloseTo(45, 1);
    });

    test('should return 0 for vertical alignment', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 0, y: 1 };
      const angle = calculateAngle(point1, point2);
      expect(angle).toBe(0);
    });

    test('should return 90 for horizontal alignment', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 1, y: 0 };
      const angle = calculateAngle(point1, point2);
      expect(angle).toBe(90);
    });

    test('should handle null points', () => {
      expect(calculateAngle(null, { x: 1, y: 1 })).toBe(0);
      expect(calculateAngle({ x: 1, y: 1 }, null)).toBe(0);
      expect(calculateAngle(null, null)).toBe(0);
    });

    test('should handle negative coordinates', () => {
      const point1 = { x: -1, y: -1 };
      const point2 = { x: 1, y: 1 };
      const angle = calculateAngle(point1, point2);
      expect(angle).toBeCloseTo(45, 1);
    });
  });

  describe('calculateDistance', () => {
    test('should calculate Euclidean distance', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 3, y: 4 };
      expect(calculateDistance(point1, point2)).toBe(5);
    });

    test('should return 0 for same points', () => {
      const point = { x: 5, y: 5 };
      expect(calculateDistance(point, point)).toBe(0);
    });

    test('should handle null points', () => {
      expect(calculateDistance(null, { x: 1, y: 1 })).toBe(0);
      expect(calculateDistance({ x: 1, y: 1 }, null)).toBe(0);
    });

    test('should handle decimal coordinates', () => {
      const point1 = { x: 0.5, y: 0.5 };
      const point2 = { x: 1.5, y: 1.5 };
      expect(calculateDistance(point1, point2)).toBeCloseTo(1.414, 2);
    });
  });

  describe('normalizeValue', () => {
    test('should normalize value to 0-1 range', () => {
      expect(normalizeValue(50, 0, 100)).toBe(0.5);
      expect(normalizeValue(0, 0, 100)).toBe(0);
      expect(normalizeValue(100, 0, 100)).toBe(1);
    });

    test('should clamp values outside range', () => {
      expect(normalizeValue(-10, 0, 100)).toBe(0);
      expect(normalizeValue(150, 0, 100)).toBe(1);
    });

    test('should handle min === max', () => {
      expect(normalizeValue(50, 50, 50)).toBe(0);
    });

    test('should handle negative ranges', () => {
      expect(normalizeValue(0, -100, 100)).toBe(0.5);
      expect(normalizeValue(-50, -100, 0)).toBe(0.5);
    });
  });

  describe('movingAverage', () => {
    test('should calculate simple moving average', () => {
      const values = [1, 2, 3, 4, 5];
      expect(movingAverage(values, 3)).toBe(4); // (3+4+5)/3
    });

    test('should handle window larger than array', () => {
      const values = [1, 2, 3];
      expect(movingAverage(values, 10)).toBe(2); // (1+2+3)/3
    });

    test('should handle empty array', () => {
      expect(movingAverage([], 3)).toBe(0);
      expect(movingAverage(null, 3)).toBe(0);
    });

    test('should handle window size 1', () => {
      const values = [5, 10, 15];
      expect(movingAverage(values, 1)).toBe(15);
    });

    test('should handle decimal values', () => {
      const values = [1.5, 2.5, 3.5];
      expect(movingAverage(values, 2)).toBe(3);
    });
  });

  describe('median', () => {
    test('should calculate median for odd-length array', () => {
      expect(median([1, 2, 3, 4, 5])).toBe(3);
    });

    test('should calculate median for even-length array', () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
    });

    test('should handle unsorted arrays', () => {
      expect(median([5, 1, 3, 2, 4])).toBe(3);
    });

    test('should handle single element', () => {
      expect(median([42])).toBe(42);
    });

    test('should handle empty array', () => {
      expect(median([])).toBe(0);
      expect(median(null)).toBe(0);
    });

    test('should handle negative values', () => {
      expect(median([-5, -1, 0, 3, 10])).toBe(0);
    });
  });

  describe('clamp', () => {
    test('should clamp value within range', () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });

    test('should clamp to minimum', () => {
      expect(clamp(-10, 0, 100)).toBe(0);
    });

    test('should clamp to maximum', () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    test('should handle negative ranges', () => {
      expect(clamp(-150, -100, -50)).toBe(-100);
      expect(clamp(-25, -100, -50)).toBe(-50);
    });

    test('should handle decimal values', () => {
      expect(clamp(0.75, 0, 1)).toBe(0.75);
      expect(clamp(1.5, 0, 1)).toBe(1);
    });
  });

  describe('lerp', () => {
    test('should interpolate between values', () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
      expect(lerp(0, 100, 0)).toBe(0);
      expect(lerp(0, 100, 1)).toBe(100);
    });

    test('should clamp t to 0-1 range', () => {
      expect(lerp(0, 100, -0.5)).toBe(0);
      expect(lerp(0, 100, 1.5)).toBe(100);
    });

    test('should handle negative ranges', () => {
      expect(lerp(-100, 100, 0.5)).toBe(0);
    });

    test('should handle decimal values', () => {
      expect(lerp(0, 1, 0.25)).toBe(0.25);
    });
  });

  describe('standardDeviation', () => {
    test('should calculate standard deviation', () => {
      const values = [2, 4, 4, 4, 5, 5, 7, 9];
      const stdDev = standardDeviation(values);
      expect(stdDev).toBeCloseTo(2, 1);
    });

    test('should return 0 for identical values', () => {
      expect(standardDeviation([5, 5, 5, 5])).toBe(0);
    });

    test('should handle single value', () => {
      expect(standardDeviation([42])).toBe(0);
    });

    test('should handle empty array', () => {
      expect(standardDeviation([])).toBe(0);
      expect(standardDeviation(null)).toBe(0);
    });

    test('should handle negative values', () => {
      const values = [-2, -1, 0, 1, 2];
      expect(standardDeviation(values)).toBeGreaterThan(0);
    });
  });

  describe('exponentialSmoothing', () => {
    test('should smooth values with default alpha', () => {
      const smoothed = exponentialSmoothing(100, 50);
      expect(smoothed).toBeCloseTo(65, 1); // 0.3*100 + 0.7*50
    });

    test('should use custom alpha', () => {
      const smoothed = exponentialSmoothing(100, 50, 0.5);
      expect(smoothed).toBe(75); // 0.5*100 + 0.5*50
    });

    test('should heavily weight new value with alpha=1', () => {
      const smoothed = exponentialSmoothing(100, 50, 1);
      expect(smoothed).toBe(100);
    });

    test('should heavily weight old value with alpha=0', () => {
      const smoothed = exponentialSmoothing(100, 50, 0);
      expect(smoothed).toBe(50);
    });

    test('should handle negative values', () => {
      const smoothed = exponentialSmoothing(-10, 10, 0.5);
      expect(smoothed).toBe(0);
    });

    test('should handle decimal values', () => {
      const smoothed = exponentialSmoothing(1.5, 2.5, 0.3);
      expect(smoothed).toBeCloseTo(2.2, 1);
    });
  });
});
