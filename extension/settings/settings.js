const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let S;

async function commit() { await nbSaveSettings(S); render(); }

function seg(id, get, setter) {
  $$(`#${id} button`).forEach((b) => {
    b.onclick = () => { setter(b.dataset.v); commit(); };
  });
  return () => $$(`#${id} button`).forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === get()));
}

function build() {
  // Apparence
  for (const [k, p] of Object.entries(NB_PRESETS)) {
    const b = document.createElement("button"); b.dataset.v = k; b.textContent = p.label; b.title = p.hint;
    $("#theme-preset").append(b);
  }
  for (const [k, a] of Object.entries(NB_ACCENTS)) {
    const b = document.createElement("button");
    b.className = "swatch"; b.dataset.accent = k; b.title = a.label;
    b.style.background = a.hex; b.style.setProperty("--swatch", a.hex);
    b.onclick = () => { S.theme.accent = k; commit(); };
    $("#theme-accent").append(b);
  }
  for (const w of NB_WALLPAPERS) {
    const b = document.createElement("button");
    b.className = "wp-" + w.id; b.dataset.wp = w.id; b.textContent = w.label;
    b.onclick = () => { S.newtab.wallpaper = w.id; commit(); };
    $("#nt-wp").append(b);
  }

  renderers.push(
    seg("theme-mode", () => S.theme.mode, (v) => (S.theme.mode = v)),
    seg("theme-preset", () => S.theme.preset, (v) => (S.theme.preset = v)),
    seg("ram-mode", () => S.ram.mode, (v) => (S.ram.mode = v))
  );

  bindCheck("#theme-enabled", () => S.theme.enabled, (v) => (S.theme.enabled = v));
  bindCheck("#ram-audible", () => S.ram.protectAudible, (v) => (S.ram.protectAudible = v));
  bindCheck("#ram-pinned", () => S.ram.protectPinned, (v) => (S.ram.protectPinned = v));
  bindCheck("#nt-clock", () => S.newtab.showClock, (v) => (S.newtab.showClock = v));
  bindCheck("#nt-greet", () => S.newtab.showGreeting, (v) => (S.newtab.showGreeting = v));

  $("#ram-idle").onchange = (e) => { S.ram.customIdleMinutes = Math.max(0, +e.target.value || 0); commit(); };
  $("#ram-max").onchange = (e) => { S.ram.customMaxLoaded = Math.max(0, +e.target.value || 0); commit(); };
  $("#ram-white").onchange = (e) => {
    S.ram.whitelist = e.target.value.split(/\s+/).map((d) => d.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "")).filter(Boolean);
    commit();
  };
  $("#nt-name").onchange = (e) => { S.newtab.name = e.target.value.trim(); commit(); };

  // Général
  $("#amo").onclick = () => browser.tabs.create({ url: "https://addons.mozilla.org/fr/firefox/" });
  $("#replay").onclick = () => browser.tabs.create({ url: browser.runtime.getURL("onboarding/index.html") });
  $("#export").onclick = () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "nounours-browser-reglages.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $("#import").onclick = () => $("#import-file").click();
  $("#import-file").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      S = nbMerge(JSON.parse(JSON.stringify(NB_DEFAULTS)), JSON.parse(await f.text()));
      await commit();
    } catch { alert("Fichier de réglages invalide."); }
  };
  $("#reset").onclick = async () => {
    if (!confirm("Réinitialiser tous les réglages Nounours ?")) return;
    S = JSON.parse(JSON.stringify(NB_DEFAULTS)); S.onboarded = true; await commit();
  };

  // Barre latérale : section active au défilement
  const content = $(".content");
  content.addEventListener("scroll", () => {
    let current = "apparence";
    for (const sec of $$(".content section")) if (sec.offsetTop - content.scrollTop < 120) current = sec.id;
    $$("#nav a").forEach((a) => a.classList.toggle("active", a.hash === "#" + current));
  });
}

const renderers = [];
function bindCheck(sel, get, setter) {
  $(sel).onchange = (e) => { setter(e.target.checked); commit(); };
  renderers.push(() => ($(sel).checked = get()));
}

function render() {
  nbApplyPageTheme(S);
  renderers.forEach((r) => r());
  $$("#theme-accent .swatch").forEach((b) => b.setAttribute("aria-pressed", b.dataset.accent === S.theme.accent));
  $$("#nt-wp button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.wp === S.newtab.wallpaper));
  $("#ram-desc").textContent = NB_RAM_MODES[S.ram.mode].desc;
  $$(".item.custom").forEach((el) => (el.hidden = S.ram.mode !== "custom"));
  $("#ram-idle").value = S.ram.customIdleMinutes;
  $("#ram-max").value = S.ram.customMaxLoaded;
  if (document.activeElement !== $("#ram-white")) $("#ram-white").value = S.ram.whitelist.join("\n");
  if (document.activeElement !== $("#nt-name")) $("#nt-name").value = S.newtab.name;
}

async function refreshStats() {
  const st = await browser.runtime.sendMessage({ type: "stats" });
  if (!st) return;
  $("#st-open").textContent = st.total;
  $("#st-sleep").textContent = st.sleeping;
  $("#st-total").textContent = st.discardedTotal;
}

browser.storage.onChanged.addListener(async (ch, area) => {
  if (area === "local" && ch.settings) { S = await nbGetSettings(); render(); }
});

(async () => {
  S = await nbGetSettings();
  build();
  render();
  refreshStats();
  setInterval(refreshStats, 5000);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
})();
