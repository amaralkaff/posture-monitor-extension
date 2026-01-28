# Build script for Posture Monitor extension (Windows PowerShell)

Write-Host "🔨 Building Posture Monitor Extension..." -ForegroundColor Cyan

# Get version from manifest.json
$manifest = Get-Content manifest.json | ConvertFrom-Json
$version = $manifest.version
$output = "posture-monitor-v$version.xpi"

Write-Host "📦 Version: $version" -ForegroundColor Green

# Clean previous build
if (Test-Path $output) {
    Write-Host "🗑️  Removing previous build..." -ForegroundColor Yellow
    Remove-Item $output
}

# Create temporary build directory
$buildDir = "build_temp"
if (Test-Path $buildDir) {
    Remove-Item -Recurse -Force $buildDir
}
New-Item -ItemType Directory -Path $buildDir | Out-Null

Write-Host "📋 Copying files..." -ForegroundColor Cyan

# Copy extension files
Copy-Item manifest.json $buildDir\
Copy-Item -Recurse src $buildDir\
if (Test-Path assets) {
    Copy-Item -Recurse assets $buildDir\
}
if (Test-Path icons) {
    Copy-Item -Recurse icons $buildDir\
}

# Copy docs for help
New-Item -ItemType Directory -Path "$buildDir\docs" -Force | Out-Null
if (Test-Path README.md) {
    Copy-Item README.md "$buildDir\docs\"
}

# Create XPI (ZIP with .xpi extension)
Write-Host "🎁 Creating package..." -ForegroundColor Cyan
Compress-Archive -Path "$buildDir\*" -DestinationPath $output -Force

# Cleanup
Remove-Item -Recurse -Force $buildDir

Write-Host "✅ Build complete: $output" -ForegroundColor Green
Write-Host ""
$size = (Get-Item $output).Length / 1KB
Write-Host "📏 Package size: $([math]::Round($size, 2)) KB" -ForegroundColor Cyan
Write-Host ""
Write-Host "To install:" -ForegroundColor Yellow
Write-Host "  1. Open Firefox"
Write-Host "  2. Go to about:addons"
Write-Host "  3. Click the gear icon → Install Add-on From File"
Write-Host "  4. Select $output"
Write-Host ""
Write-Host "Or use web-ext for development:" -ForegroundColor Yellow
Write-Host "  bun run dev"
