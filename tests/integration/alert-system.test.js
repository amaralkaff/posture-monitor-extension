/**
 * Integration Tests for Alert System
 * Tests alert triggering, cooldowns, and notification flow
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { PostureStatus, NotificationIds } from '../../src/utils/constants.js';
import { getSettings } from '../fixtures/mockSettings.js';

describe('Alert System Integration', () => {
  let alertManager;
  let mockNotifications;
  let mockBrowser;

  beforeEach(() => {
    // Mock browser notifications API
    mockNotifications = {
      create: jest.fn().mockResolvedValue('notification-id'),
      clear: jest.fn().mockResolvedValue(true),
    };

    mockBrowser = {
      notifications: mockNotifications,
      runtime: {
        getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`),
      },
      alarms: {
        create: jest.fn(),
        clear: jest.fn(),
      },
    };

    global.browser = mockBrowser;

    const defaultSettings = {
      enabled: true,
      sensitivity: 'medium',
      thresholds: {
        headForwardAngle: 15,
        shoulderAsymmetry: 10,
        poorPostureDuration: 0, // No duration threshold for these tests
      },
      alerts: {
        enabled: true,
        cooldown: 300,
        sound: false,
        vibration: false,
      },
    };

    alertManager = new AlertManager(defaultSettings);
  });

  describe('Alert triggering', () => {
    test('should trigger alert for poor posture', async () => {
      const analysis = {
        status: PostureStatus.POOR,
        score: 30,
        metrics: {
          headForwardAngle: 25,
          shoulderAsymmetry: 15,
        },
      };

      await alertManager.checkAndAlert(analysis);

      expect(mockNotifications.create).toHaveBeenCalledWith(
        NotificationIds.POOR_POSTURE,
        expect.objectContaining({
          type: 'basic',
          title: expect.any(String),
          message: expect.any(String),
        })
      );
    });

    test('should trigger warning for warning status', async () => {
      const analysis = {
        status: PostureStatus.WARNING,
        score: 60,
        metrics: {
          headForwardAngle: 12,
          shoulderAsymmetry: 8,
        },
      };

      await alertManager.checkAndAlert(analysis);

      expect(mockNotifications.create).toHaveBeenCalledWith(
        NotificationIds.WARNING_POSTURE,
        expect.any(Object)
      );
    });

    test('should not trigger alert for good posture', async () => {
      const analysis = {
        status: PostureStatus.GOOD,
        score: 85,
        metrics: {
          headForwardAngle: 5,
          shoulderAsymmetry: 3,
        },
      };

      await alertManager.checkAndAlert(analysis);

      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    test('should not trigger alert when disabled', async () => {
      alertManager.updateSettings({ alerts: { enabled: false } });

      const analysis = {
        status: PostureStatus.POOR,
        score: 30,
        metrics: {},
      };

      await alertManager.checkAndAlert(analysis);

      expect(mockNotifications.create).not.toHaveBeenCalled();
    });
  });

  describe('Alert cooldown', () => {
    test('should respect cooldown period', async () => {
      const analysis = {
        status: PostureStatus.POOR,
        score: 30,
        metrics: {},
      };

      // First alert should trigger
      await alertManager.checkAndAlert(analysis);
      expect(mockNotifications.create).toHaveBeenCalledTimes(1);

      // Immediate second alert should not trigger
      await alertManager.checkAndAlert(analysis);
      expect(mockNotifications.create).toHaveBeenCalledTimes(1);
    });

    test('should allow alert after cooldown period', async () => {
      jest.useFakeTimers();

      const analysis = {
        status: PostureStatus.POOR,
        score: 30,
        metrics: {},
      };

      await alertManager.checkAndAlert(analysis);
      expect(mockNotifications.create).toHaveBeenCalledTimes(1);

      // Advance time past cooldown (default 5 minutes = 300000ms)
      jest.setSystemTime(Date.now() + 350000);

      await alertManager.checkAndAlert(analysis);
      expect(mockNotifications.create).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    test('should have separate cooldowns for different alert types', async () => {
      const poorAnalysis = {
        status: PostureStatus.POOR,
        score: 30,
        metrics: {},
      };

      const warningAnalysis = {
        status: PostureStatus.WARNING,
        score: 60,
        metrics: {},
      };

      await alertManager.checkAndAlert(poorAnalysis);
      expect(mockNotifications.create).toHaveBeenCalledTimes(1);

      // Different alert type should trigger even during cooldown
      await alertManager.checkAndAlert(warningAnalysis);
      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sound and vibration', () => {
    test('should play sound when enabled', async () => {
      const mockAudio = {
        play: jest.fn().mockResolvedValue(undefined),
      };

      global.Audio = jest.fn(() => mockAudio);

      alertManager.updateSettings({
        alerts: { enabled: true, sound: true },
      });

      const analysis = {
        status: PostureStatus.POOR,
        score: 30,
        metrics: {},
      };

      await alertManager.checkAndAlert(analysis);

      expect(global.Audio).toHaveBeenCalled();
      expect(mockAudio.play).toHaveBeenCalled();
    });

    test('should not play sound when disabled', async () => {
      const mockAudio = {
        play: jest.fn(),
      };

      global.Audio = jest.fn(() => mockAudio);

      alertManager.updateSettings({
        alerts: { enabled: true, sound: false },
      });

      const analysis = {
        status: PostureStatus.POOR,
        score: 30,
        metrics: {},
      };

      await alertManager.checkAndAlert(analysis);

      expect(mockAudio.play).not.toHaveBeenCalled();
    });

    test('should vibrate when enabled and supported', async () => {
      const mockVibrate = jest.fn();
      navigator.vibrate = mockVibrate;

      alertManager.updateSettings({
        alerts: { enabled: true, vibration: true },
      });

      const analysis = {
        status: PostureStatus.POOR,
        score: 30,
        metrics: {},
      };

      await alertManager.checkAndAlert(analysis);

      expect(mockVibrate).toHaveBeenCalled();
    });
  });

  describe('Poor posture duration tracking', () => {
    test('should track consecutive poor posture duration', async () => {
      jest.useFakeTimers();

      const poorAnalysis = {
        status: PostureStatus.POOR,
        score: 30,
        metrics: {},
      };

      // First poor posture detection
      await alertManager.checkAndAlert(poorAnalysis);

      // Advance time
      jest.setSystemTime(Date.now() + 10000); // Advance 10 seconds

      // Still poor posture
      await alertManager.checkAndAlert(poorAnalysis);

      expect(alertManager.poorPostureDuration).toBeGreaterThanOrEqual(10000);

      jest.useRealTimers();
    });

    test('should reset duration on good posture', async () => {
      jest.useFakeTimers();

      const poorAnalysis = {
        status: PostureStatus.POOR,
        score: 30,
        metrics: {},
      };

      const goodAnalysis = {
        status: PostureStatus.GOOD,
        score: 85,
        metrics: {},
      };

      // First poor posture check
      await alertManager.checkAndAlert(poorAnalysis);

      // Advance time and check again
      jest.setSystemTime(Date.now() + 5000);
      await alertManager.checkAndAlert(poorAnalysis);

      expect(alertManager.poorPostureDuration).toBeGreaterThan(0);

      // Good posture should reset
      await alertManager.checkAndAlert(goodAnalysis);
      expect(alertManager.poorPostureDuration).toBe(0);

      jest.useRealTimers();
    });

    test('should only alert after duration threshold', async () => {
      jest.useFakeTimers();

      alertManager.updateSettings({
        thresholds: { poorPostureDuration: 30 }, // 30 seconds
      });

      const poorAnalysis = {
        status: PostureStatus.POOR,
        score: 30,
        metrics: {},
      };

      // First detection - should not alert yet
      await alertManager.checkAndAlert(poorAnalysis);
      expect(mockNotifications.create).not.toHaveBeenCalled();

      // Wait for threshold
      jest.setSystemTime(Date.now() + 35000); // Advance 35 seconds

      await alertManager.checkAndAlert(poorAnalysis);
      expect(mockNotifications.create).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Alert messages', () => {
    test('should include specific feedback in alert message', async () => {
      const analysis = {
        status: PostureStatus.POOR,
        score: 30,
        metrics: {
          headForwardAngle: 25,
          shoulderAsymmetry: 5,
        },
      };

      await alertManager.checkAndAlert(analysis);

      const createCall = mockNotifications.create.mock.calls[0];
      const message = createCall[1].message;

      expect(message).toContain('head'); // Should mention head issue
    });

    test('should show score in alert', async () => {
      const analysis = {
        status: PostureStatus.POOR,
        score: 35,
        metrics: {},
      };

      await alertManager.checkAndAlert(analysis);

      const createCall = mockNotifications.create.mock.calls[0];
      const message = createCall[1].message;

      expect(message).toContain('35'); // Should show score
    });
  });
});

/**
 * Mock AlertManager class for testing
 * (In real implementation, this would be in src/alerts/alertManager.js)
 */
