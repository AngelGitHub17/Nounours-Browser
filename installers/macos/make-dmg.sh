#!/usr/bin/env bash
# Crée le .dmg macOS à partir de build/stage-mac (à lancer sur macOS : CI macos-latest)
# Usage : installers/macos/make-dmg.sh <version>
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
V="${1:?version}"
SRC="$ROOT/build/dmg-src"
rm -rf "$SRC"; mkdir -p "$SRC"
ditto "$ROOT/build/stage-mac/Nounours Browser.app" "$SRC/Nounours Browser.app"
ln -s /Applications "$SRC/Applications"
mkdir -p "$ROOT/build/release"
OUT="$ROOT/build/release/NounoursBrowser-$V-mac-universal.dmg"
rm -f "$OUT"
hdiutil create -volname "Nounours Browser" -srcfolder "$SRC" -fs HFS+ -format UDZO -imagekey zlib-level=9 -ov "$OUT"
echo "OK : $OUT"
