/**
 * Mathematical utility functions for pose analysis
 */

/**
 * Calculate angle in degrees between two points relative to vertical
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @returns {number} Angle in degrees
 */
export function calculateAngle(point1, point2) {
  if (!point1 || !point2) return 0;
  
  const deltaX = point2.x - point1.x;
  const deltaY = point2.y - point1.y;
  
  // Calculate angle from vertical (0 degrees = straight up)
  const angleRad = Math.atan2(deltaX, deltaY);
  const angleDeg = Math.abs(angleRad * (180 / Math.PI));
  
  return angleDeg;
}

/**
 * Calculate Euclidean distance between two points
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @returns {number} Distance
 */
export function calculateDistance(point1, point2) {
  if (!point1 || !point2) return 0;
  
  const deltaX = point2.x - point1.x;
  const deltaY = point2.y - point1.y;
  
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

/**
 * Normalize a value to 0-1 range
 * @param {number} value - Value to normalize
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Normalized value (0-1), clamped
 */
export function normalizeValue(value, min, max) {
  if (max === min) return 0;
  
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Calculate simple moving average
 * @param {Array<number>} values - Array of values
 * @param {number} windowSize - Window size for averaging
 * @returns {number} Moving average
 */
export function movingAverage(values, windowSize) {
  if (!values || values.length === 0) return 0;
  
  const window = values.slice(-windowSize);
  const sum = window.reduce((acc, val) => acc + val, 0);
  
  return sum / window.length;
}

/**
 * Calculate median of array
 * @param {Array<number>} values - Array of values
 * @returns {number} Median value
 */
export function median(values) {
  if (!values || values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  return sorted[mid];
}

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, t) {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Calculate standard deviation
 * @param {Array<number>} values - Array of values
 * @returns {number} Standard deviation
 */
export function standardDeviation(values) {
  if (!values || values.length === 0) return 0;
  
  const avg = values.reduce((acc, val) => acc + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Smooth value using exponential moving average
 * @param {number} newValue - New value
 * @param {number} oldValue - Previous smoothed value
 * @param {number} alpha - Smoothing factor (0-1, higher = less smoothing)
 * @returns {number} Smoothed value
 */
export function exponentialSmoothing(newValue, oldValue, alpha = 0.3) {
  return alpha * newValue + (1 - alpha) * oldValue;
}