class AlertManager {
  constructor(settings) {
    this.settings = settings;
    this.lastAlertTime = {};
    this.poorPostureDuration = 0;
    this.lastPoorPostureTime = null;
  }

  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }

  async checkAndAlert(analysis) {
    if (!this.settings.enabled || !this.settings.alerts?.enabled) {
      return;
    }

    // Track poor posture duration
    const now = Date.now();
    if (analysis.status === PostureStatus.POOR) {
      if (this.lastPoorPostureTime) {
        this.poorPostureDuration += now - this.lastPoorPostureTime;
      }
      this.lastPoorPostureTime = now;
    } else {
      this.poorPostureDuration = 0;
      this.lastPoorPostureTime = null;
    }

    // Check duration threshold
    const durationThreshold =
      (this.settings.thresholds?.poorPostureDuration || 0) * 1000;
    if (durationThreshold > 0 && this.poorPostureDuration < durationThreshold) {
      return;
    }

    // Check if we should alert
    if (
      analysis.status !== PostureStatus.GOOD &&
      analysis.status !== PostureStatus.UNKNOWN
    ) {
      const notificationId =
        analysis.status === PostureStatus.POOR
          ? NotificationIds.POOR_POSTURE
          : NotificationIds.WARNING_POSTURE;

      // Check cooldown
      const cooldown = (this.settings.alerts?.cooldown || 300) * 1000;
      const lastAlert = this.lastAlertTime[notificationId] || 0;

      if (now - lastAlert < cooldown) {
        return; // Still in cooldown
      }

      // Trigger alert
      await this.triggerAlert(notificationId, analysis);

      this.lastAlertTime[notificationId] = now;
    }
  }

  async triggerAlert(notificationId, analysis) {
    // Create notification
    const message = this.buildAlertMessage(analysis);

    await browser.notifications.create(notificationId, {
      type: 'basic',
      title:
        analysis.status === PostureStatus.POOR
          ? 'Poor Posture Detected'
          : 'Posture Warning',
      message,
      iconUrl: browser.runtime.getURL('icons/icon-96.png'),
    });

    // Play sound if enabled
    if (this.settings.alerts?.sound && typeof Audio !== 'undefined') {
      const audio = new Audio(browser.runtime.getURL('sounds/alert.mp3'));
      await audio.play().catch(() => {
        /* Ignore errors */
      });
    }

    // Vibrate if enabled and supported
    if (this.settings.alerts?.vibration && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  buildAlertMessage(analysis) {
    const feedback = [];

    if (analysis.metrics.headForwardAngle > 15) {
      feedback.push('Your head is too far forward.');
    }

    if (analysis.metrics.shoulderAsymmetry > 10) {
      feedback.push('Your shoulders are uneven.');
    }

    if (feedback.length === 0) {
      feedback.push('Please adjust your posture.');
    }

    return `${feedback.join(' ')} Score: ${analysis.score}/100`;
  }
}
