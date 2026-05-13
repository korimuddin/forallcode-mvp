import { ArrowUpRight, Star } from "lucide-react";
import { Link } from "react-router-dom";

export default function RisingRepos({ repos = [], range = "week" }) {
  return (
    <section className="explore-discovery-panel">
      <div className="explore-section-heading">
        <p className="eyebrow">Rising repos</p>
        <span>Star velocity this {range === "month" ? "month" : "week"}</span>
      </div>
      <div className="rising-repo-list">
        {repos.map((item, index) => {
          const repo = item.repository || {};
          const owner = repo.profiles?.username || "unknown";
          const href = item.externalUrl || `/${owner}/${repo.name}`;
          const isExternal = Boolean(item.externalUrl);
          return (
            <LinkOrAnchor className="rising-repo-row" external={isExternal} href={href} key={item.id || repo.id || repo.name}>
              <strong>{index + 1}</strong>
              <span>
                <b>{repo.name}</b>
                <small>{repo.description || `${repo.language || "Code"} repository`}</small>
              </span>
              <em><ArrowUpRight size={15} />+{item.velocity || 0}</em>
              <i><Star size={14} />{repo.stars_count || 0}</i>
            </LinkOrAnchor>
          );
        })}
      </div>
      {repos.length === 0 && <p className="explore-empty">Rising repos will appear after snapshot data is collected.</p>}
    </section>
  );
}

function LinkOrAnchor({ children, className, external, href }) {
  if (external) {
    return <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>;
  }
  return <Link className={className} to={href}>{children}</Link>;
}
