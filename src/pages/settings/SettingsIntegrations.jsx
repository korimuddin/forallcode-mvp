import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import SettingsSection from "../../components/settings/SettingsSection";
import { SettingsPageHeader } from "../../components/settings/SettingsControls";
import { signInWithGitHub, supabase } from "../../lib/supabase";

export default function SettingsIntegrations() {
  const [githubUsername, setGithubUsername] = useState("mira");

  useEffect(() => {
    async function loadSession() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const metadata = data.session?.user?.user_metadata;
      if (metadata?.user_name || metadata?.preferred_username) {
        setGithubUsername(metadata.user_name || metadata.preferred_username);
      }
    }

    loadSession();
  }, []);

  function handleDisconnect() {
    if (window.confirm("Disconnect GitHub? Your repos will stay on ForAllCode, but sync access will be removed.")) {
      setGithubUsername("");
    }
  }

  return (
    <div className="settings-tab">
      <SettingsPageHeader title="Integrations" subtitle="Connected apps and services." />

      <SettingsSection title="GitHub">
        <div className="settings-integration-card">
          <div>
            <Github size={32} />
            <span>
              <strong>GitHub</strong>
              <small>{githubUsername ? `Connected as @${githubUsername}` : "Not connected"}</small>
              <small>Your repos are synced from GitHub. Disconnecting will remove access but will not delete your repos from ForAllCode.</small>
            </span>
          </div>
          {githubUsername ? (
            <button className="settings-ghost danger" onClick={handleDisconnect} type="button">Disconnect</button>
          ) : (
            <button className="settings-ghost" onClick={signInWithGitHub} type="button">Connect</button>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title="Coming soon">
        <div className="settings-coming-soon-grid">
          {[
            ["Netlify", "Deploy your repo directly from ForAllCode"],
            ["Vercel", "One-click deploy to Vercel"],
            ["Slack", "Get notifications in your Slack workspace"]
          ].map(([name, text]) => (
            <article key={name}>
              <span>
                <strong>{name}</strong>
                <small>{text}</small>
              </span>
              <em>Coming soon</em>
            </article>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
