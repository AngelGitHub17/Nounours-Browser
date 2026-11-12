#!/usr/bin/env bash
# Construit dist/nounours-browser.xpi à partir du dossier extension/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/dist"
rm -f "$ROOT/dist/nounours-browser.xpi"
(cd "$ROOT/extension" && zip -qr -X "$ROOT/dist/nounours-browser.xpi" . -x '.*')
echo "OK : $ROOT/dist/nounours-browser.xpi"
