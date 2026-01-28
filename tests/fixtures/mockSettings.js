/**
 * Mock Settings Fixtures
 * Pre-defined settings configurations for testing
 */

export const DEFAULT_SETTINGS = {
  enabled: true,
  alertThreshold: 70,
  checkInterval: 5000,
  soundEnabled: true,
  vibrationEnabled: false,
  notificationEnabled: true,
  sensitivity: 'medium',
  reminderInterval: 1800000, // 30 minutes
  sessionTimeout: 3600000, // 1 hour
  cameraEnabled: true,
  debugMode: false,
};

export const STRICT_SETTINGS = {
  enabled: true,
  alertThreshold: 85, // Very strict - requires near-perfect posture
  checkInterval: 2000, // Check frequently
  soundEnabled: true,
  vibrationEnabled: true,
  notificationEnabled: true,
  sensitivity: 'high',
  reminderInterval: 600000, // 10 minutes
  sessionTimeout: 1800000, // 30 minutes
  cameraEnabled: true,
  debugMode: false,
};

export const LENIENT_SETTINGS = {
  enabled: true,
  alertThreshold: 50, // Lenient - allows more variation
  checkInterval: 10000, // Check less frequently
  soundEnabled: false,
  vibrationEnabled: false,
  notificationEnabled: true,
  sensitivity: 'low',
  reminderInterval: 3600000, // 60 minutes
  sessionTimeout: 7200000, // 2 hours
  cameraEnabled: true,
  debugMode: false,
};

export const DISABLED_SETTINGS = {
  enabled: false,
  alertThreshold: 70,
  checkInterval: 5000,
  soundEnabled: false,
  vibrationEnabled: false,
  notificationEnabled: false,
  sensitivity: 'medium',
  reminderInterval: 1800000,
  sessionTimeout: 3600000,
  cameraEnabled: false,
  debugMode: false,
};

export const DEBUG_SETTINGS = {
  enabled: true,
  alertThreshold: 70,
  checkInterval: 1000, // Very frequent for debugging
  soundEnabled: true,
  vibrationEnabled: true,
  notificationEnabled: true,
  sensitivity: 'medium',
  reminderInterval: 300000, // 5 minutes
  sessionTimeout: 600000, // 10 minutes
  cameraEnabled: true,
  debugMode: true,
};

export const MINIMAL_ALERTS_SETTINGS = {
  enabled: true,
  alertThreshold: 70,
  checkInterval: 5000,
  soundEnabled: false, // No sound
  vibrationEnabled: false, // No vibration
  notificationEnabled: false, // No notifications
  sensitivity: 'medium',
  reminderInterval: 1800000,
  sessionTimeout: 3600000,
  cameraEnabled: true,
  debugMode: false,
};

/**
 * Get a copy of settings with overrides
 * @param {string} preset - Name of preset ('default', 'strict', 'lenient', etc.)
 * @param {Object} overrides - Properties to override
 * @returns {Object} Settings object
 */
export function getSettings(preset = 'default', overrides = {}) {
  const presets = {
    default: DEFAULT_SETTINGS,
    strict: STRICT_SETTINGS,
    lenient: LENIENT_SETTINGS,
    disabled: DISABLED_SETTINGS,
    debug: DEBUG_SETTINGS,
    minimal: MINIMAL_ALERTS_SETTINGS,
  };

  const base = presets[preset] || DEFAULT_SETTINGS;
  return { ...base, ...overrides };
}
