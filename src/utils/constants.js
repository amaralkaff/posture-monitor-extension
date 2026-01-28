/**
 * Application-wide constants
 */

// Posture classification
export const PostureStatus = Object.freeze({
  GOOD: 'good',
  WARNING: 'warning',
  POOR: 'poor',
  UNKNOWN: 'unknown'
});

// Detection states
export const DetectionState = Object.freeze({
  IDLE: 'idle',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  ERROR: 'error'
});

// Message types for worker communication
export const MessageType = Object.freeze({
  // Main -> Worker
  INIT: 'init',
  START_DETECTION: 'start_detection',
  STOP_DETECTION: 'stop_detection',
  UPDATE_SETTINGS: 'update_settings',
  PROCESS_FRAME: 'process_frame',
  
  // Worker -> Main
  READY: 'ready',
  POSE_RESULT: 'pose_result',
  ERROR: 'error',
  STATUS: 'status'
});

// Storage keys
export const StorageKeys = Object.freeze({
  SETTINGS: 'settings',
  STATISTICS: 'statistics',
  CALIBRATION: 'calibration',
  LAST_ALERT: 'lastAlert',
  SESSION_DATA: 'sessionData'
});

// Sensitivity multipliers (higher = more strict)
export const SensitivityMultipliers = Object.freeze({
  low: 0.7,
  medium: 1.0,
  high: 1.5
});

// Score thresholds for posture classification
export const ScoreThresholds = Object.freeze({
  GOOD: 80,
  WARNING: 50,
  POOR: 0
});

// Keypoint parts from PoseNet
export const KeypointParts = Object.freeze({
  NOSE: 'nose',
  LEFT_EYE: 'leftEye',
  RIGHT_EYE: 'rightEye',
  LEFT_EAR: 'leftEar',
  RIGHT_EAR: 'rightEar',
  LEFT_SHOULDER: 'leftShoulder',
  RIGHT_SHOULDER: 'rightShoulder',
  LEFT_ELBOW: 'leftElbow',
  RIGHT_ELBOW: 'rightElbow',
  LEFT_WRIST: 'leftWrist',
  RIGHT_WRIST: 'rightWrist',
  LEFT_HIP: 'leftHip',
  RIGHT_HIP: 'rightHip'
});

// Notification IDs
export const NotificationIds = Object.freeze({
  POOR_POSTURE: 'poor-posture-alert',
  WARNING_POSTURE: 'warning-posture-alert',
  CAMERA_ERROR: 'camera-error',
  PERMISSION_DENIED: 'permission-denied'
});

// Time constants (in milliseconds)
export const Time = Object.freeze({
  SECOND: 1000,
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000
});

// Statistics aggregation periods
export const StatsPeriod = Object.freeze({
  SESSION: 'session',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
});

// Error codes
export const ErrorCode = Object.freeze({
  CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
  CAMERA_NOT_FOUND: 'CAMERA_NOT_FOUND',
  MODEL_LOAD_FAILED: 'MODEL_LOAD_FAILED',
  DETECTION_FAILED: 'DETECTION_FAILED',
  INVALID_SETTINGS: 'INVALID_SETTINGS',
  STORAGE_ERROR: 'STORAGE_ERROR'
});

// Default video constraints
export const VideoConstraints = Object.freeze({
  width: { ideal: 640 },
  height: { ideal: 480 },
  frameRate: { ideal: 30 },
  facingMode: 'user'
});

// PoseNet configuration
export const PoseNetConfig = Object.freeze({
  architecture: 'MobileNetV1',
  outputStride: 16,
  inputResolution: Object.freeze({ width: 257, height: 257 }),
  multiplier: 0.75,
  quantBytes: 2
});

// Maximum history sizes
export const MaxHistory = Object.freeze({
  METRICS: 30,        // 30 data points for smoothing
  STATISTICS: 90,     // 90 days of daily stats
  NOTIFICATIONS: 100  // Last 100 notifications
});

// UI update intervals (milliseconds)
export const UpdateIntervals = Object.freeze({
  POPUP: 500,         // Popup UI refresh
  STATISTICS: 60000   // Statistics calculation
});
