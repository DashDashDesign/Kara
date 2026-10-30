#!/bin/sh
# Starts Kara and opens it in its own Google Chrome window (macOS and Linux).
# Without Chrome (or Chromium on Linux), it opens in the default browser and says how to get Chrome.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it from https://nodejs.org then run this file again."
  exit 1
fi
url=http://localhost:3210
profile="${HOME}/.kara/browser-chrome"
flags="--app=$url --user-data-dir=$profile --no-first-run --no-default-browser-check --disable-sync --disable-extensions --disable-features=Translate --window-size=1440,900"
open_window() {
  sleep 2
  if [ "$(uname)" = "Darwin" ] && open -Ra "Google Chrome" >/dev/null 2>&1; then
    open -na "Google Chrome" --args $flags
    return
  fi
  for c in google-chrome google-chrome-stable chromium chromium-browser; do
    if command -v "$c" >/dev/null 2>&1; then
      "$c" $flags >/dev/null 2>&1 &
      return
    fi
  done
  echo "Kara works best in Google Chrome: https://www.google.com/chrome/"
  if command -v open >/dev/null 2>&1; then open "$url"; elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$url" >/dev/null 2>&1; fi
}
open_window &
exec node server.js
