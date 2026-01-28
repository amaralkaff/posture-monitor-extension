/**
 * Mock Pose Data Fixtures
 * Pre-defined pose data for testing
 */

export const GOOD_POSTURE_POSE = {
  poseLandmarks: [
    { x: 0.5, y: 0.3, z: 0, visibility: 0.99 }, // 0: nose
    { x: 0.48, y: 0.32, z: -0.01, visibility: 0.98 }, // 1: left eye inner
    { x: 0.47, y: 0.31, z: -0.01, visibility: 0.98 }, // 2: left eye
    { x: 0.46, y: 0.31, z: -0.01, visibility: 0.97 }, // 3: left eye outer
    { x: 0.52, y: 0.32, z: -0.01, visibility: 0.98 }, // 4: right eye inner
    { x: 0.53, y: 0.31, z: -0.01, visibility: 0.98 }, // 5: right eye
    { x: 0.54, y: 0.31, z: -0.01, visibility: 0.97 }, // 6: right eye outer
    { x: 0.45, y: 0.34, z: -0.02, visibility: 0.95 }, // 7: left ear
    { x: 0.55, y: 0.34, z: -0.02, visibility: 0.95 }, // 8: right ear
    { x: 0.48, y: 0.38, z: 0.01, visibility: 0.92 }, // 9: mouth left
    { x: 0.52, y: 0.38, z: 0.01, visibility: 0.92 }, // 10: mouth right
    { x: 0.4, y: 0.5, z: 0, visibility: 0.99 }, // 11: left shoulder
    { x: 0.6, y: 0.5, z: 0, visibility: 0.99 }, // 12: right shoulder
    { x: 0.38, y: 0.65, z: 0.05, visibility: 0.96 }, // 13: left elbow
    { x: 0.62, y: 0.65, z: 0.05, visibility: 0.96 }, // 14: right elbow
    { x: 0.36, y: 0.75, z: 0.1, visibility: 0.94 }, // 15: left wrist
    { x: 0.64, y: 0.75, z: 0.1, visibility: 0.94 }, // 16: right wrist
    { x: 0.35, y: 0.78, z: 0.12, visibility: 0.90 }, // 17: left pinky
    { x: 0.65, y: 0.78, z: 0.12, visibility: 0.90 }, // 18: right pinky
    { x: 0.34, y: 0.77, z: 0.12, visibility: 0.91 }, // 19: left index
    { x: 0.66, y: 0.77, z: 0.12, visibility: 0.91 }, // 20: right index
    { x: 0.35, y: 0.79, z: 0.12, visibility: 0.89 }, // 21: left thumb
    { x: 0.65, y: 0.79, z: 0.12, visibility: 0.89 }, // 22: right thumb
    { x: 0.42, y: 0.7, z: 0, visibility: 0.98 }, // 23: left hip
    { x: 0.58, y: 0.7, z: 0, visibility: 0.98 }, // 24: right hip
    { x: 0.41, y: 0.85, z: 0.02, visibility: 0.97 }, // 25: left knee
    { x: 0.59, y: 0.85, z: 0.02, visibility: 0.97 }, // 26: right knee
    { x: 0.4, y: 0.95, z: 0.05, visibility: 0.95 }, // 27: left ankle
    { x: 0.6, y: 0.95, z: 0.05, visibility: 0.95 }, // 28: right ankle
    { x: 0.39, y: 0.98, z: 0.06, visibility: 0.93 }, // 29: left heel
    { x: 0.61, y: 0.98, z: 0.06, visibility: 0.93 }, // 30: right heel
    { x: 0.38, y: 0.99, z: 0.07, visibility: 0.91 }, // 31: left foot index
    { x: 0.62, y: 0.99, z: 0.07, visibility: 0.91 }, // 32: right foot index
  ],
};

