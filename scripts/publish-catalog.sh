#!/usr/bin/env bash
# Inscrit une release GitHub de Nounours Browser dans le catalogue NounoursLauncher.
# Variables : GH_TOKEN, GITHUB_REPOSITORY, TAG, NL_API_URL, NL_CI_TOKEN, NL_SLUG, NOTES (facultatif)
# Le dépôt étant privé, le serveur du catalogue donne aux utilisateurs un lien relais
# (api.php?r=asset&id=…) : son jeton GitHub doit avoir accès en lecture à ce dépôt.
set -euo pipefail
work="$(mktemp -d)"
gh release download "$TAG" -R "$GITHUB_REPOSITORY" -D "$work" -p '*.zip'
cd "$work"

assets='[]'
add() { # add <plateforme> <type> <fichier>
  local url="https://github.com/$GITHUB_REPOSITORY/releases/download/$TAG/$3"
  assets=$(jq -c --arg p "$1" --arg k "$2" --arg u "$url" \
    --argjson s "$(stat -c%s "$3")" --arg h "$(sha256sum "$3" | cut -d' ' -f1)" \
    '. + [{platform:$p, kind:$k, url:$u, size:$s, sha256:$h}]' <<< "$assets")
}
for f in *.zip; do
  case "$f" in
    *-win-x64.zip)       add windows-x86_64 zip "$f" ;;
    *-mac-universal.zip) add darwin-aarch64 zip "$f"; add darwin-x86_64 zip "$f" ;;
    *-linux-x64.zip)     add linux-x86_64 zip "$f" ;;
  esac
done

case "$TAG" in *-*) channel=beta ;; *) channel=stable ;; esac
body=$(jq -n --arg slug "$NL_SLUG" --arg v "$TAG" --arg c "$channel" --arg n "${NOTES:-}" --argjson a "$assets" \
  '{slug:$slug, version:$v, channel:$c, notes:$n, published:true, assets:$a}')
echo "Fichiers envoyés au catalogue :"; jq -r '.assets[] | "  \(.platform)  \(.kind)  \(.url | split("/") | last)"' <<< "$body"

resp="$(mktemp)"
code=$(curl -sS -o "$resp" -w '%{http_code}' -X POST "$NL_API_URL?r=ci/release" \
  -H "Authorization: Bearer $NL_CI_TOKEN" -H "X-NL-Token: $NL_CI_TOKEN" \
  -H "Content-Type: application/json" -d "$body" || echo 000)
answer=$(head -c 600 "$resp" | tr '\n' ' ')
echo "Réponse du catalogue (HTTP $code) : $answer"
if [ "$code" != "200" ]; then
  echo "::error title=Catalogue NounoursLauncher::HTTP $code — $answer"
  exit 1
fi
echo "::notice title=Catalogue NounoursLauncher::$TAG inscrit — $answer"
