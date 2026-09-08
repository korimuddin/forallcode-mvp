import { ExternalLink, Github, Link as LinkIcon, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import PortfolioCard from "../components/portfolio/PortfolioCard";
import PortfolioEditor from "../components/portfolio/PortfolioEditor";
import IllustratedAvatar from "../components/ui/IllustratedAvatar";
import { useAuthSession, useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

function mapProfile(row) {
  return {
    id: row.id,
    username: row.username || "",
    displayName: row.display_name || row.username || "ForAllCode developer",
    bio: row.bio || "",
    professional_title: row.professional_title || "",
    skills: row.skills || [],
    avatarStyle: row.avatar_style || "sage",
    avatarUrl: row.avatar_url || "",
    website: row.website || "",
    githubUrl: row.github_url || "",
    twitterUrl: row.twitter_url || "",
    linkedinUrl: row.linkedin_url || ""
  };
}

function mapRepo(row, username) {
  return {
    ...row,
    owner_username: username,
    stars: row.stars_count || 0,
    forks: row.forks_count || 0,
    private: Boolean(row.is_private)
  };
}

export default function Portfolio() {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const { session } = useAuthSession();
  const [profile, setProfile] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const isOwner = Boolean(session?.user?.id && profile?.id === session.user.id);

  useDocumentTitle(profile?.displayName ? `${profile.displayName} portfolio` : `${username} portfolio`);

  async function loadPortfolio() {
    if (!supabase || !username) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (profileError || !profileRow) {
      setProfile(null);
      setRepositories([]);
      setEntries([]);
      setLoading(false);
      return;
    }

    const mappedProfile = mapProfile(profileRow);
    setProfile(mappedProfile);

    const { data: repoRows } = await supabase
      .from("repositories")
      .select("*")
      .eq("owner_id", profileRow.id)
      .order("updated_at", { ascending: false });

    const mappedRepos = (repoRows || []).map((repo) => mapRepo(repo, mappedProfile.username));
    setRepositories(mappedRepos);

    const { data: entryRows } = await supabase
      .from("portfolio_entries")
      .select("*")
      .eq("user_id", profileRow.id)
      .order("sort_order", { ascending: true });

    const repoById = new Map(mappedRepos.map((repo) => [repo.id, repo]));
    const mappedEntries = (entryRows || [])
      .map((entry) => ({
        ...entry,
        repositories: repoById.get(entry.repo_id)
      }))
      .filter((entry) => entry.repositories);

    setEntries(mappedEntries);
    setLoading(false);
  }

  useEffect(() => {
    loadPortfolio();
  }, [username]);

  useEffect(() => {
    if (isOwner && searchParams.get("edit") === "1") setEditorOpen(true);
  }, [isOwner, searchParams]);

  const displayEntries = useMemo(() => {
    if (entries.length) return entries;
    return repositories
      .filter((repo) => !repo.private)
      .slice(0, 6)
      .map((repo, index) => ({
        id: `fallback-${repo.id || repo.name}`,
        repo_id: repo.id,
        repositories: repo,
        screenshot_url: repo.hero_image_url || "",
        live_url: "",
        tech_stack: [repo.language].filter(Boolean),
        sort_order: index
      }));
  }, [entries, repositories]);

  const skills = useMemo(() => {
    const profileSkills = Array.isArray(profile?.skills) ? profile.skills.filter(Boolean) : [];
    if (profileSkills.length) return profileSkills;
    return [...new Set(displayEntries.flatMap((entry) => entry.tech_stack || []).filter(Boolean))].slice(0, 12);
  }, [displayEntries, profile?.skills]);

  async function sharePortfolio() {
    const shareUrl = `${window.location.origin}/${encodeURIComponent(username)}/portfolio`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus("Portfolio link copied.");
    } catch {
      setShareStatus(shareUrl);
    }
    setTimeout(() => setShareStatus(""), 2400);
  }

  if (loading) {
    return (
      <div className="portfolio-public-page">
        <MinimalPortfolioNav name="Loading portfolio" username={username} />
        <div className="portfolio-loading">Preparing portfolio...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="portfolio-public-page">
        <MinimalPortfolioNav name="ForAllCode" username={username} />
        <section className="portfolio-empty-state">
          <h1>Portfolio not found</h1>
          <p>This developer has not set up a ForAllCode portfolio yet.</p>
          <Link className="button" to="/explore">Explore developers</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="portfolio-public-page">
      <MinimalPortfolioNav name={profile.displayName} username={profile.username} />
      <section className="portfolio-hero">
        <IllustratedAvatar size={96} variant={profile.avatarStyle} photoUrl={profile.avatarUrl} alt={profile.displayName} />
        <h1>{profile.displayName}</h1>
        <span>@{profile.username}</span>
        <h2>{profile.professional_title || firstBioLine(profile.bio) || "Developer building in public"}</h2>
        {profile.bio && <p>{profile.bio}</p>}
        <div className="portfolio-link-row">
          {profile.website && <a href={ensureUrl(profile.website)} target="_blank" rel="noreferrer"><LinkIcon size={15} />Website</a>}
          {profile.githubUrl && <a href={ensureUrl(profile.githubUrl)} target="_blank" rel="noreferrer"><Github size={15} />GitHub</a>}
          {profile.twitterUrl && <a href={ensureUrl(profile.twitterUrl)} target="_blank" rel="noreferrer">Twitter/X</a>}
          {profile.linkedinUrl && <a href={ensureUrl(profile.linkedinUrl)} target="_blank" rel="noreferrer"><ExternalLink size={15} />LinkedIn</a>}
        </div>
        <div className="portfolio-hero-actions">
          <button className="button" type="button" onClick={sharePortfolio}><Share2 size={16} />Share portfolio</button>
          {isOwner && <button className="button soft" type="button" onClick={() => setEditorOpen(true)}>Edit portfolio</button>}
        </div>
        {shareStatus && <small>{shareStatus}</small>}
      </section>

      <main className="portfolio-main">
        <section>
          <div className="portfolio-section-heading">
            <span>Selected work</span>
            <h2>Projects worth opening twice</h2>
          </div>
          <div className="portfolio-grid">
            {displayEntries.map((entry) => <PortfolioCard entry={entry} key={entry.id || entry.repo_id} />)}
          </div>
          {displayEntries.length === 0 && (
            <div className="portfolio-empty-state compact">
              <h2>No projects featured yet</h2>
              <p>{isOwner ? "Open the editor to choose the repositories you want to show here." : "This portfolio is warming up."}</p>
            </div>
          )}
        </section>

        <section className="portfolio-skills-section">
          <div className="portfolio-section-heading">
            <span>Skills</span>
            <h2>Tools and strengths</h2>
          </div>
          <div className="portfolio-skills">
            {(skills.length ? skills : ["Git", "Collaboration", "Project craft"]).map((skill) => <span key={skill}>{skill}</span>)}
          </div>
        </section>

        <section className="portfolio-activity-section">
          <div className="portfolio-section-heading">
            <span>Activity</span>
            <h2>Recent GitHub rhythm</h2>
          </div>
          <PortfolioHeatmap repositories={repositories} />
        </section>
      </main>

      <footer className="portfolio-footer">
        Built with <Link to="/">ForAllCode</Link>
      </footer>

      {editorOpen && (
        <PortfolioEditor
          profile={profile}
          repositories={repositories}
          portfolioEntries={entries}
          onClose={() => setEditorOpen(false)}
          onSaved={loadPortfolio}
        />
      )}
    </div>
  );
}

function MinimalPortfolioNav({ name, username }) {
  return (
    <nav className="portfolio-minimal-nav">
      <Link to="/home" className="portfolio-minimal-brand">
        <img src="/forallcode-logo.png" alt="" />
        <strong>ForAllCode</strong>
      </Link>
      <Link to={`/${username}`} className="portfolio-minimal-profile">{name}</Link>
    </nav>
  );
}

function PortfolioHeatmap({ repositories }) {
  const cells = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 84 }, (_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (83 - index));
      const dateKey = day.toISOString().slice(0, 10);
      const count = repositories.filter((repo) => {
        const updated = repo.updated_at || repo.updatedAt;
        return updated && String(updated).slice(0, 10) === dateKey;
      }).length;
      return { dateKey, count };
    });
  }, [repositories]);

  return (
    <div className="portfolio-heatmap" aria-label="Recent repository activity">
      {cells.map((cell) => <span className={`level-${Math.min(cell.count, 3)}`} title={cell.dateKey} key={cell.dateKey} />)}
    </div>
  );
}

function ensureUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function firstBioLine(value) {
  return String(value || "").split(/\n|\. /)[0]?.trim();
}
