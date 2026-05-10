import { useEffect, useState } from "react";
import { Moon, SunMedium } from "lucide-react";
import SettingsSection from "../../components/settings/SettingsSection";
import { SettingsActions, SettingsPageHeader, SettingsRadioCards, SettingsSaveButton, SettingsSwatches, SettingsToggle } from "../../components/settings/SettingsControls";

const accentOptions = [
  { label: "Lavender", value: "lavender", colour: "#9b8fd4", light: "#ddd5f0" },
  { label: "Sage", value: "sage", colour: "#7aaa72", light: "#c8d8c4" },
  { label: "Rose", value: "rose", colour: "#d4848c", light: "#f5d5d8" },
  { label: "Sky", value: "sky", colour: "#6aa8d4", light: "#cce0f0" },
  { label: "Amber", value: "amber", colour: "#c8a055", light: "#f5e4c4" }
];

const defaultAppearance = {
  theme: "system",
  accent: "lavender",
  fontSize: "default",
  reduceMotion: false,
  density: "comfortable"
};

export default function SettingsAppearance() {
  const [appearance, setAppearance] = useState(defaultAppearance);
  const [status, setStatus] = useState("default");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("forallcode-appearance");
    if (stored) setAppearance({ ...defaultAppearance, ...JSON.parse(stored) });
  }, []);

  useEffect(() => {
    const accent = accentOptions.find((option) => option.value === appearance.accent) || accentOptions[0];
    document.documentElement.style.setProperty("--accent", accent.colour);
    document.documentElement.style.setProperty("--accent-light", accent.light);
    document.body.classList.toggle("font-large", appearance.fontSize === "large");
    document.body.classList.toggle("reduce-motion", appearance.reduceMotion);
    document.body.classList.toggle("density-compact", appearance.density === "compact");
  }, [appearance]);

  function updateAppearance(key, value) {
    if (key === "theme" && value === "dark") {
      setNotice("Dark mode is coming soon.");
      setAppearance((current) => ({ ...current, theme: "system" }));
      return;
    }
    setNotice("");
    setAppearance((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    setStatus("saving");
    localStorage.setItem("forallcode-appearance", JSON.stringify(appearance));
    setStatus("saved");
    setTimeout(() => setStatus("default"), 1800);
  }

  return (
    <div className="settings-tab">
      <SettingsPageHeader title="Appearance" subtitle="Make ForAllCode feel like yours." />

      <SettingsSection title="Theme">
        <SettingsRadioCards
          value={appearance.theme}
          onChange={(value) => updateAppearance("theme", value)}
          options={[
            { value: "light", label: "Light", preview: <SunMedium size={24} /> },
            { value: "system", label: "System", preview: <span className="half-moon">◐</span> },
            { value: "dark", label: "Dark", preview: <Moon size={24} /> }
          ]}
        />
        {notice && <p className="settings-info-note">{notice}</p>}
      </SettingsSection>

      <SettingsSection title="Accent colour" description="Your accent colour appears on buttons, links, and highlights.">
        <SettingsSwatches value={appearance.accent} options={accentOptions} onChange={(value) => updateAppearance("accent", value)} />
      </SettingsSection>

      <SettingsSection title="Font size">
        <SettingsRadioCards
          value={appearance.fontSize}
          onChange={(value) => updateAppearance("fontSize", value)}
          options={[
            { value: "default", label: "Default", description: "14px body text." },
            { value: "large", label: "Large", description: "16px body text." }
          ]}
        />
      </SettingsSection>

      <SettingsSection title="Accessibility">
        <SettingsToggle label="Reduce motion" description="Disables animations on the workspace desk and page transitions." checked={appearance.reduceMotion} onChange={(value) => updateAppearance("reduceMotion", value)} />
      </SettingsSection>

      <SettingsSection title="Density">
        <SettingsRadioCards
          value={appearance.density}
          onChange={(value) => updateAppearance("density", value)}
          options={[
            { value: "comfortable", label: "Comfortable", description: "Default spacing." },
            { value: "compact", label: "Compact", description: "Tighter padding on cards and lists." }
          ]}
        />
        <SettingsActions><SettingsSaveButton status={status} onClick={handleSave} /></SettingsActions>
      </SettingsSection>
    </div>
  );
}
