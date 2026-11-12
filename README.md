<p align="center"><img src="branding/logo-512.png" width="160" alt="Logo Nounours Browser"></p>

<h1 align="center">Nounours Browser</h1>

<p align="center">Le navigateur de NounoursCorp : <b>léger en RAM</b>, <b>compatible avec toutes les extensions Firefox</b>, <b>personnalisable</b>, au <b>style macOS</b>.<br>Il s'installe et se met à jour tout seul depuis <b>NounoursLauncher</b>.</p>

---

## Installer

**Avec NounoursLauncher (recommandé)**
1. Ouvrez NounoursLauncher.
2. Dans *Applications*, choisissez **Nounours Browser**, puis cliquez sur **Installer**.
3. Les mises à jour arrivent ensuite d'elles-mêmes, avec *Mettre à jour* ou *Tout mettre à jour*, ou en silence si la mise à jour automatique est activée.

Au **premier lancement**, Nounours Browser télécharge son moteur, Firefox ESR (environ 90 Mo). Ensuite, l'**assistant de démarrage** s'ouvre.

**À la main**, depuis les *Releases* :

| Système | Installeur | Portable |
|---|---|---|
| Windows | `NounoursBrowser-X.Y.Z-win-x64-setup.exe` (sans droits admin) | `…-win-x64.zip` → `NounoursBrowser.exe` |
| macOS | `NounoursBrowser-X.Y.Z-mac-universal.dmg` → glisser dans Applications | `…-mac-universal.zip` → `Nounours Browser.app` |
| Linux | `NounoursBrowser-X.Y.Z-x86_64.AppImage` ou `nounours-browser_X.Y.Z_amd64.deb` | `…-linux-x64.zip` → `./nounours-browser` |

### Où sont mes données ?

Le profil (marque-pages, extensions installées, mots de passe, réglages) et le moteur sont rangés **à part**. Une mise à jour remplace le dossier de l'appli, mais ne touche jamais à vos données :

| Système | Dossier |
|---|---|
| Windows | `%LOCALAPPDATA%\NounoursBrowser` |
| macOS | `~/Library/Application Support/NounoursBrowser` |
| Linux | `~/.local/share/nounours-browser` |

Ce dossier contient aussi deux fichiers que vous pouvez modifier :
- `user-overrides.js` : vos préférences moteur personnelles, jamais écrasées ;
- `mode.txt` : `eco` ou `balanced`.

### Options du lanceur

| Option | Effet |
|---|---|
| `--eco` | Mode **Ultra éco**, mémorisé : Fission (isolation des sites) désactivée et 2 processus. Gros gain de RAM, mais sécurité réduite. |
| `--balanced` | Revient au mode normal. |
| `--reinstall-engine` | Retélécharge le moteur. |
| `NB_FIREFOX=/chemin/firefox` | Utilise un autre Firefox (ESR, Developer Edition ou Nightly) à la place du moteur intégré. |

## Pourquoi le moteur Firefox ESR ?

- **Compatibilité :** les extensions Firefox ne fonctionnent qu'avec le moteur **Gecko**.
- **Extension compagnon non signée :** la version **ESR** l'accepte, contrairement à Firefox standard. Vérifié : elle s'installe et s'active automatiquement.
- **Pas de droits administrateur :** le moteur est installé dans le dossier de l'utilisateur. Firefox ESR continue de recevoir ses correctifs de sécurité par son propre système de mise à jour.

## Ce qu'apporte Nounours Browser

