# Test-Driven Development Plan

## Test Strategy

### Testing Pyramid
```
        ┌─────────────┐
        │   E2E (5%)  │  Integration tests with real browser
        ├─────────────┤
        │ Integration │  Component interaction tests
        │    (25%)    │
        ├─────────────┤
        │    Unit     │  Individual function tests
        │    (70%)    │
        └─────────────┘
```

### Testing Tools
- **Test Runner**: Jest 29.x
- **Browser Testing**: web-ext-test-utils
- **Mocking**: Jest mocks
- **Coverage**: Jest coverage reports (target: 80%+)
- **E2E**: Selenium WebDriver with Firefox

## Test Structure

### Directory Layout
```
tests/
├── unit/
│   ├── detection/
│   │   ├── poseAnalyzer.test.js
│   │   ├── postureMetrics.test.js
│   │   └── detectionWorker.test.js
│   ├── background/
│   │   ├── storageManager.test.js
│   │   ├── notificationManager.test.js
│   │   └── alertController.test.js
│   ├── utils/
│   │   ├── mathUtils.test.js
│   │   ├── timeUtils.test.js
│   │   └── validators.test.js
│   └── popup/
│       └── popupController.test.js
├── integration/
│   ├── pose-to-alert.test.js
│   ├── settings-persistence.test.js
│   └── worker-communication.test.js
├── e2e/
│   ├── full-monitoring-session.test.js
│   ├── settings-workflow.test.js
│   └── notification-flow.test.js
├── fixtures/
│   ├── mockPoseData.js
│   ├── mockSettings.js
│   └── mockVideoFrames.js
└── helpers/
    ├── testSetup.js
    └── mockBrowserAPIs.js
```

## Test Cases

### 1. Pose Detection Module

#### Unit Tests

##### 1.1 Pose Analyzer (`tests/unit/detection/poseAnalyzer.test.js`)

```javascript
describe('PoseAnalyzer', () => {
  describe('analyzePose', () => {
    test('should return null when no keypoints provided', () => {});
    test('should return null when confidence below threshold', () => {});
    test('should calculate head forward angle correctly', () => {});
    test('should calculate shoulder asymmetry correctly', () => {});
    test('should return posture score between 0-100', () => {});
    test('should classify posture as GOOD when all metrics healthy', () => {});
    test('should classify posture as WARNING when metrics borderline', () => {});
    test('should classify posture as POOR when metrics exceed thresholds', () => {});
  });

  describe('getHeadForwardAngle', () => {
    test('should calculate angle from nose to shoulder keypoints', () => {});
    test('should return 0 when head aligned vertically', () => {});
    test('should return positive angle when head forward', () => {});
    test('should handle missing keypoints gracefully', () => {});
  });

  describe('getShoulderAsymmetry', () => {
    test('should return 0 when shoulders level', () => {});
    test('should return positive value when left shoulder higher', () => {});
    test('should return positive value when right shoulder higher', () => {});
    test('should handle missing shoulder keypoints', () => {});
  });
});
```

##### 1.2 Posture Metrics (`tests/unit/detection/postureMetrics.test.js`)

```javascript
describe('PostureMetrics', () => {
  describe('calculatePostureScore', () => {
    test('should return 100 for perfect posture', () => {});
    test('should return 0 for worst posture', () => {});
    test('should weight head angle higher than shoulder asymmetry', () => {});
    test('should apply sensitivity multiplier correctly', () => {});
  });

  describe('classifyPosture', () => {
    test('should classify score > 80 as GOOD', () => {});
    test('should classify score 50-80 as WARNING', () => {});
    test('should classify score < 50 as POOR', () => {});
  });

  describe('smoothMetrics', () => {
    test('should average metrics over time window', () => {});
    test('should ignore outliers', () => {});
    test('should handle empty history', () => {});
  });
});
```

##### 1.3 Detection Worker (`tests/unit/detection/detectionWorker.test.js`)

