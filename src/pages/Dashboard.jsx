import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FeedEvent from "../components/feed/FeedEvent";
import OnboardingFlow from "../components/onboarding/OnboardingFlow";
import Skeleton from "../components/ui/Skeleton";
import { useDocumentTitle, useSignedInUserData } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { PageFrame, Card, Button, RepoListSkeleton } from "./PageShared";

function DashboardPage() {
  useDocumentTitle("Dashboard");
  const { session, profile, repos: userRepos, loading, error } = useSignedInUserData();
  const [feedEvents, setFeedEvents] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const displayName = profile?.displayName || "there";
  const firstName = displayName.split(" ")[0] || displayName;
  const visibleRepos = userRepos.slice(0, 2);
  const dashboardHeroSlides = [
    {
      eyebrow: "ForAllCode",
      title: `Welcome back, ${firstName}`,
      text: "Your workspace is ready. Pick up where you left off, follow the work, and keep the useful ideas in sight.",
      theme: "welcome",
      cta: "Open dashboard"
    },
    {
      eyebrow: "Featured profiles",
      title: "Monthly rising contributors",
      text: "Discover developers who are building, explaining, and sharing work that helps the community move further.",
      theme: "profiles",
      cta: "Explore profiles"
    },
    {
      eyebrow: "Featured workspaces",
      title: visibleRepos[0]?.name || "Build in public, beautifully",
      text: visibleRepos[0]?.description || "Turn active repositories into friendly workspaces with notes, visual maps, and project context.",
      theme: "workspaces",
      cta: "View workspaces"
    },
    {
      eyebrow: "Featured courses",
      title: "Have you tried the DevOps course?",
      text: "Go deeper on CI/CD, environments, deployment strategy, observability, and the habits that make shipping feel calmer.",
      theme: "courses",
      cta: "Browse courses"
    },
    {
      eyebrow: "ForAllCode features",
      title: "Have you tried creating notes?",
      text: "Create notebooks inside your repository and keep project thinking beside the code where future contributors can find it.",
      theme: "notes",
      cta: "Try notes"
    },
    {
      eyebrow: "Keep going",
      title: "Small commits still count.",
      text: "Great software is rarely one heroic leap. It is careful progress, shared clearly, one useful change at a time.",
      theme: "quote",
      cta: "Start gently"
    }
  ];
  const activeHeroSlide = dashboardHeroSlides[heroIndex] || dashboardHeroSlides[0];

  useEffect(() => {
    let alive = true;

    async function loadFollowingFeed() {
      if (!supabase || !session?.user?.id) {
        setFeedEvents([]);
        setFeedLoading(false);
        return;
      }

      setFeedLoading(true);
      setFeedError("");

      try {
        const { data: followingRows, error: followingError } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", session.user.id);
        if (followingError) throw followingError;

        const followingIds = (followingRows || []).map((row) => row.following_id).filter(Boolean);
        if (followingIds.length === 0) {
          if (alive) setFeedEvents([]);
          return;
        }

        const { data: events, error: eventsError } = await supabase
          .from("feed_events")
          .select(`
            *,
            profiles!feed_events_actor_id_fkey(username, display_name, avatar_style, avatar_url),
            repositories(name, description, language, stars_count, is_private, profiles!repositories_owner_id_fkey(username)),
            issues(number, title, status),
            pull_requests(number, title, status)
          `)
          .in("actor_id", followingIds)
          .order("created_at", { ascending: false })
          .limit(30);
        if (eventsError) throw eventsError;

        if (alive) setFeedEvents((events || []).filter((event) => !event.repositories?.is_private));
      } catch (loadError) {
        if (alive) setFeedError(loadError.message || "Could not load followed activity.");
      } finally {
        if (alive) setFeedLoading(false);
      }
    }

    loadFollowingFeed();
    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % dashboardHeroSlides.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, [dashboardHeroSlides.length]);

  useEffect(() => {
    if (profile?.onboardingCompleted === false) {
      setShowOnboarding(true);
    }
  }, [profile?.onboardingCompleted]);

  return (
    <PageFrame title="" eyebrow="">
      {showOnboarding && session?.user && (
        <OnboardingFlow
          user={session.user}
          profile={profile}
          repos={userRepos}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
      <section className={`phase-dashboard-hero dashboard-hero-${activeHeroSlide.theme}`}>
        <div className="dashboard-hero-copy">
          <p className="eyebrow">{activeHeroSlide.eyebrow}</p>
          <h1>{activeHeroSlide.title}</h1>
          <p>{activeHeroSlide.text}</p>
          <span>{activeHeroSlide.cta}</span>
        </div>
        <DashboardHeroVisual theme={activeHeroSlide.theme} repos={visibleRepos} />
        <div className="carousel-dots phase-dots" aria-label="Dashboard hero slides">
          {dashboardHeroSlides.map((slide, index) => (
            <button
              aria-label={`Show dashboard card ${index + 1}`}
              className={index === heroIndex ? "active" : ""}
              key={slide.theme}
              onClick={() => setHeroIndex(index)}
              type="button"
            />
          ))}
        </div>
      </section>

      <div className="phase-dashboard-grid">
        <section>
          <div className="phase-section-head">
            <div><p className="eyebrow">FOLLOWED</p><h2>Users and projects</h2></div>
            <Link to="/following">Manage</Link>
          </div>
          <Card>
            {feedLoading ? <DashboardActivitySkeleton /> : feedEvents.map((event) => <FeedEvent event={event} key={event.id} />)}
            {!feedLoading && feedError && <p className="auth-error">{feedError}</p>}
            {!feedLoading && !feedError && feedEvents.length === 0 && (
              <div className="dashboard-feed-empty">
                <h3>No followed activity yet</h3>
                <p>Follow some developers to see their activity.</p>
                <Button to="/explore" variant="soft">Find developers</Button>
              </div>
            )}
          </Card>

          <div className="phase-section-head compact">
            <div><p className="eyebrow">EDUCATION</p></div>
          </div>
          <Card>
            <div className="education-callout">
              <h3>Continue learning</h3>
              <p>Start with Branching</p>
              <span><b /></span>
              <Button to="/learn" variant="soft">Continue →</Button>
            </div>
          </Card>
        </section>

        <aside>
          <div className="phase-section-head">
            <div><p className="eyebrow">FEATURED</p><h2>Workspaces and projects</h2></div>
            <Link to="/explore">Explore</Link>
          </div>
          {loading && <RepoListSkeleton />}
          {!loading && error && <p className="auth-error">{error}</p>}
          {!loading && !error && visibleRepos.map((repo, index) => (
            <Link className={`featured-project-card card-${index + 1}`} key={repo.name} to={`/${repo.owner}/${repo.name}`}>
              <div>
                <h3>{repo.name}</h3>
                <p>{repo.description}</p>
                <div><span>{repo.stars} stars</span><span>Active</span></div>
              </div>
            </Link>
          ))}
          {!loading && !error && visibleRepos.length === 0 && (
            <p className="empty-helper">No GitHub repositories found yet. Make sure you granted repo access when signing in.</p>
          )}
        </aside>
      </div>
    </PageFrame>
  );
}

function DashboardHeroVisual({ repos = [], theme }) {
  if (theme === "profiles") {
    return (
      <div className="dashboard-hero-visual profiles" aria-hidden="true">
        {["KP", "AM", "JS"].map((initials, index) => (
          <span key={initials} style={{ "--lift": `${index * 18}px` }}>
            <b>{initials}</b>
            <i />
          </span>
        ))}
      </div>
    );
  }

  if (theme === "workspaces") {
    return (
      <div className="dashboard-hero-visual workspaces" aria-hidden="true">
        {(repos.length ? repos : [{ name: "orbit-readme" }, { name: "first-pr-path" }]).slice(0, 2).map((repo, index) => (
          <article key={repo.name || index}>
            <strong>{repo.name || "workspace"}</strong>
            <span />
            <span />
          </article>
        ))}
      </div>
    );
  }

  if (theme === "courses") {
    return (
      <div className="dashboard-hero-visual courses" aria-hidden="true">
        <span>DevOps</span>
        <div><i /><i /><i /></div>
        <b>CI</b>
      </div>
    );
  }

  if (theme === "notes") {
    return (
      <div className="dashboard-hero-visual notes" aria-hidden="true">
        <article>Notebook</article>
        <span>Deploy notes</span>
        <span>README ideas</span>
      </div>
    );
  }

  if (theme === "quote") {
    return (
      <div className="dashboard-hero-visual quote" aria-hidden="true">
        <span>“</span>
        <i />
      </div>
    );
  }

  return (
    <div className="dashboard-hero-visual welcome" aria-hidden="true">
      <svg viewBox="0 0 420 180">
        <path d="M16 150c78-86 142-86 220 0s128 54 168-2" />
        <path d="M80 170c58-52 110-52 160 0s96 26 132-8" />
      </svg>
    </div>
  );
}

function DashboardActivitySkeleton() {
  return (
    <div className="dashboard-activity-skeleton">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="phase-activity-row" key={index}>
          <Skeleton className="skeleton-avatar" />
          <div>
            <Skeleton className="skeleton-text medium" />
            <Skeleton className="skeleton-text wide" />
          </div>
          <Skeleton className="skeleton-pill" />
          <Skeleton className="skeleton-text short" />
        </div>
      ))}
    </div>
  );
}

export { DashboardPage };
