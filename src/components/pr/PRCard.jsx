import { formatDistanceToNow } from "date-fns";

const statusColors = {
  open: { bg: "#c8d8c4", color: "#27500A", label: "Open" },
  merged: { bg: "#ddd5f0", color: "#534AB7", label: "Merged" },
  closed: { bg: "#f4efe6", color: "#9c918c", label: "Closed" }
};

export function getPRCommentCount(pr) {
  const countRow = Array.isArray(pr.pr_comments) ? pr.pr_comments[0] : null;
  return Number(countRow?.count || pr.comment_count || 0);
}

export default function PRCard({ pr, onClick }) {
  const status = statusColors[pr.status] || statusColors.open;
  const author = pr.profiles || pr.author || {};
  const commentCount = getPRCommentCount(pr);

  return (
    <button className="pr-card" onClick={onClick} type="button">
      <span className="pr-status-badge" style={{ background: status.bg, color: status.color }}>
        {status.label}
      </span>
      <span className="pr-card-content">
        <span className="pr-card-title">{pr.title}</span>
        <span className="pr-card-meta">
          #{pr.number} · {pr.head_branch} → {pr.base_branch} · opened
          {author.username ? ` by @${author.username}` : ""} {formatDistanceToNow(new Date(pr.created_at))} ago
          {commentCount > 0 ? ` · ${commentCount} ${commentCount === 1 ? "comment" : "comments"}` : ""}
        </span>
      </span>
    </button>
  );
}