```javascript
describe('DetectionWorker', () => {
  describe('initialization', () => {
    test('should load TensorFlow.js successfully', () => {});
    test('should load PoseNet model', () => {});
    test('should handle model loading failure', () => {});
    test('should set up message handlers', () => {});
  });

  describe('processFrame', () => {
    test('should detect poses from video frame', () => {});
    test('should return keypoints with confidence scores', () => {});
    test('should handle low-quality frames', () => {});
    test('should respect FPS throttling', () => {});
  });

  describe('message handling', () => {
    test('should respond to START_DETECTION message', () => {});
    test('should respond to STOP_DETECTION message', () => {});
    test('should respond to UPDATE_SETTINGS message', () => {});
    test('should post results to main thread', () => {});
  });
});
```

### 2. Background Script Module

#### Unit Tests

##### 2.1 Storage Manager (`tests/unit/background/storageManager.test.js`)

```javascript
describe('StorageManager', () => {
  describe('saveSettings', () => {
    test('should save settings to browser.storage.local', () => {});
    test('should merge with existing settings', () => {});
    test('should validate settings before saving', () => {});
    test('should handle storage quota errors', () => {});
  });

  describe('loadSettings', () => {
    test('should load settings from storage', () => {});
    test('should return default settings if none exist', () => {});
    test('should handle corrupted data', () => {});
  });

  describe('saveStatistics', () => {
    test('should append to statistics history', () => {});
    test('should limit history to max entries', () => {});
    test('should aggregate daily statistics', () => {});
  });
});
```

##### 2.2 Notification Manager (`tests/unit/background/notificationManager.test.js`)

```javascript
describe('NotificationManager', () => {
  describe('showAlert', () => {
    test('should create browser notification', () => {});
    test('should respect cooldown period', () => {});
    test('should not show notification during cooldown', () => {});
    test('should show appropriate icon for severity', () => {});
    test('should include posture score in notification', () => {});
  });

  describe('cooldown logic', () => {
    test('should start cooldown after notification', () => {});
    test('should allow notification after cooldown expires', () => {});
    test('should reset cooldown on user dismiss', () => {});
  });

  describe('notification history', () => {
    test('should track notification timestamps', () => {});
    test('should calculate notification frequency', () => {});
    test('should limit history size', () => {});
  });
});
```

##### 2.3 Alert Controller (`tests/unit/background/alertController.test.js`)

```javascript
describe('AlertController', () => {
  describe('evaluatePosture', () => {
    test('should not alert for GOOD posture', () => {});
    test('should alert after poor posture duration threshold', () => {});
    test('should not alert if duration below threshold', () => {});
    test('should reset timer when posture improves', () => {});
  });

  describe('alert levels', () => {
    test('should escalate alert if posture worsens', () => {});
    test('should de-escalate when posture improves', () => {});
    test('should track consecutive poor posture sessions', () => {});
  });

  describe('snooze functionality', () => {
    test('should disable alerts during snooze period', () => {});
    test('should resume alerts after snooze expires', () => {});
    test('should allow manual snooze cancellation', () => {});
  });
});
```

### 3. Utility Functions

#### Unit Tests

##### 3.1 Math Utils (`tests/unit/utils/mathUtils.test.js`)

```javascript
describe('MathUtils', () => {
  describe('calculateAngle', () => {
    test('should calculate angle between two points', () => {});
    test('should return angle in degrees', () => {});
    test('should handle negative slopes', () => {});
    test('should return 0 for vertical alignment', () => {});
  });

  describe('calculateDistance', () => {
    test('should calculate Euclidean distance', () => {});
    test('should handle 2D points', () => {});
    test('should handle 3D points', () => {});
  });

  describe('normalizeValue', () => {
    test('should normalize to 0-1 range', () => {});
    test('should clamp values outside range', () => {});
    test('should handle reversed ranges', () => {});
  });

  describe('movingAverage', () => {
    test('should calculate simple moving average', () => {});
    test('should handle window size', () => {});
    test('should handle insufficient data', () => {});
  });
});
```

##### 3.2 Validators (`tests/unit/utils/validators.test.js`)

