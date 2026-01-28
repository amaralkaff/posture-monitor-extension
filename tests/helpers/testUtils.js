/**
 * Test Utilities
 * Helper functions for testing
 */

/**
 * Wait for a condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {number} timeout - Max wait time in ms
 * @param {number} interval - Check interval in ms
 */
export async function waitFor(condition, timeout = 1000, interval = 50) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for condition');
}

/**
 * Create a mock pose landmark
 * @param {number} x - X coordinate (0-1)
 * @param {number} y - Y coordinate (0-1)
 * @param {number} z - Z coordinate
 * @param {number} visibility - Visibility score (0-1)
 */
export function createLandmark(x, y, z = 0, visibility = 1) {
  return { x, y, z, visibility };
}

/**
 * Create a complete mock pose result
 * @param {Object} overrides - Override specific landmarks
 */
export function createMockPose(overrides = {}) {
  const defaultPose = {
    poseLandmarks: [
      createLandmark(0.5, 0.3), // 0: nose
      createLandmark(0.48, 0.32), // 1: left eye inner
      createLandmark(0.47, 0.31), // 2: left eye
      createLandmark(0.46, 0.31), // 3: left eye outer
      createLandmark(0.52, 0.32), // 4: right eye inner
      createLandmark(0.53, 0.31), // 5: right eye
      createLandmark(0.54, 0.31), // 6: right eye outer
      createLandmark(0.45, 0.34), // 7: left ear
      createLandmark(0.55, 0.34), // 8: right ear
      createLandmark(0.48, 0.38), // 9: mouth left
      createLandmark(0.52, 0.38), // 10: mouth right
      createLandmark(0.4, 0.5), // 11: left shoulder
      createLandmark(0.6, 0.5), // 12: right shoulder
      createLandmark(0.38, 0.65), // 13: left elbow
      createLandmark(0.62, 0.65), // 14: right elbow
      createLandmark(0.36, 0.75), // 15: left wrist
      createLandmark(0.64, 0.75), // 16: right wrist
      createLandmark(0.35, 0.78), // 17: left pinky
      createLandmark(0.65, 0.78), // 18: right pinky
      createLandmark(0.34, 0.77), // 19: left index
      createLandmark(0.66, 0.77), // 20: right index
      createLandmark(0.35, 0.79), // 21: left thumb
      createLandmark(0.65, 0.79), // 22: right thumb
      createLandmark(0.42, 0.7), // 23: left hip
      createLandmark(0.58, 0.7), // 24: right hip
      createLandmark(0.41, 0.85), // 25: left knee
      createLandmark(0.59, 0.85), // 26: right knee
      createLandmark(0.4, 0.95), // 27: left ankle
      createLandmark(0.6, 0.95), // 28: right ankle
      createLandmark(0.39, 0.98), // 29: left heel
      createLandmark(0.61, 0.98), // 30: right heel
      createLandmark(0.38, 0.99), // 31: left foot index
      createLandmark(0.62, 0.99), // 32: right foot index
    ],
  };

  // Apply overrides
  if (overrides.poseLandmarks) {
    overrides.poseLandmarks.forEach((landmark, index) => {
      if (landmark) {
        defaultPose.poseLandmarks[index] = { ...defaultPose.poseLandmarks[index], ...landmark };
      }
    });
  }

  return defaultPose;
}

/**
 * Create a mock pose with poor posture
 */
export function createBadPosturePose() {
  return createMockPose({
    poseLandmarks: [
      createLandmark(0.5, 0.2), // 0: nose - forward
      null, // 1
      null, // 2
      null, // 3
      null, // 4
      null, // 5
      null, // 6
      createLandmark(0.42, 0.28), // 7: left ear - forward
      createLandmark(0.52, 0.28), // 8: right ear - forward
      null, // 9
      null, // 10
      createLandmark(0.4, 0.45), // 11: left shoulder - hunched
      createLandmark(0.6, 0.45), // 12: right shoulder - hunched
    ],
  });
}

/**
 * Create a mock pose with good posture
 */
export function createGoodPosturePose() {
  return createMockPose({
    poseLandmarks: [
      createLandmark(0.5, 0.3), // 0: nose - aligned
      null, // 1
      null, // 2
      null, // 3
      null, // 4
      null, // 5
      null, // 6
      createLandmark(0.45, 0.34), // 7: left ear - aligned
      createLandmark(0.55, 0.34), // 8: right ear - aligned
      null, // 9
      null, // 10
      createLandmark(0.4, 0.5), // 11: left shoulder - straight
      createLandmark(0.6, 0.5), // 12: right shoulder - straight
    ],
  });
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
}

/**
 * Flush all pending promises
 */
export function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Create mock settings
 */
export function createMockSettings(overrides = {}) {
  return {
    enabled: true,
    alertThreshold: 70,
    checkInterval: 5000,
    soundEnabled: true,
    vibrationEnabled: false,
    sensitivity: 'medium',
    ...overrides,
  };
}
