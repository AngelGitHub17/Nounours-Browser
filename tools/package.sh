#!/usr/bin/env bash
# Construit les paquets Linux de Nounours Browser et prépare Windows / macOS.
#
# Usage : tools/package.sh [--linux-engine DIR] [--win-engine DIR] [--exe NounoursBrowser.exe]
#   DIR = moteur Firefox ESR déjà rebrandé (tools/brand-engine.py)
#
# build/release/ :
#   NounoursBrowser-<v>-x86_64.AppImage      Linux (préféré par NounoursLauncher)
#   nounours-browser_<v>_amd64.deb           Linux Debian / Ubuntu
#   NounoursBrowser-<v>-linux-x64.zip        Linux portable
#   NounoursBrowser-<v>-win-x64.zip          Windows portable (si --exe)
# build/app/        → contenu Nounours commun (utilisé par installers/macos/build-app.sh)
# build/stage-win/  → à compléter par NounoursBrowser.exe puis Inno Setup (CI Windows)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
V="$(python3 -c 'import json,sys;d=json.load(open(sys.argv[1]));print(d.get("version_name") or d["version"])' "$ROOT/extension/manifest.json")"
LINUX_ENGINE=""; WIN_ENGINE=""; EXE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --linux-engine) LINUX_ENGINE="$2"; shift ;;
    --win-engine) WIN_ENGINE="$2"; shift ;;
    --exe) EXE="$2"; shift ;;
    *) echo "Option inconnue : $1" >&2; exit 1 ;;
  esac
  shift
done
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

# 3) Linux
if [ -n "$LINUX_ENGINE" ]; then
  # zip portable
  L="$B/stage-linux"; mkdir -p "$L"
  cp -Rp "$APP" "$L/app"
  cp -Rp "$LINUX_ENGINE" "$L/engine"
  cp -p "$ROOT/launchers/unix/nounours-browser" "$L/"
  cp "$ROOT/launchers/LISEZMOI.txt" "$ROOT/branding/logo.png" "$L/"
  chmod +x "$L/nounours-browser"
  zipdir "$L" "$B/release/NounoursBrowser-$V-linux-x64.zip"

  # AppImage
  if command -v "${APPIMAGETOOL:-appimagetool}" >/dev/null; then
    AD="$B/AppDir"; mkdir -p "$AD"
    cp -Rp "$APP" "$AD/app"
    cp -Rp "$LINUX_ENGINE" "$AD/engine"
    cat > "$AD/AppRun" <<'R'
#!/usr/bin/env bash
HERE="$(dirname "$(readlink -f "$0")")"
exec "$HERE/app/nounours-browser.sh" "$@"
R
    chmod +x "$AD/AppRun"
    cp "$ROOT/installers/linux/nounours-browser.desktop" "$AD/"
    cp "$ROOT/branding/logo.png" "$AD/nounours-browser.png"
    cp "$ROOT/branding/logo.png" "$AD/.DirIcon"
    ARCH=x86_64 VERSION="$V" "${APPIMAGETOOL:-appimagetool}" ${APPIMAGETOOL_ARGS:-} --no-appstream "$AD" \
      "$B/release/NounoursBrowser-$V-x86_64.AppImage" >/dev/null 2>&1
  else
    echo "(appimagetool absent : AppImage ignorée)"
  fi

  # .deb
  if command -v dpkg-deb >/dev/null; then
    D="$B/deb"; O="$D/opt/nounours-browser"
    mkdir -p "$D/DEBIAN" "$O" "$D/usr/bin" "$D/usr/share/applications" \
             "$D/usr/share/icons/hicolor/256x256/apps" "$D/usr/share/icons/hicolor/512x512/apps"
    cp -Rp "$APP" "$O/app"
    cp -Rp "$LINUX_ENGINE" "$O/engine"
    cp -p "$ROOT/launchers/unix/nounours-browser" "$O/"
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
Depends: bash, libgtk-3-0 | libgtk-3-0t64, libasound2 | libasound2t64, libx11-xcb1
Recommends: libdbus-glib-1-2
Provides: www-browser
Homepage: https://nounourscorp.fr
Description: Navigateur léger NounoursCorp
 Navigateur compatible avec les extensions Firefox, au style macOS, économe en
 mémoire. Basé sur Firefox ESR.
C
    find "$D" -type d -exec chmod 755 {} +
    dpkg-deb --build --root-owner-group -Zxz "$D" "$B/release/nounours-browser_${DEBV}_amd64.deb" >/dev/null
  fi
fi

# 4) Windows (le setup.exe est fait sur Windows par la CI)
W="$B/stage-win"; mkdir -p "$W"
cp -R "$APP" "$W/app"; rm "$W/app/nounours-browser.sh"
cp "$ROOT/launchers/LISEZMOI.txt" "$W/"
if [ -n "$WIN_ENGINE" ]; then cp -R "$WIN_ENGINE" "$W/engine-$V"; fi
if [ -n "$EXE" ]; then
  cp "$EXE" "$W/NounoursBrowser.exe"
  zipdir "$W" "$B/release/NounoursBrowser-$V-win-x64.zip"
fi

echo "Version $V :"; ls -la "$B/release"
