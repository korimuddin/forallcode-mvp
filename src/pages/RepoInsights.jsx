import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { CheckCircle2, Circle, GitFork, ShieldCheck, Star } from "lucide-react";
import Skeleton from "../components/ui/Skeleton";
import { useDocumentTitle } from "../lib/hooks";
import { getCurrentSession, supabase } from "../lib/supabase";
import { useRepoAccess } from "../lib/useRepoAccess";

const languageColours = {
  JavaScript: "#c8a055",
  TypeScript: "#9b8fd4",
  CSS: "#7aaa72",
  HTML: "#d4848c",
  Python: "#6aa8d4",
  Shell: "#9c918c",
  Rust: "#c56f5d",
  Go: "#76b7b2"
};

function RepoInsightsHeader({ repo, repoName, username }) {
  return (
    <>
      <section className="issue-repo-header">
        <div className="repo-breadcrumb">
          <Link to="/repos">{username}</Link>
          <b>/</b>
          <Link to={`/${username}/${repoName}`}>{repoName}</Link>
        </div>
        <h1>{repo?.hero_title || repoName}</h1>
        <p>{repo?.description || "GitHub repository"}</p>
      </section>
      <nav className="repo-tab-bar issue-page-tabs" aria-label="Repository navigation">
        <Link to={`/${username}/${repoName}`}>Code</Link>
        <Link to={`/${username}/${repoName}/issues`}>Issues</Link>
        <Link to={`/${username}/${repoName}/pulls`}>Pull requests</Link>
        <Link to={`/${username}/${repoName}/discussions`}>Discussions</Link>
        <Link to={`/${username}/${repoName}/projects`}>Projects</Link>
        <Link className="active" to={`/${username}/${repoName}/insights`}>Insights</Link>
        <Link to={`/${username}/${repoName}`}>Commits</Link>
        <Link to={`/${username}/${repoName}`}>Branches</Link>
        <Link to={`/${username}/${repoName}`}>Settings</Link>
      </nav>
    </>
  );
}

