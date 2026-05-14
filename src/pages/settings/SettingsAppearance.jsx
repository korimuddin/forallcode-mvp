import { useEffect, useState } from "react";
import { Moon, SunMedium } from "lucide-react";
import SettingsSection from "../../components/settings/SettingsSection";
import { SettingsActions, SettingsPageHeader, SettingsRadioCards, SettingsSaveButton, SettingsSwatches, SettingsToggle } from "../../components/settings/SettingsControls";
import { accentOptions, applyAppearance, persistAndApplyAppearance, readAppearance } from "../../lib/appearance";

export default function SettingsAppearance() {
  const [appearance, setAppearance] = useState(() => readAppearance());
  const [status, setStatus] = useState("default");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const stored = readAppearance();
    setAppearance(stored);
    applyAppearance(stored);
  }, []);

  useEffect(() => {
    if (appearance.theme !== "system") return undefined;
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return undefined;
    const handleChange = () => applyAppearance(appearance);
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, [appearance]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function updateAppearance(key, value) {
    setNotice("");
    const next = { ...appearance, [key]: value };
    setAppearance(next);
    persistAndApplyAppearance(next);
    setStatus("saved");
    window.setTimeout(() => setStatus("default"), 1000);
  }

  function handleSave() {
    setStatus("saving");
    persistAndApplyAppearance(appearance);
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
        {notice && <div className="settings-toast" role="status">{notice}</div>}
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
