import { useEffect, useMemo, useState } from "react";
import DNSInstructions from "../../components/domains/DNSInstructions";
import DomainSetupCard from "../../components/domains/DomainSetupCard";
import SettingsSection from "../../components/settings/SettingsSection";
import { SettingsPageHeader } from "../../components/settings/SettingsControls";
import { ProGate } from "../../components/ui/ProGate";
import Skeleton from "../../components/ui/Skeleton";
import { supabase } from "../../lib/supabase";

const domainPattern = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;

export default function SettingsDomains() {
  const [session, setSession] = useState(null);
  const [repos, setRepos] = useState([]);
  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [activeDomainId, setActiveDomainId] = useState("");
  const [verifyingId, setVerifyingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadDomains() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data: sessionData } = await supabase.auth.getSession();
      const nextSession = sessionData.session;
      if (!alive) return;
      setSession(nextSession);

      if (!nextSession?.user?.id) {
        setLoading(false);
        return;
      }

      const [repoResult, domainResult] = await Promise.all([
        supabase
          .from("repositories")
          .select("id, name, landing_page_html")
          .eq("owner_id", nextSession.user.id)
          .not("landing_page_html", "is", null)
          .order("name", { ascending: true }),
        supabase
          .from("custom_domains")
          .select("*, repositories(name)")
          .eq("user_id", nextSession.user.id)
          .order("created_at", { ascending: false })
      ]);

      if (!alive) return;
      if (repoResult.error) setError(repoResult.error.message);
      if (domainResult.error) setError(domainResult.error.message);
      const nextRepos = repoResult.data || [];
      setRepos(nextRepos);
      setDomains(domainResult.data || []);
      setSelectedRepo((current) => current || nextRepos[0]?.id || "");
      setLoading(false);
    }

    loadDomains();
    return () => {
      alive = false;
    };
  }, []);

  const activeDomain = useMemo(() => domains.find((item) => item.id === activeDomainId), [activeDomainId, domains]);

  async function handleConnect(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedDomain = domain.trim().toLowerCase();
    if (!selectedRepo) {
      setError("Choose a repo with a published landing page first.");
      return;
    }
    if (normalizedDomain.startsWith("http://") || normalizedDomain.startsWith("https://")) {
      setError("Enter only the domain name, without http:// or https://.");
      return;
    }
    if (!domainPattern.test(normalizedDomain)) {
      setError("Enter a valid domain, for example www.yourproject.com.");
      return;
    }

    setSaving(true);
    try {
      const { data: existing, error: existingError } = await supabase
        .from("custom_domains")
        .select("id, user_id")
        .eq("domain", normalizedDomain)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing?.user_id && existing.user_id !== session?.user?.id) {
        throw new Error("This domain is already connected by another user.");
      }
      if (existing?.user_id === session?.user?.id) {
        throw new Error("This domain is already connected to your account.");
      }

      const token = `forallcode-verify-${Math.random().toString(36).slice(2)}`;
      const { data: inserted, error: insertError } = await supabase
        .from("custom_domains")
        .insert({
          user_id: session.user.id,
          repo_id: selectedRepo,
          domain: normalizedDomain,
          verified: false,
          verification_token: token
        })
        .select("*, repositories(name)")
        .single();
      if (insertError) throw insertError;

      setDomains((current) => [inserted, ...current]);
      setActiveDomainId(inserted.id);
      setDomain("");
      setMessage("Domain added. Add the DNS records below, then verify.");
    } catch (connectError) {
      setError(connectError.message || "Could not connect this domain.");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify(domainRow) {
    setError("");
    setMessage("");
    setVerifyingId(domainRow.id);

    try {
      const response = await fetch("/.netlify/functions/verify-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domainRow.domain,
          token: domainRow.verification_token,
          userId: session.user.id,
          repoId: domainRow.repo_id
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not verify this domain.");
      if (!payload.verified) {
        setMessage(payload.message || "TXT record not found yet.");
        return;
      }

      setDomains((current) => current.map((item) => (
        item.id === domainRow.id ? { ...item, verified: true, verified_at: new Date().toISOString() } : item
      )));
      setMessage(`${domainRow.domain} is verified.`);
    } catch (verifyError) {
      setError(verifyError.message || "Could not verify this domain.");
    } finally {
      setVerifyingId("");
    }
  }

  async function handleRemove(domainRow) {
    if (!window.confirm(`Remove ${domainRow.domain}?`)) return;
    setError("");
    setMessage("");
    const { error: removeError } = await supabase.from("custom_domains").delete().eq("id", domainRow.id);
    if (removeError) {
      setError(removeError.message || "Could not remove this domain.");
      return;
    }
    setDomains((current) => current.filter((item) => item.id !== domainRow.id));
    if (activeDomainId === domainRow.id) setActiveDomainId("");
  }

  return (
    <ProGate feature="Custom domains" description="Connect your own domain to your ForAllCode landing pages.">
      <div className="settings-tab settings-domains-tab">
        <SettingsPageHeader title="Custom domains" subtitle="Connect your domain to your repo landing pages." />

        {loading ? (
          <Skeleton className="settings-domains-skeleton" />
        ) : (
          <>
            <SettingsSection title="Connect a domain" description="Choose a published landing page, then add the domain you want visitors to use.">
              <form className="domain-connect-form" onSubmit={handleConnect}>
                <label>
                  <span>Domain</span>
                  <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="www.yourproject.com" />
                </label>
                <label>
                  <span>Repo</span>
                  <select value={selectedRepo} onChange={(event) => setSelectedRepo(event.target.value)}>
                    {repos.map((repo) => <option key={repo.id} value={repo.id}>{repo.name}</option>)}
                  </select>
                </label>
                <button className="settings-save-button" disabled={saving || repos.length === 0} type="submit">
                  {saving ? "Connecting..." : "Connect domain"}
                </button>
              </form>
              {repos.length === 0 && <p className="settings-muted">Publish a repo landing page first, then come back to connect a custom domain.</p>}
              {error && <p className="settings-error">{error}</p>}
              {message && <p className="settings-success">{message}</p>}
              {activeDomain && (
                <DNSInstructions
                  domain={activeDomain.domain}
                  verificationToken={activeDomain.verification_token}
                  verifying={verifyingId === activeDomain.id}
                  onVerify={() => handleVerify(activeDomain)}
                />
              )}
            </SettingsSection>

            <SettingsSection title="Your domains">
              {domains.length > 0 ? (
                <div className="domain-table-wrap">
                  <table className="domain-table">
                    <thead>
                      <tr>
                        <th>Domain</th>
                        <th>Repo</th>
                        <th>Status</th>
                        <th>Added</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domains.map((item) => (
                        <DomainSetupCard
                          domain={item}
                          key={item.id}
                          onRemove={handleRemove}
                          onVerify={handleVerify}
                          showInstructions={activeDomainId === item.id}
                          verifying={verifyingId === item.id}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="settings-muted">No custom domains connected yet.</p>
              )}
            </SettingsSection>

            <SettingsSection title="How it works">
              <div className="domain-how-it-works">
                <article><strong>1</strong><span>Add your domain and choose the landing page it should open.</span></article>
                <article><strong>2</strong><span>Add the TXT record so ForAllCode can verify you own it.</span></article>
                <article><strong>3</strong><span>Point your CNAME to ForAllCode and press verify when DNS has updated.</span></article>
              </div>
            </SettingsSection>
          </>
        )}
      </div>
    </ProGate>
  );
}
