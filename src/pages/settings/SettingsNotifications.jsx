import { useEffect, useState } from "react";
import SettingsSection from "../../components/settings/SettingsSection";
import { SettingsActions, SettingsPageHeader, SettingsSaveButton, SettingsToggle } from "../../components/settings/SettingsControls";
import { supabase } from "../../lib/supabase";

export default function SettingsNotifications() {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("default");
  const [prefs, setPrefs] = useState({
    inappStars: true,
    inappFollowers: true,
    inappComments: true,
    inappLearnReminders: true,
    emailDigest: true,
    emailFollowers: false,
    emailMarketing: false
  });

  useEffect(() => {
    async function loadPrefs() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (!data.session?.user?.id) return;
      const { data: stored } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (stored) {
        setPrefs({
          inappStars: stored.inapp_stars ?? true,
          inappFollowers: stored.inapp_followers ?? true,
          inappComments: stored.inapp_comments ?? true,
          inappLearnReminders: stored.inapp_learn_reminders ?? true,
          emailDigest: stored.email_digest ?? true,
          emailFollowers: stored.email_followers ?? false,
          emailMarketing: stored.email_marketing ?? false
        });
      }
    }

    loadPrefs();
  }, []);

  function updatePref(key, value) {
    setPrefs((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setStatus("saving");
    if (supabase && session?.user?.id) {
      await supabase.from("notification_settings").upsert({
        user_id: session.user.id,
        inapp_stars: prefs.inappStars,
        inapp_followers: prefs.inappFollowers,
        inapp_comments: prefs.inappComments,
        inapp_learn_reminders: prefs.inappLearnReminders,
        email_digest: prefs.emailDigest,
        email_followers: prefs.emailFollowers,
        email_marketing: prefs.emailMarketing
      }, { onConflict: "user_id" });
    }
    setStatus("saved");
    setTimeout(() => setStatus("default"), 1800);
  }

  return (
    <div className="settings-tab">
      <SettingsPageHeader title="Notifications" subtitle="Choose what you hear about and how." />

      <SettingsSection title="In-app notifications">
        <SettingsToggle label="Someone stars your repo" checked={prefs.inappStars} onChange={(value) => updatePref("inappStars", value)} />
        <SettingsToggle label="New follower" checked={prefs.inappFollowers} onChange={(value) => updatePref("inappFollowers", value)} />
        <SettingsToggle label="Comment on your repo" checked={prefs.inappComments} onChange={(value) => updatePref("inappComments", value)} />
        <SettingsToggle label="Lesson completion reminder" description="Remind me to continue learning." checked={prefs.inappLearnReminders} onChange={(value) => updatePref("inappLearnReminders", value)} />
      </SettingsSection>

      <SettingsSection title="Email notifications">
        <SettingsToggle label="Weekly activity digest" description="A summary of your week, every Monday." checked={prefs.emailDigest} onChange={(value) => updatePref("emailDigest", value)} />
        <SettingsToggle label="New follower" description="When someone follows you." checked={prefs.emailFollowers} onChange={(value) => updatePref("emailFollowers", value)} />
        <SettingsToggle label="Security alerts" description="Security alerts cannot be disabled." checked disabled locked />
        <SettingsToggle label="ForAllCode news and updates" description="Product announcements and tips." checked={prefs.emailMarketing} onChange={(value) => updatePref("emailMarketing", value)} />
        <SettingsActions><SettingsSaveButton status={status} onClick={handleSave} /></SettingsActions>
      </SettingsSection>
    </div>
  );
}
