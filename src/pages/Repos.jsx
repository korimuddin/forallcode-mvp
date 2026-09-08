import { useState } from "react";
import { Github, Folder, GitFork, Lock, MoreHorizontal, Plus, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import Hint from "../components/ui/Hint";
import { LimitBanner } from "../components/ui/LimitBanner";
import Skeleton from "../components/ui/Skeleton";
import { createFeedEvent } from "../lib/createFeedEvent";
import { useDocumentTitle, useSignedInUserData } from "../lib/hooks";
import { createNotification } from "../lib/notifications";
import { getUserPreference, setUserPreference } from "../lib/preferences";
import { getCurrentSession, supabase } from "../lib/supabase";
import { useSubscription } from "../lib/useSubscription";

const languageStyles = {
  TypeScript: ["#ddd5f0", "#534AB7"],
  JavaScript: ["#f5e4c4", "#633806"],
  Python: ["#cce0f0", "#0C447C"],
  CSS: ["#c8d8c4", "#27500A"],
  Rust: ["#f5d5d8", "#72243E"],
  Shell: ["#f5e4c4", "#633806"],
  Go: ["#cce0f0", "#0C447C"]
};

export default function ReposPage() {
  useDocumentTitle("Repositories");
  const { repos: userRepos, loading: loadingRepos, error } = useSignedInUserData();
  const { isPro, limits } = useSubscription();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [sort, setSort] = useState("updated");
  const [layout, setLayout] = useState(() => getUserPreference("repos", "layout", "rows"));
  const repoSource = userRepos.length > 0 ? userRepos : [];
  const privateRepoCount = repoSource.filter((repo) => repo.private).length;
  const languages = [...new Set(repoSource.map((repo) => repo.language).filter(Boolean))];
  const filtered = repoSource
    .filter((repo) => language === "all" || repo.language === language)
    .filter((repo) => visibility === "all" || (visibility === "private" ? repo.private : !repo.private))
    .filter((repo) => `${repo.name} ${repo.description}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === "stars") return b.stars - a.stars;
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  const repoHeroSlides = buildRepoHeroSlides(repoSource);
  const layoutOptions = [
    { value: "rows", label: "Layout: Rows" },
    { value: "grid-2", label: "Layout: 2 x 2 grid" },
    { value: "grid-3", label: "Layout: 3 x 3 grid" }
  ];

  function updateLayout(nextLayout) {
    setLayout(nextLayout);
    setUserPreference("repos", "layout", nextLayout);
  }

  return (
    <main className="page-frame">
      <CarouselHero slides={repoHeroSlides} type="repos" />
      <div className="repos-page-header">
        <h1><Hint term="repository">Repositories</Hint></h1>
        <div className="repos-header-actions">
          <Button variant="soft"><Github size={16} />Import from GitHub</Button>
          <div className="new-repo-action-stack">
            <Button to="/repos/new"><Plus size={16} />New <Hint term="repository">repository</Hint></Button>
            {!isPro && <span>{privateRepoCount} of {limits.privateRepos} private repos used</span>}
          </div>
        </div>
      </div>
      <LimitBanner limitKey="privateRepos" currentCount={privateRepoCount} />
      <div className="phase-filter-bar">
        <input placeholder="Search repositories..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="all">All languages</option>
          {languages.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
          <option value="all">All</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="updated">Recently updated</option>
          <option value="stars">Stars</option>
          <option value="name">Name (A-Z)</option>
        </select>
        <select
          aria-label="Repository layout"
          className="repo-layout-select"
          value={layout}
          onChange={(event) => updateLayout(event.target.value)}
        >
          {layoutOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      {loadingRepos ? (
        <RepoListSkeleton />
      ) : error ? (
        <EmptyState
          icon={<Github size={34} />}
          title="We could not load your projects just now."
          body={error}
          actionLabel="Try again"
          onAction={() => window.location.reload()}
        />
      ) : filtered.length > 0 ? (
        <div className={`phase-repo-list ${layout}`}>{filtered.map((repo) => <PhaseRepoCard key={repo.name} repo={repo} />)}</div>
      ) : (
        <EmptyState
          icon={<Folder size={34} />}
          title="Your projects will live here."
          body="Start with something tiny — a recipe collection, a list of favourite songs. Every developer's first repo was small."
          actionLabel="Create your first project"
          to="/repos/new"
        />
      )}
    </main>
  );
}

function buildRepoHeroSlides(reposForHero) {
  const repoSlides = reposForHero.slice(0, 3).map((repo) => ({
    eyebrow: "Your repository",
    title: repo.name,
    text: repo.description || "A synced GitHub repository ready to explore visually.",
    meta: `${repo.language || "Code"} · ${repo.stars || 0} stars · Updated ${repo.updated || "recently"}`,
    tone: "repo"
  }));

  return [
    ...repoSlides,
    {
      eyebrow: "Build warmly",
      title: "Every repository is a place someone can learn from.",
      text: "Shape your README, map the codebase, and make the first contribution feel less mysterious.",
      tone: "lavender"
    },
    {
      eyebrow: "Keep going",
      title: "Small commits become a clear story.",
      text: "A thoughtful history makes collaboration easier for future you and everyone after.",
      tone: "sage"
    },
    {
      eyebrow: "Repository momentum",
      title: "Code is easier to join when it welcomes people in.",
      text: "Use project pages, README Studio, and visual maps to turn your repos into friendly workspaces.",
      tone: "amber"
    }
  ].slice(0, 5);
}

function CarouselHero({ slides, type }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex] || slides[0];
  if (!activeSlide) return null;

  return (
    <section className={`carousel-hero ${type || ""} tone-${activeSlide.tone || "lavender"}`}>
      <div className="carousel-hero-copy">
        <p className="eyebrow">{activeSlide.eyebrow}</p>
        <h1>{activeSlide.title}</h1>
        <p>{activeSlide.text}</p>
        {activeSlide.meta && <span>{activeSlide.meta}</span>}
      </div>
      <div className="carousel-dots" aria-label="Hero slides">
        {slides.map((slide, index) => (
          <button
            aria-label={`Show slide ${index + 1}`}
            className={index === activeIndex ? "active" : ""}
            key={`${slide.title}-${index}`}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}

function PhaseRepoCard({ repo }) {
  const navigate = useNavigate();

  async function handleStarClick() {
    if (!supabase) return;
    const session = await getCurrentSession();
    if (!session?.user?.id) return;
    const { data: repository } = await supabase
      .from("repositories")
      .select("id, owner_id, is_private, name")
      .eq("name", repo.name)
      .maybeSingle();
    const { data: actor } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle();
    if (repository?.id && !repository.is_private) {
      createFeedEvent(supabase, {
        actorId: session.user.id,
        eventType: "repo_starred",
        repoId: repository.id,
        metadata: { repo_name: repository.name || repo.name }
      }).catch(() => {});
    }
    if (!repository?.owner_id || repository.owner_id === session.user.id) return;
    await createNotification(supabase, {
      userId: repository.owner_id,
      type: "star",
      actorId: session.user.id,
      repoId: repository.id,
      message: `${actor?.display_name || "Someone"} starred your repo ${repo.name}`
    });
  }

  return (
    <article className="phase-repo-card" onClick={() => navigate(`/${repo.owner}/${repo.name}`)}>
      <div className="phase-repo-title">
        <h3>{repo.name}</h3>
        {repo.private && <Lock size={15} />}
      </div>
      <p>{repo.description}</p>
      <div className="phase-repo-meta">
        <LanguagePill language={repo.language} />
        <span><Star size={14} />{repo.stars}</span>
        <span>Updated {repo.updated}</span>
        <span className="repo-visibility-pill">{repo.private ? "Private" : "Public"}</span>
      </div>
      <div className="phase-repo-actions" onClick={(event) => event.stopPropagation()}>
        <button type="button">Pin to workspace</button>
        <button onClick={handleStarClick} type="button">★ Star</button>
        <Link to={`/${repo.owner}/${repo.name}/readme`}>README Studio</Link>
        <Link to={`/${repo.owner}/${repo.name}/landing`}>Landing Designer</Link>
        <button type="button" aria-label="Repo settings"><MoreHorizontal size={16} /></button>
      </div>
    </article>
  );
}

function LanguagePill({ language }) {
  const [bg, color] = languageStyles[language] || languageStyles.TypeScript;
  return <span className="language-pill" style={{ backgroundColor: bg, color }}><span style={{ backgroundColor: color }} />{language || "TypeScript"}</span>;
}

function RepoListSkeleton() {
  return (
    <div className="phase-repo-list" aria-label="Loading repositories">
      {Array.from({ length: 4 }).map((_, index) => (
        <article className="phase-repo-card" key={index}>
          <Skeleton className="skeleton-text medium" />
          <Skeleton className="skeleton-text wide" />
          <div className="phase-repo-meta">
            <Skeleton className="skeleton-pill" />
            <Skeleton className="skeleton-text short" />
            <Skeleton className="skeleton-text short" />
          </div>
        </article>
      ))}
    </div>
  );
}

function Button({ children, disabled = false, to, variant = "primary", full = false, onClick, type = "button" }) {
  const className = `button ${variant} ${full ? "full" : ""}`;
  return to ? <Link className={className} to={to}>{children}</Link> : <button className={className} disabled={disabled} onClick={onClick} type={type}>{children}</button>;
}
