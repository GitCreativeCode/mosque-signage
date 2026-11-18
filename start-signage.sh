#!/usr/bin/env bash
# MosqueSignage - 24/7 Digital Signage Appliance Startup Script
# Supports Linux (Ubuntu, Debian, Raspberry Pi OS) and macOS

set -e

echo "=========================================================="
echo "   MosqueSignage: Local-First Digital Signage Appliance   "
echo "=========================================================="
echo ""

# 1. Verify Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not detected on your system!"
    echo "To run MosqueSignage, please install Node.js (version 22 or newer):"
    echo "https://nodejs.org/"
    exit 1
fi

# 2. Check Node.js major version (require >= 22)
NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])" 2>/dev/null || echo "0")
if [ "$NODE_MAJOR" -lt 22 ]; then
    echo "[WARNING] Detected Node.js version is v$NODE_MAJOR."
    echo "MosqueSignage requires Node.js 22 or newer for native local SQLite support."
    echo "If you encounter errors, please upgrade Node.js from https://nodejs.org/"
    echo ""
fi

# 3. Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "[1/3] First-time setup detected. Installing required packages..."
    npm install
    echo "[SUCCESS] Packages installed successfully!"
    echo ""
fi

# 4. Build application if .next is missing
if [ ! -d ".next" ]; then
    echo "[2/3] Building application for initial launch..."
    npm run build
    echo "[SUCCESS] Build completed!"
    echo ""
fi

# 5. Start the server
echo "[3/3] Starting MosqueSignage appliance server..."
echo "Keep this terminal open. Press Ctrl+C anytime to stop."
echo ""

OPEN_BROWSER=true npm start
