#!/usr/bin/env bash
# Affiche la section « ## <version> » de CHANGELOG.md
V="${1#v}"
awk -v v="$V" '
  /^## / { if (p) exit; s=$0; gsub(/^## +\[?v?/, "", s); split(s, a, /[] —-]/); if (a[1]==v) { p=1; next } }
  p' "$(dirname "$0")/../CHANGELOG.md"
