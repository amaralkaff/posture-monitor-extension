/**
 * Detection page script - manages camera and pose detection
 */

import { PoseAnalyzer } from './poseAnalyzer.js';
import { MessageType, DetectionState, VideoConstraints } from '../utils/constants.js';

class DetectionManager {
  constructor() {
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.worker = null;
    this.poseAnalyzer = null;
    this.stream = null;
    this.state = DetectionState.IDLE;
    this.settings = null;
    this.frameInterval = null;
    this.targetFPS = 5;
    
    this.init();
  }

  async init() {
    try {
      // Get settings from background
      const response = await browser.runtime.sendMessage({ type: 'get_settings' });
      this.settings = response;
      
      // Initialize pose analyzer
      this.poseAnalyzer = new PoseAnalyzer(this.settings);
      
      // Initialize worker
      this.initWorker();
      
      // Request camera access
      await this.startCamera();
      
      // Listen for settings updates
      browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
      
    } catch (error) {
      console.error('Detection initialization error:', error);
      this.reportError(error);
    }
  }

  initWorker() {
    this.worker = new Worker(browser.runtime.getURL('src/detection/detectionWorker.js'));
    
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      this.reportError(error);
    };
    
    // Initialize worker with settings
    this.worker.postMessage({
      type: MessageType.INIT,
      data: this.settings
    });
  }

  async startCamera() {
    try {
      this.state = DetectionState.STARTING;
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: VideoConstraints,
        audio: false
      });
      
      this.video.srcObject = this.stream;
      
      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve();
        };
      });
      
      // Set canvas size to match video
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      
      console.log('Camera started:', this.video.videoWidth, 'x', this.video.videoHeight);
      
    } catch (error) {
      console.error('Camera access error:', error);
      this.state = DetectionState.ERROR;
      this.reportError(error);
      throw error;
    }
  }

  handleWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case MessageType.READY:
        console.log('Worker ready');
        this.startDetection();
        break;
        
      case MessageType.POSE_RESULT:
        this.handlePoseResult(data);
        break;
        
      case MessageType.ERROR:
        console.error('Worker error:', data);
        this.reportError(data);
        break;
        
      case MessageType.STATUS:
        console.log('Worker status:', data);
        break;
    }
  }

  startDetection() {
    if (this.state === DetectionState.RUNNING) {
      return;
    }
    
    this.state = DetectionState.RUNNING;
    
    // Tell worker to start
    this.worker.postMessage({
      type: MessageType.START_DETECTION
    });
    
    // Calculate frame interval based on target FPS
    this.targetFPS = this.settings.detection?.fps || 5;
    const intervalMs = 1000 / this.targetFPS;
    
    // Start processing frames
    this.frameInterval = setInterval(() => {
      this.processFrame();
    }, intervalMs);
    
    console.log('Detection started at', this.targetFPS, 'FPS');
  }

  stopDetection() {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    
    if (this.worker) {
      this.worker.postMessage({
        type: MessageType.STOP_DETECTION
      });
    }
    
    this.state = DetectionState.IDLE;
    console.log('Detection stopped');
  }

  processFrame() {
    if (this.state !== DetectionState.RUNNING) {
      return;
    }
    
    // Draw current video frame to canvas
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    
    // Get image data
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Send to worker for processing
    this.worker.postMessage({
      type: MessageType.PROCESS_FRAME,
      data: imageData
    }, [imageData.data.buffer]); // Transfer buffer for performance
  }

  handlePoseResult(poseData) {
    // Analyze pose using PoseAnalyzer
    const analysis = this.poseAnalyzer.analyzePose(poseData);
    
    if (analysis) {
      // Send analysis to background script
      browser.runtime.sendMessage({
        type: 'posture_update',
        data: {
          status: analysis.status,
          score: analysis.score,
          metrics: analysis.metrics
        }
      }).catch(error => {
        console.error('Error sending posture update:', error);
      });
    }
  }

  handleMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'settings_updated':
        this.updateSettings(data);
        break;
        
      case 'play_alert_sound':
        this.playAlertSound();
        break;
        
      case 'stop_monitoring':
        this.cleanup();
        break;
    }
  }

  updateSettings(newSettings) {
    this.settings = newSettings;
    
    // Update pose analyzer
    if (this.poseAnalyzer) {
      this.poseAnalyzer.updateSettings(newSettings);
    }
    
    // Update worker
    if (this.worker) {
      this.worker.postMessage({
        type: MessageType.UPDATE_SETTINGS,
        data: newSettings
      });
    }
    
    // Update FPS if changed
    const newFPS = newSettings.detection?.fps || 5;
    if (newFPS !== this.targetFPS) {
      this.targetFPS = newFPS;
      
      // Restart frame processing with new FPS
      if (this.frameInterval) {
        clearInterval(this.frameInterval);
        const intervalMs = 1000 / this.targetFPS;
        this.frameInterval = setInterval(() => {
          this.processFrame();
        }, intervalMs);
      }
    }
    
    console.log('Settings updated');
  }

  playAlertSound() {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
    } catch (error) {
      console.error('Error playing alert sound:', error);
    }
  }

  reportError(error) {
    browser.runtime.sendMessage({
      type: 'detection_error',
      data: {
        message: error.message || 'Unknown error',
        stack: error.stack
      }
    }).catch(err => {
      console.error('Error reporting error:', err);
    });
  }

  cleanup() {
    this.stopDetection();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    console.log('Detection manager cleaned up');
  }
}

// Initialize when page loads
const manager = new DetectionManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  manager.cleanup();
});