| Couche | Fichier(s) | Rôle |
|---|---|---|
| Moteur allégé | `profile-template/user.js`, `user-eco.js` | Moins de processus, cache plafonné, aucun préchargement, IA, Pocket et télémétrie désactivés, onglets restaurés uniquement au clic |
| Politiques | `distribution/policies.json` | Télémétrie, études, Pocket et recommandations désactivés |
| Interface macOS | `profile-template/chrome/userChrome.css` | Onglets en pilules, barre d'adresse centrée, menus arrondis, feux tricolores sur Windows et Linux, onglets endormis grisés |
| Extension compagnon | `extension/` | Assistant de démarrage, thèmes en direct, mise en veille des onglets, page Nouvel onglet, Centre de contrôle 🧸, Réglages |
| Lanceurs | `launchers/` | `.exe` Windows (C#, .NET Framework 4), `.app` macOS, script Linux : installation du moteur et préparation du profil |

Fonctions principales :
- **5 styles** (Aqua, Graphite, Mica, Nord, Sakura), **8 couleurs d'accent**, mode clair, sombre ou automatique.
- **Mise en veille des onglets** : modes Éco, Équilibré, Performance ou Personnalisé. Les onglets qui jouent du son, les onglets épinglés et une liste de sites de votre choix sont protégés.
- **Clic droit sur un onglet** pour le mettre en veille.
- **Raccourcis clavier** : `Alt+Maj+S` endort les autres onglets, `Alt+Maj+D` bascule entre clair et sombre.

## Publier une nouvelle version

```bash
scripts/set-version.sh 1.1.0          # ou 1.2.0-beta.1 → canal bêta du launcher
# ajoutez une section « ## 1.1.0 — date » en haut de CHANGELOG.md
git commit -am "v1.1.0" && git push
```

GitHub Actions (`.github/workflows/release.yml`) fait ensuite le reste :
1. il vérifie l'extension (`web-ext lint`) ;
2. Linux : il construit l'AppImage, le .deb et le zip ;
3. Windows : il compile `NounoursBrowser.exe`, puis le zip et le `setup.exe` (Inno Setup) ; macOS : il construit le `.dmg` ;
4. il crée la release `v1.1.0` avec les notes du CHANGELOG ;
5. il l'**inscrit dans le catalogue NounoursLauncher**, qui propose alors la mise à jour aux utilisateurs.

Le launcher choisit automatiquement le meilleur fichier pour chaque système :

| Plateforme | Choisi en priorité | Mise à jour |
|---|---|---|
| Windows | `setup.exe` (type `installer`, arguments `/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-`) | silencieuse |
| macOS | `.dmg` → copié dans `~/Applications` | en un clic |
| Linux | `.AppImage` | silencieuse |

Les zips portables et le `.deb` sont aussi inscrits, comme solutions de repli. Les arguments et le chemin à lancer sont envoyés par la CI : rien à saisir dans le panel.

### Préparation unique

1. **Panel NounoursLauncher** (`nounourscorp.fr/launcher/admin/`) :
   - crée le projet avec le slug **`nounours-browser`**, de type *Applications* ;
   - dans *Dépôt GitHub des versions*, indique `AngelGitHub17/Nounours-Browser` ;
   - pour le logo, utilise `branding/logo-512.png`.
2. **Dépôt privé :** ajoute `Nounours-Browser` à la liste des dépôts du jeton GitHub *fine-grained* de `launcher/config.php` (permission *Contents : Read-only*). Le catalogue pourra alors relayer les téléchargements sans rendre le dépôt public.
3. **Ce dépôt GitHub** → *Settings → Secrets and variables → Actions* :
   - secret **`NL_CI_TOKEN`** : le même jeton CI que celui du launcher ;
   - variables facultatives `NL_API_URL` et `NL_SLUG`.

> Si une release a été créée avant cette configuration : *Actions → Catalogue NounoursLauncher → Run workflow*. Le bouton **Importer les versions depuis GitHub** du panel fonctionne aussi.

## Développement

```bash
tools/build-xpi.sh                       # construit dist/nounours-browser.xpi
tools/package.sh [NounoursBrowser.exe]   # AppImage, .deb et zips dans build/release/ (+ préparation .dmg / setup.exe)
npx web-ext lint --source-dir extension  # vérification Mozilla
npx web-ext run  --source-dir extension  # test à chaud dans un Firefox temporaire
```

Les pages `extension/*/index.html` s'ouvrent aussi directement dans un navigateur, pour un aperçu (`shared/preview-shim.js` simule l'API).

## Structure

```
branding/           logo (SVG, PNG 512/1024, ICO, ICNS) — NounoursCorp × Web
extension/          extension compagnon (manifest, background, onboarding, newtab, popup, settings, shared)
launchers/          windows/NounoursBrowser.cs · macos/Info.plist + NounoursBrowser · unix/nounours-browser(.sh)
installers/         windows/NounoursBrowser.iss (Inno Setup) · macos/make-dmg.sh · linux/nounours-browser.desktop
profile-template/   user.js, user-eco.js, user-overrides.js, chrome/userChrome.css
distribution/       policies.json
scripts/            set-version.sh, publish-catalog.sh, changelog-section.sh
tools/              build-xpi.sh, package.sh
.github/workflows/  release.yml
```

## Limites connues

- `userChrome.css` dépend de la structure interne de Firefox. Une mise à jour majeure d'ESR, environ une fois par an, peut décaler un détail visuel. Les couleurs passent par l'API officielle des thèmes et ne cassent pas.
- Les applis ne sont pas signées par Apple ni Microsoft. Comme pour le launcher, l'avertissement de Windows ou de macOS peut s'afficher en lançant l'archive à la main. Il ne s'affiche pas quand Nounours Browser est installé par NounoursLauncher.
- La marque Firefox est protégée. Le moteur reste un Firefox ESR officiel, non modifié ; Nounours Browser n'est qu'une couche par-dessus.
