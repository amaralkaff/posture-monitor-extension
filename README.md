# Posture Monitor - Firefox Extension

A privacy-first browser extension that monitors your posture in real-time using AI-powered pose detection. Improve your ergonomics with smart, non-intrusive alerts.

## Features

✅ **Real-Time Posture Monitoring** - Continuous webcam-based pose detection  
✅ **AI-Powered Detection** - Uses TensorFlow.js and PoseNet for accurate body keypoint detection  
✅ **Smart Alerts** - Configurable notifications when poor posture is detected  
✅ **Privacy-First** - 100% local processing, no data leaves your browser  
✅ **Customizable** - Adjustable sensitivity, thresholds, and alert settings  
✅ **Minimal Performance Impact** - Optimized with Web Workers and configurable FPS  
✅ **Statistics Tracking** - Monitor your posture trends over time  
✅ **Calibration** - Personalize detection to your body and setup  

## Installation

### From Source (Development)

1. **Clone or download this repository**
   ```bash
   cd ~/clawd/posture-monitor-extension
   ```

2. **Load extension in Firefox**
   - Open Firefox
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from this directory

3. **Grant camera permission**
   - When prompted, allow camera access
   - Camera is only used when monitoring is active

### From Package

```bash
# Build the extension package
./build.sh

# Install the generated .xpi file in Firefox
```

## Quick Start

1. **Click the extension icon** in the toolbar
2. **Click "Start Monitoring"** - Grant camera permission if requested
3. **Sit in your best posture** for calibration (optional but recommended)
4. **Receive alerts** when your posture needs correction

## Configuration

### Sensitivity Levels
- **Low**: Relaxed detection, fewer alerts
- **Medium**: Balanced (recommended)
- **High**: Strict detection, more alerts

### Posture Thresholds
- **Head Forward Angle**: Maximum angle before triggering alert (default: 15°)
- **Shoulder Asymmetry**: Maximum shoulder height difference (default: 10°)
- **Poor Posture Duration**: How long before alerting (default: 30 seconds)

### Alert Settings
- **Alert Cooldown**: Minimum time between alerts (default: 5 minutes)
- **Sound Alerts**: Optional audio notification
- **Enable/Disable**: Toggle alerts on/off

### Detection Settings
- **Frame Rate**: 1-10 FPS (default: 5 FPS) - Lower uses less CPU
- **Confidence Threshold**: Minimum confidence for detection (default: 0.5)

## How It Works

### Architecture

```
┌─────────────────────────────────────┐
│   Browser Extension (Firefox)       │
├─────────────────────────────────────┤
│                                     │
│  Popup UI ←→ Background Script ←──┐ │
│                    ↕               │ │
│  Options Page      │               │ │
│                    ↓               │ │
│  Detection Window (Hidden)         │ │
│  ┌───────────────────────────────┐ │ │
│  │ Camera Stream                 │ │ │
│  │      ↓                        │ │ │
│  │ Web Worker (TensorFlow.js)    │ │ │
│  │      ↓                        │ │ │
│  │ PoseNet Model                 │ │ │
│  │      ↓                        │ │ │
│  │ Pose Analyzer                 │ │ │
│  │      ↓                        │ │ │
│  └──→ Posture Metrics ────────────┼─┘ │
│           ↓                        │
│  Alert System                      │
│           ↓                        │
│  Browser Notifications             │
└─────────────────────────────────────┘
```

### Detection Pipeline

1. **Video Capture**: Webcam stream accessed via `getUserMedia`
2. **Frame Processing**: Frames sent to Web Worker at configured FPS
3. **Pose Detection**: TensorFlow.js PoseNet estimates body keypoints
4. **Analysis**: Keypoints analyzed for posture metrics:
   - Head forward angle (forward head posture)
   - Shoulder asymmetry (uneven shoulders)
   - Neck angle (slouching)
5. **Scoring**: Metrics combined into 0-100 posture score
6. **Classification**: Score mapped to status (Good/Warning/Poor)
7. **Alerting**: Notifications triggered based on thresholds and cooldown

### Privacy & Security

- ✅ **Local Processing**: All AI models run in your browser
- ✅ **No External Servers**: No data transmitted anywhere
- ✅ **No Storage of Video**: Only metrics are saved locally
- ✅ **Camera Control**: Camera only active during monitoring
- ✅ **Open Source**: Full transparency of code

## Project Structure

```
posture-monitor-extension/
├── manifest.json                 # Extension manifest
├── src/
│   ├── background/
│   │   └── background.js         # Background script (coordinates everything)
│   ├── detection/
│   │   ├── detection.html        # Detection page (hidden window)
│   │   ├── detection.js          # Detection page script
│   │   ├── detectionWorker.js    # Web Worker (TensorFlow.js)
│   │   └── poseAnalyzer.js       # Posture analysis logic
│   ├── popup/
│   │   ├── popup.html            # Extension popup UI
│   │   ├── popup.css             # Popup styles
│   │   └── popup.js              # Popup controller
│   ├── options/
│   │   ├── options.html          # Settings page
│   │   ├── options.css           # Settings styles
│   │   └── options.js            # Settings controller
│   └── utils/
│       ├── constants.js          # Shared constants
│       ├── mathUtils.js          # Math utilities
│       └── validators.js         # Validation functions
├── assets/
│   └── icons/                    # Extension icons
├── docs/
│   ├── PRD.md                    # Product Requirements Document
│   ├── TDD.md                    # Test-Driven Development Plan
│   └── help.html                 # User help documentation
├── tests/                        # Test suite
├── build.sh                      # Build script
└── README.md                     # This file
```

## Development

### Prerequisites
- Firefox 91+ (for development)
- Text editor or IDE
- Basic understanding of JavaScript and browser extensions

