#!/usr/bin/env bash
# NounoursBrowser — cœur du lanceur macOS / Linux
#
# Le moteur (Firefox ESR rebrandé « NounoursBrowser ») est livré avec l'appli :
#   macOS : NounoursBrowser.app/Contents/MacOS/firefox   (ce script : Contents/Resources/nounours/)
#   Linux : <dossier>/engine/firefox                      (ce script : <dossier>/app/)
# Le profil vit dans le dossier de données : il survit aux mises à jour de NounoursLauncher.
#
# Options : --eco (Ultra éco, mémorisé)  --balanced
# Variable NB_FIREFOX : chemin d'un autre binaire firefox (tests)
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_ID="nounours-browser@didikaria.fr"
OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
  DATA_DIR="$HOME/Library/Application Support/NounoursBrowser"
  FIREFOX="$APP_DIR/../../MacOS/firefox"
  PLATFORM_INI="$APP_DIR/../platform.ini"
else
  DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/nounours-browser"
  FIREFOX="$APP_DIR/../engine/firefox"
  PLATFORM_INI="$APP_DIR/../engine/platform.ini"
fi
PROFILE_DIR="$DATA_DIR/profile"
mkdir -p "$DATA_DIR"

fail() {
  if [ "$OS" = "Darwin" ]; then
    osascript -e "display dialog \"$1\" with title \"NounoursBrowser\" buttons {\"OK\"} with icon stop" >/dev/null 2>&1 || true
  elif command -v zenity >/dev/null; then
    zenity --error --title="NounoursBrowser" --text="$1" 2>/dev/null || true
  fi
  echo "Erreur : $1" >&2
  exit 1
}

# Copie seulement si le contenu a changé, via un renommage atomique : un fichier que
# le moteur a ouvert (l'extension .xpi) n'est jamais modifié pendant qu'il le lit.
put() { # put <source> <destination>
  if [ -f "$2" ] && cmp -s "$1" "$2"; then return 0; fi
  cp -f "$1" "$2.nbtmp" && mv -f "$2.nbtmp" "$2"
}
put_text() { # put_text <destination>  (contenu sur l'entrée standard)
  local tmp="$1.nbtmp"
  cat > "$tmp"
  if [ -f "$1" ] && cmp -s "$tmp" "$1"; then rm -f "$tmp"; else mv -f "$tmp" "$1"; fi
}

# ---------------------------------------------------------------- options
URLS=()
for a in "$@"; do
  case "$a" in
    -psn_*) ;;  # argument ajouté par macOS au lancement d'une .app
    --eco) echo eco > "$DATA_DIR/mode.txt" ;;
    --balanced) echo balanced > "$DATA_DIR/mode.txt" ;;
    -*) ;;
    *) URLS+=("$a") ;;  # liens / fichiers à ouvrir
  esac
done
MODE="$(cat "$DATA_DIR/mode.txt" 2>/dev/null || echo balanced)"

if [ -n "${NB_FIREFOX:-}" ] && [ -x "$NB_FIREFOX" ]; then FIREFOX="$NB_FIREFOX"; fi
[ -x "$FIREFOX" ] || fail "Moteur introuvable. Réinstallez NounoursBrowser depuis NounoursLauncher."

# Anciennes versions (1.0.x) : moteur téléchargé dans le dossier de données → inutile désormais
rm -rf "$DATA_DIR/engine" 2>/dev/null || true
# macOS : l'appli s'appelait « Nounours Browser.app » (avec espace) jusqu'en 1.1 → on retire l'ancienne copie
if [ "$OS" = "Darwin" ]; then
  for old in "$HOME/Applications/Nounours Browser.app" "/Applications/Nounours Browser.app"; do
    if [ -d "$old" ] && [ "$(defaults read "$old/Contents/Info" CFBundleIdentifier 2>/dev/null)" = "fr.nounourscorp.browser" ]; then
      rm -rf "$old" 2>/dev/null || true
    fi
  done
fi

# ---------------------------------------------------------------- profil
TPL="$APP_DIR/profile-template"
mkdir -p "$PROFILE_DIR/extensions" "$PROFILE_DIR/chrome"
for f in "$TPL"/chrome/*; do put "$f" "$PROFILE_DIR/chrome/$(basename "$f")"; done
[ -f "$DATA_DIR/user-overrides.js" ] || cp "$TPL/user-overrides.js" "$DATA_DIR/user-overrides.js"
{
  cat "$TPL/user.js"
  if [ "$MODE" = "eco" ]; then cat "$TPL/user-eco.js"; fi
  echo
  cat "$DATA_DIR/user-overrides.js"
} | put_text "$PROFILE_DIR/user.js"
put "$APP_DIR/nounours-browser.xpi" "$PROFILE_DIR/extensions/$EXT_ID.xpi"

# ---------------------------------------------------------------- lancement
ARGS=(-profile "$PROFILE_DIR")
# Nouveau moteur depuis le dernier lancement : on vide les caches de démarrage
ENGINE_V="$(grep -m1 '^Milestone=' "$PLATFORM_INI" 2>/dev/null | cut -d= -f2 || true)"
if [ "$ENGINE_V" != "$(cat "$DATA_DIR/engine-version" 2>/dev/null || true)" ]; then
  ARGS+=(-purgecaches)
  echo "$ENGINE_V" > "$DATA_DIR/engine-version"
fi
# Linux : nom de fenêtre propre (regroupement correct dans la barre des tâches)
if [ "$OS" != "Darwin" ]; then ARGS+=(--name nounours-browser --class nounours-browser); fi

# exec : le lanceur devient le navigateur (indispensable pour l'AppImage, qui reste montée tant qu'il tourne)
exec "$FIREFOX" "${ARGS[@]}" ${URLS[@]+"${URLS[@]}"}
