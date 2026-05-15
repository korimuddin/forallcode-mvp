import { Copy, GitMerge } from "lucide-react";
import { renderMarkdown } from "../../lib/markdownRenderer";

function copy(value) {
  navigator.clipboard?.writeText(value).catch(() => {});
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
}

export default function PullsRenderer({ payload, resource }) {
  const pull = payload?.pull;
  const pulls = payload?.pulls || [];

  if (pull) {
    return (
      <div className="github-panel-resource">
        <div className="github-repo-hero compact">
          <p className="eyebrow">Pull request #{pull.number} · {resource.owner}/{resource.repo}</p>
          <h2>{pull.title}</h2>
          <p>Opened by {pull.user?.login} on {formatDate(pull.created_at)}</p>
          <div className="github-panel-meta">
            <span>{pull.state}</span>
            <span>{pull.commits} commits</span>
            <span>{pull.changed_files} files changed</span>
            <span><GitMerge size={14} /> {pull.mergeable_state || "review"}</span>
          </div>
          <div className="github-panel-actions">
            <button className="button soft" onClick={() => copy(pull.html_url)} type="button"><Copy size={15} /> Copy link</button>
            <button className="button" type="button">Reference in project</button>
          </div>
        </div>
        <article className="github-markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(pull.body || "_No description provided._") }} />
      </div>
    );
  }

  return (
    <div className="github-panel-resource">
      <div className="github-repo-hero compact">
        <p className="eyebrow">{resource.owner} / {resource.repo}</p>
        <h2>Open pull requests</h2>
        <p>{pulls.length} pull request{pulls.length === 1 ? "" : "s"} fetched from GitHub.</p>
      </div>
      <div className="github-resource-list">
        {pulls.map((item) => (
          <a href={item.html_url} key={item.id}>
            <strong>#{item.number} {item.title}</strong>
            <span>Opened by {item.user?.login} · {formatDate(item.created_at)}</span>
          </a>
        ))}
        {!pulls.length && <p className="github-empty">No open pull requests found.</p>}
      </div>
    </div>
  );
}