export default function RepoInsights() {
  const { username, repo: repoName } = useParams();
  useDocumentTitle(`Insights · ${repoName} · ${username}`);
  const [repo, setRepo] = useState(null);
  const [counts, setCounts] = useState({ openIssues: 0, openPrs: 0 });
  const [githubStats, setGithubStats] = useState({
    commits: [],
    contributors: [],
    forks: 0,
    hasLicense: false,
    hasReadme: false,
    languages: [],
    stars: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { canMerge, loading: accessLoading } = useRepoAccess(repo?.id, repo?.owner_id);

  useEffect(() => {
    let alive = true;

    async function loadRepo() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data: repository, error: repoError } = await supabase
        .from("repositories")
        .select("*, profiles!repositories_owner_id_fkey!inner(id, username, display_name, avatar_style), repo_topics(topic)")
        .eq("name", repoName)
        .eq("profiles.username", username)
        .maybeSingle();

      if (!alive) return;
      if (repoError || !repository) {
        setRepo(null);
        setError(repoError?.message || "Repository not found.");
        setLoading(false);
        return;
      }

      setRepo(repository);

      const [{ count: issueCount }, { count: prCount }] = await Promise.all([
        supabase
          .from("issues")
          .select("id", { count: "exact", head: true })
          .eq("repo_id", repository.id)
          .eq("status", "open"),
        supabase
          .from("pull_requests")
          .select("id", { count: "exact", head: true })
          .eq("repo_id", repository.id)
          .eq("status", "open")
      ]);

      if (!alive) return;
      setCounts({ openIssues: issueCount || 0, openPrs: prCount || 0 });
      setLoading(false);
    }

    loadRepo();
    return () => {
      alive = false;
    };
  }, [repoName, username]);

  useEffect(() => {
    let alive = true;

    async function loadGithubInsights() {
      if (!repo || accessLoading || !canMerge) return;

      try {
        const session = await getCurrentSession();
        if (!session?.provider_token) throw new Error("Sign in with GitHub to load insights.");

        const headers = {
          Authorization: `Bearer ${session.provider_token}`,
          Accept: "application/vnd.github+json"
        };
        const base = `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}`;
        const since = new Date();
        since.setDate(since.getDate() - 30);

        const [repoResult, commitsResult, languagesResult, contributorsResult, readmeResult, licenseResult] = await Promise.allSettled([
          fetch(base, { headers }).then(readGithubJson),
          fetch(`${base}/commits?per_page=100&since=${since.toISOString()}`, { headers }).then(readGithubJson),
          fetch(`${base}/languages`, { headers }).then(readGithubJson),
          fetch(`${base}/contributors?per_page=10`, { headers }).then(readGithubJson),
          fetch(`${base}/readme`, { headers }).then((response) => response.ok),
          fetch(`${base}/license`, { headers }).then((response) => response.ok)
        ]);

        if (!alive) return;
        const githubRepo = repoResult.status === "fulfilled" ? repoResult.value : {};
        const commits = commitsResult.status === "fulfilled" && Array.isArray(commitsResult.value) ? commitsResult.value : [];
        const languages = languagesResult.status === "fulfilled" ? languagesResult.value || {} : {};
        const contributors = contributorsResult.status === "fulfilled" && Array.isArray(contributorsResult.value) ? contributorsResult.value : [];

        setGithubStats({
          commits: groupCommitsByDay(commits),
          contributors,
          forks: githubRepo.forks_count ?? repo.forks_count ?? 0,
          hasLicense: licenseResult.status === "fulfilled" ? licenseResult.value : false,
          hasReadme: readmeResult.status === "fulfilled" ? readmeResult.value : false,
          languages: mapLanguages(languages),
          stars: githubRepo.stargazers_count ?? repo.stars_count ?? 0
        });
      } catch (githubError) {
        if (alive) setError(githubError.message || "Could not load GitHub insights.");
      }
    }

    loadGithubInsights();
    return () => {
      alive = false;
    };
  }, [accessLoading, canMerge, repo, repoName, username]);

  const healthChecks = useMemo(() => {
    const topics = repo?.repo_topics || [];
    return [
      { label: "Has a README", pass: githubStats.hasReadme, to: `/${username}/${repoName}` },
      { label: "Has a description", pass: Boolean(repo?.description), to: `/${username}/${repoName}` },
      { label: "Has a licence", pass: githubStats.hasLicense, to: `/${username}/${repoName}` },
      { label: "Has a landing page", pass: Boolean(repo?.landing_page_html), to: `/${username}/${repoName}/landing` },
      { label: "Has topics", pass: topics.length > 0, to: `/${username}/${repoName}` }
    ];
  }, [githubStats.hasLicense, githubStats.hasReadme, repo, repoName, username]);

  const healthScore = healthChecks.filter((item) => item.pass).length;

  return (
    <div className="repo-insights-page">
      <RepoInsightsHeader repo={repo} repoName={repoName} username={username} />

      {loading || accessLoading ? (
        <div className="insights-loading-grid">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton className="insights-skeleton" key={index} />)}
        </div>
      ) : error ? (
        <p className="auth-error">{error}</p>
      ) : !canMerge ? (
        <section className="issue-empty-state">
          <ShieldCheck size={42} />
          <h2>Insights are private</h2>
          <p>Repo insights are available to owners and maintainers only.</p>
        </section>
      ) : (
        <>
          <section className="insights-stat-grid">
            <InsightStat icon={<Star size={18} />} label="Total stars" value={githubStats.stars} />
            <InsightStat icon={<GitFork size={18} />} label="Total forks" value={githubStats.forks} />
            <InsightStat label="Open issues" value={counts.openIssues} />
            <InsightStat label="Open PRs" value={counts.openPrs} />
          </section>

          <section className="insights-main-grid">
            <article className="insights-card wide">
              <h2>Commit frequency</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={githubStats.commits}>
                  <CartesianGrid stroke="#e8e0d4" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: "#6b5f58", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "#6b5f58", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#fffdf9", border: "1px solid #e8e0d4", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="commits" stroke="#9b8fd4" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </article>

            <article className="insights-card">
              <h2>Language breakdown</h2>
              {githubStats.languages.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={githubStats.languages} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>
                      {githubStats.languages.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#fffdf9", border: "1px solid #e8e0d4", borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="insights-muted">No language data yet.</p>}
              <div className="insights-language-list">
                {githubStats.languages.map((language) => (
                  <span key={language.name}><i style={{ background: language.color }} />{language.name}</span>
                ))}
              </div>
            </article>

            <article className="insights-card">
              <h2>Top contributors</h2>
              <div className="insights-contributors">
                {githubStats.contributors.map((contributor) => (
                  <ContributorRow contributor={contributor} key={contributor.id || contributor.login} max={githubStats.contributors[0]?.contributions || 1} />
                ))}
                {githubStats.contributors.length === 0 && <p className="insights-muted">No contributors found yet.</p>}
              </div>
            </article>

            <article className="insights-card">
              <h2>Repo health</h2>
              <strong className="insights-health-score">{healthScore} / 5</strong>
              <div className="insights-health-list">
                {healthChecks.map((check) => (
                  <Link className={check.pass ? "pass" : "fail"} key={check.label} to={check.to}>
                    {check.pass ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                    {check.label}
                  </Link>
                ))}
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}

function InsightStat({ icon, label, value }) {
  return (
    <article className="insights-stat-card">
      <span>{icon}</span>
      <strong>{Number(value || 0).toLocaleString()}</strong>
      <small>{label}</small>
    </article>
  );
}

function ContributorRow({ contributor, max }) {
  const percent = Math.max(6, Math.round((contributor.contributions / max) * 100));
  return (
    <div className="insights-contributor-row">
      <img alt="" src={contributor.avatar_url} />
      <span>
        <strong>{contributor.login}</strong>
        <small>{contributor.contributions.toLocaleString()} commits</small>
        <i><b style={{ width: `${percent}%` }} /></i>
      </span>
    </div>
  );
}

async function readGithubJson(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || "GitHub request failed.");
  return payload;
}

function groupCommitsByDay(commits) {
  const days = Array.from({ length: 30 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    const key = date.toISOString().slice(0, 10);
    return { key, label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), commits: 0 };
  });
  const byKey = new Map(days.map((day) => [day.key, day]));

  commits.forEach((commit) => {
    const key = commit.commit?.author?.date?.slice(0, 10);
    if (byKey.has(key)) byKey.get(key).commits += 1;
  });

  return days;
}

function mapLanguages(languages) {
  return Object.entries(languages || {})
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      color: languageColours[name] || "#9b8fd4"
    }));
}
