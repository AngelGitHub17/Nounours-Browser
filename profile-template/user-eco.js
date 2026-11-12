
// ============================================================================
//  Mode ULTRA ÉCO (ajouté par le lanceur avec  -Mode eco  /  --eco)
//  Gain de RAM important, au prix d'une isolation des sites plus faible
//  (Fission désactivé) : un site malveillant partage plus facilement un
//  processus avec un autre. À réserver aux machines très modestes.
// ============================================================================
user_pref("fission.autostart", false);
user_pref("dom.ipc.processCount", 2);
user_pref("dom.ipc.processCount.webIsolated", 1);
user_pref("browser.cache.memory.capacity", 32768);
user_pref("image.mem.surfacecache.max_size_kb", 131072);
user_pref("browser.sessionstore.max_tabs_undo", 5);
user_pref("browser.sessionhistory.max_entries", 20);
user_pref("javascript.options.mem.high_water_mark", 64);
// Moins de processus auxiliaires : réseau, décodage média et audio rejoignent le processus principal
user_pref("network.process.enabled", false);
user_pref("media.rdd-process.enabled", false);
user_pref("media.utility-process.enabled", false);
// Windows : pas de processus graphique séparé (gain de mémoire ; un plantage du pilote graphique
// ferme alors tout le navigateur au lieu d'être rattrapé)
user_pref("layers.gpu-process.enabled", false);
