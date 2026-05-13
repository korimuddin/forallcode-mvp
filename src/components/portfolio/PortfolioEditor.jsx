import { Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getCurrentSession, supabase, uploadPortfolioScreenshot } from "../../lib/supabase";
import TechStackPicker from "./TechStackPicker";

function normalizeEntry(entry, repo, index) {
  return {
    repo_id: repo.id,
    screenshot_url: entry?.screenshot_url || "",
    live_url: entry?.live_url || "",
    tech_stack: entry?.tech_stack?.length ? entry.tech_stack : [repo.language].filter(Boolean),
    featured: true,
    sort_order: entry?.sort_order ?? index
  };
}

export default function PortfolioEditor({
  onClose,
  onSaved,
  portfolioEntries = [],
  profile,
  repositories = []
}) {
  const entriesByRepo = useMemo(() => new Map(portfolioEntries.map((entry) => [entry.repo_id, entry])), [portfolioEntries]);
  const [selected, setSelected] = useState(() => {
    const initial = {};
    repositories.forEach((repo, index) => {
      const entry = entriesByRepo.get(repo.id);
      if (entry) initial[repo.id] = normalizeEntry(entry, repo, index);
    });
    return initial;
  });
  const [professionalTitle, setProfessionalTitle] = useState(profile?.professional_title || "");
  const [skills, setSkills] = useState(profile?.skills || []);
  const [saving, setSaving] = useState(false);
  const [uploadingRepo, setUploadingRepo] = useState("");
  const [status, setStatus] = useState("");

  function toggleRepo(repo) {
    setSelected((current) => {
      if (current[repo.id]) {
        const next = { ...current };
        delete next[repo.id];
        return next;
      }
      return {
        ...current,
        [repo.id]: normalizeEntry(null, repo, Object.keys(current).length)
      };
    });
  }

  function updateEntry(repoId, key, value) {
    setSelected((current) => ({
      ...current,
      [repoId]: {
        ...current[repoId],
        [key]: value
      }
    }));
  }

  async function handleScreenshot(repo, file) {
    if (!file) return;
    setUploadingRepo(repo.id);
    setStatus("");
    try {
      const session = await getCurrentSession();
      const screenshotUrl = await uploadPortfolioScreenshot(session, repo.name, file);
      updateEntry(repo.id, "screenshot_url", screenshotUrl);
      setStatus(`${repo.name} screenshot uploaded.`);
    } catch (error) {
      setStatus(error.message || "Could not upload this screenshot.");
    } finally {
      setUploadingRepo("");
    }
  }

  async function savePortfolio() {
    if (!supabase || !profile?.id) return;
    setSaving(true);
    setStatus("");
    try {
      const orderedEntries = Object.values(selected)
        .map((entry, index) => ({
          user_id: profile.id,
          repo_id: entry.repo_id,
          screenshot_url: entry.screenshot_url || null,
          live_url: entry.live_url || null,
          tech_stack: entry.tech_stack || [],
          featured: true,
          sort_order: index
        }));

      await supabase.from("profiles").update({
        professional_title: professionalTitle || null,
        skills
      }).eq("id", profile.id);

      const { error: deleteError } = await supabase
        .from("portfolio_entries")
        .delete()
        .eq("user_id", profile.id);
      if (deleteError) throw deleteError;

      if (orderedEntries.length) {
        const { error: insertError } = await supabase.from("portfolio_entries").insert(orderedEntries);
        if (insertError) throw insertError;
      }

      setStatus("Portfolio saved.");
      onSaved?.();
      setTimeout(() => onClose?.(), 450);
    } catch (error) {
      setStatus(error.message || "Could not save your portfolio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="portfolio-editor-backdrop" onClick={onClose}>
      <section className="portfolio-editor" role="dialog" aria-modal="true" aria-label="Edit portfolio" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span>Portfolio editor</span>
            <h2>Choose the work you want to share</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close portfolio editor">
            <X size={18} />
          </button>
        </header>

        <div className="portfolio-editor-profile">
          <label>
            Professional title
            <input value={professionalTitle} onChange={(event) => setProfessionalTitle(event.target.value)} placeholder="Frontend developer, open-source maintainer..." />
          </label>
          <label>
            Skills
            <TechStackPicker value={skills} onChange={setSkills} />
          </label>
        </div>

        <div className="portfolio-editor-repos">
          {repositories.map((repo) => {
            const entry = selected[repo.id];
            return (
              <article className={entry ? "portfolio-editor-repo selected" : "portfolio-editor-repo"} key={repo.id}>
                <label className="portfolio-editor-toggle">
                  <input type="checkbox" checked={Boolean(entry)} onChange={() => toggleRepo(repo)} />
                  <span>
                    <strong>{repo.name}</strong>
                    <small>{repo.description || "No description yet."}</small>
                  </span>
                </label>
                {entry && (
                  <div className="portfolio-editor-fields">
                    <label>
                      Live URL
                      <input value={entry.live_url || ""} onChange={(event) => updateEntry(repo.id, "live_url", event.target.value)} placeholder="https://project.example.com" />
                    </label>
                    <label>
                      Tech stack
                      <TechStackPicker value={entry.tech_stack || []} onChange={(value) => updateEntry(repo.id, "tech_stack", value)} />
                    </label>
                    <label className="portfolio-screenshot-field">
                      Screenshot
                      <input accept="image/*" type="file" onChange={(event) => handleScreenshot(repo, event.target.files?.[0])} disabled={uploadingRepo === repo.id} />
                      {entry.screenshot_url && <img src={entry.screenshot_url} alt={`${repo.name} screenshot preview`} />}
                      <span><Upload size={14} />{uploadingRepo === repo.id ? "Uploading..." : "Upload screenshot"}</span>
                    </label>
                  </div>
                )}
              </article>
            );
          })}
          {repositories.length === 0 && <p className="portfolio-editor-empty">Sync or create a repository first, then come back to choose projects.</p>}
        </div>

        {status && <p className="portfolio-editor-status">{status}</p>}
        <footer>
          <button className="button soft" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="button" type="button" onClick={savePortfolio} disabled={saving}>{saving ? "Saving..." : "Save portfolio"}</button>
        </footer>
      </section>
    </div>
  );
}