```javascript
describe('Validators', () => {
  describe('validateSettings', () => {
    test('should accept valid settings object', () => {});
    test('should reject invalid sensitivity values', () => {});
    test('should reject negative thresholds', () => {});
    test('should reject invalid alert frequencies', () => {});
    test('should provide detailed error messages', () => {});
  });

  describe('validatePoseData', () => {
    test('should accept valid pose keypoints', () => {});
    test('should reject missing required keypoints', () => {});
    test('should reject invalid confidence scores', () => {});
    test('should reject malformed keypoint data', () => {});
  });
});
```

### 4. Integration Tests

##### 4.1 Pose to Alert Flow (`tests/integration/pose-to-alert.test.js`)

```javascript
describe('Pose Detection to Alert Flow', () => {
  test('should detect poor posture and trigger alert', async () => {
    // 1. Initialize detection with mock video
    // 2. Feed frames with poor posture
    // 3. Wait for duration threshold
    // 4. Verify alert triggered
  });

  test('should not alert for brief poor posture', async () => {
    // 1. Feed poor posture frames
    // 2. Correct posture before threshold
    // 3. Verify no alert
  });

  test('should respect cooldown between alerts', async () => {
    // 1. Trigger first alert
    // 2. Maintain poor posture
    // 3. Verify no second alert during cooldown
    // 4. Verify alert after cooldown expires
  });
});
```

##### 4.2 Settings Persistence (`tests/integration/settings-persistence.test.js`)

```javascript
describe('Settings Persistence', () => {
  test('should save and load settings correctly', async () => {
    // 1. Update settings
    // 2. Verify saved to storage
    // 3. Reload extension
    // 4. Verify settings restored
  });

  test('should apply settings to detection engine', async () => {
    // 1. Change sensitivity setting
    // 2. Verify detection behavior changes
    // 3. Verify thresholds updated
  });

  test('should migrate old settings format', async () => {
    // 1. Load old format settings
    // 2. Verify migration applied
    // 3. Verify functionality preserved
  });
});
```

##### 4.3 Worker Communication (`tests/integration/worker-communication.test.js`)

```javascript
describe('Main Thread to Worker Communication', () => {
  test('should initialize worker successfully', async () => {
    // 1. Create worker
    // 2. Verify ready message received
    // 3. Verify model loaded
  });

  test('should send frames and receive pose data', async () => {
    // 1. Start detection
    // 2. Send video frames
    // 3. Verify pose results returned
    // 4. Verify correct message format
  });

  test('should handle worker errors gracefully', async () => {
    // 1. Trigger worker error
    // 2. Verify error message received
    // 3. Verify recovery attempt
    // 4. Verify user notified
  });
});
```

### 5. End-to-End Tests

##### 5.1 Full Monitoring Session (`tests/e2e/full-monitoring-session.test.js`)

```javascript
describe('Full Monitoring Session E2E', () => {
  test('should complete full monitoring workflow', async () => {
    // 1. Install extension
    // 2. Grant camera permission
    // 3. Start monitoring from popup
    // 4. Simulate poor posture
    // 5. Verify notification displayed
    // 6. Stop monitoring
    // 7. Verify statistics saved
  });

  test('should handle camera disconnection', async () => {
    // 1. Start monitoring
    // 2. Disconnect camera
    // 3. Verify error displayed
    // 4. Reconnect camera
    // 5. Verify monitoring resumes
  });
});
```

##### 5.2 Settings Workflow (`tests/e2e/settings-workflow.test.js`)

```javascript
describe('Settings Workflow E2E', () => {
  test('should configure all settings', async () => {
    // 1. Open options page
    // 2. Change each setting
    // 3. Save settings
    // 4. Verify changes applied
    // 5. Reload extension
    // 6. Verify settings persisted
  });

  test('should complete calibration workflow', async () => {
    // 1. Open calibration
    // 2. Assume good posture
    // 3. Capture baseline
    // 4. Verify baseline saved
    // 5. Verify detection uses baseline
  });
});
```

## Test Fixtures

