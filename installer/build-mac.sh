#!/bin/sh
# Builds dist/Kara.dmg on macOS: Kara.app (an AppleScript applet) with the app as in git and a
# universal Node (Apple Silicon and Intel). Not signed by Apple: macOS asks to confirm the first opening.
#   sh installer/build-mac.sh [version]
set -eu
VERSION="${1:-0.1.0}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="$ROOT/build/mac"
APP="$BUILD/Kara.app"
rm -rf "$BUILD" && mkdir -p "$BUILD" "$ROOT/dist"

# 1. The applet.
osacompile -s -o "$APP" "$ROOT/installer/Kara.applescript"
RES="$APP/Contents/Resources"

# 2. The app as committed, without what only developers need.
mkdir -p "$RES/app"
git -C "$ROOT" archive --format=tar HEAD | tar -x -C "$RES/app"
for dev in test tools worker installer docs .github CLAUDE.md wrangler.jsonc apercus.bat update.bat start.bat install.ps1 install.sh; do rm -rf "$RES/app/$dev"; done
git -C "$ROOT" rev-parse HEAD | tr -d '\n' > "$RES/app/.version"

# 3. Universal Node (latest 24.x), checked against the official checksums.
BASE=https://nodejs.org/dist/latest-v24.x
curl -fsSL "$BASE/SHASUMS256.txt" -o "$BUILD/SHASUMS256.txt"
mkdir -p "$RES/node/bin"
for arch in arm64 x64; do
  NAME=$(grep -o "node-v[0-9.]*-darwin-$arch.tar.gz" "$BUILD/SHASUMS256.txt" | head -1)
  curl -fsSL "$BASE/$NAME" -o "$BUILD/$NAME"
  (cd "$BUILD" && grep " $NAME\$" SHASUMS256.txt | shasum -a 256 -c -)
  tar -xzf "$BUILD/$NAME" -C "$BUILD"
  cp "$BUILD/${NAME%.tar.gz}/bin/node" "$BUILD/node-$arch"
  cp "$BUILD/${NAME%.tar.gz}/LICENSE" "$RES/node/LICENSE"
done
lipo -create "$BUILD/node-arm64" "$BUILD/node-x64" -output "$RES/node/bin/node"
chmod +x "$RES/node/bin/node"

# 4. The Kara icon.
ICONSET="$BUILD/kara.iconset"
mkdir -p "$ICONSET"
for s in 16 32 128 256 512; do
  sips -z $s $s "$ROOT/public/icons/icon-512.png" --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
  d=$((s * 2)); [ $d -le 512 ] && sips -z $d $d "$ROOT/public/icons/icon-512.png" --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$RES/applet.icns"

# 5. Name, version, and a local signature (no Apple account): the files inside changed, so sign again.
/usr/libexec/PlistBuddy -c "Set :CFBundleName Kara" "$APP/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleShortVersionString string $VERSION" "$APP/Contents/Info.plist" 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" "$APP/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string design.dashdash.kara" "$APP/Contents/Info.plist" 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier design.dashdash.kara" "$APP/Contents/Info.plist"
# Smoke test on this Mac: the bundled Node runs and the server answers from inside the app.
"$RES/node/bin/node" --version
(cd "$RES/app" && PORT=3299 "$RES/node/bin/node" server.js > "$BUILD/server.log" 2>&1 & echo $! > "$BUILD/server.pid")
ok=0; for i in $(seq 1 40); do curl -fsS -m 2 http://127.0.0.1:3299/api/config > /dev/null 2>&1 && ok=1 && break; sleep 0.5; done
kill "$(cat "$BUILD/server.pid")" 2>/dev/null || true
[ "$ok" = 1 ] || { cat "$BUILD/server.log"; echo "The server inside Kara.app did not answer"; exit 1; }
echo "Kara.app: server answered"
codesign --force --deep --sign - "$APP"

# 6. The disk image: Kara.app and a shortcut to Applications.
STAGE="$BUILD/dmg"
mkdir -p "$STAGE"
cp -R "$APP" "$STAGE/"
ln -s /Applications "$STAGE/Applications"
hdiutil create -volname Kara -srcfolder "$STAGE" -ov -format UDZO "$ROOT/dist/Kara.dmg"
ls -l "$ROOT/dist/Kara.dmg"