export const BAD_POSTURE_FORWARD_HEAD = {
  poseLandmarks: [
    { x: 0.65, y: 0.28, z: 0.15, visibility: 0.99 }, // 0: nose - VERY forward (right)
    { x: 0.63, y: 0.30, z: 0.14, visibility: 0.98 },
    { x: 0.62, y: 0.29, z: 0.14, visibility: 0.98 },
    { x: 0.61, y: 0.29, z: 0.14, visibility: 0.97 },
    { x: 0.67, y: 0.30, z: 0.14, visibility: 0.98 },
    { x: 0.68, y: 0.29, z: 0.14, visibility: 0.98 },
    { x: 0.69, y: 0.29, z: 0.14, visibility: 0.97 },
    { x: 0.59, y: 0.33, z: 0.12, visibility: 0.95 }, // 7: left ear - forward
    { x: 0.69, y: 0.33, z: 0.12, visibility: 0.95 }, // 8: right ear - forward
    { x: 0.63, y: 0.35, z: 0.16, visibility: 0.92 },
    { x: 0.67, y: 0.35, z: 0.16, visibility: 0.92 },
    { x: 0.4, y: 0.50, z: 0, visibility: 0.99 }, // 11: left shoulder - back
    { x: 0.6, y: 0.50, z: 0, visibility: 0.99 }, // 12: right shoulder - back
    { x: 0.38, y: 0.65, z: 0.05, visibility: 0.96 },
    { x: 0.62, y: 0.65, z: 0.05, visibility: 0.96 },
    { x: 0.36, y: 0.75, z: 0.1, visibility: 0.94 },
    { x: 0.64, y: 0.75, z: 0.1, visibility: 0.94 },
    { x: 0.35, y: 0.78, z: 0.12, visibility: 0.90 },
    { x: 0.65, y: 0.78, z: 0.12, visibility: 0.90 },
    { x: 0.34, y: 0.77, z: 0.12, visibility: 0.91 },
    { x: 0.66, y: 0.77, z: 0.12, visibility: 0.91 },
    { x: 0.35, y: 0.79, z: 0.12, visibility: 0.89 },
    { x: 0.65, y: 0.79, z: 0.12, visibility: 0.89 },
    { x: 0.42, y: 0.7, z: 0, visibility: 0.98 },
    { x: 0.58, y: 0.7, z: 0, visibility: 0.98 },
    { x: 0.41, y: 0.85, z: 0.02, visibility: 0.97 },
    { x: 0.59, y: 0.85, z: 0.02, visibility: 0.97 },
    { x: 0.4, y: 0.95, z: 0.05, visibility: 0.95 },
    { x: 0.6, y: 0.95, z: 0.05, visibility: 0.95 },
    { x: 0.39, y: 0.98, z: 0.06, visibility: 0.93 },
    { x: 0.61, y: 0.98, z: 0.06, visibility: 0.93 },
    { x: 0.38, y: 0.99, z: 0.07, visibility: 0.91 },
    { x: 0.62, y: 0.99, z: 0.07, visibility: 0.91 },
  ],
};

export const BAD_POSTURE_SLOUCHED = {
  poseLandmarks: [
    { x: 0.52, y: 0.32, z: 0.05, visibility: 0.99 }, // Nose slightly forward
    { x: 0.50, y: 0.34, z: 0.04, visibility: 0.98 },
    { x: 0.49, y: 0.33, z: 0.04, visibility: 0.98 },
    { x: 0.48, y: 0.33, z: 0.04, visibility: 0.97 },
    { x: 0.54, y: 0.34, z: 0.04, visibility: 0.98 },
    { x: 0.55, y: 0.33, z: 0.04, visibility: 0.98 },
    { x: 0.56, y: 0.33, z: 0.04, visibility: 0.97 },
    { x: 0.47, y: 0.36, z: 0.03, visibility: 0.95 },
    { x: 0.57, y: 0.36, z: 0.03, visibility: 0.95 },
    { x: 0.50, y: 0.40, z: 0.06, visibility: 0.92 },
    { x: 0.54, y: 0.40, z: 0.06, visibility: 0.92 },
    { x: 0.40, y: 0.50, z: 0.08, visibility: 0.99 }, // 11: left shoulder
    { x: 0.60, y: 0.53, z: 0.08, visibility: 0.99 }, // 12: right shoulder - uneven (slouched)
    { x: 0.40, y: 0.67, z: 0.10, visibility: 0.96 },
    { x: 0.60, y: 0.67, z: 0.10, visibility: 0.96 },
    { x: 0.38, y: 0.77, z: 0.12, visibility: 0.94 },
    { x: 0.62, y: 0.77, z: 0.12, visibility: 0.94 },
    { x: 0.37, y: 0.80, z: 0.14, visibility: 0.90 },
    { x: 0.63, y: 0.80, z: 0.14, visibility: 0.90 },
    { x: 0.36, y: 0.79, z: 0.14, visibility: 0.91 },
    { x: 0.64, y: 0.79, z: 0.14, visibility: 0.91 },
    { x: 0.37, y: 0.81, z: 0.14, visibility: 0.89 },
    { x: 0.63, y: 0.81, z: 0.14, visibility: 0.89 },
    { x: 0.44, y: 0.72, z: 0.05, visibility: 0.98 },
    { x: 0.56, y: 0.72, z: 0.05, visibility: 0.98 },
    { x: 0.43, y: 0.87, z: 0.03, visibility: 0.97 },
    { x: 0.57, y: 0.87, z: 0.03, visibility: 0.97 },
    { x: 0.42, y: 0.96, z: 0.02, visibility: 0.95 },
    { x: 0.58, y: 0.96, z: 0.02, visibility: 0.95 },
    { x: 0.41, y: 0.98, z: 0.01, visibility: 0.93 },
    { x: 0.59, y: 0.98, z: 0.01, visibility: 0.93 },
    { x: 0.40, y: 0.99, z: 0.01, visibility: 0.91 },
    { x: 0.60, y: 0.99, z: 0.01, visibility: 0.91 },
  ],
};

