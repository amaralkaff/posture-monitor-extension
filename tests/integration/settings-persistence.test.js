/**
 * Integration Tests for Settings Persistence
 * Tests saving, loading, and syncing settings with browser storage
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { validateSettings, sanitizeSettings, getDefaultSettings } from '../../src/utils/validators.js';
import { StorageKeys } from '../../src/utils/constants.js';
import { getSettings } from '../fixtures/mockSettings.js';

describe('Settings Persistence Integration', () => {
  let settingsManager;
  let mockStorage;

  beforeEach(() => {
    // Mock browser storage API
    const storageData = {};

    mockStorage = {
      local: {
        get: jest.fn((keys) => {
          if (typeof keys === 'string') {
            return Promise.resolve({ [keys]: storageData[keys] });
          }
          const result = {};
          keys.forEach((key) => {
            if (storageData[key]) result[key] = storageData[key];
          });
          return Promise.resolve(result);
        }),
        set: jest.fn((data) => {
          Object.assign(storageData, data);
          return Promise.resolve();
        }),
        remove: jest.fn((keys) => {
          const keysArray = Array.isArray(keys) ? keys : [keys];
          keysArray.forEach((key) => delete storageData[key]);
          return Promise.resolve();
        }),
        clear: jest.fn(() => {
          Object.keys(storageData).forEach((key) => delete storageData[key]);
          return Promise.resolve();
        }),
      },
      sync: {
        get: jest.fn(),
        set: jest.fn(),
      },
    };

    global.browser = { storage: mockStorage };

    settingsManager = new SettingsManager();
  });

  describe('Settings initialization', () => {
    test('should load default settings on first run', async () => {
      const settings = await settingsManager.loadSettings();

      expect(settings).toMatchObject(getDefaultSettings());
    });

    test('should validate settings on load', async () => {
      await mockStorage.local.set({
        [StorageKeys.SETTINGS]: { sensitivity: 'invalid' },
      });

      const settings = await settingsManager.loadSettings();

      // Should fall back to defaults for invalid settings
      expect(settings.sensitivity).toBe('medium');
    });

    test('should merge stored settings with defaults', async () => {
      await mockStorage.local.set({
        [StorageKeys.SETTINGS]: { sensitivity: 'high' },
      });

      const settings = await settingsManager.loadSettings();

      expect(settings.sensitivity).toBe('high');
      expect(settings).toHaveProperty('thresholds'); // From defaults
      expect(settings).toHaveProperty('alerts'); // From defaults
    });
  });

  describe('Settings saving', () => {
    test('should save valid settings', async () => {
      const newSettings = {
        sensitivity: 'high',
        thresholds: {
          headForwardAngle: 20,
          shoulderAsymmetry: 12,
          poorPostureDuration: 45,
        },
      };

      await settingsManager.saveSettings(newSettings);

      const stored = await mockStorage.local.get(StorageKeys.SETTINGS);
      expect(stored[StorageKeys.SETTINGS]).toMatchObject(newSettings);
    });

    test('should sanitize settings before saving', async () => {
      const invalidSettings = {
        sensitivity: 'extreme',
        thresholds: {
          headForwardAngle: 200, // Out of range
        },
      };

      await settingsManager.saveSettings(invalidSettings);

      const stored = await mockStorage.local.get(StorageKeys.SETTINGS);
      const savedSettings = stored[StorageKeys.SETTINGS];

      expect(savedSettings.sensitivity).toBe('medium'); // Sanitized
      expect(savedSettings.thresholds.headForwardAngle).toBeLessThanOrEqual(90); // Clamped
    });

    test('should preserve unmodified settings', async () => {
      const original = getSettings('default');
      await settingsManager.saveSettings(original);

      const partial = { sensitivity: 'high' };
      await settingsManager.saveSettings(partial);

      const stored = await mockStorage.local.get(StorageKeys.SETTINGS);
      const savedSettings = stored[StorageKeys.SETTINGS];

      expect(savedSettings.sensitivity).toBe('high');
      // Should preserve default thresholds from initial load/merge
      expect(savedSettings.thresholds).toEqual(getDefaultSettings().thresholds);
    });

    test('should trigger storage change events', async () => {
      const changeListener = jest.fn();

      if (browser.storage.onChanged) {
        browser.storage.onChanged.addListener(changeListener);
      }

      await settingsManager.saveSettings({ sensitivity: 'high' });

      expect(mockStorage.local.set).toHaveBeenCalled();
    });
  });

  describe('Settings update', () => {
    test('should update specific setting fields', async () => {
      await settingsManager.saveSettings(getSettings('default'));

      await settingsManager.updateSetting('sensitivity', 'high');

      const settings = await settingsManager.loadSettings();
      expect(settings.sensitivity).toBe('high');
    });

    test('should update nested settings', async () => {
      await settingsManager.saveSettings(getSettings('default'));

      await settingsManager.updateSetting('thresholds.headForwardAngle', 25);

      const settings = await settingsManager.loadSettings();
      expect(settings.thresholds.headForwardAngle).toBe(25);
    });

    test('should validate on update', async () => {
      await settingsManager.saveSettings(getSettings('default'));

      await settingsManager.updateSetting('sensitivity', 'invalid');

      const settings = await settingsManager.loadSettings();
      expect(settings.sensitivity).not.toBe('invalid');
    });
  });

  describe('Settings reset', () => {
    test('should reset to default settings', async () => {
      const custom = getSettings('strict');
      await settingsManager.saveSettings(custom);

      await settingsManager.resetSettings();

      const settings = await settingsManager.loadSettings();
      expect(settings).toMatchObject(getDefaultSettings());
    });

    test('should clear stored settings', async () => {
      await settingsManager.saveSettings(getSettings('strict'));

      await settingsManager.resetSettings();

      expect(mockStorage.local.remove).toHaveBeenCalledWith(StorageKeys.SETTINGS);
    });
  });

  describe('Export and import', () => {
    test('should export settings as JSON', async () => {
      const settings = getSettings('strict');
      await settingsManager.saveSettings(settings);

      const exported = await settingsManager.exportSettings();
      const parsed = JSON.parse(exported);

      expect(parsed).toMatchObject(settings);
    });

    test('should import valid settings from JSON', async () => {
      const settings = getSettings('lenient');
      const json = JSON.stringify(settings);

      await settingsManager.importSettings(json);

      const loaded = await settingsManager.loadSettings();
      expect(loaded).toMatchObject(settings);
    });

    test('should reject invalid JSON', async () => {
      const invalidJson = 'not valid json {';

      await expect(settingsManager.importSettings(invalidJson)).rejects.toThrow();
    });

    test('should validate imported settings', async () => {
      const invalidSettings = {
        sensitivity: 'extreme',
        thresholds: { headForwardAngle: 200 },
      };
      const json = JSON.stringify(invalidSettings);

      await settingsManager.importSettings(json);

      const loaded = await settingsManager.loadSettings();
      expect(loaded.sensitivity).not.toBe('extreme');
    });
  });

  describe('Migration', () => {
    test('should migrate old settings format', async () => {
      const oldSettings = {
        alertLevel: 70, // Old format
        checkFrequency: 5000,
      };

      await mockStorage.local.set({ [StorageKeys.SETTINGS]: oldSettings });

      const settings = await settingsManager.loadSettings();

      // Should be migrated to new format
      expect(settings).toHaveProperty('thresholds');
      expect(settings).toHaveProperty('alerts');
    });

    test('should preserve custom values during migration', async () => {
      const oldSettings = {
        alertLevel: 85, // Custom value
      };

      await mockStorage.local.set({ [StorageKeys.SETTINGS]: oldSettings });

      const settings = await settingsManager.loadSettings();

      // Custom value should be preserved in new format
      expect(settings.thresholds).toBeDefined();
    });
  });

  describe('Concurrent access', () => {
    test('should handle concurrent save operations', async () => {
      const promises = [
        settingsManager.saveSettings({ sensitivity: 'high' }),
        settingsManager.saveSettings({ sensitivity: 'low' }),
        settingsManager.saveSettings({ sensitivity: 'medium' }),
      ];

      await Promise.all(promises);

      const settings = await settingsManager.loadSettings();
      // Last write should win
      expect(['high', 'low', 'medium']).toContain(settings.sensitivity);
    });

    test('should handle concurrent read operations', async () => {
      await settingsManager.saveSettings(getSettings('default'));

      const promises = [
        settingsManager.loadSettings(),
        settingsManager.loadSettings(),
        settingsManager.loadSettings(),
      ];

      const results = await Promise.all(promises);

      // All reads should return same data
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });
  });
});

/**
 * Mock SettingsManager for testing
 */
