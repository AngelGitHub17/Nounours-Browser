// Page Nouvel onglet : horloge, recherche, dock de raccourcis
const $ = (s) => document.querySelector(s);
let S;

function greetingFor(h) {
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function tick() {
  const d = new Date();
  if (S.newtab.showClock) {
    $("#clock").textContent = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    $("#date").textContent = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }
  if (S.newtab.showGreeting) {
    $("#greeting").textContent = greetingFor(d.getHours()) + (S.newtab.name ? `, ${S.newtab.name}` : "") + ".";
  }
}

function colorFor(str) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `linear-gradient(140deg, hsl(${h} 75% 60%), hsl(${(h + 40) % 360} 70% 45%))`;
}

function renderDock() {
  const dock = $("#dock");
  dock.innerHTML = "";
  for (const sc of S.newtab.shortcuts) {
    const a = document.createElement("a");
    a.href = sc.url;
    const tile = document.createElement("span");
    tile.className = "tile";
    tile.style.background = colorFor(sc.title);
    tile.textContent = (sc.title[0] || "?").toUpperCase();
    const label = document.createElement("span");
    label.textContent = sc.title;
    a.append(tile, label);
    dock.append(a);
  }
  dock.hidden = !S.newtab.shortcuts.length;
}

function render() {
  nbApplyPageTheme(S);
  $("#wallpaper").className = "wp-" + S.newtab.wallpaper;
  document.body.classList.toggle("plain", S.newtab.wallpaper === "uni");
  $("#clock").hidden = $("#date").hidden = !S.newtab.showClock;
  $("#greeting").hidden = !S.newtab.showGreeting;
  renderDock();
  tick();
}

function looksLikeUrl(q) {
  return /^[a-z]+:\/\//i.test(q) || (/^[^\s]+\.[a-z]{2,}(\/.*)?$/i.test(q) && !q.includes(" ")) || /^localhost(:\d+)?/.test(q);
}

$("#search").onsubmit = async (e) => {
  e.preventDefault();
  const q = $("#q").value.trim();
  if (!q) return;
  if (looksLikeUrl(q)) {
    location.href = /^[a-z]+:\/\//i.test(q) ? q : "https://" + q;
  } else {
    const tab = await browser.tabs.getCurrent();
    await browser.search.search({ query: q, tabId: tab ? tab.id : undefined });
  }
};

$("#prefs").onclick = () => browser.runtime.openOptionsPage();
$("#edit").onclick = () => {
  $("#shortcuts").value = S.newtab.shortcuts.map((s) => `${s.title} | ${s.url}`).join("\n");
  $("#editor").showModal();
};
$("#editor").addEventListener("close", async () => {
  if ($("#editor").returnValue !== "ok") return;
  S.newtab.shortcuts = $("#shortcuts").value.split("\n").map((l) => l.split("|").map((x) => x.trim()))
    .filter(([t, u]) => t && u)
    .map(([title, url]) => ({ title, url: /^[a-z]+:\/\//i.test(url) ? url : "https://" + url }));
  await nbSaveSettings(S);
  render();
});

browser.storage.onChanged.addListener(async (ch, area) => {
  if (area === "local" && ch.settings) { S = await nbGetSettings(); render(); }
});

(async () => {
  S = await nbGetSettings();
  render();
  setInterval(tick, 1000);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
})();
