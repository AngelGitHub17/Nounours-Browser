// NounoursBrowser — arrière-plan (page événementielle, ne reste pas en RAM)
// Rôles : thème, mise en veille des onglets, menus, raccourcis, premier démarrage.

const TICK = "nb-tick";

// ---------------- Cycle de vie ----------------
browser.runtime.onInstalled.addListener(async ({ reason }) => {
  await init();
  if (reason === "install") {
    const s = await nbGetSettings();
    if (!s.onboarded) {
      // Ouvre le démarrage rapide dans l'onglet d'accueil déjà affiché (une seule page chargée au lieu de deux)
      const url = browser.runtime.getURL("onboarding/index.html");
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const home = browser.runtime.getURL("newtab/index.html");
      if (tab && (!tab.url || tab.url === home || /^about:(blank|home|newtab)/.test(tab.url))) {
        await browser.tabs.update(tab.id, { url });
      } else {
        await browser.tabs.create({ url });
      }
    }
  }
});
browser.runtime.onStartup.addListener(init);

async function init() {
  browser.alarms.create(TICK, { periodInMinutes: 1 });
  await setupMenus();
  await applyTheme(await nbGetSettings(), true);
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings) {
    const prev = changes.settings.oldValue && changes.settings.oldValue.theme;
    const next = changes.settings.newValue && changes.settings.newValue.theme;
    if (JSON.stringify(prev) !== JSON.stringify(next)) nbGetSettings().then((s) => applyTheme(s, true));
  }
});

browser.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== TICK) return;
  const s = await nbGetSettings();
  await applyTheme(s, false);   // suit le mode clair/sombre du système en mode « auto »
  await sleepTabs(s);
});

let activateTimer = null;
browser.tabs.onActivated.addListener(() => {
  clearTimeout(activateTimer);
  activateTimer = setTimeout(async () => sleepTabs(await nbGetSettings(), { onlyLimit: true }), 1500);
});

// ---------------- Thème ----------------
async function applyTheme(s, force) {
  if (!s.theme.enabled) {
    if (force) await browser.theme.reset();
    return;
  }
  const signature = JSON.stringify([s.theme, nbIsDark(s)]);
  let last = null;
  try { ({ lastTheme: last } = await browser.storage.session.get("lastTheme")); } catch {}
  if (!force && last === signature) return;
  await browser.theme.update(nbBuildTheme(s));
  try { await browser.storage.session.set({ lastTheme: signature }); } catch {}
}

// ---------------- Mise en veille des onglets ----------------
function hostOf(url) { try { return new URL(url).hostname; } catch { return ""; } }

function isWhitelisted(tab, s) {
  const h = hostOf(tab.url);
  return h && s.ram.whitelist.some((d) => h === d || h.endsWith("." + d));
}

function canSleep(tab, s) {
  if (tab.active || tab.discarded) return false;
  if (!/^https?:/.test(tab.url || "")) return false;
  if (s.ram.protectPinned && tab.pinned) return false;
  if (s.ram.protectAudible && tab.audible) return false;
  if (isWhitelisted(tab, s)) return false;
  return true;
}

async function discard(tabs) {
  if (!tabs.length) return 0;
  await browser.tabs.discard(tabs.map((t) => t.id));
  const s = await nbGetSettings();
  s.stats.discardedTotal += tabs.length;
  await nbSaveSettings(s);
  return tabs.length;
}

async function sleepTabs(s, { onlyLimit = false } = {}) {
  const { idleMinutes, maxLoaded } = nbRamParams(s);
  if (!idleMinutes && !maxLoaded) return 0;
  const tabs = await browser.tabs.query({});
  const now = Date.now();
  const candidates = tabs.filter((t) => canSleep(t, s));
  const chosen = new Set();

  if (idleMinutes && !onlyLimit) {
    for (const t of candidates) if (now - t.lastAccessed > idleMinutes * 60000) chosen.add(t);
  }
  if (maxLoaded) {
    const loaded = tabs.filter((t) => !t.discarded).length - chosen.size;
    let excess = loaded - maxLoaded;
    const oldestFirst = candidates.filter((t) => !chosen.has(t)).sort((a, b) => a.lastAccessed - b.lastAccessed);
    for (const t of oldestFirst) { if (excess-- <= 0) break; chosen.add(t); }
  }
  return discard([...chosen]);
}

async function sleepOthers() {
  const s = await nbGetSettings();
  const tabs = await browser.tabs.query({ currentWindow: true });
  return discard(tabs.filter((t) => canSleep(t, s)));
}

async function stats() {
  const tabs = await browser.tabs.query({});
  const s = await nbGetSettings();
  return { total: tabs.length, sleeping: tabs.filter((t) => t.discarded).length, discardedTotal: s.stats.discardedTotal };
}

// ---------------- Menus contextuels des onglets ----------------
async function setupMenus() {
  await browser.menus.removeAll();
  browser.menus.create({ id: "nb-sleep", title: "Mettre cet onglet en veille", contexts: ["tab"] });
  browser.menus.create({ id: "nb-sleep-others", title: "Mettre en veille les autres onglets", contexts: ["tab"] });
  browser.menus.create({ id: "nb-sep", type: "separator", contexts: ["tab"] });
  browser.menus.create({ id: "nb-never", title: "Ne jamais mettre ce site en veille", contexts: ["tab"] });
  // Clic droit sur le bouton 🧸 et menu Outils
  for (const ctx of ["action", "tools_menu"]) {
    browser.menus.create({ id: `nb-onboarding-${ctx}`, title: "Revoir le démarrage rapide", contexts: [ctx] });
    browser.menus.create({ id: `nb-settings-${ctx}`, title: "Réglages Nounours", contexts: [ctx] });
  }
}

function openOnboarding() {
  return browser.tabs.create({ url: browser.runtime.getURL("onboarding/index.html") });
}

browser.menus.onClicked.addListener(async (info, tab) => {
  if (String(info.menuItemId).startsWith("nb-onboarding-")) return openOnboarding();
  if (String(info.menuItemId).startsWith("nb-settings-")) return browser.runtime.openOptionsPage();
  const s = await nbGetSettings();
  if (info.menuItemId === "nb-sleep") {
    if (tab.active) {
      // un onglet actif ne peut pas être déchargé : on passe d'abord à un voisin
      const others = (await browser.tabs.query({ windowId: tab.windowId })).filter((t) => t.id !== tab.id);
      if (!others.length) return;
      const next = others.sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
      await browser.tabs.update(next.id, { active: true });
    }
    await discard([tab]);
  } else if (info.menuItemId === "nb-sleep-others") {
    await sleepOthers();
  } else if (info.menuItemId === "nb-never") {
    const h = hostOf(tab.url);
    if (h && !s.ram.whitelist.includes(h)) { s.ram.whitelist.push(h); await nbSaveSettings(s); }
  }
});

// ---------------- Raccourcis clavier ----------------
browser.commands.onCommand.addListener(async (cmd) => {
  if (cmd === "sleep-others") await sleepOthers();
  if (cmd === "toggle-dark") {
    const s = await nbGetSettings();
    s.theme.mode = nbIsDark(s) ? "light" : "dark";
    await nbSaveSettings(s);
  }
});

// ---------------- Messages des pages (popup, réglages) ----------------
browser.runtime.onMessage.addListener((msg) => {
  if (!msg) return;
  if (msg.type === "sleep-others") return sleepOthers().then((count) => ({ count }));
  if (msg.type === "stats") return stats();
});
