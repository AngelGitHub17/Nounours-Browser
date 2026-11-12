#!/usr/bin/env bash
# Assemble « Nounours Browser.app » (à lancer sur macOS : CI macos-latest)
#  = Firefox ESR officiel rebrandé + fichiers Nounours + lanceur, re-signé (signature ad hoc).
# Usage : installers/macos/build-app.sh <Firefox.app> <dossier app/ (build/app)> <version>
# Produit : build/release/NounoursBrowser-<v>-mac-universal.dmg et .zip
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FF="${1:?Firefox.app}"; PAYLOAD="${2:?dossier app}"; V="${3:?version}"
STAGE="$ROOT/build/stage-mac"; APP="$STAGE/Nounours Browser.app"
rm -rf "$STAGE"; mkdir -p "$STAGE" "$ROOT/build/release"

ditto "$FF" "$APP"
python3 "$ROOT/tools/brand-engine.py" "$APP" macos

# Fichiers Nounours + lanceur en exécutable principal
ditto "$PAYLOAD" "$APP/Contents/Resources/nounours"
chmod +x "$APP/Contents/Resources/nounours/nounours-browser.sh"
cp "$ROOT/launchers/macos/nounours-launcher" "$APP/Contents/MacOS/nounours-launcher"
chmod +x "$APP/Contents/MacOS/nounours-launcher"
PB=/usr/libexec/PlistBuddy
$PB -c "Set :CFBundleExecutable nounours-launcher" "$APP/Contents/Info.plist"
$PB -c "Set :CFBundleShortVersionString $V" "$APP/Contents/Info.plist"
$PB -c "Set :CFBundleVersion $V" "$APP/Contents/Info.plist"

# Le contenu a changé : nouvelle signature ad hoc (sans « hardened runtime », donc sans entitlements requis)
xattr -cr "$APP"
codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict --verbose=2 "$APP"

# .dmg (glisser dans Applications) — format préféré par NounoursLauncher
DMG_SRC="$ROOT/build/dmg-src"; rm -rf "$DMG_SRC"; mkdir -p "$DMG_SRC"
ditto "$APP" "$DMG_SRC/Nounours Browser.app"
ln -s /Applications "$DMG_SRC/Applications"
hdiutil create -volname "Nounours Browser" -srcfolder "$DMG_SRC" -fs HFS+ -format UDZO -imagekey zlib-level=9 -ov \
  "$ROOT/build/release/NounoursBrowser-$V-mac-universal.dmg"

# .zip portable (LISEZMOI à la racine : le launcher ne « remonte » pas le .app)
cp "$ROOT/launchers/LISEZMOI.txt" "$STAGE/"
(cd "$STAGE" && zip -qry -X "$ROOT/build/release/NounoursBrowser-$V-mac-universal.zip" .)
ls -la "$ROOT/build/release"
