# Windows Installation Guide

Complete guide for building and running Posture Monitor extension on Windows.

## Prerequisites

### 1. Install Bun

Open PowerShell as Administrator and run:

```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

Or download installer from: https://bun.sh/

### 2. Install Git (Optional)

Download from: https://git-scm.com/download/win

Or use GitHub Desktop: https://desktop.github.com/

### 3. Install Firefox

Download from: https://www.mozilla.org/firefox/

## Installation Steps

### Option 1: Using Git

```powershell
# Clone repository
git clone https://github.com/amaralkaff/posture-monitor-extension.git
cd posture-monitor-extension

# Install dependencies
bun install

# Run tests (optional)
bun test
```

### Option 2: Download ZIP

1. Go to: https://github.com/amaralkaff/posture-monitor-extension
2. Click **Code** → **Download ZIP**
3. Extract the ZIP file
4. Open PowerShell in the extracted folder
5. Run: `bun install`

## Building the Extension

### Method 1: Using PowerShell Script

```powershell
.\build.ps1
```

This will create `posture-monitor-v1.0.0.xpi` file.

### Method 2: Using Bun Script

```powershell
bun run build
```

Note: This runs the bash script which requires Git Bash or WSL.

### Method 3: Manual Build

If you don't have zip tools:

1. Install 7-Zip from: https://www.7-zip.org/
2. Select these files/folders:
   - `manifest.json`
   - `src/` folder
   - `assets/` folder
   - `icons/` folder
3. Right-click → 7-Zip → Add to archive
4. Format: ZIP
5. Archive name: `posture-monitor-v1.0.0.zip`
6. Rename to: `posture-monitor-v1.0.0.xpi`

## Loading in Firefox

### Temporary Installation (for development)

1. Open Firefox
2. Type in address bar: `about:debugging#/runtime/this-firefox`
3. Click **This Firefox** (left sidebar)
4. Click **Load Temporary Add-on**
5. Navigate to the extension folder
6. Select `manifest.json`
7. Extension will be loaded (removed on Firefox restart)

### Permanent Installation (from .xpi file)

1. Build the extension first (see above)
2. Open Firefox
3. Type in address bar: `about:addons`
4. Click the gear icon (⚙️)
5. Select **Install Add-on From File**
6. Choose the `.xpi` file you built
7. Click **Add** when prompted

Note: You may need to enable installation from unsigned extensions:
- Type `about:config` in Firefox
- Search for `xpinstall.signatures.required`
- Set to `false` (Firefox Developer Edition/Nightly only)

## Development

### Running Tests

```powershell
bun test                    # Run all tests
bun run test:coverage       # With coverage
bun run test:watch          # Watch mode
```

### Running in Development Mode

```powershell
bun run dev
```

This will:
- Auto-reload extension on file changes
- Open Firefox with extension loaded
- Show debug console

### Linting

```powershell
bun run lint                # Check for errors
bun run lint:fix            # Auto-fix issues
```

## Troubleshooting

### "bun: command not found"

- Restart PowerShell after installing Bun
- Or add Bun to PATH manually: `C:\Users\YourName\.bun\bin`

### "Cannot be loaded because running scripts is disabled"

Run in PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "zip: command not found" when running build.sh

Use `build.ps1` instead:
```powershell
.\build.ps1
```

Or install Git Bash (included with Git for Windows).

### Extension not loading in Firefox

- Make sure you selected `manifest.json` file
- Check Firefox Developer Console (F12) for errors
- Try Firefox Developer Edition for easier testing

### Camera permission denied

- Click the camera icon in Firefox address bar
- Allow camera access for the extension
- Reload the extension

## Common Commands Reference

```powershell
# Install dependencies
bun install

# Run tests
bun test

# Build extension
.\build.ps1

# Run in development mode
bun run dev

# Lint code
bun run lint

# Update dependencies
bun update
```

## Additional Resources

- Bun Documentation: https://bun.sh/docs
- Firefox Extension Workshop: https://extensionworkshop.com/
- MDN Web Extensions: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions
- Project Repository: https://github.com/amaralkaff/posture-monitor-extension

## Support

For issues or questions:
- GitHub Issues: https://github.com/amaralkaff/posture-monitor-extension/issues
- Check existing issues first
- Provide Windows version and error messages
