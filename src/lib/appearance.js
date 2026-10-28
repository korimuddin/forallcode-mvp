// Accent options follow the GitHub (Primer) palette. Keys are kept stable so
// saved preferences keep working; "lavender" is the default Primer blue.
export const accentOptions = [
  { label: "Blue", value: "lavender", colour: "#0969da", light: "#ddf4ff", soft: "#54aeff", dark: "#0550ae" },
  { label: "Green", value: "sage", colour: "#1a7f37", light: "#dafbe1", soft: "#4ac26b", dark: "#116329" },
  { label: "Pink", value: "rose", colour: "#bf3989", light: "#ffeff7", soft: "#ff80c8", dark: "#99286e" },
  { label: "Purple", value: "sky", colour: "#8250df", light: "#fbefff", soft: "#c297ff", dark: "#6639ba" },
  { label: "Orange", value: "amber", colour: "#bc4c00", light: "#fff1e5", soft: "#fb8f44", dark: "#953800" }
];

export const defaultAppearance = {
  theme: "system",
  accent: "lavender",
  fontSize: "default",
  reduceMotion: false,
  density: "comfortable"
};

const storageKey = "forallcode-appearance";

// Neutral colours (canvas, text, borders) come from the Primer tokens in
// styles.css, switched by :root[data-theme]. Only the accent is set here.
const legacyNeutralTokens = ["cream", "cream2", "cream3", "ink", "ink2", "ink3", "white"];

export function readAppearance() {
  if (typeof window === "undefined") return defaultAppearance;

  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? { ...defaultAppearance, ...JSON.parse(stored) } : defaultAppearance;
  } catch {
    return defaultAppearance;
  }
}

export function saveAppearance(appearance) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify({ ...defaultAppearance, ...appearance }));
}

export function getResolvedTheme(theme = "system") {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function applyAppearance(appearance = readAppearance()) {
  if (typeof document === "undefined") return;

  const resolved = getResolvedTheme(appearance.theme);
  const accent = accentOptions.find((option) => option.value === appearance.accent) || accentOptions[0];
  const root = document.documentElement;

  legacyNeutralTokens.forEach((key) => root.style.removeProperty(`--${key}`));

  // In dark mode Primer uses lighter accent text so links stay readable on #0d1117.
  const accentText = resolved === "dark" ? accent.soft : accent.colour;
  root.style.setProperty("--accent", accentText);
  root.style.setProperty("--accent-light", accent.light);
  root.style.setProperty("--accent-soft", accent.soft);
  root.style.setProperty("--accent-dark", accent.dark);
  root.style.setProperty("--accent-hover", accent.dark);
  root.style.setProperty("--accent-subtle", resolved === "dark" ? `${accent.colour}26` : accent.light);
  root.style.setProperty("--lavender", resolved === "dark" ? `${accent.colour}26` : accent.light);
  root.style.setProperty("--lavender2", accent.soft);
  root.style.setProperty("--lavender3", accent.colour);
  root.style.setProperty("--lavender4", resolved === "dark" ? accent.soft : accent.dark);
  root.dataset.theme = resolved;
  root.dataset.themePreference = appearance.theme;

  document.body.classList.toggle("theme-dark", resolved === "dark");
  document.body.classList.toggle("theme-light", resolved === "light");
  document.body.classList.toggle("font-large", appearance.fontSize === "large");
  document.body.classList.toggle("reduce-motion", Boolean(appearance.reduceMotion));
  document.body.classList.toggle("density-compact", appearance.density === "compact");
  document.body.classList.toggle("density-comfortable", appearance.density !== "compact");
}

export function persistAndApplyAppearance(appearance) {
  saveAppearance(appearance);
  applyAppearance(appearance);
}
