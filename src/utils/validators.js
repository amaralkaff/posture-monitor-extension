/**
 * Validation utilities for settings and data
 */

/**
 * Validate settings object
 * @param {Object} settings - Settings to validate
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
export function validateSettings(settings) {
  const errors = [];
  
  if (!settings || typeof settings !== 'object') {
    return { valid: false, errors: ['Settings must be an object'] };
  }
  
  // Validate sensitivity
  if (settings.sensitivity) {
    const validSensitivities = ['low', 'medium', 'high'];
    if (!validSensitivities.includes(settings.sensitivity)) {
      errors.push(`Invalid sensitivity: must be one of ${validSensitivities.join(', ')}`);
    }
  }
  
  // Validate thresholds
  if (settings.thresholds) {
    const { headForwardAngle, shoulderAsymmetry, poorPostureDuration } = settings.thresholds;
    
    if (headForwardAngle !== undefined) {
      if (typeof headForwardAngle !== 'number' || headForwardAngle < 0 || headForwardAngle > 90) {
        errors.push('headForwardAngle must be a number between 0 and 90');
      }
    }
    
    if (shoulderAsymmetry !== undefined) {
      if (typeof shoulderAsymmetry !== 'number' || shoulderAsymmetry < 0 || shoulderAsymmetry > 90) {
        errors.push('shoulderAsymmetry must be a number between 0 and 90');
      }
    }
    
    if (poorPostureDuration !== undefined) {
      if (typeof poorPostureDuration !== 'number' || poorPostureDuration < 1 || poorPostureDuration > 600) {
        errors.push('poorPostureDuration must be a number between 1 and 600 seconds');
      }
    }
  }
  
  // Validate alerts
  if (settings.alerts) {
    const { enabled, cooldown, sound } = settings.alerts;
    
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      errors.push('alerts.enabled must be a boolean');
    }
    
    if (cooldown !== undefined) {
      if (typeof cooldown !== 'number' || cooldown < 0 || cooldown > 3600) {
        errors.push('alerts.cooldown must be a number between 0 and 3600 seconds');
      }
    }
    
    if (sound !== undefined && typeof sound !== 'boolean') {
      errors.push('alerts.sound must be a boolean');
    }
  }
  
  // Validate detection settings
  if (settings.detection) {
    const { fps, confidenceThreshold } = settings.detection;
    
    if (fps !== undefined) {
      if (typeof fps !== 'number' || fps < 1 || fps > 30) {
        errors.push('detection.fps must be a number between 1 and 30');
      }
    }
    
    if (confidenceThreshold !== undefined) {
      if (typeof confidenceThreshold !== 'number' || confidenceThreshold < 0 || confidenceThreshold > 1) {
        errors.push('detection.confidenceThreshold must be a number between 0 and 1');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate pose data from detection
 * @param {Object} poseData - Pose data to validate
 * @returns {boolean} Whether pose data is valid
 */
export function validatePoseData(poseData) {
  if (!poseData || typeof poseData !== 'object') {
    return false;
  }
  
  if (!Array.isArray(poseData.keypoints)) {
    return false;
  }
  
  // Check for required keypoints
  const requiredParts = ['nose', 'leftShoulder', 'rightShoulder'];
  const parts = poseData.keypoints.map(kp => kp.part);
  
  for (const required of requiredParts) {
    if (!parts.includes(required)) {
      return false;
    }
  }
  
  // Validate keypoint structure
  for (const keypoint of poseData.keypoints) {
    if (!keypoint.part || !keypoint.position || typeof keypoint.score !== 'number') {
      return false;
    }
    
    if (typeof keypoint.position.x !== 'number' || typeof keypoint.position.y !== 'number') {
      return false;
    }
    
    if (keypoint.score < 0 || keypoint.score > 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Sanitize settings object
 * @param {Object} settings - Settings to sanitize
 * @returns {Object} Sanitized settings
 */
export function sanitizeSettings(settings) {
  const sanitized = {};
  
  if (settings.sensitivity) {
    sanitized.sensitivity = ['low', 'medium', 'high'].includes(settings.sensitivity) 
      ? settings.sensitivity 
      : 'medium';
  }
  
  if (settings.thresholds) {
    sanitized.thresholds = {
      headForwardAngle: clampNumber(settings.thresholds.headForwardAngle, 0, 90, 15),
      shoulderAsymmetry: clampNumber(settings.thresholds.shoulderAsymmetry, 0, 90, 10),
      poorPostureDuration: clampNumber(settings.thresholds.poorPostureDuration, 1, 600, 30)
    };
  }
  
  if (settings.alerts) {
    sanitized.alerts = {
      enabled: Boolean(settings.alerts.enabled ?? true),
      cooldown: clampNumber(settings.alerts.cooldown, 0, 3600, 300),
      sound: Boolean(settings.alerts.sound ?? false)
    };
  }
  
  if (settings.detection) {
    sanitized.detection = {
      fps: clampNumber(settings.detection.fps, 1, 30, 5),
      confidenceThreshold: clampNumber(settings.detection.confidenceThreshold, 0, 1, 0.5)
    };
  }
  
  return sanitized;
}

/**
 * Clamp number to range with default
 * @param {*} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} defaultValue - Default if invalid
 * @returns {number} Clamped value
 */
function clampNumber(value, min, max, defaultValue) {
  if (typeof value !== 'number' || isNaN(value)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Get default settings
 * @returns {Object} Default settings object
 */
export function getDefaultSettings() {
  return {
    sensitivity: 'medium',
    thresholds: {
      headForwardAngle: 15,
      shoulderAsymmetry: 10,
      poorPostureDuration: 30
    },
    alerts: {
      enabled: true,
      cooldown: 300,
      sound: false
    },
    detection: {
      fps: 5,
      confidenceThreshold: 0.5
    },
    calibration: null
  };
}
