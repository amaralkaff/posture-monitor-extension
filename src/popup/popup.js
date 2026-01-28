/**
 * Popup UI controller
 */

import { PostureStatus } from '../utils/constants.js';

class PopupController {
  constructor() {
    this.isMonitoring = false;
    this.currentStatus = null;
    this.updateInterval = null;
    
    this.initElements();
    this.attachListeners();
    this.loadStatus();
    
    // Auto-refresh every 500ms when monitoring
    this.startAutoRefresh();
  }

  initElements() {
    this.statusCard = document.getElementById('statusCard');
    this.statusIcon = document.getElementById('statusIcon');
    this.statusText = document.getElementById('statusText');
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.scoreValue = document.getElementById('scoreValue');
    this.scoreProgress = document.getElementById('scoreProgress');
    this.scoreLabel = document.getElementById('scoreLabel');
    this.toggleBtn = document.getElementById('toggleBtn');
    this.toggleBtnText = document.getElementById('toggleBtnText');
    this.snoozeBtn = document.getElementById('snoozeBtn');
    this.statsSection = document.getElementById('statsSection');
    this.sessionDuration = document.getElementById('sessionDuration');
    this.goodTime = document.getElementById('goodTime');
    this.alertCount = document.getElementById('alertCount');
    this.settingsLink = document.getElementById('settingsLink');
    this.helpLink = document.getElementById('helpLink');
  }

  attachListeners() {
    this.toggleBtn.addEventListener('click', () => this.handleToggle());
    this.snoozeBtn.addEventListener('click', () => this.handleSnooze());
    this.settingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      browser.runtime.openOptionsPage();
    });
    this.helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });
  }

  async loadStatus() {
    try {
      const status = await browser.runtime.sendMessage({ type: 'get_status' });
      this.updateUI(status);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  }

  startAutoRefresh() {
    this.updateInterval = setInterval(async () => {
      if (this.isMonitoring) {
        await this.loadStatus();
      }
    }, 500);
  }

  updateUI(status) {
    this.isMonitoring = status.isMonitoring;
    this.currentStatus = status.sessionStats?.lastStatus || PostureStatus.UNKNOWN;
    
    // Update toggle button
    if (this.isMonitoring) {
      this.toggleBtnText.textContent = 'Stop Monitoring';
      this.toggleBtn.querySelector('svg').innerHTML = '<rect x="6" y="6" width="12" height="12"></rect>';
      this.statusCard.classList.add('monitoring');
      this.snoozeBtn.style.display = 'flex';
      this.statsSection.style.display = 'block';
      this.scoreDisplay.style.display = 'block';
    } else {
      this.toggleBtnText.textContent = 'Start Monitoring';
      this.toggleBtn.querySelector('svg').innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
      this.statusCard.classList.remove('monitoring', 'good', 'warning', 'poor');
      this.snoozeBtn.style.display = 'none';
      this.statsSection.style.display = 'none';
      this.scoreDisplay.style.display = 'none';
    }
    
    // Update status display
    if (this.isMonitoring) {
      this.updatePostureStatus(this.currentStatus);
      
      // Update session stats
      if (status.sessionStats) {
        this.updateSessionStats(status.sessionStats);
      }
    } else {
      this.statusText.textContent = 'Not Monitoring';
    }
  }

  updatePostureStatus(status) {
    // Remove all status classes
    this.statusCard.classList.remove('good', 'warning', 'poor');
    this.scoreProgress.classList.remove('good', 'warning', 'poor');
    
    // Add current status class
    if (status !== PostureStatus.UNKNOWN) {
      this.statusCard.classList.add(status);
      this.scoreProgress.classList.add(status);
    }
    
    // Update status text
    const statusTexts = {
      [PostureStatus.GOOD]: '✓ Good Posture',
      [PostureStatus.WARNING]: '⚠ Posture Warning',
      [PostureStatus.POOR]: '✗ Poor Posture',
      [PostureStatus.UNKNOWN]: 'Detecting...'
    };
    
    this.statusText.textContent = statusTexts[status] || 'Unknown';
  }

  updateSessionStats(stats) {
    // Update duration
    const duration = Date.now() - stats.startTime;
    this.sessionDuration.textContent = this.formatDuration(duration);
    
    // Update good posture percentage
    if (stats.totalTime > 0) {
      const goodPercentage = Math.round((stats.goodPostureTime / stats.totalTime) * 100);
      this.goodTime.textContent = goodPercentage + '%';
      
      // Update score display
      this.scoreValue.textContent = goodPercentage;
      this.updateScoreCircle(goodPercentage);
    }
    
    // Update alert count
    this.alertCount.textContent = stats.alertCount;
  }

  updateScoreCircle(score) {
    // Circle circumference = 2πr = 2π(45) ≈ 283
    const circumference = 283;
    const offset = circumference - (score / 100) * circumference;
    this.scoreProgress.style.strokeDashoffset = offset;
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }

  async handleToggle() {
    try {
      this.toggleBtn.disabled = true;
      
      if (this.isMonitoring) {
        const result = await browser.runtime.sendMessage({ type: 'stop_monitoring' });
        if (result.success) {
          this.isMonitoring = false;
        }
      } else {
        const result = await browser.runtime.sendMessage({ type: 'start_monitoring' });
        if (result.success) {
          this.isMonitoring = true;
        } else {
          this.showError(result.error || 'Failed to start monitoring');
        }
      }
      
      await this.loadStatus();
      
    } catch (error) {
      console.error('Error toggling monitoring:', error);
      this.showError(error.message);
    } finally {
      this.toggleBtn.disabled = false;
    }
  }

  async handleSnooze() {
    try {
      const result = await browser.runtime.sendMessage({ 
        type: 'snooze_alerts',
        data: { duration: 15 }
      });
      
      if (result.success) {
        this.showNotification('Alerts snoozed for 15 minutes');
      }
      
    } catch (error) {
      console.error('Error snoozing alerts:', error);
    }
  }

  showHelp() {
    const helpUrl = browser.runtime.getURL('docs/help.html');
    browser.tabs.create({ url: helpUrl });
  }

  showError(message) {
    // Simple error display - could be enhanced with a toast notification
    alert(message);
  }

  showNotification(message) {
    // Simple notification - could be enhanced with a toast
    console.log('Notification:', message);
  }
}

// Initialize popup controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
