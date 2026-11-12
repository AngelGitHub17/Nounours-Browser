#!/usr/bin/env bash
# Change la version de NounoursBrowser (source unique : extension/manifest.json)
# Usage : scripts/set-version.sh 1.1.0   (ou 1.2.0-beta.1 pour le canal bêta)
set -euo pipefail
V="${1:?Usage : scripts/set-version.sh X.Y.Z}"
[[ "$V" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$ ]] || { echo "Version invalide : $V" >&2; exit 1; }
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Firefox n'accepte pas « -beta.1 » dans le manifeste : 1.2.0-beta.1 → 1.2.0.1 côté extension
EXTV="$(python3 -c 'import re,sys;v=sys.argv[1];m=re.match(r"^(\d+\.\d+\.\d+)(?:-[A-Za-z]*\.?(\d+))?",v);print(m.group(1)+("."+m.group(2) if m.group(2) else ""))' "$V")"
python3 - "$ROOT/extension/manifest.json" "$V" "$EXTV" <<'P'
import json,sys
p,v,ev=sys.argv[1:]
d=json.load(open(p)); d["version"]=ev; d["version_name"]=v
open(p,"w").write(json.dumps(d,indent=2,ensure_ascii=False)+"\n")
P
echo "Version $V (extension $EXTV). Ajoutez « ## $V » en haut de CHANGELOG.md, puis commit + push."
