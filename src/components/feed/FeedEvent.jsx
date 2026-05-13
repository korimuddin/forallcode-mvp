import { formatDistanceToNow } from "date-fns";
import { GitMerge, GitPullRequest, Star } from "lucide-react";
import { Link } from "react-router-dom";
import IllustratedAvatar from "../ui/IllustratedAvatar";

const eventCopy = {
  repo_created: "created a new repository",
  repo_starred: "starred a repository",
  issue_opened: "opened an issue",
  issue_closed: "closed an issue",
  pr_opened: "opened a pull request",
  pr_merged: "merged a pull request",
  lesson_completed: "completed a lesson",
  discussion_started: "started a discussion",
  release_published: "published a release"
};

export default function FeedEvent({ event }) {
  const actor = event.profiles || {};
  const repo = event.repositories || {};
  const owner = repo.profiles?.username || repo.owner_username || actor.username || "repo";
  const repoPath = repo.name ? `/${owner}/${repo.name}` : "#";

  return (
    <article className={`feed-event ${event.event_type || "system"}`}>
      <IllustratedAvatar size={38} variant={actor.avatar_style || "sage"} photoUrl={actor.avatar_url} alt={actor.username || "Developer"} />
      <div className="feed-event-body">
        <p>
          <Link to={actor.username ? `/${actor.username}` : "#"}>@{actor.username || "developer"}</Link>{" "}
          {eventCopy[event.event_type] || "shared an update"}
        </p>
        {renderEventPreview(event, repo, repoPath)}
        <time>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</time>
      </div>
    </article>
  );
}

function renderEventPreview(event, repo, repoPath) {
  if (event.event_type === "lesson_completed") {
    return (
      <div className="feed-event-preview lesson">
        <strong>{event.metadata?.lesson_title || event.metadata?.lesson_slug || "Git lesson"}</strong>
        <span>{event.metadata?.track_name || event.metadata?.track || "Learn"} track</span>
      </div>
    );
  }

  if (event.event_type === "pr_merged" || event.event_type === "pr_opened") {
    const pr = event.pull_requests || {};
    return (
      <div className="feed-event-preview pull-request">
        {event.event_type === "pr_merged" ? <GitMerge size={16} /> : <GitPullRequest size={16} />}
        <div>
          <strong>#{pr.number || event.metadata?.number || "PR"} {pr.title || event.metadata?.title || "Pull request"}</strong>
          {repo.name && <Link to={repoPath}>in {repo.name}</Link>}
        </div>
      </div>
    );
  }

  if (event.event_type === "repo_starred") {
    return (
      <div className="feed-event-preview star">
        <Star size={16} />
        {repo.name ? <Link to={repoPath}>{repo.name}</Link> : <strong>{event.metadata?.repo_name || "Repository"}</strong>}
      </div>
    );
  }

  if (repo.name) {
    return (
      <Link className="feed-repo-preview" to={repoPath}>
        <strong>{repo.name}</strong>
        <span>{repo.description || "No description yet."}</span>
        <small>{repo.language || "Code"} · {(repo.stars_count || 0).toLocaleString()} stars</small>
      </Link>
    );
  }

  return null;
}
