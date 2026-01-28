#!/bin/bash

# Build script for Posture Monitor extension

set -e

echo "🔨 Building Posture Monitor Extension..."

# Get version from manifest.json
VERSION=$(grep -o '"version": "[^"]*' manifest.json | grep -o '[^"]*$')
OUTPUT="posture-monitor-v${VERSION}.xpi"

echo "📦 Version: $VERSION"

# Clean previous build
if [ -f "$OUTPUT" ]; then
  echo "🗑️  Removing previous build..."
  rm "$OUTPUT"
fi

# Create temporary build directory
BUILD_DIR="build_temp"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "📋 Copying files..."

# Copy extension files
cp manifest.json "$BUILD_DIR/"
cp -r src "$BUILD_DIR/"
cp -r assets "$BUILD_DIR/" 2>/dev/null || echo "⚠️  No assets directory found"

# Copy docs for help
mkdir -p "$BUILD_DIR/docs"
cp README.md "$BUILD_DIR/docs/" 2>/dev/null || true

# Create XPI (ZIP with .xpi extension)
echo "🎁 Creating package..."
cd "$BUILD_DIR"
zip -r "../$OUTPUT" . -x "*.DS_Store" -x "__MACOSX/*"
cd ..

# Cleanup
rm -rf "$BUILD_DIR"

echo "✅ Build complete: $OUTPUT"
echo ""
echo "📏 Package size: $(du -h "$OUTPUT" | cut -f1)"
echo ""
echo "To install:"
echo "  1. Open Firefox"
echo "  2. Go to about:addons"
echo "  3. Click the gear icon → Install Add-on From File"
echo "  4. Select $OUTPUT"
echo ""
echo "Or use web-ext for development:"
echo "  web-ext run"
