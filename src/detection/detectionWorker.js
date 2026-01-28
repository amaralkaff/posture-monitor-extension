/**
 * Web Worker for pose detection using TensorFlow.js
 * Runs in separate thread to avoid blocking main UI
 */

// Import TensorFlow.js and PoseNet from CDN
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js');
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet@2.2.2/dist/posenet.min.js');

let model = null;
let isInitialized = false;
let detectionActive = false;
let settings = null;

/**
 * Initialize TensorFlow.js and load PoseNet model
 */
async function initialize() {
  try {
    postMessage({ type: 'status', data: 'Loading AI model...' });

    // Set TensorFlow.js backend
    await tf.setBackend('webgl');
    await tf.ready();

    // Load PoseNet model
    model = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 257, height: 257 },
      multiplier: 0.75,
      quantBytes: 2
    });

    isInitialized = true;
    postMessage({ type: 'ready', data: 'Model loaded successfully' });
    
  } catch (error) {
    postMessage({ 
      type: 'error', 
      data: { 
        message: 'Failed to load AI model',
        error: error.message 
      } 
    });
  }
}

/**
 * Process a video frame and detect pose
 * @param {ImageData} imageData - Video frame
 */
async function processFrame(imageData) {
  if (!isInitialized || !model || !detectionActive) {
    return;
  }

  try {
    // Convert ImageData to tensor
    const imageTensor = tf.browser.fromPixels(imageData);
    
    // Estimate pose
    const pose = await model.estimateSinglePose(imageTensor, {
      flipHorizontal: true,
      decodingMethod: 'single-person'
    });

    // Clean up tensor
    imageTensor.dispose();

    // Filter keypoints by confidence
    const confidenceThreshold = settings?.detection?.confidenceThreshold || 0.5;
    const filteredKeypoints = pose.keypoints.filter(kp => kp.score >= confidenceThreshold);

    // Send result back to main thread
    postMessage({
      type: 'pose_result',
      data: {
        keypoints: filteredKeypoints.map(kp => ({
          part: kp.part,
          position: kp.position,
          score: kp.score
        })),
        score: pose.score,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    postMessage({
      type: 'error',
      data: {
        message: 'Pose detection failed',
        error: error.message
      }
    });
  }
}

/**
 * Handle messages from main thread
 */
self.onmessage = async function(event) {
  const { type, data } = event.data;

  switch (type) {
    case 'init':
      settings = data;
      await initialize();
      break;

    case 'start_detection':
      detectionActive = true;
      postMessage({ type: 'status', data: 'Detection started' });
      break;

    case 'stop_detection':
      detectionActive = false;
      postMessage({ type: 'status', data: 'Detection stopped' });
      break;

    case 'update_settings':
      settings = { ...settings, ...data };
      break;

    case 'process_frame':
      await processFrame(data);
      break;

    default:
      postMessage({
        type: 'error',
        data: { message: `Unknown message type: ${type}` }
      });
  }
};

// Handle errors
self.onerror = function(error) {
  postMessage({
    type: 'error',
    data: {
      message: 'Worker error',
      error: error.message
    }
  });
};
