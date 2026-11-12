// Assistant de démarrage rapide (affiché au premier lancement)

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const LAST = 7;
let step = 0;
let S; // réglages courants
let isMac = false;

const HELLO = ["Bienvenue", "Welcome", "Bienvenido", "Willkommen", "Benvenuto", "Bem-vindo", "ようこそ", "Welkom", "Välkommen", "환영합니다"];

const SPOTS = {
  tabs:     ["Les onglets", "Glissez-les pour les réorganiser. Un onglet en italique et grisé est « endormi » : il ne consomme presque plus de RAM. Clic droit › « Mettre cet onglet en veille » pour le faire à la main."],
  url:      ["La barre d'adresse", "Tapez une adresse ou une recherche. Elle affiche le nom du site au centre, comme sur macOS, et s'élargit quand vous écrivez."],
  nounours: ["Le Centre de contrôle 🧸", "Basculez clair/sombre, changez d'accent, endormez les onglets inactifs et voyez combien dorment en ce moment."],
  ext:      ["Les extensions 🧩", "Toutes vos extensions Firefox se rangent ici. Épinglez celles que vous utilisez souvent."],
  menu:     ["Le menu ≡", "Historique, téléchargements, marque-pages, impression, et « Personnaliser la barre d'outils » pour déplacer les boutons par glisser-déposer."]
};

async function save() { await nbSaveSettings(S); nbApplyPageTheme(S); renderAll(); }

