#!/usr/bin/env bash
# Inscrit la version dans le lanceur Windows (propriétés du fichier .exe)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
V="$(python3 -c 'import json,sys;d=json.load(open(sys.argv[1]));print(d.get("version_name") or d["version"])' "$ROOT/extension/manifest.json")"
N="$(echo "$V" | sed -E 's/^([0-9]+\.[0-9]+\.[0-9]+).*/\1/').0"
sed -i.bak -e "s/AssemblyVersion(\"0.0.0.0\")/AssemblyVersion(\"$N\")/" \
           -e "s/AssemblyFileVersion(\"0.0.0.0\")/AssemblyFileVersion(\"$N\")/" \
           -e "s/AssemblyInformationalVersion(\"0.0.0-dev\")/AssemblyInformationalVersion(\"$V\")/" \
           "$ROOT/launchers/windows/NounoursBrowser.cs"
rm -f "$ROOT/launchers/windows/NounoursBrowser.cs.bak"
echo "$V"