### Setup Development Environment

```bash
# Navigate to extension directory
cd ~/clawd/posture-monitor-extension

# Edit source files
# No build step needed for development!

# Load in Firefox
# about:debugging → Load Temporary Add-on → manifest.json
```

### Testing

The project includes a comprehensive Test-Driven Development (TDD) test suite with unit, integration, and end-to-end tests.

#### Running Tests

```bash
# Install test dependencies (first time only)
npm install

# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run only unit tests
npm test -- tests/unit/

# Run only integration tests
npm run test:integration

# Run only end-to-end tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

#### Test Coverage

The test suite covers:
- **Unit Tests** (`tests/unit/`)
  - `mathUtils.test.js` - Mathematical calculations (angles, distances, averaging)
  - `validators.test.js` - Settings validation and sanitization
  - `constants.test.js` - Application constants and enums
  - `poseAnalyzer.test.js` - Posture analysis and scoring logic

- **Integration Tests** (`tests/integration/`)
  - `detection-flow.test.js` - Complete detection pipeline
  - `alert-system.test.js` - Alert triggering and cooldowns
  - `settings-persistence.test.js` - Settings storage and retrieval

- **E2E Tests** (`tests/e2e/`)
  - `full-workflow.test.js` - Complete application lifecycle

- **Test Fixtures** (`tests/fixtures/`)
  - `mockPoseData.js` - Pre-defined pose data (good/bad postures)
  - `mockSettings.js` - Settings configurations

- **Test Helpers** (`tests/helpers/`)
  - `testSetup.js` - Jest configuration and global mocks
  - `testUtils.js` - Utility functions for testing

#### Coverage Requirements

Minimum coverage thresholds:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

View coverage report at: `coverage/lcov-report/index.html` after running `npm run test:coverage`

### Building for Production

```bash
# Build extension package
./build.sh

# Output: posture-monitor-v1.0.0.xpi
```

### Code Style

- ES6+ JavaScript (modules)
- No external build tools (vanilla JS)
- Consistent formatting
- Comprehensive comments
- Modular architecture

## Performance

### Benchmarks
- **CPU Usage**: < 10% on average hardware
- **Memory**: < 150MB during active monitoring
- **Detection Latency**: < 200ms per frame
- **Extension Load Time**: < 2 seconds

### Optimization Tips
- **Lower FPS**: Reduce detection frame rate to 3-5 FPS
- **Higher Confidence**: Increase confidence threshold to 0.6+
- **Reduce Sensitivity**: Use "Low" sensitivity setting
- **Close Other Tabs**: Minimize browser resource usage

## Troubleshooting

### Camera Not Working
- **Check permissions**: Ensure camera access is granted
- **Check hardware**: Verify camera is connected and working
- **Check other apps**: Close other applications using the camera
- **Restart Firefox**: Sometimes helps resolve camera issues

### Poor Detection Accuracy
- **Improve lighting**: Ensure face and shoulders are well-lit
- **Adjust position**: Sit directly facing the camera
- **Calibrate**: Use calibration feature for personalized baseline
- **Adjust sensitivity**: Try different sensitivity settings

### High CPU Usage
- **Lower FPS**: Reduce to 3 FPS in settings
- **Close tabs**: Reduce overall browser load
- **Update Firefox**: Ensure you're using the latest version
- **Check hardware**: Older computers may struggle

### Alerts Not Showing
- **Check settings**: Ensure alerts are enabled
- **Check cooldown**: Wait for cooldown period to expire
- **Check permissions**: Verify notification permissions granted
- **Check duration**: Ensure poor posture duration threshold is met

## FAQ

**Q: Does this extension collect my data?**  
A: No. All processing happens locally in your browser. No data is transmitted anywhere.

**Q: Can I use this without a camera?**  
A: No, the extension requires a webcam for pose detection.

**Q: Does it work in all tabs?**  
A: The monitoring runs in the background and works regardless of which tab is active.

**Q: Will it drain my battery?**  
A: It uses some CPU/battery for processing. Lower the FPS setting to reduce impact.

**Q: Can I use it on mobile?**  
A: Currently only desktop Firefox is supported.

**Q: Is the detection accurate?**  
A: PoseNet is highly accurate for body keypoint detection. Calibration improves personalization.

**Q: What if I temporarily need to slouch?**  
A: Use the "Snooze" button to pause alerts for 15 minutes.

## Contributing

Contributions are welcome! Please:

1. Read the PRD and TDD documents
2. Follow existing code style
3. Add tests for new features
4. Update documentation
5. Submit pull requests

## License

MIT License - See LICENSE file for details

## Credits

- **TensorFlow.js**: Machine learning framework
- **PoseNet**: Pose estimation model
- **Firefox WebExtensions API**: Extension platform

## Support

For issues, questions, or feature requests:
- GitHub Issues: [Link to repo]
- Email: support@example.com
- Documentation: See `docs/` folder

## Roadmap

### v1.1
- [ ] Sitting duration tracker
- [ ] Break reminders
- [ ] Exercise suggestions

### v1.2
- [ ] Advanced analytics dashboard
- [ ] Data export functionality
- [ ] Multiple calibration profiles

### v2.0
- [ ] Chrome support
- [ ] Mobile app companion
- [ ] Machine learning improvements
- [ ] Gamification features

## Changelog

### v1.0.0 (Initial Release)
- ✅ Real-time posture monitoring
- ✅ AI-powered pose detection
- ✅ Configurable alerts
- ✅ Privacy-first architecture
- ✅ Statistics tracking
- ✅ Calibration support
- ✅ Clean UI

---

**Made with ❤️ for better posture and healthier computing**
