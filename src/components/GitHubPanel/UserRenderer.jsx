import { MapPin, Users } from "lucide-react";

function formatNumber(value = 0) {
  return new Intl.NumberFormat("en", { notation: value > 999 ? "compact" : "standard" }).format(value || 0);
}

export default function UserRenderer({ payload }) {
  const user = payload?.user || payload?.org;
  const repos = payload?.repos || [];
  if (!user) return null;

  return (
    <div className="github-panel-resource">
      <div className="github-user-card">
        <img src={user.avatar_url} alt="" />
        <div>
          <p className="eyebrow">{payload?.org ? "GitHub organisation" : "GitHub developer"}</p>
          <h2>{user.name || user.login}</h2>
          <p>@{user.login}</p>
          {user.bio && <p>{user.bio}</p>}
          <div className="github-panel-meta">
            {user.location && <span><MapPin size={14} /> {user.location}</span>}
            <span><Users size={14} /> {formatNumber(user.followers)} followers</span>
            <span>{formatNumber(user.public_repos)} public repos</span>
          </div>
          <div className="github-panel-actions">
            <button className="button" type="button">Follow on ForAllCode</button>
            <a className="button soft" href={`/${user.login}`} onClick={(event) => event.stopPropagation()}>View ForAllCode profile</a>
          </div>
        </div>
      </div>

      {repos.length > 0 && (
        <section className="github-panel-section">
          <h3>Recently updated repos</h3>
          <div className="github-resource-list">
            {repos.map((repo) => (
              <a href={repo.html_url} key={repo.id}>
                <strong>{repo.name}</strong>
                <span>{repo.description || "No description provided."}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
