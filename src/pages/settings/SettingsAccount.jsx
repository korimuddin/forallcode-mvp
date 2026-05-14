import { useEffect, useMemo, useState } from "react";
import { Github } from "lucide-react";
import SettingsInput from "../../components/settings/SettingsInput";
import SettingsSection from "../../components/settings/SettingsSection";
import { SettingsActions, SettingsPageHeader, SettingsSaveButton } from "../../components/settings/SettingsControls";
import IllustratedAvatar from "../../components/ui/IllustratedAvatar";
import { UpgradeButton } from "../../components/ui/UpgradeButton";
import { getUserPreference, setUserPreference } from "../../lib/preferences";
import { signInWithGitHub, supabase } from "../../lib/supabase";
import { useSubscription } from "../../lib/useSubscription";

const defaultAccount = {
  displayName: "",
  email: "",
  githubUsername: "",
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

function formatRenewalDate(value) {
  if (!value) return "after your current billing period";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function BillingSection() {
  const { subscription, isPro, isCancelling } = useSubscription();
  const [billingStatus, setBillingStatus] = useState("");
  const [openingPortal, setOpeningPortal] = useState(false);

  async function handleManageBilling() {
    setBillingStatus("");
    setOpeningPortal(true);

    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) throw new Error("Please sign in before managing billing.");

      const response = await fetch("/.netlify/functions/create-billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          returnUrl: `${window.location.origin}/settings/account`
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Could not open billing portal.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setBillingStatus(error.message || "Could not open billing portal.");
      setOpeningPortal(false);
    }
  }

  if (!isPro) {
    return (
      <SettingsSection title="Plan" description="You are on the Free plan.">
        <div className="settings-plan-card">
          <div>
            <strong>ForAllCode Free</strong>
            <span>Public repos, learning, README Studio, one landing page, and five sticky notes.</span>
          </div>
          <UpgradeButton />
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection title="Plan" description="You are on ForAllCode Pro.">
      <div className="settings-plan-card pro">
        <div>
          <strong>ForAllCode Pro — £10/month</strong>
          {isCancelling ? (
            <span className="settings-billing-warning">
              Cancels at end of billing period ({formatRenewalDate(subscription.current_period_end)})
            </span>
          ) : (
            <span>Renews {formatRenewalDate(subscription.current_period_end)}</span>
          )}
        </div>
        <button className="settings-ghost" disabled={openingPortal} onClick={handleManageBilling} type="button">
          {openingPortal ? "Opening..." : "Manage billing →"}
        </button>
      </div>
      {billingStatus && <p className="settings-error">{billingStatus}</p>}
    </SettingsSection>
  );
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
      const localProfile = getUserPreference(nextSession.user.id, "profile", null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_style")
        .eq("id", nextSession.user.id)
        .maybeSingle();

      const metadata = nextSession.user.user_metadata || {};
      const nextAccount = {
        displayName: localProfile?.displayName || profile?.display_name || metadata.full_name || metadata.name || metadata.user_name || defaultAccount.displayName,
        email: nextSession.user.email || defaultAccount.email,
        githubUsername: localProfile?.username || metadata.user_name || metadata.preferred_username || profile?.username || "",
        avatarStyle: localProfile?.avatarStyle || profile?.avatar_style || defaultAccount.avatarStyle
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
      if (session?.user?.id) {
        const currentProfile = getUserPreference(session.user.id, "profile", {});
        setUserPreference(session.user.id, "profile", {
          ...currentProfile,
          displayName: account.displayName,
          username: account.githubUsername || currentProfile.username || ""
        });
      }
      if (!supabase || !session?.user?.id) return;
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: session.user.id, display_name: account.displayName }, { onConflict: "id" });
      if (error) console.warn("Could not sync account display name to Supabase.", error);
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
        <SettingsInput hideLabel label="Display name" value={account.displayName} onChange={(value) => updateAccount("displayName", value)} />
        <SettingsActions><SettingsSaveButton status={displayStatus} onClick={handleDisplaySave} /></SettingsActions>
      </SettingsSection>

      <SettingsSection title="Email address">
        <SettingsInput hideLabel label="Email" value={email} onChange={setEmail} readOnly={isGitHubUser} />
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

      <BillingSection />

      <SettingsSection title="Sessions">
        <p className="settings-muted">You are currently signed in.</p>
        <button className="settings-ghost danger" onClick={handleSignOutAll} type="button">Sign out of all devices</button>
      </SettingsSection>
    </div>
  );
}