// ---------------- Rendu ----------------
function renderAll() {
  $$("#mode-cards [data-mode]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === S.theme.mode));
  $$("#accents .swatch").forEach((b) => b.setAttribute("aria-pressed", b.dataset.accent === S.theme.accent));
  $$("#presets button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.preset === S.theme.preset));
  $("#preset-hint").textContent = NB_PRESETS[S.theme.preset].hint;
  $$("#ram-cards [data-ram]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.ram === S.ram.mode));
  $("#protect-audible").checked = S.ram.protectAudible;
  $("#protect-pinned").checked = S.ram.protectPinned;
  $$("#wallpapers button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.wp === S.newtab.wallpaper));
  $("#wallpaper").className = "wp-" + S.newtab.wallpaper;
}

function buildControls() {
  // accents
  for (const [key, a] of Object.entries(NB_ACCENTS)) {
    const b = document.createElement("button");
    b.className = "swatch"; b.dataset.accent = key; b.title = a.label;
    b.style.background = a.hex; b.style.setProperty("--swatch", a.hex);
    b.onclick = () => { S.theme.accent = key; save(); };
    $("#accents").append(b);
  }
  // préréglages
  for (const [key, p] of Object.entries(NB_PRESETS)) {
    const b = document.createElement("button");
    b.dataset.preset = key; b.textContent = p.label;
    b.onclick = () => { S.theme.preset = key; save(); };
    $("#presets").append(b);
  }
  $$("#mode-cards [data-mode]").forEach((b) => (b.onclick = () => { S.theme.mode = b.dataset.mode; save(); }));

  // mémoire
  $$("#ram-cards [data-ram]").forEach((b) => {
    b.querySelector("span").textContent = NB_RAM_MODES[b.dataset.ram].desc;
    b.onclick = () => { S.ram.mode = b.dataset.ram; save(); };
  });
  $("#protect-audible").onchange = (e) => { S.ram.protectAudible = e.target.checked; save(); };
  $("#protect-pinned").onchange = (e) => { S.ram.protectPinned = e.target.checked; save(); };

  // accueil
  $("#name").value = S.newtab.name;
  $("#name").oninput = (e) => { S.newtab.name = e.target.value.trim(); nbSaveSettings(S); };
  for (const w of NB_WALLPAPERS) {
    const b = document.createElement("button");
    b.className = "wp-" + w.id; b.dataset.wp = w.id; b.textContent = w.label;
    b.onclick = () => { S.newtab.wallpaper = w.id; save(); };
    $("#wallpapers").append(b);
  }

  // visite
  $$(".hotspot").forEach((h) => (h.onclick = () => showSpot(h.dataset.spot)));

  // extensions
  $("#open-amo").onclick = () => browser.tabs.create({ url: "https://addons.mozilla.org/fr/firefox/" });

  // raccourcis
  const mod = isMac ? "⌘" : "Ctrl";
  const shift = isMac ? "⇧" : "Maj";
  const alt = isMac ? "⌥" : "Alt";
  const rows = [
    ["Nouvel onglet", [mod, "T"]],
    ["Fermer l'onglet", [mod, "W"]],
    ["Rouvrir l'onglet fermé", [mod, shift, "T"]],
    ["Aller à la barre d'adresse", [mod, "L"]],
    ["Onglet suivant / précédent", ["Ctrl", "Tab"]],
    ["Rechercher dans la page", [mod, "F"]],
    ["Gérer les extensions", [mod, shift, "A"]],
    ["Endormir les autres onglets", [alt, shift, "S"]],
    ["Basculer clair / sombre", [alt, shift, "D"]]
  ];
  for (const [label, keys] of rows) {
    const tr = document.createElement("tr");
    const a = document.createElement("td"); a.textContent = label;
    const b = document.createElement("td");
    keys.forEach((k, i) => {
      if (i) b.append(" + ");
      const kbd = document.createElement("kbd"); kbd.textContent = k; b.append(kbd);
    });
    tr.append(a, b);
    $("#keys").append(tr);
  }
  $$("kbd[data-mod]").forEach((k) => (k.textContent = mod));
  if (isMac) $$("kbd").forEach((k) => { if (k.textContent === "Maj") k.textContent = "⇧"; });

  // pastilles de progression
  for (let i = 0; i <= LAST; i++) $("#dots").append(document.createElement("i"));
}

function showSpot(id) {
  $$(".hotspot").forEach((h) => h.setAttribute("aria-pressed", h.dataset.spot === id));
  const [t, d] = SPOTS[id];
  const b = document.createElement("b");
  b.textContent = t;
  $("#spot-info").replaceChildren(b, d);
}

// ---------------- Navigation ----------------
function go(n) {
  const dir = n < step ? "back" : "";
  step = Math.max(0, Math.min(LAST, n));
  $$(".step").forEach((s) => {
    const on = Number(s.dataset.step) === step;
    s.hidden = !on;
    s.classList.toggle("back", on && dir === "back");
  });
  $$("#dots i").forEach((d, i) => d.classList.toggle("on", i === step));
  $("#back").hidden = step === 0 || step === LAST;
  $("#skip").hidden = step === LAST;
  $("#next").textContent = step === 0 ? "Commencer" : step === LAST ? "Commencer à naviguer" : "Continuer";
  if (step === 4) showSpot("tabs");
}

async function finish() {
  S.onboarded = true;
  await nbSaveSettings(S);
  location.href = browser.runtime.getURL("newtab/index.html");
}

function cycleHello() {
  let i = 0;
  const el = $("#hello-word");
  setInterval(() => {
    if (step !== 0) return;
    el.classList.add("fade");
    setTimeout(() => { i = (i + 1) % HELLO.length; el.textContent = HELLO[i]; el.classList.remove("fade"); }, 500);
  }, 2400);
}

document.addEventListener("keydown", (e) => {
  if (e.target.matches("input")) return;
  if (e.key === "ArrowRight" || e.key === "Enter") $("#next").click();
  if (e.key === "ArrowLeft" && step > 0 && step < LAST) go(step - 1);
});

(async function main() {
  S = await nbGetSettings();
  try { isMac = (await browser.runtime.getPlatformInfo()).os === "mac"; } catch {}
  nbApplyPageTheme(S);
  buildControls();
  renderAll();
  go(0);
  cycleHello();
  $("#next").onclick = () => (step === LAST ? finish() : go(step + 1));
  $("#back").onclick = () => go(step - 1);
  $("#skip").onclick = () => go(LAST);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => nbApplyPageTheme(S));
})();
