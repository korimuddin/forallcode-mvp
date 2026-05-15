import { Link } from "react-router-dom";
import { Copy, GitFork, Star } from "lucide-react";
import TopicPills from "../repo/TopicPills";
import { decodeGitHubBase64 } from "../../lib/githubApi";
import { renderMarkdown } from "../../lib/markdownRenderer";

function formatNumber(value = 0) {
  return new Intl.NumberFormat("en", { notation: value > 999 ? "compact" : "standard" }).format(value || 0);
}

function copy(value) {
  navigator.clipboard?.writeText(value).catch(() => {});
}

export default function RepoRenderer({ payload }) {
  const repo = payload?.repo;
  const readme = payload?.readme;
  const contents = Array.isArray(payload?.contents) ? payload.contents : [];
  if (!repo) return null;

  const readmeMarkdown = readme?.content ? decodeGitHubBase64(readme.content) : "";
  const topics = repo.topics || [];

  return (
    <div className="github-panel-resource">
      <div className="github-repo-hero">
        <p className="eyebrow">{repo.owner?.login} / {repo.name}</p>
        <h2>{repo.name}</h2>
        <p>{repo.description || "No description provided."}</p>
        <div className="github-panel-meta">
          {repo.language && <span>{repo.language}</span>}
          <span><Star size={14} /> {formatNumber(repo.stargazers_count)}</span>
          <span><GitFork size={14} /> {formatNumber(repo.forks_count)}</span>
          <span>{formatNumber(repo.watchers_count)} watchers</span>
        </div>
        {topics.length > 0 && <TopicPills topics={topics.slice(0, 8)} />}
        <div className="github-panel-actions">
          <Link className="button" to={`/repos/new?import=${encodeURIComponent(repo.clone_url)}`}>Import Repository</Link>
          <button className="button soft" onClick={() => copy(repo.clone_url)} type="button"><Copy size={15} /> Copy clone URL</button>
        </div>
      </div>

      {contents.length > 0 && (
        <section className="github-panel-section">
          <h3>Top-level files</h3>
          <div className="github-file-list">
            {contents.slice(0, 14).map((item) => (
              <a href={item.html_url} key={item.sha || item.path}>
                <span>{item.type === "dir" ? "Folder" : "File"}</span>
                <strong>{item.name}</strong>
              </a>
            ))}
          </div>
        </section>
      )}

      {readmeMarkdown && (
        <section className="github-panel-section">
          <h3>README</h3>
          <article
            className="markdown-preview github-readme-preview"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(readmeMarkdown) }}
          />
        </section>
      )}
    </div>
  );
}
