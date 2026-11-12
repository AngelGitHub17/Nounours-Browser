// ============================================================================
//  Nounours Browser — user.js (préférences appliquées à CHAQUE démarrage)
//  Moteur : Gecko (Firefox). Objectif : RAM minimale, zéro superflu.
//  Ce fichier est régénéré par le lanceur : modifiez profile-template/user.js
//  (ou ajoutez vos lignes dans profile-template/user-overrides.js).
// ============================================================================

// ---------- Personnalisation de l'interface (userChrome.css) ----------
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("browser.tabs.inTitlebar", 1);            // onglets dans la barre de titre (style macOS)
user_pref("browser.compactmode.show", true);
user_pref("browser.uidensity", 0);
user_pref("svg.context-properties.content.enabled", true);
user_pref("widget.macos.native-context-menus", true);

// ---------- Extension compagnon ----------
// Installation automatique de l'extension déposée dans <profil>/extensions
user_pref("extensions.autoDisableScopes", 0);
user_pref("extensions.enabledScopes", 15);
// UUID fixe => l'adresse moz-extension:// de la page d'accueil est stable
user_pref("extensions.webextensions.uuids", "{\"nounours-browser@didikaria.fr\":\"6e0b7d1a-4b1f-4c55-9a3e-d1d1ca71a2a0\"}");
// Fonctionne uniquement sur Firefox ESR / Developer Edition / Nightly / non-brandé.
// Avec Firefox « normal », l'extension doit être signée (voir README).
user_pref("xpinstall.signatures.required", false);

// ---------- Démarrage / accueil ----------
user_pref("browser.startup.homepage", "moz-extension://6e0b7d1a-4b1f-4c55-9a3e-d1d1ca71a2a0/newtab/index.html");
user_pref("browser.startup.page", 3);                     // restaure la session…
user_pref("browser.sessionstore.restore_on_demand", true);// …mais ne charge un onglet que lorsqu'on clique dessus
user_pref("browser.sessionstore.restore_pinned_tabs_on_demand", true);
user_pref("browser.aboutwelcome.enabled", false);         // notre propre démarrage rapide remplace celui de Firefox
user_pref("trailhead.firstrun.didSeeAboutWelcome", true);
user_pref("browser.startup.homepage_override.mstone", "ignore");
user_pref("startup.homepage_welcome_url", "");
user_pref("startup.homepage_welcome_url.additional", "");
user_pref("browser.shell.checkDefaultBrowser", false);
// Pas d'écran « Conditions d'utilisation / données » de Mozilla (aucune donnée n'est envoyée)
user_pref("browser.preonboarding.enabled", false);
user_pref("termsofuse.bypassNotification", true);
user_pref("termsofuse.acceptedVersion", 999);
user_pref("termsofuse.acceptedDate", "1735689600000");
user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);
user_pref("browser.profiles.enabled", false);
// Paramètres : sans bannière « nouveau design », sans Firefox Labs ni « Plus de produits Mozilla »
user_pref("browser.settings-redesign.promo.dismissed", true);
user_pref("browser.preferences.experimental", false);
user_pref("browser.preferences.moreFromMozilla", false);
// Compte Mozilla / synchronisation masqués (réactivable dans user-overrides.js : identity.fxaccounts.enabled = true)
user_pref("identity.fxaccounts.enabled", false);
user_pref("browser.disableResetPrompt", true);

// ---------- RAM : réglages principaux ----------
user_pref("browser.tabs.unloadOnLowMemory", true);        // décharge les onglets si la mémoire manque
user_pref("browser.sessionhistory.max_total_viewers", 0); // pas de pages précédentes gardées en RAM
user_pref("browser.cache.memory.capacity", 65536);        // cache mémoire plafonné à 64 Mo
user_pref("media.memory_cache_max_size", 32768);
user_pref("image.mem.surfacecache.max_size_kb", 262144);
user_pref("dom.ipc.processCount", 4);                     // processus de contenu (mode Équilibré)
user_pref("dom.ipc.processPrelaunch.enabled", false);     // pas de processus préchargé « au cas où »
user_pref("dom.ipc.keepProcessesAlive.web", 0);
user_pref("browser.preferences.defaultPerformanceSettings.enabled", false);
user_pref("browser.sessionstore.interval", 60000);        // écrit la session toutes les 60 s (au lieu de 15)
user_pref("browser.tabs.hoverPreview.showThumbnails", false);
user_pref("browser.newtab.preload", false);

// ---------- Fonctions lourdes désactivées ----------
user_pref("browser.ml.enable", false);
user_pref("browser.ml.chat.enabled", false);
user_pref("browser.ml.linkPreview.enabled", false);
user_pref("browser.tabs.groups.smart.enabled", false);
user_pref("extensions.pocket.enabled", false);
user_pref("browser.tabs.firefox-view", false);
user_pref("browser.newtabpage.activity-stream.feeds.topsites", false);
user_pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);
user_pref("browser.newtabpage.activity-stream.showSponsored", false);
user_pref("browser.newtabpage.activity-stream.showSponsoredTopSites", false);
user_pref("browser.newtabpage.activity-stream.feeds.snippets", false);
user_pref("browser.urlbar.suggest.quicksuggest.sponsored", false);
user_pref("browser.urlbar.suggest.quicksuggest.nonsponsored", false);
user_pref("browser.vpn_promo.enabled", false);
user_pref("browser.promo.focus.enabled", false);
user_pref("identity.fxaccounts.toolbar.pxiToolbarEnabled", false);
user_pref("extensions.htmlaboutaddons.recommendations.enabled", false);
user_pref("extensions.getAddons.showPane", false);
user_pref("browser.messaging-system.whatsNewPanel.enabled", false);
user_pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons", false);
user_pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features", false);

// ---------- Réseau : pas de préchargement spéculatif ----------
user_pref("network.prefetch-next", false);
user_pref("network.dns.disablePrefetch", true);
user_pref("network.predictor.enabled", false);
user_pref("network.http.speculative-parallel-limit", 0);
user_pref("browser.urlbar.speculativeConnect.enabled", false);
user_pref("browser.places.speculativeConnect.enabled", false);

// ---------- Télémétrie / études : tout coupé ----------
user_pref("datareporting.policy.dataSubmissionEnabled", false);
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("toolkit.telemetry.enabled", false);
user_pref("toolkit.telemetry.unified", false);
user_pref("toolkit.telemetry.archive.enabled", false);
user_pref("toolkit.telemetry.newProfilePing.enabled", false);
user_pref("toolkit.telemetry.shutdownPingSender.enabled", false);
user_pref("toolkit.telemetry.updatePing.enabled", false);
user_pref("toolkit.telemetry.bhrPing.enabled", false);
user_pref("toolkit.telemetry.firstShutdownPing.enabled", false);
user_pref("toolkit.coverage.opt-out", true);
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("app.normandy.enabled", false);
user_pref("app.normandy.api_url", "");
user_pref("breakpad.reportURL", "");
user_pref("browser.tabs.crashReporting.sendReport", false);
user_pref("browser.crashReports.unsubmittedCheck.autoSubmit2", false);

// ---------- Confort ----------
user_pref("browser.download.autohideButton", true);
user_pref("browser.urlbar.trimURLs", true);
user_pref("browser.tabs.warnOnClose", false);
user_pref("general.smoothScroll", true);
user_pref("browser.toolbars.bookmarks.visibility", "never");   // barre personnelle : Ctrl+Maj+B pour l'afficher
// Onglets verticaux natifs (décommentez pour les activer)
// user_pref("sidebar.revamp", true);
// user_pref("sidebar.verticalTabs", true);
