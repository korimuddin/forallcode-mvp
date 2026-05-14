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
          const href = item.externalUrl || profile.html_url || `/${username}`;
          const external = Boolean(item.externalUrl || profile.html_url);
          return (
            <article className="trending-developer-card" key={item.id || username}>
              <IllustratedAvatar size={54} variant={profile.avatar_style || "sage"} photoUrl={profile.avatar_url} />
              <div>
                <LinkOrAnchor external={external} href={href}>@{username}</LinkOrAnchor>
                <p>{profile.professional_title || profile.bio || "ForAllCode developer"}</p>
                <span>{item.metricLabel || `${item.count} contribution${item.count === 1 ? "" : "s"} this ${range === "month" ? "month" : "week"}`}</span>
              </div>
              <LinkOrAnchor className="button soft" external={external} href={href}>View</LinkOrAnchor>
            </article>
          );
        })}
      </div>
      {developers.length === 0 && <p className="explore-empty">Trending developers will appear as followed activity grows.</p>}
    </section>
  );
}

function LinkOrAnchor({ children, className, external, href }) {
  if (external) {
    return <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>;
  }
  return <Link className={className} to={href}>{children}</Link>;
}
