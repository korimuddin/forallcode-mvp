import { Copy } from "lucide-react";
import { renderMarkdown } from "../../lib/markdownRenderer";

function copy(value) {
  navigator.clipboard?.writeText(value).catch(() => {});
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
}

function LabelRow({ labels = [] }) {
  return (
    <span className="github-label-row">
      {labels.slice(0, 5).map((label) => (
        <span key={label.id || label.name} style={{ "--label-colour": `#${label.color || "ddd5f0"}` }}>{label.name}</span>
      ))}
    </span>
  );
}

export default function IssuesRenderer({ payload, resource }) {
  const issue = payload?.issue;
  const issues = (payload?.issues || []).filter((item) => !item.pull_request);
  const comments = payload?.comments || [];

  if (issue) {
    return (
      <div className="github-panel-resource">
        <div className="github-repo-hero compact">
          <p className="eyebrow">Issue #{issue.number} · {resource.owner}/{resource.repo}</p>
          <h2>{issue.title}</h2>
          <p>Opened by {issue.user?.login} on {formatDate(issue.created_at)}</p>
          <LabelRow labels={issue.labels} />
          <div className="github-panel-actions">
            <button className="button soft" onClick={() => copy(issue.html_url)} type="button"><Copy size={15} /> Copy link</button>
            <button className="button" type="button">Reference in project</button>
          </div>
        </div>
        <article className="github-markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(issue.body || "_No description provided._") }} />
        {comments.length > 0 && (
          <section className="github-panel-section">
            <h3>Comments</h3>
            <div className="github-comment-list">
              {comments.map((comment) => (
                <article key={comment.id}>
                  <strong>{comment.user?.login}</strong>
                  <small>{formatDate(comment.created_at)}</small>
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.body || "") }} />
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="github-panel-resource">
      <div className="github-repo-hero compact">
        <p className="eyebrow">{resource.owner} / {resource.repo}</p>
        <h2>Open issues</h2>
        <p>{issues.length} issue{issues.length === 1 ? "" : "s"} fetched from GitHub.</p>
      </div>
      <div className="github-resource-list">
        {issues.map((item) => (
          <a href={item.html_url} key={item.id}>
            <strong>#{item.number} {item.title}</strong>
            <span>Opened by {item.user?.login} · {formatDate(item.created_at)}</span>
            <LabelRow labels={item.labels} />
          </a>
        ))}
        {!issues.length && <p className="github-empty">No open issues found.</p>}
      </div>
    </div>
  );
}
