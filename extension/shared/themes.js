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
const NB_PRESETS = {
  aqua: {
    label: "Aqua", hint: "Inspiré de macOS",
    light: { frame: "#E6E6E9", frameInactive: "#F1F1F3", toolbar: "#F7F7F8", text: "#1D1D1F", field: "#FFFFFF", popup: "#FFFFFF" },
    dark:  { frame: "#1C1C1E", frameInactive: "#262628", toolbar: "#2A2A2D", text: "#F5F5F7", field: "#3A3A3D", popup: "#2C2C2E" }
  },
  graphite: {
    label: "Graphite", hint: "Neutre et sobre",
    light: { frame: "#DCDCDE", frameInactive: "#E8E8EA", toolbar: "#EFEFF1", text: "#202022", field: "#FAFAFB", popup: "#FAFAFB" },
    dark:  { frame: "#141416", frameInactive: "#1D1D1F", toolbar: "#232326", text: "#E8E8EA", field: "#323236", popup: "#232326" }
  },
  mica: {
    label: "Mica", hint: "Esprit Windows 11",
    light: { frame: "#EDF0F5", frameInactive: "#F4F6F9", toolbar: "#F9FAFC", text: "#1B1B1F", field: "#FFFFFF", popup: "#FFFFFF" },
    dark:  { frame: "#1F1F1F", frameInactive: "#262626", toolbar: "#2B2B2B", text: "#F3F3F3", field: "#383838", popup: "#2C2C2C" }
  },
  nord: {
    label: "Nord", hint: "Bleus polaires",
    light: { frame: "#E5E9F0", frameInactive: "#ECEFF4", toolbar: "#F0F3F7", text: "#2E3440", field: "#FFFFFF", popup: "#FFFFFF" },
    dark:  { frame: "#2E3440", frameInactive: "#353C4A", toolbar: "#3B4252", text: "#ECEFF4", field: "#434C5E", popup: "#3B4252" }
  },
  sakura: {
    label: "Sakura", hint: "Doux et rosé",
    light: { frame: "#F5E4EA", frameInactive: "#F9EDF1", toolbar: "#FDF5F8", text: "#3D2A33", field: "#FFFFFF", popup: "#FFFFFF" },
    dark:  { frame: "#261C21", frameInactive: "#2E2228", toolbar: "#35282F", text: "#F6E9EE", field: "#45353D", popup: "#35282F" }
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
      frame: p.frame,
      frame_inactive: p.frameInactive,
      tab_background_text: p.text,
      tab_text: p.text,
      tab_selected: p.toolbar,
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
      toolbar_field_focus: p.field,
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
      ntp_background: p.frame,
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
