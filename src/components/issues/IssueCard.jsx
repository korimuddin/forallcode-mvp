import { formatDistanceToNow } from "date-fns";
import LabelPill from "./LabelPill";

function getCommentCount(issue) {
  const countRow = Array.isArray(issue.issue_comments) ? issue.issue_comments[0] : null;
  return Number(countRow?.count || issue.comment_count || 0);
}

export default function IssueCard({ issue, onClick }) {
  const author = issue.profiles || issue.author || {};
  const assignee = issue.assignee || {};
  const commentCount = getCommentCount(issue);

  return (
    <button className="issue-card" onClick={onClick} type="button">
      <span className={issue.status === "open" ? "issue-status-dot open" : "issue-status-dot closed"} aria-hidden="true" />
      <span className="issue-card-content">
        <span className="issue-card-title-row">
          <span>{issue.title}</span>
          <LabelPill label={issue.label} />
        </span>
        <span className="issue-card-meta">
          #{issue.number} opened {formatDistanceToNow(new Date(issue.created_at))} ago
          {author.username ? ` by @${author.username}` : ""}
          {assignee.username ? ` · assigned to @${assignee.username}` : ""}
          {commentCount > 0 ? ` · ${commentCount} ${commentCount === 1 ? "comment" : "comments"}` : ""}
        </span>
      </span>
    </button>
  );
}

export function getIssueCommentCount(issue) {
  return getCommentCount(issue);
}
