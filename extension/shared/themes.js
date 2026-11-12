// Thèmes : génère le thème Firefox (API browser.theme) et les variables CSS des pages.

const NB_ACCENTS = {
  blue:     { label: "Bleu",     hex: "#007AFF" },
  purple:   { label: "Violet",   hex: "#AF52DE" },
  pink:     { label: "Rose",     hex: "#FF2D55" },
  red:      { label: "Rouge",    hex: "#FF3B30" },
  orange:   { label: "Orange",   hex: "#FF9500" },
  yellow:   { label: "Jaune",    hex: "#F5B800" },
  green:    { label: "Vert",     hex: "#28B550" },
  graphite: { label: "Graphite", hex: "#8E8E93" }
};

// Chaque préréglage : couleurs de base claires et sombres.
// Chaque préréglage : fenêtre unifiée (frame = toolbar), onglet actif « surélevé », champ d'adresse en creux.
const NB_PRESETS = {
  aqua: {
    label: "Aqua", hint: "Inspiré de macOS",
    light: { toolbar: "#F2F2F4", tab: "#FFFFFF", text: "#1D1D1F", field: "#E3E3E7", fieldFocus: "#FFFFFF", popup: "#F7F7F8" },
    dark:  { toolbar: "#2A2A2D", tab: "#434347", text: "#F5F5F7", field: "#3A3A3E", fieldFocus: "#1F1F22", popup: "#2C2C2F" }
  },
  graphite: {
    label: "Graphite", hint: "Neutre et sobre",
    light: { toolbar: "#E9E9EB", tab: "#F8F8F9", text: "#202022", field: "#DADADD", fieldFocus: "#FFFFFF", popup: "#F4F4F5" },
    dark:  { toolbar: "#1E1E20", tab: "#38383B", text: "#E8E8EA", field: "#2E2E31", fieldFocus: "#161618", popup: "#252527" }
  },
  mica: {
    label: "Mica", hint: "Esprit Windows 11",
    light: { toolbar: "#F3F5F9", tab: "#FFFFFF", text: "#1B1B1F", field: "#E6E9EF", fieldFocus: "#FFFFFF", popup: "#F9FAFC" },
    dark:  { toolbar: "#202020", tab: "#3A3A3A", text: "#F3F3F3", field: "#2D2D2D", fieldFocus: "#191919", popup: "#2B2B2B" }
  },
  nord: {
    label: "Nord", hint: "Bleus polaires",
    light: { toolbar: "#E8ECF2", tab: "#F7F9FB", text: "#2E3440", field: "#D8DEE9", fieldFocus: "#FFFFFF", popup: "#F0F3F7" },
    dark:  { toolbar: "#2E3440", tab: "#4C566A", text: "#ECEFF4", field: "#3B4252", fieldFocus: "#272C36", popup: "#3B4252" }
  },
  sakura: {
    label: "Sakura", hint: "Doux et rosé",
    light: { toolbar: "#F8EBF0", tab: "#FFFAFC", text: "#3D2A33", field: "#EED8E1", fieldFocus: "#FFFFFF", popup: "#FDF5F8" },
    dark:  { toolbar: "#2A1F24", tab: "#4A3841", text: "#F6E9EE", field: "#3A2C33", fieldFocus: "#21181C", popup: "#35282F" }
  }
};

function nbAccentHex(key) { return (NB_ACCENTS[key] || NB_ACCENTS.blue).hex; }

function nbSystemIsDark() {
  try { return matchMedia("(prefers-color-scheme: dark)").matches; } catch { return false; }
}

function nbIsDark(s) {
  if (s.theme.mode === "dark") return true;
  if (s.theme.mode === "light") return false;
  return nbSystemIsDark();
}

function nbAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Construit l'objet thème pour browser.theme.update() */
function nbBuildTheme(s) {
  const dark = nbIsDark(s);
  const p = (NB_PRESETS[s.theme.preset] || NB_PRESETS.aqua)[dark ? "dark" : "light"];
  const accent = nbAccentHex(s.theme.accent);
  const sep = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const hover = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)";
  const active = dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.12)";
  return {
    colors: {
      frame: p.toolbar,
      frame_inactive: p.toolbar,
      tab_background_text: p.text,
      tab_text: p.text,
      tab_selected: p.tab,
      tab_line: "transparent",
      tab_loading: accent,
      toolbar: p.toolbar,
      toolbar_text: p.text,
      toolbar_top_separator: "transparent",
      toolbar_bottom_separator: sep,
      toolbar_vertical_separator: sep,
      toolbar_field: p.field,
      toolbar_field_text: p.text,
      toolbar_field_border: "transparent",
      toolbar_field_focus: p.fieldFocus,
      toolbar_field_text_focus: p.text,
      toolbar_field_border_focus: accent,
      toolbar_field_highlight: nbAlpha(accent, 0.35),
      toolbar_field_highlight_text: p.text,
      button_background_hover: hover,
      button_background_active: active,
      icons: p.text,
      icons_attention: accent,
      popup: p.popup,
      popup_text: p.text,
      popup_border: sep,
      popup_highlight: accent,
      popup_highlight_text: "#FFFFFF",
      sidebar: p.toolbar,
      sidebar_text: p.text,
      sidebar_border: sep,
      sidebar_highlight: accent,
      sidebar_highlight_text: "#FFFFFF",
      ntp_background: p.toolbar,
      ntp_text: p.text
    },
    properties: {
      color_scheme: dark ? "dark" : "light",
      content_color_scheme: "system"
    }
  };
}

/** Applique accent + clair/sombre aux pages de l'extension */
function nbApplyPageTheme(s) {
  const root = document.documentElement;
  root.style.setProperty("--accent", nbAccentHex(s.theme.accent));
  root.dataset.scheme = nbIsDark(s) ? "dark" : "light";
}

const NB_WALLPAPERS = [
  { id: "aube", label: "Aube" },
  { id: "lagon", label: "Lagon" },
  { id: "foret", label: "Forêt" },
  { id: "crepuscule", label: "Crépuscule" },
  { id: "graphite", label: "Graphite" },
  { id: "uni", label: "Uni" }
];
