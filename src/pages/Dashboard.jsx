import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Code2, FileText, GitPullRequest } from "lucide-react";
import OnboardingFlow from "../components/onboarding/OnboardingFlow";
import FollowingActivity from "../components/feed/FollowingActivity";
import { useDocumentTitle, useSignedInUserData } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { firstProjectLessons, nextProjectLesson, repositoryPath } from "../lib/projectJourney";
import { learnLessons } from "../data/learnLessons";
import { trackUsage } from "../lib/trackUsage";
import { PageFrame, RepoListSkeleton } from "./PageShared";
import "../styles/project-journey.css";

export function DashboardPage() {
  useDocumentTitle("Your next step · ForAllCode");
  const { session, profile, repos, loading, error } = useSignedInUserData();
  const [selectedRepo, setSelectedRepo] = useState("");
  const [progress, setProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState("");
  const [retry, setRetry] = useState(0);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const repo = repos.find(item => repositoryPath(item) === selectedRepo) || repos[0];
  const repoPath = repo ? repositoryPath(repo) : "/repos/new";
  const nextSlug = nextProjectLesson(progress);
  const nextLesson = learnLessons.find(item => item.slug === nextSlug);
  const reviewed = firstProjectLessons.filter(slug => progress.includes(slug)).length;
  const portfolioPath = profile?.username ? `/${encodeURIComponent(profile.username)}/portfolio` : "/settings/profile";

  useEffect(() => {
    let alive = true;
    setProgress([]);
    setProgressError("");
    setProgressLoading(true);
    async function load() {
      try {
        if (!supabase || !session?.user?.id) return;
        const { data, error: loadError } = await supabase.from("learn_progress")
          .select("lesson_slug,completed").eq("user_id", session.user.id);
        if (loadError) throw loadError;
        if (alive) setProgress((data || []).filter(item => item.completed).map(item => item.lesson_slug));
      } catch {
        if (alive) setProgressError("Your learning progress could not be loaded.");
      } finally {
        if (alive) setProgressLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [session?.user?.id, retry]);

  const nextAction = !repo
    ? { title: "Start with one small project", text: "A personal introduction is enough. Create a repository with a README, then make one useful improvement.", href: "/repos/new", label: "Create your first project" }
    : nextLesson
      ? { title: `Next: ${nextLesson.title}`, text: `Apply one Git concept to ${repo.name}. Start with a small README improvement you can describe in your own words.`, href: `/learn/${nextSlug}`, label: "Open your next lesson" }
      : { title: "Put your learning into practice", text: "Open a README pull request and check the evidence of your change. Reviewing lessons is a starting point, not proof of practical skill.", href: "/learn/pull-request-best-practices#project-practice", label: "Check your project work" };

  return (
    <PageFrame title="Your next step" eyebrow="Learn. Build. Explain.">
      {profile?.onboardingCompleted === false && !onboardingDismissed && session?.user && (
        <OnboardingFlow user={session.user} profile={profile} repos={repos} onComplete={() => setOnboardingDismissed(true)} />
      )}
      <div className="project-journey">
        <section className="journey-next" aria-labelledby="next-action-heading">
          <p>Welcome{profile?.displayName ? `, ${profile.displayName.split(" ")[0]}` : ""}.</p>
          {loading || progressLoading ? <RepoListSkeleton /> : error ? (
            <p role="alert">Your projects could not be loaded. <Link to="/repos">Open repositories to reconnect or retry.</Link></p>
          ) : progressError ? (
            <div role="alert"><p>{progressError}</p><button className="button soft" type="button" onClick={() => setRetry(value => value + 1)}>Retry progress</button></div>
          ) : (
            <>
              <h2 id="next-action-heading">{nextAction.title}</h2>
              <p>{nextAction.text}</p>
              <Link className="button" to={nextAction.href} onClick={() => trackUsage(session?.user?.id, "journey_action_opened", { action: nextAction.label }).catch(() => {})}>{nextAction.label}<ArrowRight size={16} /></Link>
            </>
          )}
        </section>

        {!loading && !error && repos.length > 0 && (
          <div className="journey-project-picker">
            <label htmlFor="active-project">Project for this session</label>
            <select id="active-project" value={repoPath} onChange={event => setSelectedRepo(event.target.value)}>
              {repos.map(item => <option key={repositoryPath(item)} value={repositoryPath(item)}>{item.owner}/{item.name}</option>)}
            </select>
            <Link to={repoPath}>Open project<ArrowRight size={16} /></Link>
          </div>
        )}

        <section aria-labelledby="project-path-heading">
          <h2 id="project-path-heading">From first change to project story</h2>
          <ol className="journey-steps">
            <li><Code2 aria-hidden="true" /><div><h3>Choose a small project</h3><p>A personal introduction, a reading list, or a project setup guide. Keep your first change small.</p><Link to={repoPath}>{repo ? `Work on ${repo.name}` : "Create a project"}</Link></div></li>
            <li><BookOpen aria-hidden="true" /><div><h3>Understand your change</h3><p>{progressLoading ? "Loading lesson progress..." : progressError ? "Lesson progress unavailable." : `${reviewed} of ${firstProjectLessons.length} suggested lessons reviewed.`} Practice matters more than ticking a box.</p><Link to={`/learn/${nextSlug || "commits"}`}>Study {nextLesson?.title || "Commits"}</Link></div></li>
            <li><GitPullRequest aria-hidden="true" /><div><h3>Open a pull request</h3><p>Improve a README on a branch, explain your commit, and check your own pull request against GitHub.</p><Link to="/learn/pull-request-best-practices#project-practice">Try the project task</Link></div></li>
            <li><FileText aria-hidden="true" /><div><h3>Explain what you built</h3><p>Write the problem, your decisions, your contribution, and what you learned. Add that project to your portfolio.</p>{repo ? <Link to={`${repoPath}/readme`}>Write your project story</Link> : <Link to="/repos/new">Create a project first</Link>}<Link to={portfolioPath}>Open portfolio</Link></div></li>
          </ol>
        </section>
        <aside className="journey-trust">
          <h2>Your work and your data</h2>
          <p>Code and commits live on GitHub. ForAllCode stores your learning progress, profile, portfolio settings, and README drafts. Saving a README to your repo creates a GitHub commit; saving a draft does not.</p>
          <Link to="/settings/integrations">Manage GitHub connection</Link>
        </aside>
        <nav className="journey-secondary" aria-label="More from ForAllCode">
          <Link to="/workspace">Workspace</Link><Link to="/repos">All repositories</Link><Link to="/explore">Community</Link><Link to="/marketplace">Course marketplace</Link>
        </nav>
        <details className="journey-secondary-activity" onToggle={event => setActivityOpen(event.currentTarget.open)}>
          <summary>Followed community activity</summary>
          {activityOpen && <FollowingActivity userId={session?.user?.id} />}
        </details>
      </div>
    </PageFrame>
  );
}