export const BAD_POSTURE_UNEVEN_SHOULDERS = {
  poseLandmarks: [
    { x: 0.5, y: 0.3, z: 0, visibility: 0.99 },
    { x: 0.48, y: 0.32, z: -0.01, visibility: 0.98 },
    { x: 0.47, y: 0.31, z: -0.01, visibility: 0.98 },
    { x: 0.46, y: 0.31, z: -0.01, visibility: 0.97 },
    { x: 0.52, y: 0.32, z: -0.01, visibility: 0.98 },
    { x: 0.53, y: 0.31, z: -0.01, visibility: 0.98 },
    { x: 0.54, y: 0.31, z: -0.01, visibility: 0.97 },
    { x: 0.45, y: 0.34, z: -0.02, visibility: 0.95 },
    { x: 0.55, y: 0.34, z: -0.02, visibility: 0.95 },
    { x: 0.48, y: 0.38, z: 0.01, visibility: 0.92 },
    { x: 0.52, y: 0.38, z: 0.01, visibility: 0.92 },
    { x: 0.4, y: 0.46, z: 0, visibility: 0.99 }, // 11: left shoulder lower
    { x: 0.6, y: 0.52, z: 0, visibility: 0.99 }, // 12: right shoulder higher (uneven)
    { x: 0.38, y: 0.62, z: 0.05, visibility: 0.96 },
    { x: 0.62, y: 0.68, z: 0.05, visibility: 0.96 },
    { x: 0.36, y: 0.72, z: 0.1, visibility: 0.94 },
    { x: 0.64, y: 0.78, z: 0.1, visibility: 0.94 },
    { x: 0.35, y: 0.75, z: 0.12, visibility: 0.90 },
    { x: 0.65, y: 0.81, z: 0.12, visibility: 0.90 },
    { x: 0.34, y: 0.74, z: 0.12, visibility: 0.91 },
    { x: 0.66, y: 0.80, z: 0.12, visibility: 0.91 },
    { x: 0.35, y: 0.76, z: 0.12, visibility: 0.89 },
    { x: 0.65, y: 0.82, z: 0.12, visibility: 0.89 },
    { x: 0.42, y: 0.7, z: 0, visibility: 0.98 },
    { x: 0.58, y: 0.7, z: 0, visibility: 0.98 },
    { x: 0.41, y: 0.85, z: 0.02, visibility: 0.97 },
    { x: 0.59, y: 0.85, z: 0.02, visibility: 0.97 },
    { x: 0.4, y: 0.95, z: 0.05, visibility: 0.95 },
    { x: 0.6, y: 0.95, z: 0.05, visibility: 0.95 },
    { x: 0.39, y: 0.98, z: 0.06, visibility: 0.93 },
    { x: 0.61, y: 0.98, z: 0.06, visibility: 0.93 },
    { x: 0.38, y: 0.99, z: 0.07, visibility: 0.91 },
    { x: 0.62, y: 0.99, z: 0.07, visibility: 0.91 },
  ],
};

export const LOW_VISIBILITY_POSE = {
  poseLandmarks: [
    { x: 0.5, y: 0.3, z: 0, visibility: 0.3 }, // Low visibility
    { x: 0.48, y: 0.32, z: -0.01, visibility: 0.2 },
    { x: 0.47, y: 0.31, z: -0.01, visibility: 0.2 },
    { x: 0.46, y: 0.31, z: -0.01, visibility: 0.1 },
    { x: 0.52, y: 0.32, z: -0.01, visibility: 0.2 },
    { x: 0.53, y: 0.31, z: -0.01, visibility: 0.2 },
    { x: 0.54, y: 0.31, z: -0.01, visibility: 0.1 },
    { x: 0.45, y: 0.34, z: -0.02, visibility: 0.3 },
    { x: 0.55, y: 0.34, z: -0.02, visibility: 0.3 },
    { x: 0.48, y: 0.38, z: 0.01, visibility: 0.15 },
    { x: 0.52, y: 0.38, z: 0.01, visibility: 0.15 },
    { x: 0.4, y: 0.5, z: 0, visibility: 0.4 },
    { x: 0.6, y: 0.5, z: 0, visibility: 0.4 },
    ...Array(20).fill({ x: 0, y: 0, z: 0, visibility: 0.1 }),
  ],
};
