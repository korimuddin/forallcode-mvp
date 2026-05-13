import { Link } from "react-router-dom";
import IllustratedAvatar from "../ui/IllustratedAvatar";

export default function SpotlightCard({ entry }) {
  const profile = entry.profiles || entry.profile || {};
  const repo = entry.repositories || entry.repository || null;
  const username = profile.username || "developer";
  const displayName = profile.display_name || username;

  return (
    <article className="spotlight-card">
      <span className="spotlight-week-label">This week</span>
      <div className="spotlight-person">
        <Link to={`/${username}`}>
          <IllustratedAvatar
            alt={displayName}
            photoUrl={profile.avatar_url}
            size={48}
            variant={profile.avatar_style || "lavender"}
          />
        </Link>
        <div>
          <h3>{entry.headline || displayName}</h3>
          <Link to={`/${username}`}>@{username}</Link>
        </div>
      </div>
      <p>{entry.reason}</p>
      {repo?.name && (
        <Link className="spotlight-repo-link" to={`/${username}/${repo.name}`}>
          Featured project: {repo.name} →
        </Link>
      )}
    </article>
  );
}
