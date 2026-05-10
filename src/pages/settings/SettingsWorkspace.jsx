import { useEffect, useState } from "react";
import SettingsSection from "../../components/settings/SettingsSection";
import { FocusToggle, SettingsActions, SettingsPageHeader, SettingsRadioCards, SettingsSaveButton, SettingsSwatches } from "../../components/settings/SettingsControls";
import { supabase } from "../../lib/supabase";

const noteColours = [
  { label: "Lavender", value: "lavender", colour: "#ddd5f0" },
  { label: "Rose", value: "rose", colour: "#f5d5d8" },
  { label: "Sage", value: "sage", colour: "#c8d8c4" },
  { label: "Amber", value: "amber", colour: "#f5e4c4" }
];

export default function SettingsWorkspace() {
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

  useEffect(() => {
    async function loadSettings() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (!data.session?.user?.id) return;

      const { data: stored } = await supabase
        .from("workspace_settings")
        .select("*")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      if (stored) {
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

  async function handleSave() {
    setStatus("saving");
    if (supabase && session?.user?.id) {
      await supabase.from("workspace_settings").upsert({
        user_id: session.user.id,
        focus_mode: settings.focusMode,
        desk_theme: settings.deskTheme,
        show_clock: settings.showClock,
        show_decorations: settings.showDecorations,
        default_note_colour: settings.defaultNoteColour
      }, { onConflict: "user_id" });
    }
    setStatus("saved");
    setTimeout(() => setStatus("default"), 1800);
  }

  return (
    <div className="settings-tab">
      <SettingsPageHeader title="Workspace" subtitle="Personalise your desk." />

      <SettingsSection title="Desk theme">
        <SettingsRadioCards
          value={settings.deskTheme}
          onChange={(value) => updateSetting("deskTheme", value)}
          options={[
            { value: "classic", label: "Classic", description: "Cream tones, warm white desk.", preview: <DeskPreview tone="#fffdf9" accent="#ddd5f0" /> },
            { value: "cosy", label: "Cosy", description: "Warmer surface with amber accents.", preview: <DeskPreview tone="#f5e4c4" accent="#f5d5d8" /> },
            { value: "minimal", label: "Minimal", description: "Lighter, calmer, less decoration.", preview: <DeskPreview tone="#faf7f2" accent="#cce0f0" /> },
            { value: "night", label: "Night owl", description: "A darker desk surface.", preview: <DeskPreview tone="#6b5f58" accent="#9b8fd4" />, disabled: true }
          ]}
        />
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

function DeskPreview({ tone, accent }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 72">
      <rect width="120" height="72" rx="12" fill={tone} />
      <rect x="22" y="14" width="46" height="28" rx="6" fill="#fffdf9" stroke="#e8e0d4" />
      <rect x="75" y="16" width="18" height="18" rx="6" fill={accent} />
      <rect x="28" y="50" width="54" height="6" rx="3" fill="#e8e0d4" />
    </svg>
  );
}
