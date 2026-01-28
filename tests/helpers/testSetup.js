/**
 * Jest Test Setup
 * Global configuration and mocks for all tests
 */

// Mock browser API
global.browser = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`),
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  notifications: {
    create: jest.fn(),
    clear: jest.fn(),
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    clearAll: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
    },
  },
};

// Mock MediaPipe models
global.pose = {
  Pose: jest.fn().mockImplementation(() => ({
    setOptions: jest.fn(),
    onResults: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
  })),
};

// Mock Canvas and 2D Context
class MockCanvasRenderingContext2D {
  constructor() {
    this.canvas = { width: 640, height: 480 };
  }
  clearRect = jest.fn();
  fillRect = jest.fn();
  strokeRect = jest.fn();
  beginPath = jest.fn();
  moveTo = jest.fn();
  lineTo = jest.fn();
  arc = jest.fn();
  stroke = jest.fn();
  fill = jest.fn();
  save = jest.fn();
  restore = jest.fn();
  translate = jest.fn();
  rotate = jest.fn();
  scale = jest.fn();
  drawImage = jest.fn();
  getImageData = jest.fn(() => ({ data: new Uint8ClampedArray(4) }));
  putImageData = jest.fn();
}

HTMLCanvasElement.prototype.getContext = jest.fn((type) => {
  if (type === '2d') return new MockCanvasRenderingContext2D();
  return null;
});

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
});

Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
});

// Mock MediaStream
global.MediaStream = jest.fn().mockImplementation(() => ({
  getTracks: jest.fn(() => []),
  getVideoTracks: jest.fn(() => []),
}));

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue(new MediaStream()),
    enumerateDevices: jest.fn().mockResolvedValue([
      { kind: 'videoinput', deviceId: 'camera1', label: 'Front Camera' },
    ]),
  },
});

// Console spy setup (suppress logs in tests unless debugging)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Cleanup after tests
afterEach(() => {
  jest.restoreAllMocks();
});
