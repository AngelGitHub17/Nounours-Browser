const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let S;

function render() {
  nbApplyPageTheme(S);
  $$("#mode button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === S.theme.mode));
  $$("#ram button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.ram === S.ram.mode));
  $$("#accents .swatch").forEach((b) => b.setAttribute("aria-pressed", b.dataset.accent === S.theme.accent));
}

async function refreshStats() {
  const st = await browser.runtime.sendMessage({ type: "stats" });
  if (!st) return;
  $("#open").textContent = st.total;
  $("#sleeping").textContent = st.sleeping;
}

async function set(fn) { fn(S); await nbSaveSettings(S); render(); }

for (const [key, a] of Object.entries(NB_ACCENTS)) {
  const b = document.createElement("button");
  b.className = "swatch"; b.dataset.accent = key; b.title = a.label;
  b.style.background = a.hex; b.style.setProperty("--swatch", a.hex);
  b.onclick = () => set((s) => (s.theme.accent = key));
  $("#accents").append(b);
}
$$("#mode button").forEach((b) => (b.onclick = () => set((s) => { s.theme.mode = b.dataset.mode; s.theme.enabled = true; })));
$$("#ram button").forEach((b) => (b.onclick = () => set((s) => (s.ram.mode = b.dataset.ram))));

$("#sleep").onclick = async () => {
  const r = await browser.runtime.sendMessage({ type: "sleep-others" });
  const n = r ? r.count : 0;
  $("#toast").textContent = n ? `${n} onglet${n > 1 ? "s" : ""} endormi${n > 1 ? "s" : ""} 💤` : "Rien à endormir.";
  refreshStats();
};
$("#settings").onclick = () => { browser.runtime.openOptionsPage(); window.close(); };
$("#tour").onclick = () => { browser.tabs.create({ url: browser.runtime.getURL("onboarding/index.html") }); window.close(); };
$("#amo").onclick = () => { browser.tabs.create({ url: "https://addons.mozilla.org/fr/firefox/" }); window.close(); };

(async () => {
  S = await nbGetSettings();
  render();
  refreshStats();
})();
