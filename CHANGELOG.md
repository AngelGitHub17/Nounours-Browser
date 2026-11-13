# Journal des versions

## 1.3.0 — 2026-11-13

- **macOS : NounoursBrowser démarre enfin.** Sur macOS récent, le lanceur placé à côté du moteur dans l'appli empêchait celui-ci de se charger (« Couldn't load XPCOM »). Le moteur est désormais l'exécutable principal de NounoursBrowser.app et prépare lui-même votre profil. Vérifié sur un vrai Mac (macOS 26) : premier lancement, second clic (même fenêtre), et en même temps qu'un vrai Firefox ouvert.
- macOS : l'icône NounoursBrowser s'affiche dans le Dock (au lieu de celle de Firefox).
## 1.2.3 — 2026-11-12

- **Toujours le bon profil** : si le moteur est lancé directement (fenêtre épinglée à la barre des tâches, raccourci vers firefox.exe…), il passe automatiquement la main à NounoursBrowser, qui rouvre votre profil avec vos extensions et réglages.
- **Windows** : les fenêtres et le raccourci NounoursBrowser partagent le même identifiant de barre des tâches ; épingler une fenêtre ouverte épingle désormais NounoursBrowser.
## 1.2.2 — 2026-11-12

- **Favoris** : la barre des favoris est de retour (Ctrl+Maj+B pour la masquer ; ce choix est désormais conservé), ainsi que l'étoile ☆ dans la barre d'adresse.
- **Onglets** : la taille des onglets est de nouveau gérée par le moteur (corrige l'affichage incorrect de la barre d'onglets sous Windows) ; le style macOS est conservé.
- **Extensions** : leurs boutons sont forcés visibles dans la barre d'outils.
## 1.2.1 — 2026-11-12

- Windows : les boutons de fenêtre sont de vrais ronds rouge / jaune / vert, sans les symboles ×, – et □ de Windows par-dessus (ni fond carré au survol).

## 1.2.0 — 2026-11-12

- **Nouveau nom : NounoursBrowser** (sans espace) partout : fenêtres, menus, Paramètres, « À propos », installeur, raccourcis, appli macOS (« NounoursBrowser.app »). L'ancienne installation et ses raccourcis sont remplacés automatiquement.
- **Moins de mémoire** :
  - les pages NounoursBrowser n'utilisent plus d'effet de flou d'arrière-plan, qui oblige le moteur graphique à garder des copies de l'écran ;
  - les animations s'arrêtent d'elles-mêmes, et l'horloge ne se rafraîchit plus qu'une fois par minute ;
  - au premier lancement, le démarrage rapide s'ouvre dans l'onglet d'accueil au lieu d'un second onglet (environ −60 Mo mesurés) ;
  - traduction locale, analyse « mode lecture » et autres fonctions lourdes sont désactivées.
- **Mode Ultra éco plus poussé** : les processus réseau, média, audio et graphique (Windows) rejoignent le processus principal.
## 1.1.0 — 2026-11-12

- **Nounours Browser partout** : titres de fenêtre, menus, Paramètres, « À propos », icônes de fenêtre et de la barre des tâches. Le moteur Firefox ESR est désormais rebrandé et livré directement dans les installeurs (plus de téléchargement au premier lancement).
- **Interface façon Safari / macOS** : fenêtre unifiée, onglets de largeur égale avec titre centré, barre d'adresse centrée en creux, menus à surbrillance colorée, feux tricolores sur Windows et Linux.
- **Section « Nounours Browser » dans les Paramètres**, avec « Revoir le démarrage rapide » et « Réglages Nounours ». Le démarrage rapide est aussi accessible depuis le bouton 🧸 (clic droit), le Centre de contrôle, le menu Outils et l'engrenage du nouvel onglet.
- Plus de mascotte Firefox, de « Firefox Labs », de compte Mozilla, de bannière « géré par votre organisation » ni d'écran de conditions d'utilisation de Mozilla.
- Le bouton 🧸 est épinglé dans la barre d'outils ; les pages Nounours n'affichent plus leur adresse technique.
- Mises à jour de sécurité : chaque nouveau Firefox ESR publié par Mozilla donne automatiquement une nouvelle version de Nounours Browser.
## 1.0.1 — 2026-11-12

- **Installeurs** : setup.exe pour Windows (sans droits admin, raccourcis Démarrer et Bureau, désinstallation propre), .dmg pour macOS, AppImage et .deb pour Linux. Les zips portables restent disponibles.
- NounoursLauncher installe désormais l'installeur adapté et met à jour Nounours Browser en silence sur Windows aussi.
- Correction : l'erreur « fichier ayant une section mappée utilisateur ouverte » au lancement sous Windows quand Nounours Browser était déjà ouvert.
- Nounours Browser peut être choisi comme navigateur par défaut (Windows et Linux) et ouvre les liens reçus.
- Les accents des messages du lanceur Windows s'affichent correctement ; l'exe indique sa version dans ses propriétés.

## 1.0.0 — 2026-11-12

- Première version de Nounours Browser, sur le moteur Firefox ESR.
- Assistant de démarrage rapide au premier lancement (apparence, mémoire, page d'accueil, visite guidée, extensions, raccourcis).
- Interface façon macOS : onglets « pilules », barre d'adresse centrée, menus arrondis, feux tricolores sur Windows et Linux.
- 5 styles, 8 couleurs d'accent, mode clair / sombre / automatique, appliqués en direct.
- Mise en veille automatique des onglets inactifs (modes Éco, Équilibré, Performance, Personnalisé) et Centre de contrôle 🧸.
- Page Nouvel onglet : horloge, recherche, raccourcis modifiables, 6 fonds d'écran.
- Compatible avec toutes les extensions de addons.mozilla.org.
- Moteur téléchargé automatiquement au premier lancement ; profil conservé lors des mises à jour.
- Nouveau logo NounoursCorp × Web.
