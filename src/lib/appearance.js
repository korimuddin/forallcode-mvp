export const accentOptions = [
  { label: "Lavender", value: "lavender", colour: "#9b8fd4", light: "#ddd5f0", soft: "#c4b8e8", dark: "#7a6dc4" },
  { label: "Sage", value: "sage", colour: "#7aaa72", light: "#c8d8c4", soft: "#a8c4a2", dark: "#5f9257" },
  { label: "Rose", value: "rose", colour: "#d4848c", light: "#f5d5d8", soft: "#eebfc4", dark: "#b76872" },
  { label: "Sky", value: "sky", colour: "#6aa8d4", light: "#cce0f0", soft: "#a8cce8", dark: "#4f8fbd" },
  { label: "Amber", value: "amber", colour: "#c8a055", light: "#f5e4c4", soft: "#ecd09c", dark: "#9f7f43" }
];

export const defaultAppearance = {
  theme: "system",
  accent: "lavender",
  fontSize: "default",
  reduceMotion: false,
  density: "comfortable",
  plainLanguageHints: true
};

const storageKey = "forallcode-appearance";

const lightTokens = {
  cream: "#faf7f2",
  cream2: "#f4efe6",
  cream3: "#e8e0d4",
  ink: "#3d3530",
  ink2: "#6b5f58",
  ink3: "#9c918c",
  ink3Text: "#796d67",
  lavenderText: "#6a5cb8",
  sageText: "#4e7a47",
  roseText: "#af505b",
  amberText: "#8a6a2a",
  skyText: "#3d6e96",
  white: "#fffdf9"
};

const darkTokens = {
  cream: "#211d1a",
  cream2: "#2c2824",
  cream3: "#4b433c",
  ink: "#fffdf9",
  ink2: "#e8e0d4",
  ink3: "#b8aca2",
  ink3Text: "#b3a89f",
  lavenderText: "#c4b8f0",
  sageText: "#a8d4a0",
  roseText: "#f0a8b0",
  amberText: "#e8c888",
  skyText: "#a0c8e8",
  white: "#332e29"
};

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
  const tokens = resolved === "dark" ? darkTokens : lightTokens;
  const accent = accentOptions.find((option) => option.value === appearance.accent) || accentOptions[0];
  const root = document.documentElement;

  Object.entries(tokens).forEach(([key, value]) => {
    const cssKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    root.style.setProperty(`--${cssKey}`, value);
  });

  root.style.setProperty("--accent", accent.colour);
  root.style.setProperty("--accent-light", accent.light);
  root.style.setProperty("--accent-soft", accent.soft);
  root.style.setProperty("--accent-dark", accent.dark);
  root.style.setProperty("--lavender", accent.light);
  root.style.setProperty("--lavender2", accent.soft);
  root.style.setProperty("--lavender3", accent.colour);
  root.style.setProperty("--lavender4", accent.dark);
  root.dataset.theme = resolved;
  root.dataset.themePreference = appearance.theme;

  document.body.classList.toggle("theme-dark", resolved === "dark");
  document.body.classList.toggle("theme-light", resolved === "light");
  document.body.classList.toggle("font-large", appearance.fontSize === "large");
  document.body.classList.toggle("reduce-motion", Boolean(appearance.reduceMotion));
  document.body.classList.toggle("density-compact", appearance.density === "compact");
  document.body.classList.toggle("density-comfortable", appearance.density !== "compact");
  document.body.classList.toggle("plain-language-hints-off", appearance.plainLanguageHints === false);
  window.dispatchEvent(new CustomEvent("forallcode-appearance-change", { detail: { ...defaultAppearance, ...appearance } }));
}

export function persistAndApplyAppearance(appearance) {
  saveAppearance(appearance);
  applyAppearance(appearance);
}
