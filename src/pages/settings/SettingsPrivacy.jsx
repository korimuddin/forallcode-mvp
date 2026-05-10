import { useEffect, useState } from "react";
import SettingsSection from "../../components/settings/SettingsSection";
import { SettingsActions, SettingsPageHeader, SettingsRadioCards, SettingsSaveButton, SettingsToggle } from "../../components/settings/SettingsControls";
import { supabase } from "../../lib/supabase";

export default function SettingsPrivacy() {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("default");
  const [privacy, setPrivacy] = useState({
    repoVisibility: "public",
    isPublic: true,
    showWorkspace: false,
    showActivityCalendar: true,
    showRecentActivity: true
  });

  useEffect(() => {
    async function loadPrivacy() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (!data.session?.user?.id) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_public, show_workspace, show_activity, privacy_settings")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (profile) {
        const stored = profile.privacy_settings || {};
        setPrivacy((current) => ({
          ...current,
          repoVisibility: stored.repoVisibility || current.repoVisibility,
          isPublic: profile.is_public ?? current.isPublic,
          showWorkspace: profile.show_workspace ?? current.showWorkspace,
          showActivityCalendar: profile.show_activity ?? current.showActivityCalendar,
          showRecentActivity: stored.showRecentActivity ?? current.showRecentActivity
        }));
      }
    }

    loadPrivacy();
  }, []);

  function updatePrivacy(key, value) {
    setPrivacy((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setStatus("saving");
    if (supabase && session?.user?.id) {
      await supabase.from("profiles").upsert({
        id: session.user.id,
        is_public: privacy.isPublic,
        show_workspace: privacy.showWorkspace,
        show_activity: privacy.showActivityCalendar,
        privacy_settings: {
          repoVisibility: privacy.repoVisibility,
          showRecentActivity: privacy.showRecentActivity
        }
      }, { onConflict: "id" });
    }
    setStatus("saved");
    setTimeout(() => setStatus("default"), 1800);
  }

  return (
    <div className="settings-tab">
      <SettingsPageHeader title="Privacy" subtitle="Control who sees what." />

      <SettingsSection title="Repository defaults">
        <SettingsRadioCards
          value={privacy.repoVisibility}
          onChange={(value) => updatePrivacy("repoVisibility", value)}
          options={[
            { value: "public", label: "Public", description: "Anyone can see this repo." },
            { value: "private", label: "Private", description: "Only you can see this repo." }
          ]}
        />
      </SettingsSection>

      <SettingsSection title="Profile visibility">
        <SettingsToggle label="Public profile" description={privacy.isPublic ? "Anyone can view your profile page." : "Only people you approve can see your profile."} checked={privacy.isPublic} onChange={(value) => updatePrivacy("isPublic", value)} />
      </SettingsSection>

      <SettingsSection title="Workspace">
        <SettingsToggle label="Show workspace on public profile" description="Off by default. Turn on to let visitors see your illustrated desk." checked={privacy.showWorkspace} onChange={(value) => updatePrivacy("showWorkspace", value)} />
      </SettingsSection>

      <SettingsSection title="Activity">
        <SettingsToggle label="Show activity calendar on public profile" checked={privacy.showActivityCalendar} onChange={(value) => updatePrivacy("showActivityCalendar", value)} />
        <SettingsToggle label="Show recent activity feed on public profile" checked={privacy.showRecentActivity} onChange={(value) => updatePrivacy("showRecentActivity", value)} />
        <SettingsActions><SettingsSaveButton status={status} onClick={handleSave} /></SettingsActions>
      </SettingsSection>
    </div>
  );
}
