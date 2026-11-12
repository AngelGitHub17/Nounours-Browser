#!/usr/bin/env bash
# Construit les archives de release pour NounoursLauncher.
# Usage : tools/package.sh [chemin/NounoursBrowser.exe]
#   → build/release/NounoursBrowser-<v>-win-x64.zip, -mac-universal.zip, -linux-x64.zip
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
V="$(python3 -c 'import json,sys;d=json.load(open(sys.argv[1]));print(d.get("version_name") or d["version"])' "$ROOT/extension/manifest.json")"
EXE="${1:-}"
B="$ROOT/build"
rm -rf "$B"; mkdir -p "$B/release"

# 1) extension
"$ROOT/tools/build-xpi.sh" >/dev/null

# 2) contenu commun « app/ »
APP="$B/app"
mkdir -p "$APP/distribution"
cp -R "$ROOT/profile-template" "$APP/"
cp "$ROOT/distribution/policies.json" "$APP/distribution/"
cp "$ROOT/dist/nounours-browser.xpi" "$APP/"
cp "$ROOT/launchers/unix/nounours-browser.sh" "$APP/"
echo "$V" > "$APP/VERSION"

zipdir() { (cd "$1" && zip -qry -X "$2" .); }

# 3) Linux
L="$B/stage-linux"; mkdir -p "$L"
cp -R "$APP" "$L/app"; rm "$L/app/nounours-browser.sh"; cp -p "$ROOT/launchers/unix/nounours-browser.sh" "$L/app/"
cp -p "$ROOT/launchers/unix/nounours-browser" "$L/"
cp "$ROOT/launchers/LISEZMOI.txt" "$ROOT/branding/logo.png" "$L/"
chmod +x "$L/nounours-browser" "$L/app/nounours-browser.sh"
zipdir "$L" "$B/release/NounoursBrowser-$V-linux-x64.zip"

# 4) macOS (.app + LISEZMOI à la racine : le launcher ne « remonte » pas le .app)
M="$B/stage-mac"; C="$M/Nounours Browser.app/Contents"
mkdir -p "$C/MacOS" "$C/Resources"
sed "s/__VERSION__/$V/g" "$ROOT/launchers/macos/Info.plist" > "$C/Info.plist"
cp -p "$ROOT/launchers/macos/NounoursBrowser" "$C/MacOS/"
cp "$ROOT/branding/logo.icns" "$C/Resources/logo.icns"
cp -R "$APP" "$C/Resources/app"
chmod +x "$C/MacOS/NounoursBrowser" "$C/Resources/app/nounours-browser.sh"
cp "$ROOT/launchers/LISEZMOI.txt" "$M/"
zipdir "$M" "$B/release/NounoursBrowser-$V-mac-universal.zip"

# 5) Windows
if [ -n "$EXE" ]; then
  W="$B/stage-win"; mkdir -p "$W"
  cp -R "$APP" "$W/app"; rm "$W/app/nounours-browser.sh"
  cp "$EXE" "$W/NounoursBrowser.exe"
  cp "$ROOT/launchers/LISEZMOI.txt" "$W/"
  zipdir "$W" "$B/release/NounoursBrowser-$V-win-x64.zip"
else
  echo "(NounoursBrowser.exe non fourni : archive Windows ignorée)"
fi

ls -la "$B/release"
