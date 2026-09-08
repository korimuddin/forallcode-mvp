import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function PortfolioCard({ entry }) {
  const repo = entry.repositories || entry.repository || {};
  const owner = repo.owner_username || entry.owner_username || repo.profiles?.username || "";
  const techStack = Array.isArray(entry.tech_stack) && entry.tech_stack.length
    ? entry.tech_stack
    : [repo.language].filter(Boolean);

  return (
    <article className="portfolio-card">
      {entry.screenshot_url ? (
        <img src={entry.screenshot_url} alt={`${repo.name} screenshot`} />
      ) : (
        <div className="portfolio-card-fallback">✦</div>
      )}
      <div className="portfolio-card-body">
        <h3>{repo.name || "Untitled project"}</h3>
        <p>{repo.description || "Project details are available in the repository."}</p>
        <div className="portfolio-tech-row">
          {techStack.map((tech) => <span key={tech}>{tech}</span>)}
        </div>
        <div className="portfolio-card-links">
          {owner && repo.name && <Link to={`/${owner}/${repo.name}`}>View repo →</Link>}
          {owner && repo.name && <a href={`https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo.name)}#readme`} target="_blank" rel="noreferrer">Read project README <ExternalLink size={13} /></a>}
          {entry.live_url && (
            <a href={entry.live_url} target="_blank" rel="noreferrer">
              Live site <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
