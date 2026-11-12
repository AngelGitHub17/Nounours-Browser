// Réglages partagés entre toutes les pages et le script d'arrière-plan.

const NB_DEFAULTS = {
  onboarded: false,
  theme: {
    enabled: true,      // false = laisser le thème Firefox installé par l'utilisateur
    preset: "aqua",     // voir NB_PRESETS (themes.js)
    mode: "auto",       // auto | light | dark
    accent: "blue"      // voir NB_ACCENTS (themes.js)
  },
  ram: {
    mode: "balanced",   // eco | balanced | performance | custom
    customIdleMinutes: 15,
    customMaxLoaded: 10,
    protectPinned: true,
    protectAudible: true,
    whitelist: []       // domaines jamais mis en veille, ex. "music.youtube.com"
  },
  newtab: {
    wallpaper: "aube",
    name: "",
    showClock: true,
    showGreeting: true,
    shortcuts: [
      { title: "DidiKaria", url: "https://didikaria.fr" },
      { title: "Wikipédia", url: "https://fr.wikipedia.org" },
      { title: "YouTube", url: "https://www.youtube.com" },
      { title: "GitHub", url: "https://github.com" },
      { title: "Modules", url: "https://addons.mozilla.org/fr/firefox/" }
    ]
  },
  stats: { discardedTotal: 0 }
};

const NB_RAM_MODES = {
  eco:         { label: "Éco",         idleMinutes: 5,  maxLoaded: 6,  desc: "Les onglets inutilisés depuis 5 min s'endorment. 6 onglets actifs au maximum." },
  balanced:    { label: "Équilibré",   idleMinutes: 20, maxLoaded: 12, desc: "Veille après 20 min d'inactivité, 12 onglets actifs au maximum." },
  performance: { label: "Performance", idleMinutes: 0,  maxLoaded: 0,  desc: "Aucune mise en veille automatique. Firefox ne décharge qu'en cas de mémoire critique." },
  custom:      { label: "Personnalisé", idleMinutes: null, maxLoaded: null, desc: "Vos propres valeurs." }
};

function nbIsObj(v) { return v && typeof v === "object" && !Array.isArray(v); }

function nbMerge(base, over) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  if (!nbIsObj(over)) return out;
  for (const k of Object.keys(over)) {
    out[k] = nbIsObj(base[k]) && nbIsObj(over[k]) ? nbMerge(base[k], over[k]) : over[k];
  }
  return out;
}

async function nbGetSettings() {
  const { settings } = await browser.storage.local.get("settings");
  return nbMerge(JSON.parse(JSON.stringify(NB_DEFAULTS)), settings || {});
}

async function nbSaveSettings(s) {
  await browser.storage.local.set({ settings: s });
  return s;
}

/** Modifie une valeur par chemin, ex. nbPatch("theme.mode", "dark") */
async function nbPatch(path, value) {
  const s = await nbGetSettings();
  const keys = path.split(".");
  let o = s;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = value;
  return nbSaveSettings(s);
}

function nbRamParams(s) {
  const m = NB_RAM_MODES[s.ram.mode] || NB_RAM_MODES.balanced;
  if (s.ram.mode === "custom") {
    return { idleMinutes: Number(s.ram.customIdleMinutes) || 0, maxLoaded: Number(s.ram.customMaxLoaded) || 0 };
  }
  return { idleMinutes: m.idleMinutes, maxLoaded: m.maxLoaded };
}
