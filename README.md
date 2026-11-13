<p align="center"><img src="branding/logo-512.png" width="160" alt="Logo NounoursBrowser"></p>

<h1 align="center">NounoursBrowser</h1>

<p align="center">Le navigateur de NounoursCorp : <b>léger en RAM</b>, <b>compatible avec toutes les extensions Firefox</b>, <b>personnalisable</b>, au <b>style macOS</b>.<br>Il s'installe et se met à jour tout seul depuis <b>NounoursLauncher</b>.</p>

---

## Installer

**Avec NounoursLauncher (recommandé)**
1. Ouvrez NounoursLauncher.
2. Dans *Applications*, choisissez **NounoursBrowser**, puis cliquez sur **Installer**.
3. Les mises à jour arrivent ensuite d'elles-mêmes, avec *Mettre à jour* ou *Tout mettre à jour*, ou en silence si la mise à jour automatique est activée.

Au **premier lancement**, l'**assistant de démarrage** s'ouvre. On peut le revoir à tout moment : *Paramètres → NounoursBrowser*, clic droit sur le bouton 🧸, menu *Outils*, ou l'engrenage du nouvel onglet.

**À la main**, depuis les *Releases* :

| Système | Installeur | Portable |
|---|---|---|
| Windows | `NounoursBrowser-X.Y.Z-win-x64-setup.exe` (sans droits admin) | `…-win-x64.zip` → `NounoursBrowser.exe` |
| macOS | `NounoursBrowser-X.Y.Z-mac-universal.dmg` → glisser dans Applications | `…-mac-universal.zip` → `NounoursBrowser.app` |
| Linux | `NounoursBrowser-X.Y.Z-x86_64.AppImage` ou `nounours-browser_X.Y.Z_amd64.deb` | `…-linux-x64.zip` → `./nounours-browser` |

### Où sont mes données ?

Le profil (marque-pages, extensions installées, mots de passe, réglages) est rangé **à part**. Une mise à jour remplace le dossier de l'appli, mais ne touche jamais à vos données :

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
| `NB_FIREFOX=/chemin/firefox` | Utilise un autre Firefox à la place du moteur intégré (tests). |

## Le moteur : Firefox ESR, rebrandé

- **Compatibilité :** les extensions Firefox ne fonctionnent qu'avec le moteur **Gecko**. NounoursBrowser utilise le Firefox **ESR** officiel de Mozilla : sa version est figée dans `engine/ESR_VERSION` et téléchargée depuis archive.mozilla.org au moment du build.
- **Rebranding** (`tools/brand-engine.py`) : seuls les textes et images de marque sont remplacés, le code n'est pas recompilé. On obtient « NounoursBrowser » dans les titres, les menus, les Paramètres et « À propos », avec les logos, les icônes de fenêtre et les tuiles Windows. Sur Windows, l'icône et la description de `firefox.exe` sont aussi changées (`rcedit`). Sur macOS, l'appli s'appelle « NounoursBrowser » et elle est re-signée ad hoc.
- **Ajouts au moteur** (`engine-overlay/nounours.cfg`, script autoconfig) : section « NounoursBrowser » des Paramètres, valeurs par défaut, et gestion du profil. Sur **macOS**, le moteur est l'exécutable principal de `NounoursBrowser.app` : c'est ce script qui prépare le profil à chaque démarrage (fichiers de `Contents/Resources/nounours/`) et relance le moteur dessus si besoin. Aucun autre exécutable ne doit être ajouté dans `Contents/MacOS`, sinon le moteur ne démarre plus. Sur Windows et Linux, ce script relance le lanceur si le moteur a été démarré sans le profil NounoursBrowser.
- **Diagnostic macOS** : pousser sur la branche `diag/run` exécute `.github/workflows/diag-macos.yml` sur un vrai Mac (construction, installation, lancement, captures). Les résultats sont publiés sur la branche `diag/results`.
- **Mises à jour :** les mises à jour internes de Mozilla sont désactivées, car elles annuleraient le rebranding. À la place, la CI vérifie chaque jour la sortie d'un nouveau Firefox ESR et publie alors automatiquement une nouvelle version de NounoursBrowser. NounoursLauncher l'installe ensuite.
- **Honnêteté :** « À propos » indique que NounoursBrowser est basé sur Firefox ESR (licence MPL 2.0).

## Ce qu'apporte NounoursBrowser

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
1. il vérifie l'extension (`web-ext lint`), télécharge le Firefox ESR figé pour Linux, Windows et macOS, puis le rebrande ;
2. Linux : il construit l'AppImage, le .deb et le zip ;
3. Windows : il compile `NounoursBrowser.exe`, puis le zip et le `setup.exe` (Inno Setup) ; macOS : il construit `NounoursBrowser.app`, le `.dmg` et le zip ;
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
python3 tools/brand-engine.py <moteur> linux|windows|macos   # rebrande un Firefox ESR décompressé
tools/package.sh --linux-engine <moteur> [--win-engine <moteur>] [--exe NounoursBrowser.exe]
npx web-ext lint --source-dir extension  # vérification Mozilla
npx web-ext run  --source-dir extension  # test à chaud dans un Firefox temporaire
```

Les pages `extension/*/index.html` s'ouvrent aussi directement dans un navigateur, pour un aperçu (`shared/preview-shim.js` simule l'API).

## Structure

```
branding/           logo (SVG, PNG 512/1024, ICO, ICNS) — NounoursCorp × Web
extension/          extension compagnon (manifest, background, onboarding, newtab, popup, settings, shared)
engine/             ESR_VERSION (version de Firefox ESR utilisée)
engine-overlay/     ajouts au moteur (autoconfig : section « NounoursBrowser » des Paramètres)
launchers/          windows/NounoursBrowser.cs · unix/nounours-browser(.sh) (Linux) — macOS : géré par nounours.cfg
installers/         windows/NounoursBrowser.iss (Inno Setup) · macos/build-app.sh · linux/nounours-browser.desktop
profile-template/   user.js, user-eco.js, user-overrides.js, chrome/userChrome.css
distribution/       policies.json
scripts/            set-version.sh, publish-catalog.sh, changelog-section.sh, changelog-add.py
tools/              brand-engine.py (rebranding du moteur), build-xpi.sh, package.sh
.github/workflows/  release.yml
```

## Limites connues

- Windows : pour épingler NounoursBrowser à la barre des tâches, utilisez le raccourci du menu Démarrer (*clic droit → Épingler*). Épingler la fenêtre ouverte pointerait vers le moteur sans passer par le lanceur.
- macOS : l'appli est signée « ad hoc » (sans compte Apple Developer). Installée par NounoursLauncher ou depuis le .dmg, elle s'ouvre normalement ; téléchargée à la main depuis un navigateur, il faut la première fois faire *clic droit → Ouvrir*.

- `userChrome.css` dépend de la structure interne de Firefox. Une mise à jour majeure d'ESR, environ une fois par an, peut décaler un détail visuel. Les couleurs passent par l'API officielle des thèmes et ne cassent pas.
- Les applis ne sont pas signées par Apple ni Microsoft. Comme pour le launcher, l'avertissement de Windows ou de macOS peut s'afficher en lançant l'archive à la main. Il ne s'affiche pas quand NounoursBrowser est installé par NounoursLauncher.
- La marque Firefox est protégée. Le moteur reste un Firefox ESR officiel, non modifié ; NounoursBrowser n'est qu'une couche par-dessus.