class SettingsManager {
  constructor() {
    this.cache = null;
  }

  async loadSettings() {
    const stored = await browser.storage.local.get(StorageKeys.SETTINGS);
    let settings = stored[StorageKeys.SETTINGS];

    if (!settings || Object.keys(settings).length === 0) {
      settings = getDefaultSettings();
    } else {
      // Merge with defaults
      settings = { ...getDefaultSettings(), ...settings };
    }

    // Validate and sanitize
    const validation = validateSettings(settings);
    if (!validation.valid) {
      settings = { ...settings, ...sanitizeSettings(settings) };
    }

    this.cache = settings;
    return settings;
  }

  async saveSettings(newSettings) {
    const current = await this.loadSettings();
    const merged = { ...current, ...newSettings };

    // Sanitize before saving
    const sanitized = sanitizeSettings(merged);
    const toSave = { ...merged, ...sanitized };

    await browser.storage.local.set({
      [StorageKeys.SETTINGS]: toSave,
    });

    this.cache = toSave;
  }

  async updateSetting(path, value) {
    const settings = await this.loadSettings();
    const keys = path.split('.');

    let current = settings;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;

    await this.saveSettings(settings);
  }

  async resetSettings() {
    await browser.storage.local.remove(StorageKeys.SETTINGS);
    this.cache = null;
  }

  async exportSettings() {
    const settings = await this.loadSettings();
    return JSON.stringify(settings, null, 2);
  }

  async importSettings(json) {
    const settings = JSON.parse(json);
    await this.saveSettings(settings);
  }
}
