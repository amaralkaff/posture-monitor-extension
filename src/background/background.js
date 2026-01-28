/**
 * Background script - coordinates detection, alerts, and storage
 */

import { StorageKeys, PostureStatus, NotificationIds, Time } from '../utils/constants.js';
import { getDefaultSettings, validateSettings } from '../utils/validators.js';

// State
let detectionWindow = null;
let currentSettings = null;
let lastAlertTime = 0;
let poorPostureStartTime = null;
let sessionStats = {
  startTime: null,
  totalTime: 0,
  goodPostureTime: 0,
  warningPostureTime: 0,
  poorPostureTime: 0,
  alertCount: 0,
  lastStatus: PostureStatus.UNKNOWN
};

/**
 * Initialize extension
 */
async function initialize() {
  console.log('Posture Monitor: Initializing...');
  
  // Load settings
  currentSettings = await loadSettings();
  
  // Set up listeners
  setupListeners();
  
  console.log('Posture Monitor: Ready');
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const result = await browser.storage.local.get(StorageKeys.SETTINGS);
    
    if (result[StorageKeys.SETTINGS]) {
      // Validate and merge with defaults
      const stored = result[StorageKeys.SETTINGS];
      const defaults = getDefaultSettings();
      return { ...defaults, ...stored };
    }
    
    // Return defaults if no settings found
    const defaults = getDefaultSettings();
    await saveSettings(defaults);
    return defaults;
    
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Save settings to storage
 */
async function saveSettings(settings) {
  try {
    const validation = validateSettings(settings);
    
    if (!validation.valid) {
      console.error('Invalid settings:', validation.errors);
      return false;
    }
    
    await browser.storage.local.set({
      [StorageKeys.SETTINGS]: settings
    });
    
    currentSettings = settings;
    return true;
    
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

/**
 * Set up message listeners
 */
function setupListeners() {
  // Listen for messages from popup/options pages
  browser.runtime.onMessage.addListener(handleMessage);
  
  // Listen for notification clicks
  browser.notifications.onClicked.addListener(handleNotificationClick);
  
  // Clean up on browser close
  browser.runtime.onSuspend.addListener(cleanup);
}

/**
 * Handle messages from other parts of extension
 */
async function handleMessage(message, sender, sendResponse) {
  const { type, data } = message;
  
  switch (type) {
    case 'start_monitoring':
      return await startMonitoring();
      
    case 'stop_monitoring':
      return await stopMonitoring();
      
    case 'get_status':
      return getStatus();
      
    case 'get_settings':
      return currentSettings;
      
    case 'update_settings':
      return await updateSettings(data);
      
    case 'get_statistics':
      return await getStatistics();
      
    case 'posture_update':
      return handlePostureUpdate(data);
      
    case 'snooze_alerts':
      return snoozeAlerts(data.duration);
      
    default:
      console.warn('Unknown message type:', type);
      return { error: 'Unknown message type' };
  }
}

/**
 * Start posture monitoring
 */
async function startMonitoring() {
  try {
    if (detectionWindow) {
      console.log('Monitoring already active');
      return { success: false, error: 'Already monitoring' };
    }
    
    // Reset session stats
    sessionStats = {
      startTime: Date.now(),
      totalTime: 0,
      goodPostureTime: 0,
      warningPostureTime: 0,
      poorPostureTime: 0,
      alertCount: 0,
      lastStatus: PostureStatus.UNKNOWN
    };
    
    poorPostureStartTime = null;
    
    // Create detection window (hidden)
    const window = await browser.windows.create({
      url: browser.runtime.getURL('src/detection/detection.html'),
      type: 'popup',
      width: 1,
      height: 1,
      left: -1000,
      top: -1000
    });
    
    detectionWindow = window;
    
    console.log('Monitoring started');
    return { success: true };
    
  } catch (error) {
    console.error('Error starting monitoring:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Stop posture monitoring
 */
async function stopMonitoring() {
  try {
    if (detectionWindow) {
      await browser.windows.remove(detectionWindow.id);
      detectionWindow = null;
    }
    
    // Save session statistics
    await saveSessionStatistics();
    
    console.log('Monitoring stopped');
    return { success: true };
    
  } catch (error) {
    console.error('Error stopping monitoring:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current monitoring status
 */
function getStatus() {
  return {
    isMonitoring: detectionWindow !== null,
    currentSettings,
    sessionStats,
    lastAlertTime
  };
}

/**
 * Update settings
 */
async function updateSettings(newSettings) {
  const merged = { ...currentSettings, ...newSettings };
  const success = await saveSettings(merged);
  
  if (success && detectionWindow) {
    // Notify detection window of settings change
    const tabs = await browser.tabs.query({ windowId: detectionWindow.id });
    if (tabs.length > 0) {
      browser.tabs.sendMessage(tabs[0].id, {
        type: 'settings_updated',
        data: currentSettings
      });
    }
  }
  
  return { success, settings: currentSettings };
}

/**
 * Handle posture update from detection window
 */
function handlePostureUpdate(postureData) {
  const { status, score, metrics } = postureData;
  const now = Date.now();
  
  // Update session statistics
  if (sessionStats.lastStatus !== PostureStatus.UNKNOWN) {
    const timeSinceLastUpdate = now - (sessionStats.lastUpdateTime || sessionStats.startTime);
    sessionStats.totalTime += timeSinceLastUpdate;
    
    switch (sessionStats.lastStatus) {
      case PostureStatus.GOOD:
        sessionStats.goodPostureTime += timeSinceLastUpdate;
        break;
      case PostureStatus.WARNING:
        sessionStats.warningPostureTime += timeSinceLastUpdate;
        break;
      case PostureStatus.POOR:
        sessionStats.poorPostureTime += timeSinceLastUpdate;
        break;
    }
  }
  
  sessionStats.lastStatus = status;
  sessionStats.lastUpdateTime = now;
  
  // Check if alert needed
  if (status === PostureStatus.POOR) {
    if (!poorPostureStartTime) {
      poorPostureStartTime = now;
    }
    
    const poorPostureDuration = (now - poorPostureStartTime) / Time.SECOND;
    const durationThreshold = currentSettings.thresholds.poorPostureDuration;
    
    if (poorPostureDuration >= durationThreshold) {
      triggerAlert(status, score, metrics);
    }
  } else {
    // Reset poor posture timer if posture improved
    poorPostureStartTime = null;
  }
  
  return { success: true };
}

/**
 * Trigger posture alert
 */
async function triggerAlert(status, score, metrics) {
  if (!currentSettings.alerts.enabled) {
    return;
  }
  
  const now = Date.now();
  const cooldownMs = currentSettings.alerts.cooldown * Time.SECOND;
  
  // Check cooldown
  if (now - lastAlertTime < cooldownMs) {
    return;
  }
  
  lastAlertTime = now;
  sessionStats.alertCount++;
  
  // Determine notification content
  let title, message, iconUrl;
  
  if (status === PostureStatus.POOR) {
    title = '⚠️ Poor Posture Detected';
    message = `Your posture score is ${score}/100. Please adjust your position.`;
    iconUrl = 'assets/icons/icon-poor.png';
  } else if (status === PostureStatus.WARNING) {
    title = '⚡ Posture Warning';
    message = `Your posture score is ${score}/100. Consider improving your position.`;
    iconUrl = 'assets/icons/icon-warning.png';
  }
  
  // Create notification
  try {
    await browser.notifications.create(NotificationIds.POOR_POSTURE, {
      type: 'basic',
      iconUrl: iconUrl || 'assets/icons/icon-96.png',
      title,
      message
    });
    
    // Play sound if enabled
    if (currentSettings.alerts.sound) {
      // Sound playback would happen in detection window
      const tabs = await browser.tabs.query({ windowId: detectionWindow?.id });
      if (tabs.length > 0) {
        browser.tabs.sendMessage(tabs[0].id, {
          type: 'play_alert_sound'
        });
      }
    }
    
    console.log('Alert triggered:', title);
    
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Snooze alerts for specified duration
 */
function snoozeAlerts(durationMinutes = 15) {
  const snoozeMs = durationMinutes * Time.MINUTE;
  lastAlertTime = Date.now() + snoozeMs - (currentSettings.alerts.cooldown * Time.SECOND);
  
  console.log(`Alerts snoozed for ${durationMinutes} minutes`);
  return { success: true, snoozedUntil: Date.now() + snoozeMs };
}

/**
 * Handle notification clicks
 */
function handleNotificationClick(notificationId) {
  if (notificationId === NotificationIds.POOR_POSTURE) {
    // Open popup or focus window
    browser.browserAction.openPopup();
  }
  
  browser.notifications.clear(notificationId);
}

/**
 * Save session statistics
 */
async function saveSessionStatistics() {
  try {
    // Calculate final stats
    const now = Date.now();
    if (sessionStats.lastStatus !== PostureStatus.UNKNOWN) {
      const timeSinceLastUpdate = now - (sessionStats.lastUpdateTime || sessionStats.startTime);
      sessionStats.totalTime += timeSinceLastUpdate;
      
      switch (sessionStats.lastStatus) {
        case PostureStatus.GOOD:
          sessionStats.goodPostureTime += timeSinceLastUpdate;
          break;
        case PostureStatus.WARNING:
          sessionStats.warningPostureTime += timeSinceLastUpdate;
          break;
        case PostureStatus.POOR:
          sessionStats.poorPostureTime += timeSinceLastUpdate;
          break;
      }
    }
    
    // Load existing statistics
    const result = await browser.storage.local.get(StorageKeys.STATISTICS);
    const stats = result[StorageKeys.STATISTICS] || { sessions: [], daily: {} };
    
    // Add session
    stats.sessions.push({
      ...sessionStats,
      endTime: now
    });
    
    // Aggregate to daily stats
    const today = new Date().toISOString().split('T')[0];
    if (!stats.daily[today]) {
      stats.daily[today] = {
        totalTime: 0,
        goodPostureTime: 0,
        warningPostureTime: 0,
        poorPostureTime: 0,
        alertCount: 0,
        sessionCount: 0
      };
    }
    
    stats.daily[today].totalTime += sessionStats.totalTime;
    stats.daily[today].goodPostureTime += sessionStats.goodPostureTime;
    stats.daily[today].warningPostureTime += sessionStats.warningPostureTime;
    stats.daily[today].poorPostureTime += sessionStats.poorPostureTime;
    stats.daily[today].alertCount += sessionStats.alertCount;
    stats.daily[today].sessionCount++;
    
    // Keep only last 100 sessions and 90 days
    stats.sessions = stats.sessions.slice(-100);
    
    const daysToKeep = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    for (const date in stats.daily) {
      if (date < cutoffDateStr) {
        delete stats.daily[date];
      }
    }
    
    // Save
    await browser.storage.local.set({
      [StorageKeys.STATISTICS]: stats
    });
    
    console.log('Session statistics saved');
    
  } catch (error) {
    console.error('Error saving statistics:', error);
  }
}

/**
 * Get statistics
 */
async function getStatistics() {
  try {
    const result = await browser.storage.local.get(StorageKeys.STATISTICS);
    return result[StorageKeys.STATISTICS] || { sessions: [], daily: {} };
  } catch (error) {
    console.error('Error loading statistics:', error);
    return { sessions: [], daily: {} };
  }
}

/**
 * Cleanup on extension unload
 */
async function cleanup() {
  if (detectionWindow) {
    await stopMonitoring();
  }
}

// Initialize when background script loads
initialize();
