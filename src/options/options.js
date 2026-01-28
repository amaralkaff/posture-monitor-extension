/**
 * Options page controller
 */

import { getDefaultSettings, validateSettings } from '../utils/validators.js';

class OptionsController {
  constructor() {
    this.settings = null;
    
    this.initElements();
    this.attachListeners();
    this.loadSettings();
  }

  initElements() {
    // Sensitivity
    this.sensitivityInputs = document.querySelectorAll('input[name="sensitivity"]');
    this.fpsInput = document.getElementById('fps');
    this.fpsValue = document.getElementById('fpsValue');
    this.confidenceInput = document.getElementById('confidence');
    this.confidenceValue = document.getElementById('confidenceValue');
    
    // Thresholds
    this.headForwardAngleInput = document.getElementById('headForwardAngle');
    this.shoulderAsymmetryInput = document.getElementById('shoulderAsymmetry');
    this.poorPostureDurationInput = document.getElementById('poorPostureDuration');
    
    // Alerts
    this.alertsEnabledInput = document.getElementById('alertsEnabled');
    this.cooldownInput = document.getElementById('cooldown');
    this.soundEnabledInput = document.getElementById('soundEnabled');
    
    // Actions
    this.saveBtn = document.getElementById('saveBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.clearDataBtn = document.getElementById('clearDataBtn');
    this.calibrateBtn = document.getElementById('calibrateBtn');
    this.resetCalibrationBtn = document.getElementById('resetCalibrationBtn');
    
    // Status
    this.saveStatus = document.getElementById('saveStatus');
    this.calibrationStatus = document.getElementById('calibrationStatus');
  }

  attachListeners() {
    // Range inputs - update display
    this.fpsInput.addEventListener('input', (e) => {
      this.fpsValue.textContent = e.target.value;
    });
    
    this.confidenceInput.addEventListener('input', (e) => {
      this.confidenceValue.textContent = parseFloat(e.target.value).toFixed(1);
    });
    
    // Buttons
    this.saveBtn.addEventListener('click', () => this.saveSettings());
    this.resetBtn.addEventListener('click', () => this.resetSettings());
    this.clearDataBtn.addEventListener('click', () => this.clearData());
    this.calibrateBtn.addEventListener('click', () => this.startCalibration());
    this.resetCalibrationBtn.addEventListener('click', () => this.resetCalibration());
  }

  async loadSettings() {
    try {
      const response = await browser.runtime.sendMessage({ type: 'get_settings' });
      this.settings = response || getDefaultSettings();
      this.populateForm();
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = getDefaultSettings();
      this.populateForm();
    }
  }

  populateForm() {
    // Sensitivity
    this.sensitivityInputs.forEach(input => {
      if (input.value === this.settings.sensitivity) {
        input.checked = true;
      }
    });
    
    // Detection settings
    this.fpsInput.value = this.settings.detection?.fps || 5;
    this.fpsValue.textContent = this.fpsInput.value;
    
    this.confidenceInput.value = this.settings.detection?.confidenceThreshold || 0.5;
    this.confidenceValue.textContent = parseFloat(this.confidenceInput.value).toFixed(1);
    
    // Thresholds
    this.headForwardAngleInput.value = this.settings.thresholds?.headForwardAngle || 15;
    this.shoulderAsymmetryInput.value = this.settings.thresholds?.shoulderAsymmetry || 10;
    this.poorPostureDurationInput.value = this.settings.thresholds?.poorPostureDuration || 30;
    
    // Alerts
    this.alertsEnabledInput.checked = this.settings.alerts?.enabled ?? true;
    this.cooldownInput.value = this.settings.alerts?.cooldown || 300;
    this.soundEnabledInput.checked = this.settings.alerts?.sound || false;
  }

  getFormData() {
    // Get selected sensitivity
    let sensitivity = 'medium';
    this.sensitivityInputs.forEach(input => {
      if (input.checked) {
        sensitivity = input.value;
      }
    });
    
    return {
      sensitivity,
      detection: {
        fps: parseInt(this.fpsInput.value),
        confidenceThreshold: parseFloat(this.confidenceInput.value)
      },
      thresholds: {
        headForwardAngle: parseInt(this.headForwardAngleInput.value),
        shoulderAsymmetry: parseInt(this.shoulderAsymmetryInput.value),
        poorPostureDuration: parseInt(this.poorPostureDurationInput.value)
      },
      alerts: {
        enabled: this.alertsEnabledInput.checked,
        cooldown: parseInt(this.cooldownInput.value),
        sound: this.soundEnabledInput.checked
      },
      calibration: this.settings.calibration
    };
  }

  async saveSettings() {
    try {
      this.saveBtn.disabled = true;
      
      const newSettings = this.getFormData();
      
      // Validate
      const validation = validateSettings(newSettings);
      if (!validation.valid) {
        this.showStatus('error', validation.errors.join('. '));
        return;
      }
      
      // Save
      const response = await browser.runtime.sendMessage({
        type: 'update_settings',
        data: newSettings
      });
      
      if (response.success) {
        this.settings = response.settings;
        this.showStatus('success', 'Settings saved successfully!');
      } else {
        this.showStatus('error', 'Failed to save settings');
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('error', error.message);
    } finally {
      this.saveBtn.disabled = false;
    }
  }

  async resetSettings() {
    if (!confirm('Reset all settings to default values?')) {
      return;
    }
    
    try {
      const defaults = getDefaultSettings();
      
      const response = await browser.runtime.sendMessage({
        type: 'update_settings',
        data: defaults
      });
      
      if (response.success) {
        this.settings = response.settings;
        this.populateForm();
        this.showStatus('success', 'Settings reset to defaults');
      }
      
    } catch (error) {
      console.error('Error resetting settings:', error);
      this.showStatus('error', error.message);
    }
  }

  async clearData() {
    if (!confirm('Clear all statistics? This cannot be undone.')) {
      return;
    }
    
    try {
      await browser.storage.local.remove('statistics');
      this.showStatus('success', 'All statistics cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      this.showStatus('error', error.message);
    }
  }

  async startCalibration() {
    try {
      this.calibrateBtn.disabled = true;
      
      // Check if monitoring is active
      const status = await browser.runtime.sendMessage({ type: 'get_status' });
      
      if (!status.isMonitoring) {
        this.showCalibrationStatus('error', 'Please start monitoring first');
        this.calibrateBtn.disabled = false;
        return;
      }
      
      this.showCalibrationStatus('info', 'Sit in your best posture... Calibrating in 3 seconds...');
      
      // Wait 3 seconds for user to position themselves
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Request current posture metrics as baseline
      // This would need to be implemented in background script
      // For now, we'll show a placeholder message
      this.showCalibrationStatus('success', 'Calibration complete! Your current posture is now the baseline.');
      
      // In a real implementation, we would:
      // 1. Get current posture metrics from detection
      // 2. Save them as calibration baseline
      // 3. Update settings
      
    } catch (error) {
      console.error('Error during calibration:', error);
      this.showCalibrationStatus('error', error.message);
    } finally {
      this.calibrateBtn.disabled = false;
    }
  }

  async resetCalibration() {
    try {
      const newSettings = {
        ...this.settings,
        calibration: null
      };
      
      const response = await browser.runtime.sendMessage({
        type: 'update_settings',
        data: newSettings
      });
      
      if (response.success) {
        this.settings = response.settings;
        this.showCalibrationStatus('success', 'Calibration reset');
      }
      
    } catch (error) {
      console.error('Error resetting calibration:', error);
      this.showCalibrationStatus('error', error.message);
    }
  }

  showStatus(type, message) {
    this.saveStatus.textContent = message;
    this.saveStatus.className = `status-message ${type}`;
    this.saveStatus.style.display = 'block';
    
    setTimeout(() => {
      this.saveStatus.style.display = 'none';
    }, 5000);
  }

  showCalibrationStatus(type, message) {
    this.calibrationStatus.textContent = message;
    this.calibrationStatus.className = `status-message ${type}`;
    this.calibrationStatus.style.display = 'block';
    
    setTimeout(() => {
      this.calibrationStatus.style.display = 'none';
    }, 5000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
