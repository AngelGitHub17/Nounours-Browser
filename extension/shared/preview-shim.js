// Permet d'ouvrir les pages HTML directement (hors extension) pour un aperçu.
// Dans le navigateur, `browser` existe déjà et ce fichier ne fait rien.
(function () {
  if (globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.id) return;
  const KEY = "nb-preview-store";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
  const write = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} };
  const listeners = [];
  globalThis.__NB_PREVIEW__ = true;
  globalThis.browser = {
    storage: {
      local: {
        async get(k) { const a = read(); if (k == null) return a; if (typeof k === "string") return k in a ? { [k]: a[k] } : {}; return a; },
        async set(o) { const a = read(); const changes = {}; for (const k in o) { changes[k] = { oldValue: a[k], newValue: o[k] }; a[k] = o[k]; } write(a); listeners.forEach((l) => l(changes, "local")); },
        async remove(k) { const a = read(); delete a[k]; write(a); }
      },
      onChanged: { addListener: (f) => listeners.push(f) }
    },
    runtime: {
      id: "preview",
      async sendMessage(m) { if (m && m.type === "stats") return { total: 7, sleeping: 3, discardedTotal: 42 }; if (m && m.type === "sleep-others") return { count: 3 }; return null; },
      async getPlatformInfo() { return { os: /Mac/.test(navigator.platform) ? "mac" : "win" }; },
      openOptionsPage() { location.href = "../settings/index.html"; },
      getURL: (p) => "../" + p,
      onMessage: { addListener() {} }
    },
    tabs: {
      async query() { return []; },
      async create({ url }) { window.open(url, "_blank"); },
      async getCurrent() { return { id: 1 }; },
      async update(_id, { url }) { location.href = url; }
    },
    search: { async search({ query }) { location.href = "https://duckduckgo.com/?q=" + encodeURIComponent(query); } },
    theme: { async update() {}, async reset() {} }
  };
})();
