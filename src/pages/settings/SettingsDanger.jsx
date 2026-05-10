import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SettingsSection from "../../components/settings/SettingsSection";
import { SettingsPageHeader } from "../../components/settings/SettingsControls";
import { supabase } from "../../lib/supabase";

export default function SettingsDanger() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [deleteStep, setDeleteStep] = useState(0);

  useEffect(() => {
    async function loadUser() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (!data.session?.user?.id) return;
      const metadata = data.session.user.user_metadata || {};
      setUsername(metadata.user_name || metadata.preferred_username || data.session.user.email?.split("@")[0] || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (profile?.username) setUsername(profile.username);
    }

    loadUser();
  }, []);

  async function handleExport() {
    const userId = session?.user?.id || "demo-user";
    const exportData = {
      exported_at: new Date().toISOString(),
      profile: { username },
      repositories: [],
      workspace_notes: [],
      workspace_todos: [],
      learn_progress: []
    };

    if (supabase && session?.user?.id) {
      const [profile, repos, notes, todos, progress] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("repositories").select("*").eq("owner_id", session.user.id),
        supabase.from("workspace_notes").select("*").eq("user_id", session.user.id),
        supabase.from("workspace_todos").select("*").eq("user_id", session.user.id),
        supabase.from("learn_progress").select("*").eq("user_id", session.user.id)
      ]);

      exportData.profile = profile.data;
      exportData.repositories = repos.data || [];
      exportData.workspace_notes = notes.data || [];
      exportData.workspace_todos = todos.data || [];
      exportData.learn_progress = progress.data || [];
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `forallcode-export-${userId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleMakePrivate() {
    if (!window.confirm("Are you sure? This will make all repos private. You can change them back individually.")) return;
    if (supabase && session?.user?.id) {
      await supabase.from("repositories").update({ is_private: true }).eq("owner_id", session.user.id);
    }
  }

  async function handleDeleteAccount() {
    if (!supabase || !session?.user?.id) {
      navigate("/");
      return;
    }

    const userId = session.user.id;
    await supabase.from("stars").delete().eq("user_id", userId);
    await supabase.from("follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);
    await supabase.from("learn_progress").delete().eq("user_id", userId);
    await supabase.from("workspace_notes").delete().eq("user_id", userId);
    await supabase.from("workspace_todos").delete().eq("user_id", userId);
    await supabase.from("workspace_settings").delete().eq("user_id", userId);
    await supabase.from("repositories").delete().eq("owner_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <div className="settings-danger-page">
      <SettingsPageHeader title="Danger zone" subtitle="These actions are permanent and cannot be undone." />

      <SettingsSection title="Export your data">
        <p className="settings-muted">Download all your ForAllCode data as a JSON file. Includes your profile, repos list, workspace notes, to-dos, and learn progress.</p>
        <button className="settings-ghost" onClick={handleExport} type="button">Export data</button>
      </SettingsSection>

      <SettingsSection title="Make all repos private">
        <p className="settings-muted">Set all your repositories to private at once.</p>
        <button className="settings-ghost warning" onClick={handleMakePrivate} type="button">Make all repos private</button>
      </SettingsSection>

      <SettingsSection title="Delete account">
        <p className="settings-muted">Permanently delete your ForAllCode account and all associated data. This cannot be undone.</p>
        {deleteStep === 0 && <button className="settings-ghost danger" onClick={() => setDeleteStep(1)} type="button">Delete account</button>}
        {deleteStep === 1 && (
          <div className="settings-delete-panel">
            <label>
              <span>To confirm, type your username below:</span>
              <input value={confirmName} onChange={(event) => setConfirmName(event.target.value)} placeholder={username} />
            </label>
            <div className="settings-button-row">
              <button className="settings-ghost" onClick={() => setDeleteStep(0)} type="button">Cancel</button>
              <button className="settings-ghost danger" disabled={confirmName !== username} onClick={() => setDeleteStep(2)} type="button">Continue</button>
            </div>
          </div>
        )}
        {deleteStep === 2 && (
          <div className="settings-delete-panel">
            <p>Last chance. This will permanently delete your profile, workspace notes, learn progress, and all repos from ForAllCode. GitHub repos are not affected.</p>
            <div className="settings-button-row">
              <button className="settings-ghost" onClick={() => setDeleteStep(0)} type="button">Cancel</button>
              <button className="settings-delete-button" onClick={handleDeleteAccount} type="button">Delete my account</button>
            </div>
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
