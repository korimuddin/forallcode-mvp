import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import SettingsSection from "../../components/settings/SettingsSection";
import { FocusToggle, SettingsActions, SettingsPageHeader, SettingsSaveButton, SettingsSwatches } from "../../components/settings/SettingsControls";
import { DESK_THEMES } from "../../data/deskThemes";
import { getUserPreference, setUserPreference } from "../../lib/preferences";
import { supabase } from "../../lib/supabase";
import { useSubscription } from "../../lib/useSubscription";

const noteColours = [
  { label: "Lavender", value: "lavender", colour: "#ddd5f0" },
  { label: "Rose", value: "rose", colour: "#f5d5d8" },
  { label: "Sage", value: "sage", colour: "#c8d8c4" },
  { label: "Amber", value: "amber", colour: "#f5e4c4" }
];

export default function SettingsWorkspace() {
  const { isPro } = useSubscription();
  const [session, setSession] = useState(null);
  const [settings, setSettings] = useState({
    deskTheme: "classic",
    showClock: true,
    showDecorations: true,
    focusMode: false,
    focusSchedule: "manual",
    defaultNoteColour: "lavender"
  });
  const [status, setStatus] = useState("default");

  const visibleDeskTheme = !isPro && DESK_THEMES[settings.deskTheme]?.isPro ? "classic" : settings.deskTheme;

  useEffect(() => {
    async function loadSettings() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (!data.session?.user?.id) return;
      const localSettings = getUserPreference(data.session.user.id, "workspace", null);
      if (localSettings) setSettings((current) => ({ ...current, ...localSettings }));

      const { data: stored, error } = await supabase
        .from("workspace_settings")
        .select("*")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      if (stored && !localSettings && !error) {
        setSettings((current) => ({
          ...current,
          deskTheme: stored.desk_theme || current.deskTheme,
          showClock: stored.show_clock ?? current.showClock,
          showDecorations: stored.show_decorations ?? current.showDecorations,
          focusMode: stored.focus_mode ?? current.focusMode,
          defaultNoteColour: stored.default_note_colour || current.defaultNoteColour
        }));
      }
    }

    loadSettings();
  }, []);

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function selectDeskTheme(themeId) {
    const theme = DESK_THEMES[themeId];
    if (!theme) return;
    if (theme.isPro && !isPro) {
      setStatus("locked");
      setTimeout(() => setStatus("default"), 1800);
      return;
    }
    updateSetting("deskTheme", themeId);
  }

  async function handleSave() {
    setStatus("saving");
    try {
      if (!supabase || !session?.user?.id) throw new Error("Sign in to save.");
    const settingsToSave = { ...settings, deskTheme: visibleDeskTheme };
    if (session?.user?.id) setUserPreference(session.user.id, "workspace", settingsToSave);
    if (supabase && session?.user?.id) {
      const { error } = await supabase.from("workspace_settings").upsert({
        user_id: session.user.id,
        focus_mode: settingsToSave.focusMode,
        desk_theme: settingsToSave.deskTheme,
        show_clock: settingsToSave.showClock,
        show_decorations: settingsToSave.showDecorations,
        default_note_colour: settingsToSave.defaultNoteColour
      }, { onConflict: "user_id" });
      if (error) throw error;
    }
    setStatus("saved");
    setTimeout(() => setStatus("default"), 1800);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="settings-tab">
      <SettingsPageHeader title="Workspace" subtitle="Personalise your desk." />

      <SettingsSection title="Desk theme">
        <ThemeSelector currentTheme={visibleDeskTheme} isPro={isPro} onSelect={selectDeskTheme} />
        {status === "locked" && <p className="settings-helper amber">Premium desk themes are included with ForAllCode Pro.</p>}
      </SettingsSection>

      <SettingsSection title="Decorations">
        <FocusToggle label="Show clock" checked={settings.showClock} onChange={(value) => updateSetting("showClock", value)} />
        <FocusToggle label="Show plant and mug" checked={settings.showDecorations} onChange={(value) => updateSetting("showDecorations", value)} />
      </SettingsSection>

      <SettingsSection title="Focus mode">
        <FocusToggle label={`Focus mode currently: ${settings.focusMode ? "ON" : "OFF"}`} checked={settings.focusMode} onChange={(value) => updateSetting("focusMode", value)} />
        <div className="settings-inline-options">
          <label><input checked={settings.focusSchedule === "manual"} onChange={() => updateSetting("focusSchedule", "manual")} type="radio" /> Manual only</label>
          <label className="disabled"><input disabled type="radio" /> Scheduled <span>Coming soon</span></label>
        </div>
      </SettingsSection>

      <SettingsSection title="Sticky note defaults" description="Default new note colour.">
        <SettingsSwatches value={settings.defaultNoteColour} options={noteColours} onChange={(value) => updateSetting("defaultNoteColour", value)} />
        <SettingsActions><SettingsSaveButton status={status} onClick={handleSave} /></SettingsActions>
      </SettingsSection>
    </div>
  );
}

function ThemeSelector({ currentTheme, isPro, onSelect }) {
  return (
    <div className="desk-theme-grid">
      {Object.entries(DESK_THEMES).map(([id, theme]) => {
        const locked = theme.isPro && !isPro;
        const active = currentTheme === id;
        return (
          <button
            className={`desk-theme-card ${active ? "active" : ""} ${locked ? "locked" : ""}`}
            key={id}
            onClick={() => onSelect(id)}
            type="button"
          >
            <DeskPreview theme={theme} />
            <span className="desk-theme-card-footer">
              <span>
                <strong>{theme.name}</strong>
                <small>{theme.isPro ? "Premium workspace theme" : "Included with Free"}</small>
              </span>
              {theme.isPro && <b>{locked ? <Lock size={12} /> : null} PRO</b>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DeskPreview({ theme }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 72">
      <rect width="120" height="72" fill={theme.desk} />
      <rect x="12" y="48" width="96" height="8" fill={theme.deskEdge} />
      <rect x="22" y="14" width="46" height="28" fill={theme.monitor} stroke={theme.deskEdge} />
      <rect x="28" y="20" width="34" height="16" fill={theme.screen} />
      <rect x="75" y="16" width="18" height="18" fill={theme.mug} stroke={theme.deskEdge} />
      <rect x="82" y="42" width="18" height="18" fill={theme.plant} />
      <circle cx="94" cy="40" r="8" fill={theme.leaf} />
      <rect x="28" y="58" width="54" height="5" fill={theme.keyboard} />
    </svg>
  );
}
