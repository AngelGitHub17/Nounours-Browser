#!/usr/bin/env bash
# Nounours Browser — cœur du lanceur macOS / Linux
# Appelé par « Nounours Browser.app » (macOS) ou par ./nounours-browser (Linux).
#
#  - Au premier lancement, télécharge le moteur Firefox ESR dans le dossier de données
#  - Le profil vit dans le dossier de données : il survit aux mises à jour de NounoursLauncher
#  - À chaque lancement : recopie userChrome.css, user.js, l'extension et policies.json
#
# Options : --eco (Ultra éco, mémorisé)  --balanced  --reinstall-engine
# Variable NB_FIREFOX : chemin d'un binaire firefox à utiliser à la place du moteur intégré
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_ID="nounours-browser@didikaria.fr"
OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
  DATA_DIR="$HOME/Library/Application Support/NounoursBrowser"
  FIREFOX="$DATA_DIR/engine/Firefox.app/Contents/MacOS/firefox"
  POLICIES_DIR="$DATA_DIR/engine/Firefox.app/Contents/Resources/distribution"
else
  DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/nounours-browser"
  FIREFOX="$DATA_DIR/engine/firefox/firefox"
  POLICIES_DIR="$DATA_DIR/engine/firefox/distribution"
fi
PROFILE_DIR="$DATA_DIR/profile"
mkdir -p "$DATA_DIR"

# ---------------------------------------------------------------- messages
notify() {
  if [ "$OS" = "Darwin" ]; then
    osascript -e "display notification \"$1\" with title \"Nounours Browser\"" >/dev/null 2>&1 || true
  elif command -v notify-send >/dev/null; then
    notify-send -i web-browser "Nounours Browser" "$1" || true
  fi
  echo "$1"
}
fail() {
  if [ "$OS" = "Darwin" ]; then
    osascript -e "display dialog \"$1\" with title \"Nounours Browser\" buttons {\"OK\"} with icon stop" >/dev/null 2>&1 || true
  elif command -v zenity >/dev/null; then
    zenity --error --title="Nounours Browser" --text="$1" 2>/dev/null || true
  fi
  echo "Erreur : $1" >&2
  exit 1
}

# ---------------------------------------------------------------- options
REINSTALL=0
for a in "$@"; do
  case "$a" in
    --eco) echo eco > "$DATA_DIR/mode.txt" ;;
    --balanced) echo balanced > "$DATA_DIR/mode.txt" ;;
    --reinstall-engine) REINSTALL=1 ;;
  esac
done
MODE="$(cat "$DATA_DIR/mode.txt" 2>/dev/null || echo balanced)"

# ---------------------------------------------------------------- moteur Firefox ESR
install_engine() {
  local tmp url
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN
  mkdir -p "$DATA_DIR/engine"
  notify "Première ouverture : téléchargement du moteur (Firefox ESR, environ 90 Mo)…"
  if [ "$OS" = "Darwin" ]; then
    url="https://download.mozilla.org/?product=firefox-esr-latest-ssl&os=osx&lang=fr"
    curl -fL --retry 3 -o "$tmp/ff.dmg" "$url" || fail "Téléchargement du moteur impossible. Vérifiez la connexion Internet."
    local mnt
    mnt="$(hdiutil attach -nobrowse -readonly -noautoopen "$tmp/ff.dmg" | tail -1 | awk -F'\t' '{print $NF}')"
    local app
    app="$(find "$mnt" -maxdepth 1 -name '*.app' | head -1)"
    [ -n "$app" ] || { hdiutil detach "$mnt" -quiet || true; fail "Image du moteur invalide."; }
    rm -rf "$DATA_DIR/engine/Firefox.app"
    ditto "$app" "$DATA_DIR/engine/Firefox.app"
    hdiutil detach "$mnt" -quiet || true
  else
    local arch="linux64"
    [ "$(uname -m)" = "aarch64" ] && arch="linux64-aarch64"
    url="https://download.mozilla.org/?product=firefox-esr-latest-ssl&os=$arch&lang=fr"
    curl -fL --retry 3 -o "$tmp/ff.tar" "$url" || fail "Téléchargement du moteur impossible. Vérifiez la connexion Internet."
    tar -xf "$tmp/ff.tar" -C "$tmp" || fail "Archive du moteur illisible (xz installé ?)."
    rm -rf "$DATA_DIR/engine/firefox"
    mv "$tmp/firefox" "$DATA_DIR/engine/firefox"
  fi
  notify "Moteur installé. Ouverture de Nounours Browser…"
}

if [ -n "${NB_FIREFOX:-}" ] && [ -x "$NB_FIREFOX" ]; then
  FIREFOX="$NB_FIREFOX"
else
  if [ "$REINSTALL" = 1 ] || [ ! -x "$FIREFOX" ]; then install_engine; fi
  [ -x "$FIREFOX" ] || fail "Le moteur n'a pas pu être installé."
  mkdir -p "$POLICIES_DIR"
  cp -f "$APP_DIR/distribution/policies.json" "$POLICIES_DIR/"
fi

# ---------------------------------------------------------------- profil
TPL="$APP_DIR/profile-template"
mkdir -p "$PROFILE_DIR/extensions"
cp -R "$TPL/chrome" "$PROFILE_DIR/"
[ -f "$DATA_DIR/user-overrides.js" ] || cp "$TPL/user-overrides.js" "$DATA_DIR/user-overrides.js"
{
  cat "$TPL/user.js"
  if [ "$MODE" = "eco" ]; then cat "$TPL/user-eco.js"; fi
  echo
  cat "$DATA_DIR/user-overrides.js"
} > "$PROFILE_DIR/user.js"
cp -f "$APP_DIR/nounours-browser.xpi" "$PROFILE_DIR/extensions/$EXT_ID.xpi"

# ---------------------------------------------------------------- lancement
# Sans -no-remote : si Nounours Browser est déjà ouvert, une nouvelle fenêtre s'y ouvre.
nohup "$FIREFOX" -profile "$PROFILE_DIR" >/dev/null 2>&1 &
