#!/bin/sh
# Kara: one-line install for macOS and Linux.
#   curl -fsSL https://raw.githubusercontent.com/DashDashDesign/Kara/main/install.sh | sh
# Downloads the latest version into ~/kara, keeps your .env (your keys)
# and starts the app. Run it again to update.
set -e
REPO=DashDashDesign/Kara
DEST="${KARA_DIR:-$HOME/kara}"

echo
echo "Kara: install"

major=$(node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/')
if [ -z "$major" ] || [ "$major" -lt 18 ]; then
  echo "Node.js 18 or newer is needed. Install it from https://nodejs.org, then run this command again."
  exit 1
fi

tmp=$(mktemp -d)
echo "Downloading the app..."
# The exact latest version, remembered in .version so the app's Update button knows where it stands.
sha=$(curl -fsSL "https://api.github.com/repos/$REPO/commits/main" 2>/dev/null | grep -o '"sha": *"[0-9a-f]\{40\}"' | head -n 1 | grep -o '[0-9a-f]\{40\}')
curl -fsSL "https://codeload.github.com/$REPO/tar.gz/${sha:-refs/heads/main}" | tar -xz -C "$tmp"
mkdir -p "$DEST"
# Copy over the old version; .env and the files you added stay where they are.
cp -R "$tmp"/*/. "$DEST"/
rm -rf "$tmp"
[ -n "$sha" ] && echo "$sha" > "$DEST/.version"
chmod +x "$DEST/start.sh"

echo "Installed in $DEST"
echo "Starting: the app opens at http://localhost:3210 (Ctrl+C to stop it)."
echo "Next time: $DEST/start.sh"
cd "$DEST"
exec ./start.sh
