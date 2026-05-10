import { useEffect, useMemo, useState } from "react";
import { Github } from "lucide-react";
import SettingsInput from "../../components/settings/SettingsInput";
import SettingsSection from "../../components/settings/SettingsSection";
import { SettingsActions, SettingsPageHeader, SettingsSaveButton } from "../../components/settings/SettingsControls";
import IllustratedAvatar from "../../components/ui/IllustratedAvatar";
import { signInWithGitHub, supabase } from "../../lib/supabase";

const defaultAccount = {
  displayName: "Mira Patel",
  email: "mira@forallcode.dev",
  githubUsername: "mira",
  avatarStyle: "sage"
};

function useSaveStatus() {
  const [status, setStatus] = useState("default");

  async function run(callback) {
    setStatus("saving");
    try {
      await callback?.();
      setStatus("saved");
      setTimeout(() => setStatus("default"), 1800);
    } catch {
      setStatus("default");
    }
  }

  return [status, run];
}

export default function SettingsAccount() {
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState(defaultAccount);
  const [email, setEmail] = useState(defaultAccount.email);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [displayStatus, saveDisplay] = useSaveStatus();
  const [emailStatus, saveEmail] = useSaveStatus();
  const [passwordStatus, savePassword] = useSaveStatus();

  const isGitHubUser = useMemo(
    () => session?.user?.app_metadata?.provider === "github" || Boolean(account.githubUsername),
    [account.githubUsername, session]
  );

  useEffect(() => {
    async function loadAccount() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const nextSession = data.session;
      setSession(nextSession);
      if (!nextSession?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_style")
        .eq("id", nextSession.user.id)
        .maybeSingle();

      const metadata = nextSession.user.user_metadata || {};
      const nextAccount = {
        displayName: profile?.display_name || metadata.name || defaultAccount.displayName,
        email: nextSession.user.email || defaultAccount.email,
        githubUsername: metadata.user_name || metadata.preferred_username || profile?.username || "",
        avatarStyle: profile?.avatar_style || defaultAccount.avatarStyle
      };

      setAccount(nextAccount);
      setEmail(nextAccount.email);
    }

    loadAccount();
  }, []);

  function updateAccount(key, value) {
    setAccount((current) => ({ ...current, [key]: value }));
  }

  async function handleDisplaySave() {
    await saveDisplay(async () => {
      if (!supabase || !session?.user?.id) return;
      await supabase
        .from("profiles")
        .upsert({ id: session.user.id, display_name: account.displayName }, { onConflict: "id" });
    });
  }

  async function handleEmailSave() {
    await saveEmail(async () => {
      if (!supabase || !session?.user?.id || isGitHubUser) return;
      await supabase.auth.updateUser({ email });
    });
  }

  async function handlePasswordSave() {
    setPasswordError("");
    if (passwords.next.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("New password and confirmation must match.");
      return;
    }

    await savePassword(async () => {
      if (!supabase) return;
      await supabase.auth.updateUser({ password: passwords.next });
      setPasswords({ current: "", next: "", confirm: "" });
    });
  }

  async function handleDisconnect() {
    if (window.confirm("Disconnect GitHub from ForAllCode?")) {
      updateAccount("githubUsername", "");
    }
  }

  async function handleSignOutAll() {
    if (supabase) await supabase.auth.signOut({ scope: "global" });
  }

  return (
    <div className="settings-tab">
      <SettingsPageHeader title="Account" subtitle="Manage your account details and connected services." />

      <SettingsSection title="Display name">
        <SettingsInput label="Display name" value={account.displayName} onChange={(value) => updateAccount("displayName", value)} />
        <SettingsActions><SettingsSaveButton status={displayStatus} onClick={handleDisplaySave} /></SettingsActions>
      </SettingsSection>

      <SettingsSection title="Email address">
        <SettingsInput label="Email" value={email} onChange={setEmail} readOnly={isGitHubUser} />
        {isGitHubUser && (
          <p className="settings-info-note">Your email is managed by GitHub. To change it, update your GitHub account.</p>
        )}
        {!isGitHubUser && <SettingsActions><SettingsSaveButton status={emailStatus} onClick={handleEmailSave}>Verify new email</SettingsSaveButton></SettingsActions>}
      </SettingsSection>

      {!isGitHubUser && (
        <SettingsSection title="Password">
          <div className="settings-fields one-column">
            <SettingsInput label="Current password" type="password" value={passwords.current} onChange={(value) => setPasswords((current) => ({ ...current, current: value }))} />
            <SettingsInput label="New password" type="password" value={passwords.next} onChange={(value) => setPasswords((current) => ({ ...current, next: value }))} />
            <SettingsInput label="Confirm password" type="password" value={passwords.confirm} onChange={(value) => setPasswords((current) => ({ ...current, confirm: value }))} />
          </div>
          {passwordError && <p className="settings-error">{passwordError}</p>}
          <SettingsActions><SettingsSaveButton status={passwordStatus} onClick={handlePasswordSave}>Update password</SettingsSaveButton></SettingsActions>
        </SettingsSection>
      )}

      <SettingsSection title="Connected accounts">
        <div className="settings-connected-card">
          <div>
            <Github size={28} />
            <IllustratedAvatar size={38} variant={account.avatarStyle} />
            <span>
              <strong>GitHub</strong>
              <small>{account.githubUsername ? `@${account.githubUsername}` : "Not connected"}</small>
            </span>
          </div>
          {account.githubUsername ? (
            <div className="settings-connected-actions">
              <span className="settings-pill success">Connected</span>
              <button className="settings-ghost danger" onClick={handleDisconnect} type="button">Disconnect</button>
            </div>
          ) : (
            <button className="settings-ghost" onClick={signInWithGitHub} type="button">Connect GitHub</button>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title="Sessions">
        <p className="settings-muted">You are currently signed in.</p>
        <button className="settings-ghost danger" onClick={handleSignOutAll} type="button">Sign out of all devices</button>
      </SettingsSection>
    </div>
  );
}
