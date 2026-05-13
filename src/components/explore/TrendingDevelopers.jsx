import { Link } from "react-router-dom";
import IllustratedAvatar from "../ui/IllustratedAvatar";

export default function TrendingDevelopers({ developers = [], range = "week" }) {
  return (
    <section className="explore-discovery-panel">
      <div className="explore-section-heading">
        <p className="eyebrow">Developers</p>
        <span>Most active this {range === "month" ? "month" : "week"}</span>
      </div>
      <div className="trending-developer-grid">
        {developers.map((item) => {
          const profile = item.profile || {};
          const username = profile.username || "developer";
          return (
            <article className="trending-developer-card" key={item.id || username}>
              <IllustratedAvatar size={54} variant={profile.avatar_style || "sage"} photoUrl={profile.avatar_url} />
              <div>
                <Link to={`/${username}`}>@{username}</Link>
                <p>{profile.professional_title || profile.bio || "ForAllCode developer"}</p>
                <span>{item.metricLabel || `${item.count} contribution${item.count === 1 ? "" : "s"} this ${range === "month" ? "month" : "week"}`}</span>
              </div>
              <Link className="button soft" to={`/${username}`}>View</Link>
            </article>
          );
        })}
      </div>
      {developers.length === 0 && <p className="explore-empty">Trending developers will appear as followed activity grows.</p>}
    </section>
  );
}
