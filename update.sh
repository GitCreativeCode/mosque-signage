#!/usr/bin/env bash
# MosqueSignage - 1-Click Appliance Updater for Linux & macOS

set -e

echo "=========================================================="
echo "      MosqueSignage: 1-Click Appliance Updater            "
echo "=========================================================="
echo ""

# 1. Verify Git is available
if ! command -v git >/dev/null 2>&1; then
    echo "[ERROR] Git command-line tool was not detected."
    echo "If you downloaded as a ZIP archive, please download the newest release from:"
    echo "https://github.com/GitCreativeCode/mosque-signage/releases"
    exit 1
fi

# 2. Check for local uncommitted changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    echo "[WARNING] You have local modifications in your project files."
    echo "If the update encounters conflicts, run 'git stash' before updating."
    echo ""
fi

# 3. Pull newest version from GitHub
echo "[1/3] Downloading latest updates from GitHub..."
git pull origin main || git pull

# 4. Update dependencies
echo ""
echo "[2/3] Checking and updating packages..."
npm install

# 5. Rebuild the application
echo ""
echo "[3/3] Rebuilding MosqueSignage application..."
npm run build

echo ""
echo "=========================================================="
echo "  UPDATE COMPLETED SUCCESSFULLY!"
echo "=========================================================="
echo ""
echo "You can now run './start-signage.sh' to launch the updated system."
echo ""