### Mock Pose Data (`tests/fixtures/mockPoseData.js`)

```javascript
export const goodPosture = {
  keypoints: [
    { part: 'nose', position: { x: 320, y: 100 }, score: 0.9 },
    { part: 'leftEye', position: { x: 310, y: 90 }, score: 0.95 },
    { part: 'rightEye', position: { x: 330, y: 90 }, score: 0.95 },
    { part: 'leftShoulder', position: { x: 280, y: 200 }, score: 0.9 },
    { part: 'rightShoulder', position: { x: 360, y: 200 }, score: 0.9 },
    // ... more keypoints
  ]
};

export const poorPosture = {
  // Head forward, shoulders asymmetric
  keypoints: [
    { part: 'nose', position: { x: 350, y: 120 }, score: 0.85 },
    // ... adjusted positions
  ]
};
```

### Mock Settings (`tests/fixtures/mockSettings.js`)

```javascript
export const defaultSettings = {
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
  }
};
```

## Test Coverage Goals

| Module | Target Coverage | Priority |
|--------|----------------|----------|
| Pose Detection | 90% | Critical |
| Posture Metrics | 95% | Critical |
| Storage Manager | 85% | High |
| Alert Controller | 90% | High |
| Notification Manager | 85% | High |
| Math Utils | 100% | Medium |
| Validators | 100% | Medium |
| UI Components | 70% | Medium |

## Continuous Integration

### Pre-commit Hooks
- Run linter (ESLint)
- Run unit tests
- Check test coverage threshold

### CI Pipeline (GitHub Actions)
```yaml
1. Install dependencies
2. Run linter
3. Run unit tests
4. Run integration tests
5. Run E2E tests (Firefox)
6. Generate coverage report
7. Build extension
8. Run smoke tests on built artifact
```

### Coverage Reports
- Generate HTML coverage reports
- Upload to Codecov or similar
- Fail build if coverage drops below 80%

## Testing Best Practices

1. **Arrange-Act-Assert**: Structure all tests clearly
2. **One assertion per test**: Keep tests focused
3. **Descriptive test names**: Use full sentences
4. **Mock external dependencies**: Isolate units under test
5. **Test edge cases**: Including error conditions
6. **Fast tests**: Unit tests should run in milliseconds
7. **Deterministic**: No flaky tests due to timing/randomness
8. **Clean up**: Reset state between tests
9. **Document complex tests**: Add comments explaining "why"
10. **Continuous refactoring**: Improve tests as code evolves

## Manual Testing Checklist

### Functional Testing
- [ ] Camera permission flow
- [ ] Monitoring start/stop
- [ ] Poor posture detection accuracy
- [ ] Alert notifications display
- [ ] Settings persistence
- [ ] Calibration workflow
- [ ] Statistics accuracy
- [ ] Multiple camera support
- [ ] Performance (CPU/Memory)
- [ ] Error recovery

### Browser Compatibility
- [ ] Firefox 91 (ESR)
- [ ] Firefox Latest
- [ ] Firefox Developer Edition
- [ ] Firefox Nightly

### Platform Testing
- [ ] Windows 10/11
- [ ] macOS (Intel)
- [ ] macOS (Apple Silicon)
- [ ] Linux (Ubuntu)
- [ ] Linux (Fedora)

### Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] High contrast mode
- [ ] Reduced motion support

## Performance Testing

### Metrics to Track
- Time to first detection
- Average frame processing time
- CPU usage during monitoring
- Memory consumption
- Extension load time
- Storage I/O performance

### Load Testing Scenarios
- Continuous monitoring for 8 hours
- Rapid start/stop cycles
- Multiple browser windows
- Low-end hardware simulation
- Limited network bandwidth (for model loading)

## Regression Testing

Maintain suite of regression tests for:
- Previously fixed bugs
- Critical user workflows
- Performance benchmarks
- Compatibility issues

Update regression suite whenever:
- A bug is fixed (add test to prevent recurrence)
- A new feature is added (add test to prevent breakage)
- A critical path changes (update existing tests)
