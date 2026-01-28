# 🧍‍♂️ Posture Monitor

**Privacy-first Firefox extension for real-time posture monitoring using AI**

Monitor your sitting posture and get smart alerts to improve ergonomics. All processing happens locally in your browser - zero data collection.

[![Tests](https://img.shields.io/badge/tests-244%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Firefox](https://img.shields.io/badge/firefox-91%2B-orange)]()

## ✨ Features

- 🤖 **AI-Powered Detection** - TensorFlow.js + PoseNet for accurate pose estimation
- 🔒 **100% Private** - All processing local, no data leaves your browser
- ⚡ **Lightweight** - <10% CPU usage, <150MB memory
- 🎯 **Smart Alerts** - Configurable notifications for poor posture
- ⚙️ **Customizable** - Adjust sensitivity, thresholds, and alert timing
- 📊 **Statistics** - Track your posture trends over time
- 🎨 **Clean UI** - Simple popup and settings page

## 🚀 Quick Start

### Installation

1. Download this extension:
   ```bash
   git clone https://github.com/amaralkaff/posture-monitor-extension.git
   cd posture-monitor-extension
   ```

2. Load in Firefox:
   - Open Firefox
   - Go to `about:debugging#/runtime/this-firefox`
   - Click **Load Temporary Add-on**
   - Select `manifest.json`

3. Grant camera permission when prompted

4. Click extension icon → **Start Monitoring**

### Usage

- Click the extension icon to see your current posture status
- Adjust settings via the gear icon
- Get notifications when you slouch for too long
- Use calibration for personalized detection

## 🧪 Development

### Prerequisites
- Node.js 14+
- Firefox 91+

### Setup
```bash
npm install
```

### Testing
```bash
npm test                 # Run all tests
npm run test:coverage    # With coverage report
npm run test:watch       # Watch mode
```

### Build
```bash
./build.sh              # Creates .xpi package
```

## 🔧 How It Works

1. **Camera** → Captures your webcam feed (5-10 FPS)
2. **AI Model** → TensorFlow.js PoseNet detects body keypoints
3. **Analysis** → Calculates head angle, shoulder symmetry, neck posture
4. **Score** → Generates 0-100 posture score
5. **Alerts** → Notifies you when posture is poor for too long

**Metrics Detected:**
- Forward head posture (ear-to-shoulder alignment)
- Shoulder asymmetry (uneven shoulders)
- Neck angle deviation

## ⚙️ Configuration

Customize in Settings:

- **Sensitivity:** Low / Medium / High
- **Head Forward Angle:** Max angle before alert (default: 15°)
- **Shoulder Asymmetry:** Max height difference (default: 10°)
- **Alert Cooldown:** Time between alerts (default: 5 min)
- **Detection FPS:** 1-10 FPS (default: 5)

## 📊 Architecture

```
Extension
├── Popup UI           # Current status, quick controls
├── Settings Page      # Full configuration
├── Background Script  # Coordinates everything
└── Detection Window   # Hidden page with:
    ├── Camera Stream
    ├── Web Worker (TensorFlow.js)
    ├── PoseNet Model
    └── Posture Analyzer
```

## 🗺️ Roadmap

### v1.1 (Next Release)
- [ ] Sitting duration tracker
- [ ] Break reminders (20-20-20 rule)
- [ ] Exercise suggestions
- [ ] Dark mode UI

### v1.2
- [ ] Advanced analytics dashboard
- [ ] Data export (CSV/JSON)
- [ ] Multiple calibration profiles
- [ ] Custom alert sounds

### v2.0
- [ ] Chrome/Edge support
- [ ] Mobile companion app
- [ ] Gamification (streaks, achievements)
- [ ] ML model improvements
- [ ] Multi-language support

## 📝 Documentation

- [Product Requirements Document](docs/PRD.md)
- [Test-Driven Development Plan](docs/TDD.md)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

## 🔐 Privacy

- ✅ All AI processing runs locally in your browser
- ✅ No data transmitted to any server
- ✅ No analytics or tracking
- ✅ Camera only active during monitoring
- ✅ No video/images stored

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Credits

- **TensorFlow.js** - Machine learning framework
- **PoseNet** - Pose estimation model
- Built with ❤️ for better posture and healthier computing

---

**Made by [@amaralkaff](https://github.com/amaralkaff)**

⭐ Star this repo if you find it useful!
