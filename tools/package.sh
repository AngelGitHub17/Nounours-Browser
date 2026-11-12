#!/usr/bin/env bash
# Construit les paquets de Nounours Browser.
# Usage : tools/package.sh [chemin/NounoursBrowser.exe]
#
# build/release/ :
#   NounoursBrowser-<v>-linux-x64.zip        Linux portable
#   NounoursBrowser-<v>-x86_64.AppImage      Linux (installé et mis à jour par NounoursLauncher)
#   nounours-browser_<v>_amd64.deb           Linux Debian / Ubuntu
#   NounoursBrowser-<v>-mac-universal.zip    macOS portable (.app)
#   NounoursBrowser-<v>-win-x64.zip          Windows portable (si l'exe est fourni)
# build/stage-mac/  → .dmg (installers/macos/make-dmg.sh, sur macOS)
# build/stage-win/  → setup.exe (installers/windows/NounoursBrowser.iss, sur Windows)
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
cp -p "$ROOT/launchers/unix/nounours-browser.sh" "$APP/"
chmod +x "$APP/nounours-browser.sh"
echo "$V" > "$APP/VERSION"

zipdir() { (cd "$1" && zip -qry -X "$2" .); }

# 3) Linux portable
L="$B/stage-linux"; mkdir -p "$L"
cp -Rp "$APP" "$L/app"
cp -p "$ROOT/launchers/unix/nounours-browser" "$L/"
cp "$ROOT/launchers/LISEZMOI.txt" "$ROOT/branding/logo.png" "$L/"
chmod +x "$L/nounours-browser"
zipdir "$L" "$B/release/NounoursBrowser-$V-linux-x64.zip"

# 4) Linux AppImage
if command -v appimagetool >/dev/null || [ -n "${APPIMAGETOOL:-}" ]; then
  AD="$B/AppDir"; mkdir -p "$AD"
  cp -Rp "$APP" "$AD/app"
  cat > "$AD/AppRun" <<'R'
#!/usr/bin/env bash
HERE="$(dirname "$(readlink -f "$0")")"
exec "$HERE/app/nounours-browser.sh" "$@"
R
  chmod +x "$AD/AppRun"
  cp "$ROOT/installers/linux/nounours-browser.desktop" "$AD/"
  cp "$ROOT/branding/logo.png" "$AD/nounours-browser.png"
  cp "$ROOT/branding/logo.png" "$AD/.DirIcon"
  ARCH=x86_64 VERSION="$V" "${APPIMAGETOOL:-appimagetool}" ${APPIMAGETOOL_ARGS:-} --no-appstream "$AD" "$B/release/NounoursBrowser-$V-x86_64.AppImage" >/dev/null
else
  echo "(appimagetool absent : AppImage ignorée)"
fi

# 5) Linux .deb
if command -v dpkg-deb >/dev/null; then
  D="$B/deb"
  mkdir -p "$D/DEBIAN" "$D/opt/nounours-browser" "$D/usr/bin" "$D/usr/share/applications" "$D/usr/share/icons/hicolor/256x256/apps" "$D/usr/share/icons/hicolor/512x512/apps"
  cp -Rp "$APP" "$D/opt/nounours-browser/app"
  cp -p "$ROOT/launchers/unix/nounours-browser" "$D/opt/nounours-browser/"
  ln -s /opt/nounours-browser/nounours-browser "$D/usr/bin/nounours-browser"
  cp "$ROOT/installers/linux/nounours-browser.desktop" "$D/usr/share/applications/"
  cp "$ROOT/branding/logo.png" "$D/usr/share/icons/hicolor/256x256/apps/nounours-browser.png"
  cp "$ROOT/branding/logo-512.png" "$D/usr/share/icons/hicolor/512x512/apps/nounours-browser.png"
  DEBV="$(echo "$V" | sed 's/-/~/')"
  cat > "$D/DEBIAN/control" <<C
Package: nounours-browser
Version: $DEBV
Section: web
Priority: optional
Architecture: amd64
Maintainer: NounoursCorp <contact@nounourscorp.fr>
Depends: bash, curl, xz-utils
Recommends: libgtk-3-0, libasound2 | libasound2t64, libdbus-glib-1-2, libx11-xcb1
Homepage: https://nounourscorp.fr
Description: Navigateur léger NounoursCorp
 Navigateur compatible avec les extensions Firefox, au style macOS, économe en
 mémoire. Le moteur (Firefox ESR) est téléchargé au premier lancement dans le
 dossier de l'utilisateur.
C
  find "$D" -type d -exec chmod 755 {} +
  dpkg-deb --build --root-owner-group "$D" "$B/release/nounours-browser_${DEBV}_amd64.deb" >/dev/null
fi

# 6) macOS (.app ; LISEZMOI à la racine du zip pour que le launcher ne « remonte » pas le .app)
M="$B/stage-mac"; C="$M/Nounours Browser.app/Contents"
mkdir -p "$C/MacOS" "$C/Resources"
sed "s/__VERSION__/$V/g" "$ROOT/launchers/macos/Info.plist" > "$C/Info.plist"
cp -p "$ROOT/launchers/macos/NounoursBrowser" "$C/MacOS/"
cp "$ROOT/branding/logo.icns" "$C/Resources/logo.icns"
cp -Rp "$APP" "$C/Resources/app"
chmod +x "$C/MacOS/NounoursBrowser"
cp "$ROOT/launchers/LISEZMOI.txt" "$M/"
zipdir "$M" "$B/release/NounoursBrowser-$V-mac-universal.zip"

# 7) Windows (contenu ; le zip et le setup.exe sont faits sur Windows par la CI)
W="$B/stage-win"; mkdir -p "$W"
cp -R "$APP" "$W/app"; rm "$W/app/nounours-browser.sh"
cp "$ROOT/launchers/LISEZMOI.txt" "$W/"
if [ -n "$EXE" ]; then
  cp "$EXE" "$W/NounoursBrowser.exe"
  zipdir "$W" "$B/release/NounoursBrowser-$V-win-x64.zip"
fi

echo "Version $V :"; ls -la "$B/release"
