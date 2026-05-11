import React, { lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import {
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileText,
  Folder,
  Github,
  GitFork,
  Home,
  Lock,
  MoreHorizontal,
  Palette,
  Plus,
  Settings,
  Sparkles,
  Star,
} from "lucide-react";
import CommandPalette from "./components/layout/CommandPalette";
import TopNav from "./components/layout/TopNav";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import IllustratedAvatar, { avatarVariants } from "./components/ui/IllustratedAvatar";
import Skeleton from "./components/ui/Skeleton";
import { useAuthSession, useDocumentTitle, useIsMobile, useSignedInUserData } from "./lib/hooks";
import { renderMarkdown } from "./lib/markdownRenderer";
import { createNotification } from "./lib/notifications";
import { fetchGitHubFileContent, fetchGitHubRepoArchive, fetchGitHubRepoOverview, getCurrentSession, isSupabaseConfigured, signInWithGitHub, signInWithPassword, supabase } from "./lib/supabase";
import "./styles.css";
import "./styles/mobile.css";

const About = lazy(() => import("./pages/About"));
const Explore = lazy(() => import("./pages/Explore"));
const LandingDesigner = lazy(() => import("./pages/LandingDesigner"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ReadmeStudio = lazy(() => import("./pages/ReadmeStudio"));
const SettingsAccount = lazy(() => import("./pages/settings/SettingsAccount"));
const SettingsAppearance = lazy(() => import("./pages/settings/SettingsAppearance"));
const SettingsDanger = lazy(() => import("./pages/settings/SettingsDanger"));
const SettingsIntegrations = lazy(() => import("./pages/settings/SettingsIntegrations"));
const SettingsLayout = lazy(() => import("./pages/settings/SettingsLayout"));
const SettingsNotifications = lazy(() => import("./pages/settings/SettingsNotifications"));
const SettingsPrivacy = lazy(() => import("./pages/settings/SettingsPrivacy"));
const SettingsProfile = lazy(() => import("./pages/settings/SettingsProfile"));
const SettingsWorkspace = lazy(() => import("./pages/settings/SettingsWorkspace"));

const currentUser = {
  username: "",
  name: "",
  pronouns: "",
  bio: "",
  location: "",
  email: "",
  website: "",
  joinDate: "March 2026",
  followers: 0,
  following: 0,
  stars: 0,
  repos: 0,
  avatarStyle: "sage"
};

const languageStyles = {
  TypeScript: ["#ddd5f0", "#534AB7"],
  JavaScript: ["#f5e4c4", "#633806"],
  Python: ["#cce0f0", "#0C447C"],
  CSS: ["#c8d8c4", "#27500A"],
  Rust: ["#f5d5d8", "#72243E"],
  Shell: ["#f5e4c4", "#633806"],
  Go: ["#cce0f0", "#0C447C"]
};

const repos = [];

const lessons = [
  ["branching", "Branching", "beginner", "Try ideas without disturbing your main line of work."],
  ["merging", "Merging", "beginner", "Bring a finished branch home with confidence."],
  ["forking", "Forking", "beginner", "Make your own copy of a project before contributing."],
  ["commits", "Commits", "beginner", "Capture meaningful checkpoints and write useful messages."],
  ["pull-requests", "Pull Requests", "intermediate", "Turn your branch into a thoughtful proposal."],
  ["rebasing", "Rebasing", "intermediate", "Replay changes onto a fresher base when history needs tidying."],
  ["conflicts", "Resolving merge conflicts", "intermediate", "Understand why conflicts happen and resolve them calmly."],
  ["gitignore", "Gitignore", "beginner", "Keep generated files and secrets out of your repo."],
  ["stashing", "Stashing changes", "intermediate", "Temporarily shelve work while you switch context."],
  ["commit-messages", "Writing good commit messages", "beginner", "Leave future readers a clear trail."],
  ["open-source", "Open source contribution", "advanced", "Choose an issue, communicate well, and ship your first PR."],
  ["licences", "Licences explained simply", "beginner", "Pick a licence without getting lost in legal fog."]
];

const lessonDetails = {
  branching: {
    label: "A feature branch splits from main and returns later.",
    steps: ["Start from main", "Create a new branch", "Make a focused change", "Compare your work"]
  },
  merging: {
    label: "Two lines of work combine into one finished history.",
    steps: ["Review both branches", "Bring changes together", "Resolve the merge", "Check the result"]
  },
  forking: {
    label: "A project is copied into your account before you contribute.",
    steps: ["Find the upstream project", "Create your fork", "Clone your copy", "Send improvements back"]
  },
  commits: {
    label: "Checkpoints stack into a clear project timeline.",
    steps: ["Stage the right files", "Describe the change", "Create the checkpoint", "Review the timeline"]
  },
  "pull-requests": {
    label: "A branch becomes a reviewed proposal with comments.",
    steps: ["Open the proposal", "Explain the change", "Respond to review", "Merge when ready"]
  },
  rebasing: {
    label: "Local commits replay on top of a fresher main branch.",
    steps: ["Fetch the newest main", "Replay your commits", "Fix any stops", "Push the tidy history"]
  },
  conflicts: {
    label: "Competing edits meet in one file and need a human choice.",
    steps: ["Find conflict markers", "Choose the final text", "Remove the markers", "Commit the resolution"]
  },
  gitignore: {
    label: "Generated files and secrets are filtered before they enter Git.",
    steps: ["Spot noisy files", "Write ignore rules", "Check ignored paths", "Commit the clean list"]
  },
  stashing: {
    label: "Unfinished work goes onto a shelf while you switch tasks.",
    steps: ["Save work in progress", "Switch context", "Finish the urgent task", "Pop the stash back"]
  },
  "commit-messages": {
    label: "A commit gets a clear subject and helpful details.",
    steps: ["Name the intent", "Add useful context", "Keep it readable", "Help future readers"]
  },
  "open-source": {
    label: "An issue moves through discussion, contribution, and review.",
    steps: ["Choose a good issue", "Talk before building", "Submit the change", "Follow through kindly"]
  },
  licences: {
    label: "A licence document clarifies how others can use the work.",
    steps: ["Compare permissions", "Pick a licence", "Add it to the repo", "Make terms visible"]
  }
};

function useInitialLoading(delay = 420) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return loading;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isEntryPage = location.pathname === "/";

  return (
    <>
      {!isEntryPage && <CommandPalette />}
      <div className={isEntryPage ? "app-shell entry-shell" : "app-shell"}>
        {!isEntryPage && <TopNav />}
        <main>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<EntryPage />} />
              <Route path="/home" element={<LandingPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/profile" element={<MyProfilePage />} />
              <Route path="/repos" element={<ReposPage />} />
              <Route path="/repos/new" element={<NewRepoPage />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="/settings/account" replace />} />
                <Route path="account" element={<SettingsAccount />} />
                <Route path="profile" element={<SettingsProfile />} />
                <Route path="workspace" element={<SettingsWorkspace />} />
                <Route path="appearance" element={<SettingsAppearance />} />
                <Route path="notifications" element={<SettingsNotifications />} />
                <Route path="integrations" element={<SettingsIntegrations />} />
                <Route path="privacy" element={<SettingsPrivacy />} />
                <Route path="danger" element={<SettingsDanger />} />
              </Route>
              <Route path="/:username/:repo/readme" element={<ReadmeStudio />} />
              <Route path="/:username/:repo/landing" element={<LandingDesigner />} />
              <Route path="/:username/:repo" element={<RepoPage />} />
              <Route path="/:username" element={<PublicProfile />} />
            </Routes>
          </Suspense>
        </main>
        {!isEntryPage && <Footer />}
      </div>
    </>
  );
}

function EntryPage() {
  useDocumentTitle("ForAllCode");

  return (
    <section className="entry-page" aria-label="ForAllCode entrance">
      <video className="entry-video" autoPlay muted loop playsInline preload="auto">
        <source src="/forallcode-entry.mp4" type="video/mp4" />
      </video>
      <div className="entry-vignette" />
      <Link className="entry-button" to="/home">enter</Link>
    </section>
  );
}

function RouteFallback() {
  return (
    <div className="route-skeleton" aria-label="Loading page">
      <Skeleton className="route-skeleton-title" />
      <Skeleton className="route-skeleton-line" />
      <Skeleton className="route-skeleton-card" />
    </div>
  );
}

function LandingPage() {
  useDocumentTitle("Home · ForAllCode");
  const { loggedIn } = useAuthSession();
  const [message, setMessage] = useState("");

  async function handleGitHubSignIn() {
    try {
      setMessage("");
      await signInWithGitHub();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <>
      <section className="hero landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">A warmer place to build</p>
          <h1>Code lives here. Understanding does too.</h1>
          <p>ForAllCode turns repositories into friendly workspaces, explains Git visually, and helps projects greet new contributors beautifully.</p>
          <div className="button-row">
            {loggedIn ? (
              <>
                <Button to="/dashboard">Go to dashboard</Button>
                <Button to="/learn" variant="soft">Explore Learn</Button>
              </>
            ) : (
              <Button onClick={handleGitHubSignIn}><Github size={18} />Sign in with GitHub</Button>
            )}
          </div>
          {!loggedIn && message && <p className="auth-error landing-auth-error">{message}</p>}
        </div>
        <DeskPreview compact />
      </section>
      {loggedIn && (
        <>
          <section className="feature-grid">
            {[
              ["Workspace", "An illustrated desk where active projects become sticky notes.", <Home />],
              ["Learn", "Interactive Git diagrams that teach what happened and why.", <BookOpen />],
              ["README Studio", "A live editor for beautiful project introductions.", <FileCode2 />],
              ["Landing Designer", "Publish a pastel project page without leaving the repo.", <Palette />]
            ].map(([title, text, icon]) => <FeatureCard key={title} title={title} text={text} icon={icon} />)}
          </section>
          <section className="band">
            <h2>How it works</h2>
            <div className="steps">
              {["Connect GitHub", "Set up workspace", "Start learning"].map((step, index) => (
                <Card key={step}><span className="step-number">{index + 1}</span><h3>{step}</h3><p>{["Sync repositories securely with OAuth.", "Pin the work that matters today.", "Continue lessons beside real projects."][index]}</p></Card>
              ))}
            </div>
          </section>
          <section className="stats">
            <Stat value="12k" label="repos warmed up" />
            <Stat value="2.8k" label="early users" />
            <Stat value="36" label="visual lessons" />
          </section>
        </>
      )}
    </>
  );
}

function AboutPage() {
  useDocumentTitle("About");
  return (
    <PageFrame title="For all people who code" eyebrow="About">
      <div className="split">
        <Card large>
          <h2>Inspired by the race that never ended</h2>
          <p>ForAllCode borrows its spirit from <em>For All Mankind</em>: an alternate history where ambition becomes more inclusive because the horizon keeps widening.</p>
          <p>Our question is smaller and closer to the keyboard: what if developer tools were built for all people, not just experienced engineers?</p>
        </Card>
        <Card large>
          <h2>Different from GitHub</h2>
          <ul className="check-list">
            <li>Visual Git education sits beside your real work.</li>
            <li>Profiles include a private illustrated workspace.</li>
            <li>READMEs and project landing pages are first-class creative tools.</li>
            <li>Every surface is designed to reduce intimidation.</li>
          </ul>
          <Button to="/login">Join the MVP</Button>
        </Card>
      </div>
      <Roadmap />
    </PageFrame>
  );
}

function LoginPage() {
  useDocumentTitle("Sign in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const githubSignIn = async () => {
    try {
      setMessage("");
      await signInWithGitHub();
    } catch (error) {
      setMessage(error.message);
    }
  };
  const passwordSignIn = async () => {
    try {
      setMessage("");
      const { error } = await signInWithPassword(email, password);
      if (error) throw error;
      window.location.assign("/dashboard");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <PageFrame title="Welcome to ForAllCode" eyebrow="Sign in">
      <section className="auth-panel">
        <Card large>
          {!isSupabaseConfigured && <p className="auth-note">Supabase env vars are missing. Add them to `.env` to enable live sign in.</p>}
          <Button full onClick={githubSignIn}><Github size={18} />Continue with GitHub</Button>
          <div className="divider">or</div>
          <label>Email<input placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" placeholder="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {message && <p className="auth-error">{message}</p>}
          <Button variant="soft" full onClick={passwordSignIn}>Continue with email</Button>
          <Link to="/login">Forgot password?</Link>
        </Card>
        <Card large>
          <h2>Sign up flow</h2>
          <ol className="flow-list">
            <li>GitHub OAuth</li>
            <li>Pick username</li>
            <li>Choose illustrated avatar</li>
            <li>Redirect to dashboard</li>
          </ol>
          <AvatarPicker />
        </Card>
      </section>
    </PageFrame>
  );
}

function AuthCallback() {
  useDocumentTitle("Signing in");
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    getCurrentSession()
      .then((session) => {
        if (session) {
          window.location.replace("/dashboard");
        } else {
          setMessage("No Supabase session was found. Please try signing in again.");
        }
      })
      .catch((error) => setMessage(error.message));
  }, []);

  return (
    <PageFrame title="Signing you in" eyebrow="Auth">
      <Card large><p>{message}</p></Card>
    </PageFrame>
  );
}

function DashboardPage() {
  useDocumentTitle("Dashboard");
  const { profile, repos: userRepos, activity, loading, error } = useSignedInUserData();
  const displayName = profile?.displayName || "there";
  const firstName = displayName.split(" ")[0] || displayName;
  const visibleRepos = userRepos.slice(0, 2);
  return (
    <PageFrame title="" eyebrow="">
      <section className="phase-dashboard-hero">
        <div>
          <p className="eyebrow">FORALLCODE</p>
          <h1>Welcome back, {firstName}</h1>
          <p>Your workspace is ready. Pick up where you left off, follow the work, and keep the useful ideas in sight.</p>
        </div>
        <svg viewBox="0 0 420 180" aria-hidden="true">
          <path d="M16 150c78-86 142-86 220 0s128 54 168-2" />
          <path d="M80 170c58-52 110-52 160 0s96 26 132-8" />
        </svg>
        <div className="carousel-dots phase-dots">{Array.from({ length: 5 }).map((_, index) => <span key={index} className={index === 0 ? "active" : ""} />)}</div>
      </section>

      <div className="phase-dashboard-grid">
        <section>
          <div className="phase-section-head">
            <div><p className="eyebrow">FOLLOWED</p><h2>Users and projects</h2></div>
            <Link to="/following">Manage</Link>
          </div>
          <Card>
            {loading ? <DashboardActivitySkeleton /> : activity.map((item) => (
              <div className="phase-activity-row" key={`${item.name}-${item.action}`}>
                <span className="phase-initials">{item.initials}</span>
                <div><strong>{item.name}</strong><p>{item.action}</p></div>
                {item.live && <span className="live-pill">Live</span>}
                <time>{item.time}</time>
              </div>
            ))}
            {!loading && activity.length === 0 && <p className="empty-helper">No GitHub activity from followed accounts yet.</p>}
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

function WorkspacePage() {
  useDocumentTitle("Workspace");
  return (
    <PageFrame title="My Workspace" eyebrow="Private desk">
      <Workspace interactive />
    </PageFrame>
  );
}

function MyProfilePage() {
  useDocumentTitle("Profile");
  const { profile, repos: userRepos, loading } = useSignedInUserData();
  const visibleRepos = userRepos.length > 0 ? userRepos : [];
  return (
    <PageFrame title="My Profile" eyebrow="Profile">
      <ProfileHeader editable profileData={profile} repoCount={userRepos.length} />
      <Workspace compact />
      <div className="two-column">
        <section>
          {loading ? <RepoListSkeleton /> : visibleRepos.map((repo) => <RepoCard key={repo.name} repo={repo} actions />)}
          {!loading && visibleRepos.length === 0 && <Card><h3>No synced repos yet</h3><p>Sign in with GitHub repo access to fill this profile with your repositories.</p></Card>}
        </section>
        <aside><ActivityCalendar /><RecentChanges repos={visibleRepos} /></aside>
      </div>
    </PageFrame>
  );
}

function PublicProfile() {
  const { username } = useParams();
  useDocumentTitle(`${username}`);
  const { profile, repos: userRepos, activity } = useSignedInUserData();
  const isOwnProfile = username === profile?.username;
  const profileRepos = isOwnProfile ? userRepos : [];
  return (
    <PageFrame title={isOwnProfile ? profile.displayName : username} eyebrow={`@${username}`}>
      <ProfileHeader publicView profileData={isOwnProfile ? profile : { username, displayName: username }} repoCount={profileRepos.length} />
      <SectionTitle title="Pinned repos" />
      <div className="repo-grid">
        {profileRepos.filter((repo) => repo.pinned).map((repo) => <RepoCard key={repo.name} repo={{ ...repo, owner: username }} />)}
        {profileRepos.filter((repo) => repo.pinned).length === 0 && <Card><h3>No pinned GitHub repos yet</h3><p>Pinned repositories will appear here once they are selected.</p></Card>}
      </div>
      <div className="two-column">
        <Card><h3>Public activity</h3>{activity.map((item) => <p key={item.id}>{item.name} {item.action}</p>)}{activity.length === 0 && <p>No public GitHub activity synced yet.</p>}</Card>
        <Card><h3>Skills and badges</h3><div className="tag-row">{["Git mentoring", "TypeScript", "Design systems", "Open source guide"].map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></Card>
      </div>
    </PageFrame>
  );
}

function ReposPage() {
  useDocumentTitle("Repositories");
  const { repos: userRepos, loading: loadingRepos, error } = useSignedInUserData();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [sort, setSort] = useState("updated");
  const repoSource = userRepos.length > 0 ? userRepos : [];
  const languages = [...new Set(repoSource.map((repo) => repo.language))];
  const filtered = repoSource
    .filter((repo) => (language === "all" || repo.language === language))
    .filter((repo) => (visibility === "all" || (visibility === "private" ? repo.private : !repo.private)))
    .filter((repo) => repo.name.toLowerCase().includes(query.toLowerCase()) || repo.description.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === "stars") return b.stars - a.stars;
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <PageFrame title="" eyebrow="">
      <div className="repos-page-header">
        <h1>Repositories</h1>
        <div>
          <Button variant="soft"><Github size={16} />Import from GitHub</Button>
          <Button to="/repos/new"><Plus size={16} />New repository</Button>
        </div>
      </div>
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
      </div>
      {loadingRepos ? (
        <RepoListSkeleton />
      ) : error ? (
        <div className="repo-empty-state">
          <Github size={54} />
          <h2>Could not load GitHub repositories</h2>
          <p>{error}</p>
          <Button variant="soft" onClick={() => window.location.reload()}>Try again</Button>
        </div>
      ) : filtered.length > 0 ? (
        <div className="phase-repo-list">{filtered.map((repo) => <PhaseRepoCard key={repo.name} repo={repo} />)}</div>
      ) : (
        <div className="repo-empty-state">
          <Folder size={54} />
          <h2>No GitHub repositories found</h2>
          <p>ForAllCode did not find repos for this GitHub account yet. If this looks wrong, sign out and sign back in with repo access enabled.</p>
          <div className="button-row"><Button to="/repos/new"><Plus size={16} />New repository</Button><Button variant="soft" onClick={() => window.location.reload()}><Github size={16} />Sync again</Button></div>
        </div>
      )}
    </PageFrame>
  );
}

function NewRepoPage() {
  useDocumentTitle("New repository");
  const [visibility, setVisibility] = useState("public");
  const [template, setTemplate] = useState("starter");

  return (
    <PageFrame title="Create a new repository" eyebrow="New repo">
      <section className="new-repo-layout">
        <div className="new-repo-form">
          <Card large>
            <h2>Repository details</h2>
            <label className="new-repo-field">
              <span>Repository name</span>
              <input placeholder="my-warm-project" />
            </label>
            <label className="new-repo-field">
              <span>Description</span>
              <textarea placeholder="A short, welcoming description for contributors." rows={4} />
            </label>
            <div className="new-repo-options">
              {[
                ["public", "Public", "Anyone can see this repository."],
                ["private", "Private", "Only people you invite can see it."]
              ].map(([value, title, text]) => (
                <button className={visibility === value ? "active" : ""} key={value} onClick={() => setVisibility(value)} type="button">
                  <strong>{title}</strong>
                  <small>{text}</small>
                </button>
              ))}
            </div>
            <label className="new-repo-field">
              <span>Starter template</span>
              <select value={template} onChange={(event) => setTemplate(event.target.value)}>
                <option value="starter">Starter README + folders</option>
                <option value="web">Pastel web app</option>
                <option value="docs">Documentation site</option>
                <option value="empty">Empty repository</option>
              </select>
            </label>
            <div className="button-row">
              <Button>Create repository</Button>
              <Button to="/repos" variant="soft">Cancel</Button>
            </div>
          </Card>
        </div>

        <CodebaseMapPanel owner="origin" repo="new-repo" />
      </section>
    </PageFrame>
  );
}

function CodebaseMapPanel({
  owner,
  repo,
  repoGraph,
  title = "See the shape of the work before it grows.",
  description = "ForAllCode shows the main branch, feature branches, forks, pull requests, and merges as a living diagram."
}) {
  return (
    <section className="codebase-map-section">
      <div className="codebase-map-copy">
        <p className="eyebrow">Visual codebase map</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <CodebaseDiagram owner={owner} repo={repo} repoGraph={repoGraph} />
      <div className="codebase-map-legend">
        <span><i className="main" /> Main branch</span>
        <span><i className="branch" /> Feature branch</span>
        <span><i className="fork" /> Fork</span>
        <span><i className="merge" /> Merge</span>
      </div>
    </section>
  );
}

function CodebaseDiagram({ owner = "origin", repo = "forallcode", repoGraph }) {
  const mainCommits = (repoGraph?.commits || []).slice(0, 6).reverse().map((commit, index, items) => ({
    x: 90 + index * (items.length > 1 ? 620 / (items.length - 1) : 0),
    y: 170,
    label: commit.hash || `c${index + 1}`
  }));
  const commits = mainCommits.length > 0 ? mainCommits : [{ x: 90, y: 170, label: "empty" }];
  const feature = (repoGraph?.branches || [])
    .filter((branch) => !branch.default)
    .slice(0, 2)
    .map((branch, index) => ({
      x: 330 + index * 130,
      y: 92,
      label: branch.name.length > 18 ? `${branch.name.slice(0, 15)}...` : branch.name
    }));
  const fork = (repoGraph?.forks || []).slice(0, 2).map((item, index) => ({
    x: 210 + index * 150,
    y: 260 + index * 30,
    label: item.owner || item.name
  }));
  const pull = repoGraph?.pulls?.[0];
  const defaultBranch = repoGraph?.defaultBranch || "main";

  return (
    <div className="codebase-diagram" aria-label="Visual diagram of main branch, forks, feature branches, and merges">
      <svg viewBox="0 0 800 380" role="img">
        <defs>
          <marker id="arrow-soft" markerHeight="8" markerWidth="8" orient="auto" refX="6" refY="3">
            <path d="M0,0 L0,6 L7,3 z" fill="#9c918c" />
          </marker>
        </defs>

        <path className="map-line main-line" d="M90 170 H710" />
        {feature.length > 0 && <path className="map-line branch-line" d="M330 170 C340 120 370 92 410 92 H460 C506 92 530 124 590 170" />}
        {fork.length > 0 && <path className="map-line fork-line" d="M210 170 C212 225 260 258 350 300 C432 332 492 302 590 170" />}
        {pull && <path className="map-line pr-line" d="M500 260 C545 244 570 212 590 170" markerEnd="url(#arrow-soft)" />}

        <rect x="54" y="26" width="196" height="54" rx="16" fill="#fffdf9" stroke="#e8e0d4" />
        <text x="74" y="58">{owner}/{repo}</text>

        {pull && (
          <>
            <rect x="586" y="244" width="146" height="54" rx="16" fill="#f5e4c4" stroke="#e8e0d4" />
            <text x="606" y="276">PR #{pull.number} {pull.state}</text>
          </>
        )}

        {commits.map((commit, index) => (
          <g key={commit.label}>
            <circle className={index === 4 ? "merge-node" : "main-node"} cx={commit.x} cy={commit.y} r="14" />
            <text x={commit.x} y="210" textAnchor="middle">{commit.label}</text>
          </g>
        ))}

        {feature.map((commit) => (
          <g key={commit.label}>
            <circle className="branch-node" cx={commit.x} cy={commit.y} r="13" />
            <text x={commit.x} y="66" textAnchor="middle">{commit.label}</text>
          </g>
        ))}

        {fork.map((commit) => (
          <g key={commit.label}>
            <circle className="fork-node" cx={commit.x} cy={commit.y} r="13" />
            <text x={commit.x} y={commit.y + 40} textAnchor="middle">{commit.label}</text>
          </g>
        ))}

        <text className="map-label" x="650" y="142">{defaultBranch}</text>
        {feature[0] && <text className="map-label" x="380" y="122">active branch</text>}
        {fork[0] && <text className="map-label" x="286" y="246">recent fork</text>}
      </svg>
    </div>
  );
}

function RepoPage() {
  const { username, repo } = useParams();
  useDocumentTitle(`${repo} · ${username}`);
  const { repos: userRepos } = useSignedInUserData();
  const data = userRepos.find((item) => item.name === repo && item.owner === username)
    || userRepos.find((item) => item.name === repo)
    || {
      name: repo,
      owner: username,
      description: "GitHub repository",
      language: "Code",
      stars: 0,
      forks: 0,
      updated: "Recently",
      private: false
  };
  const [activeTab, setActiveTab] = useState("Code");
  const [landingHtml, setLandingHtml] = useState("");
  const [repoDetails, setRepoDetails] = useState(null);
  const [repoDetailsLoading, setRepoDetailsLoading] = useState(true);
  const [repoDetailsError, setRepoDetailsError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [openFile, setOpenFile] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [downloadState, setDownloadState] = useState("");
  const cloneUrl = `https://github.com/${username}/${repo}.git`;

  useEffect(() => {
    let alive = true;

    async function loadGitHubDetails() {
      setRepoDetailsLoading(true);
      setRepoDetailsError("");

      try {
        const session = await getCurrentSession();
        if (!session?.provider_token) {
          throw new Error("Sign in with GitHub to load live repo contents.");
        }

        const details = await fetchGitHubRepoOverview(username, repo, session.provider_token);
        if (alive) {
          setRepoDetails(details);
          const readmeFile = details.files.find((item) => item.type === "file" && item.name.toLowerCase() === "readme.md");
          setSelectedFile(readmeFile || details.files.find((item) => item.type === "file") || null);
          setOpenFile(readmeFile ? {
            name: "README.md",
            path: readmeFile.path,
            content: details.readme,
            size: readmeFile.size || details.readme.length
          } : null);
        }
      } catch (error) {
        if (alive) {
          setRepoDetails(null);
          setRepoDetailsError(error.message || "Could not load this repository from GitHub.");
        }
      } finally {
        if (alive) setRepoDetailsLoading(false);
      }
    }

    loadGitHubDetails();
    return () => {
      alive = false;
    };
  }, [username, repo]);

  async function openRepoFile(file) {
    if (file.type === "folder") return;
    setSelectedFile(file);
    setFileLoading(true);
    setFileError("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub to open files.");
      }

      const content = await fetchGitHubFileContent(username, repo, file.path, session.provider_token, repoDetails?.defaultBranch);
      setOpenFile(content);
    } catch (error) {
      setOpenFile(null);
      setFileError(error.message || "Could not open this file from GitHub.");
    } finally {
      setFileLoading(false);
    }
  }

  async function downloadSelectedFile() {
    if (!selectedFile || selectedFile.type === "folder") return;
    setDownloadState("file");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub to download files.");
      }

      const content = openFile?.path === selectedFile.path
        ? openFile
        : await fetchGitHubFileContent(username, repo, selectedFile.path, session.provider_token, repoDetails?.defaultBranch);
      downloadBlob(new Blob([content.content || ""], { type: "text/plain;charset=utf-8" }), content.name || selectedFile.name);
    } catch (error) {
      setFileError(error.message || "Could not download this file from GitHub.");
    } finally {
      setDownloadState("");
    }
  }

  async function downloadRepositoryArchive() {
    setDownloadState("repo");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub to download this repository.");
      }

      const branch = repoDetails?.defaultBranch || "main";
      const archive = await fetchGitHubRepoArchive(username, repo, session.provider_token, branch);
      downloadBlob(archive, `${repo}-${branch}.zip`);
    } catch (error) {
      setFileError(error.message || "Could not download this repository from GitHub.");
    } finally {
      setDownloadState("");
    }
  }

  useEffect(() => {
    async function loadPublishedLanding() {
      if (!supabase) return;

      const { data: repository } = await supabase
        .from("repositories")
        .select("landing_page_html")
        .eq("name", repo)
        .maybeSingle();

      if (repository?.landing_page_html) setLandingHtml(repository.landing_page_html);
    }

    loadPublishedLanding();
  }, [repo]);

  async function handleStarRepo() {
    if (!supabase) return;
    const session = await getCurrentSession();
    if (!session?.user?.id) return;

    const { data: repository } = await supabase
      .from("repositories")
      .select("id, owner_id")
      .eq("name", repo)
      .maybeSingle();
    const { data: actor } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!repository?.owner_id || repository.owner_id === session.user.id) return;
    await createNotification(supabase, {
      userId: repository.owner_id,
      type: "star",
      actorId: session.user.id,
      repoId: repository.id,
      message: `${actor?.display_name || "Someone"} starred your repo ${repo}`
    });
  }

  return (
    <div className="phase-repo-page">
      {landingHtml && <PublishedLanding html={landingHtml} />}
      <section className="phase-repo-header">
        <div className="repo-breadcrumb"><span>{username}</span><b>/</b><strong>{repo}</strong></div>
        <p>{data.description}</p>
        <div className="phase-repo-meta">
          <LanguagePill language={data.language} />
          <span><Star size={14} />{data.stars}</span>
          <span><GitFork size={14} />{data.forks}</span>
          <span>Updated {data.updated}</span>
        </div>
        <div className="repo-header-actions">
          <Button variant="soft" onClick={handleStarRepo}><Star size={16} />Star</Button>
          <Button variant="soft"><GitFork size={16} />Fork</Button>
          <Button variant="soft" onClick={downloadRepositoryArchive} disabled={repoDetailsLoading || downloadState === "repo"}>
            <Download size={16} />{downloadState === "repo" ? "Downloading..." : "Download all"}
          </Button>
          <div className="clone-control">
            <button>Clone <ChevronDown size={14} /></button>
            <div><input readOnly value={cloneUrl} /><Button variant="soft"><Copy size={16} /></Button></div>
          </div>
        </div>
      </section>

      <div className="repo-tab-bar">
        {["Code", "Commits", "Branches", "Visual Map", "Settings"].map((tab) => (
          <button className={activeTab === tab ? "active" : ""} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      {activeTab === "Code" && (
        <section className="phase-code-tab">
          {repoDetailsLoading ? (
            <>
              <RepoFileTreeSkeleton />
              <ReadmeSkeleton />
            </>
          ) : repoDetailsError ? (
            <RepoDataMessage title="Could not load GitHub files" text={repoDetailsError} />
          ) : (
            <>
              <aside className="phase-file-tree">
                <select value={repoDetails?.defaultBranch || "main"} onChange={() => {}}>
                  {(repoDetails?.branches?.length ? repoDetails.branches : [{ name: repoDetails?.defaultBranch || "main" }]).map((branch) => (
                    <option key={branch.name}>{branch.name}</option>
                  ))}
                </select>
                {(repoDetails?.files || []).map((item) => (
                  <button
                    className={selectedFile?.path === item.path ? "active" : ""}
                    disabled={item.type === "folder"}
                    key={item.path}
                    onClick={() => openRepoFile(item)}
                    title={item.path}
                    style={{ paddingLeft: `${12 + item.indent * 18}px` }}
                  >
                    {item.type === "folder" ? <Folder size={15} /> : <FileText size={15} />}
                    {item.name}
                  </button>
                ))}
                {repoDetails?.files?.length === 0 && <p className="empty-state">No files found in this repository.</p>}
              </aside>
              <FilePreview
                error={fileError}
                file={openFile}
                loading={fileLoading}
                onDownload={downloadSelectedFile}
                repo={data}
                repoReadme={repoDetails?.readme}
                downloading={downloadState === "file"}
              />
            </>
          )}
        </section>
      )}

      {activeTab === "Commits" && (
        <section className="phase-list-panel">
          {repoDetailsLoading && <RepoListLoading />}
          {!repoDetailsLoading && repoDetailsError && <RepoDataMessage title="Could not load GitHub commits" text={repoDetailsError} />}
          {!repoDetailsLoading && !repoDetailsError && (repoDetails?.commits || []).map((commit) => (
            <div className="commit-row" key={commit.hash}>
              <span className="phase-initials">{commit.author?.[0] || "?"}</span>
              <div><strong>{commit.message}</strong><p>{commit.author}</p></div>
              <code>{commit.hash}</code>
              <time>{commit.time}</time>
            </div>
          ))}
          {!repoDetailsLoading && !repoDetailsError && repoDetails?.commits?.length === 0 && <RepoDataMessage title="No commits found" text="GitHub did not return any commits for this repository." />}
        </section>
      )}

      {activeTab === "Branches" && (
        <section className="phase-list-panel">
          {repoDetailsLoading && <RepoListLoading />}
          {!repoDetailsLoading && repoDetailsError && <RepoDataMessage title="Could not load GitHub branches" text={repoDetailsError} />}
          {!repoDetailsLoading && !repoDetailsError && (repoDetails?.branches || []).map((branch) => (
            <div className="branch-row" key={branch.name}>
              <code>{branch.name}</code>
              {branch.default && <Badge>default</Badge>}
              <time>{branch.sha || branch.updated}</time>
            </div>
          ))}
          {!repoDetailsLoading && !repoDetailsError && repoDetails?.branches?.length === 0 && <RepoDataMessage title="No branches found" text="GitHub did not return any branches for this repository." />}
        </section>
      )}

      {activeTab === "Visual Map" && (
        <section className="repo-map-panel">
          {repoDetailsError && <RepoDataMessage title="Using limited map data" text={repoDetailsError} />}
          <CodebaseMapPanel
            owner={username}
            repo={repo}
            repoGraph={repoDetails}
            title="A visual map of this repository."
            description="Trace the main branch, active branches, forks, pull requests, and merge points before you open the file tree."
          />
        </section>
      )}

      {activeTab === "Settings" && (
        <section className="repo-settings-panel">
          <Card large>
            <h2>Repository settings</h2>
            <label>Rename repo<input defaultValue={repo} /></label>
            <label>Visibility<select defaultValue={data.private ? "private" : "public"}><option value="public">Public</option><option value="private">Private</option></select></label>
            <Button>Save changes</Button>
          </Card>
          <Card large>
            <h2>Danger zone</h2>
            <p>Delete repo requires typing <strong>{repo}</strong> to confirm.</p>
            <label>Confirmation<input placeholder={repo} /></label>
            <Button variant="soft">Delete repo</Button>
          </Card>
        </section>
      )}
    </div>
  );
}

function LearnPage() {
  useDocumentTitle("Learn");
  const isMobile = useIsMobile();
  const [active, setActive] = useState(lessons[0][0]);
  const lesson = lessons.find((item) => item[0] === active);
  const detail = lessonDetails[active] || lessonDetails.branching;
  return (
    <PageFrame title="Learn Git visually" eyebrow="Learn">
      {isMobile && (
        <select className="learn-mobile-select" value={active} onChange={(event) => setActive(event.target.value)} aria-label="Choose lesson">
          {lessons.map(([slug, title, level]) => (
            <option key={slug} value={slug}>{title} - {level}</option>
          ))}
        </select>
      )}
      <div className="learn-layout">
        <aside className="lesson-sidebar">
          {["New to Git", "Getting comfortable", "Going further"].map((track) => <h3 key={track}>{track}</h3>)}
          {lessons.map(([slug, title, level], index) => (
            <button key={slug} className={active === slug ? "active" : ""} onClick={() => setActive(slug)}>
              <span>{title}</span>{index > 2 && <Lock size={13} />}<Badge>{level}</Badge>
            </button>
          ))}
        </aside>
        <article className="lesson-content">
          <Badge>{lesson[2]}</Badge>
          <h2>{lesson[1]}</h2>
          <p>{lesson[3]}</p>
          <LessonIllustration slug={active} title={lesson[1]} description={detail.label} />
          <div className="steps">
            {detail.steps.map((step) => <Card key={step}><h3>{step}</h3><p>Each step connects the illustration to the command and the reason behind it.</p></Card>)}
          </div>
          <Button><Check size={16} />Mark as complete</Button>
        </article>
      </div>
    </PageFrame>
  );
}

function ExplorePage() {
  useDocumentTitle("Explore");
  return (
    <PageFrame title="Explore" eyebrow="Public discovery">
      <div className="filter-bar"><input placeholder="Search public repos and users" /><select><option>All languages</option><option>TypeScript</option><option>Python</option></select><select><option>Trending this week</option><option>Featured</option></select></div>
      <SectionTitle title="Featured repos" />
      <div className="repo-grid">{repos.map((repo) => <RepoCard key={repo.name} repo={repo} />)}</div>
      <SectionTitle title="Active public workspaces" />
      <div className="feature-grid">{["Shared workspace", "Project desk", "Learning path"].map((item) => <Card key={item}><DeskPreview compact /><h3>{item}</h3></Card>)}</div>
    </PageFrame>
  );
}

function Workspace({ compact = false, interactive = false }) {
  const [focus, setFocus] = useState(false);
  const [notes, setNotes] = useState([
    { id: 1, colour: "lavender", content: "Ship README Studio", x: 18, y: 22 },
    { id: 2, colour: "rose", content: "Review OAuth copy", x: 70, y: 18 },
    { id: 3, colour: "sage", content: "Lesson diagrams", x: 60, y: 64 }
  ]);
  const [todos, setTodos] = useState([
    { id: 1, content: "Sync GitHub repos", completed: true },
    { id: 2, content: "Draft public roadmap", completed: false },
    { id: 3, content: "Polish landing designer", completed: false }
  ]);
  const addNote = () => setNotes([...notes, { id: Date.now(), colour: "amber", content: "New idea", x: 34, y: 56 }]);
  return (
    <section className={compact ? "workspace compact" : "workspace"}>
      <div className="workspace-toolbar">
        <Button variant="soft" onClick={() => setFocus(!focus)}><Eye size={16} />Focus mode {focus ? "ON" : "OFF"}</Button>
        {interactive && <Button onClick={addNote}><Plus size={16} />Sticky note</Button>}
      </div>
      <div className={focus ? "desk focus-on" : "desk"}>
        <DeskIllustration />
        {notes.map((note) => (
          <textarea
            key={note.id}
            className={`sticky ${note.colour}`}
            value={note.content}
            style={{ left: `${note.x}%`, top: `${note.y}%` }}
            onChange={(event) => setNotes(notes.map((item) => item.id === note.id ? { ...item, content: event.target.value } : item))}
            onDoubleClick={() => window.location.assign("/repos")}
            readOnly={!interactive}
          />
        ))}
        <div className="todo-paper">
          <strong>To-do</strong>
          {todos.map((todo) => (
            <label key={todo.id}>
              <input type="checkbox" checked={todo.completed} onChange={() => setTodos(todos.map((item) => item.id === todo.id ? { ...item, completed: !item.completed } : item))} />
              {todo.content}
            </label>
          ))}
        </div>
        {focus && <div className="focus-message">Focus is on</div>}
      </div>
    </section>
  );
}

function DeskPreview() {
  return <div className="desk-preview"><DeskIllustration /></div>;
}

function DeskIllustration() {
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setDate(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const minute = date.getMinutes() * 6;
  const hour = (date.getHours() % 12) * 30 + date.getMinutes() / 2;
  return (
    <svg viewBox="0 0 900 520" role="img" aria-label="Pastel illustrated workspace desk">
      <rect x="18" y="18" width="864" height="484" rx="28" fill="#f4efe6" stroke="#e8e0d4" />
      <rect x="185" y="70" width="360" height="210" rx="20" fill="#fffdf9" stroke="#e8e0d4" />
      <rect x="215" y="100" width="300" height="150" rx="12" fill="#3d3530" opacity=".9" />
      <path d="M248 134h142M248 166h210M248 198h118M248 230h174" stroke="#c8d8c4" strokeWidth="9" strokeLinecap="round" />
      <rect x="292" y="288" width="150" height="16" rx="8" fill="#c4b8e8" />
      <rect x="214" y="326" width="316" height="82" rx="18" fill="#fffdf9" stroke="#e8e0d4" />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={236 + i * 22} y="348" width="14" height="12" rx="4" fill="#ddd5f0" />)}
      <rect x="615" y="92" width="76" height="86" rx="18" fill="#f5e4c4" stroke="#e8e0d4" />
      <path d="M690 116c42 0 42 42 0 42" fill="none" stroke="#e8e0d4" strokeWidth="10" />
      <path d="M640 70c-8-18 8-28 0-44M668 70c-8-18 8-28 0-44" stroke="#9c918c" strokeWidth="5" strokeLinecap="round" />
      <circle cx="748" cy="118" r="54" fill="#fffdf9" stroke="#e8e0d4" />
      <line x1="748" y1="118" x2="748" y2="84" stroke="#7a6dc4" strokeWidth="5" transform={`rotate(${minute} 748 118)`} />
      <line x1="748" y1="118" x2="748" y2="94" stroke="#3d3530" strokeWidth="6" transform={`rotate(${hour} 748 118)`} />
      <circle cx="748" cy="118" r="5" fill="#3d3530" />
      <rect x="650" y="325" width="92" height="88" rx="18" fill="#c8d8c4" stroke="#e8e0d4" />
      <path d="M696 325c-42-54-98-28-54 10M696 325c34-68 92-32 44 8" fill="#a8c4a2" />
      <rect x="640" y="410" width="116" height="26" rx="13" fill="#e8e0d4" />
      <circle cx="110" cy="104" r="11" fill="#d4848c" />
      <rect x="86" y="114" width="116" height="86" rx="10" fill="#f5d5d8" stroke="#e8e0d4" transform="rotate(-8 144 157)" />
      <circle cx="775" cy="322" r="11" fill="#7aaa72" />
      <rect x="733" y="334" width="112" height="82" rx="10" fill="#c8d8c4" stroke="#e8e0d4" transform="rotate(7 789 375)" />
    </svg>
  );
}

function RepoCard({ repo, actions = false }) {
  async function handleStarClick() {
    if (!supabase) return;
    const session = await getCurrentSession();
    if (!session?.user?.id) return;
    const { data: repository } = await supabase
      .from("repositories")
      .select("id, owner_id")
      .eq("name", repo.name)
      .maybeSingle();
    const { data: actor } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle();
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
    <Card>
      <div className="repo-card-head"><h3><Link to={`/${repo.owner}/${repo.name}`}>{repo.name}</Link></h3>{repo.private && <Lock size={15} />}</div>
      <p>{repo.description}</p>
      <div className="repo-meta"><LanguagePill language={repo.language} /><span><Star size={14} />{repo.stars}</span><span><GitFork size={14} />{repo.forks}</span><span>{repo.updated}</span></div>
      {actions && <div className="card-actions"><Button variant="soft"><Home size={15} />Pin</Button><Button variant="soft" onClick={handleStarClick}><Star size={15} />Star</Button><Button to={`/${repo.owner}/${repo.name}/readme`} variant="soft">README</Button><Button to={`/${repo.owner}/${repo.name}/landing`} variant="soft">Landing</Button><Button variant="soft"><Settings size={15} /></Button></div>}
    </Card>
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
      .select("id, owner_id")
      .eq("name", repo.name)
      .maybeSingle();
    const { data: actor } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle();
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
        <span>{repo.private ? "Private" : "Public"}</span>
      </div>
      <p>{repo.description}</p>
      <div className="phase-repo-meta">
        <LanguagePill language={repo.language} />
        <span><Star size={14} />{repo.stars}</span>
        <span>Updated {repo.updated}</span>
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
  return <span className="language-pill" style={{ backgroundColor: bg, color }}><span style={{ backgroundColor: color }} />{language}</span>;
}

function Avatar({ size = "normal", variant = currentUser.avatarStyle }) {
  const sizes = { tiny: 28, normal: 44, large: 112 };
  return <span className={`avatar ${size}`}><IllustratedAvatar size={sizes[size] || sizes.normal} variant={variant} /></span>;
}

function ProfileHeader({ editable = false, publicView = false, profileData = null, repoCount = currentUser.repos }) {
  const loadingStats = useInitialLoading();
  const displayName = profileData?.displayName || currentUser.name;
  const username = profileData?.username || currentUser.username;
  const avatarStyle = profileData?.avatarStyle || currentUser.avatarStyle;

  async function handleFollow() {
    if (!supabase) return;
    const session = await getCurrentSession();
    if (!session?.user?.id) return;
    const { data: followedUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", currentUser.username)
      .maybeSingle();
    const { data: actor } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle();
    if (!followedUser?.id || followedUser.id === session.user.id) return;
    await createNotification(supabase, {
      userId: followedUser.id,
      type: "follow",
      actorId: session.user.id,
      message: `${actor?.display_name || "Someone"} followed you`
    });
  }

  return (
    <section className="profile-header">
      <div className="cover" />
      <div className="profile-content">
        <Avatar size="large" variant={avatarStyle} />
        <div><h2>{displayName}</h2><p>@{username} - {currentUser.pronouns}</p><p>{currentUser.bio}</p><p>{currentUser.location} - {currentUser.website} - Joined {currentUser.joinDate}</p></div>
        <div className="profile-actions">{editable && <Button>Edit profile</Button>}{publicView && <Button onClick={handleFollow}>Follow</Button>}<Button variant="soft">Message</Button></div>
      </div>
      {loadingStats ? (
        <ProfileStatsSkeleton />
      ) : (
        <div className="stats profile-stats"><Stat value={repoCount} label="repos" /><Stat value={currentUser.followers} label="followers" /><Stat value={currentUser.following} label="following" /><Stat value={currentUser.stars} label="stars" /></div>
      )}
    </section>
  );
}

function ProjectLanding({ repo }) {
  return <section className="project-landing"><h2>{repo.name}</h2><p>{repo.description}</p><Button>Open project</Button></section>;
}

function PublishedLanding({ html }) {
  return (
    <section className="published-landing-frame" aria-label="Published landing page">
      <iframe title="Published landing page" srcDoc={html} sandbox="" />
    </section>
  );
}

function RepoToolbar({ repo }) {
  return (
    <div className="repo-toolbar">
      <p>{repo.description}</p>
      <LanguagePill language={repo.language} />
      <Button variant="soft"><Star size={16} />Star</Button>
      <Button variant="soft"><GitFork size={16} />Fork</Button>
      <select><option>main</option><option>studio-redesign</option></select>
      <code>git clone https://forallcode.dev/{repo.owner}/{repo.name}.git</code>
      <Button variant="soft"><Copy size={16} /></Button>
    </div>
  );
}

function FileTree() {
  return <aside className="file-tree">{["src", "src/components", "src/App.tsx", "README.md", "package.json", ".gitignore"].map((file) => <button key={file}><FileCode2 size={15} />{file}</button>)}</aside>;
}

function ReadmePreview({ repo = repos[0], markdown }) {
  const fallback = `# ${repo.name}\n\n${repo.description || "No README.md found for this repository."}`;
  return <MarkdownPreview markdown={markdown || fallback} />;
}

function MarkdownPreview({ markdown, className = "readme-render" }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />;
}

function FilePreview({ downloading, error, file, loading, onDownload, repo, repoReadme }) {
  if (loading) return <ReadmeSkeleton />;

  if (error) return <RepoDataMessage title="Could not open file" text={error} />;

  if (!file) return <ReadmePreview repo={repo} markdown={repoReadme} />;

  const isMarkdown = file.name?.toLowerCase().endsWith(".md") || file.path?.toLowerCase().endsWith(".md");

  return (
    <section className="file-preview-panel">
      <div className="file-preview-header">
        <div>
          <p className="eyebrow">Open file</p>
          <h2>{file.path}</h2>
          <span>{formatFileSize(file.size)}</span>
        </div>
        <Button variant="soft" onClick={onDownload}>
          <Download size={16} />{downloading ? "Downloading..." : "Download file"}
        </Button>
      </div>
      {isMarkdown ? (
        <MarkdownPreview markdown={file.content || `# ${file.name}\n\nThis file is empty.`} />
      ) : (
        <pre className="file-code-preview"><code>{file.content || "This file is empty or could not be previewed as text."}</code></pre>
      )}
    </section>
  );
}

function downloadBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatFileSize(size = 0) {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function RepoDataMessage({ title, text }) {
  return (
    <Card>
      <h3>{title}</h3>
      <p>{text}</p>
    </Card>
  );
}

function RepoListLoading() {
  return Array.from({ length: 4 }).map((_, index) => (
    <div className="commit-row" key={index}>
      <Skeleton className="skeleton-avatar" />
      <div>
        <Skeleton className="skeleton-text wide" />
        <Skeleton className="skeleton-text" />
      </div>
      <Skeleton className="skeleton-text" />
      <Skeleton className="skeleton-text" />
    </div>
  ));
}

function LessonIllustration({ slug, title, description }) {
  const diagrams = {
    branching: <BranchingArt />,
    merging: <MergingArt />,
    forking: <ForkingArt />,
    commits: <CommitsArt />,
    "pull-requests": <PullRequestArt />,
    rebasing: <RebasingArt />,
    conflicts: <ConflictsArt />,
    gitignore: <GitignoreArt />,
    stashing: <StashingArt />,
    "commit-messages": <CommitMessagesArt />,
    "open-source": <OpenSourceArt />,
    licences: <LicencesArt />
  };

  return (
    <figure className="git-diagram">
      <svg viewBox="0 0 760 300" role="img" aria-label={`${title} lesson illustration`}>
        <title>{title}</title>
        <desc>{description}</desc>
        <rect x="0" y="0" width="760" height="300" rx="28" fill="#f4efe6" />
        <circle cx="660" cy="58" r="58" fill="#ddd5f0" opacity="0.72" />
        <circle cx="92" cy="235" r="72" fill="#c8d8c4" opacity="0.55" />
        <path d="M60 252 C188 198 292 274 430 218 S620 206 704 142" stroke="#fffdf9" strokeWidth="26" fill="none" strokeLinecap="round" opacity="0.72" />
        {diagrams[slug] || diagrams.branching}
      </svg>
    </figure>
  );
}

function GitNode({ x, y, fill = "#fffdf9", stroke = "#7aaa72", label }) {
  return (
    <>
      <circle cx={x} cy={y} r="20" fill={fill} stroke={stroke} strokeWidth="7" />
      {label && <text x={x} y={y + 52} textAnchor="middle">{label}</text>}
    </>
  );
}

function BranchingArt() {
  return (
    <>
      <path d="M100 190 C240 190 326 190 660 190" stroke="#7aaa72" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M230 190 C292 92 418 92 506 190" stroke="#9b8fd4" strokeWidth="9" fill="none" strokeLinecap="round" />
      {[100, 230, 380, 530, 660].map((x) => <GitNode key={x} x={x} y={190} />)}
      {[326, 430].map((x) => <GitNode key={x} x={x} y={104} stroke="#9b8fd4" />)}
      <text x="98" y="244">main</text><text x="320" y="64">feature branch</text>
    </>
  );
}

function MergingArt() {
  return (
    <>
      <path d="M96 205 C220 205 354 205 640 205" stroke="#7aaa72" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M188 205 C284 100 420 100 532 205" stroke="#d4848c" strokeWidth="9" fill="none" strokeLinecap="round" />
      {[96, 188, 330, 532, 640].map((x) => <GitNode key={x} x={x} y={205} />)}
      {[286, 410].map((x) => <GitNode key={x} x={x} y={112} stroke="#d4848c" />)}
      <circle cx="532" cy="205" r="34" fill="none" stroke="#9b8fd4" strokeWidth="4" strokeDasharray="8 8" />
      <text x="490" y="258">merge commit</text>
    </>
  );
}

function ForkingArt() {
  return (
    <>
      <rect x="110" y="92" width="190" height="132" rx="22" fill="#fffdf9" stroke="#9b8fd4" strokeWidth="6" />
      <rect x="460" y="92" width="190" height="132" rx="22" fill="#fffdf9" stroke="#7aaa72" strokeWidth="6" />
      <path d="M300 158 C360 116 404 116 460 158" stroke="#6aa8d4" strokeWidth="8" fill="none" strokeLinecap="round" markerEnd="url(#forkArrow)" />
      <defs><marker id="forkArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0 0 L8 3 L0 6 Z" fill="#6aa8d4" /></marker></defs>
      <text x="205" y="142" textAnchor="middle">upstream</text><text x="555" y="142" textAnchor="middle">your fork</text>
      <path d="M156 184 h98 M506 184 h98" stroke="#e8e0d4" strokeWidth="10" strokeLinecap="round" />
    </>
  );
}

function CommitsArt() {
  return (
    <>
      <path d="M126 158 H650" stroke="#7aaa72" strokeWidth="9" strokeLinecap="round" />
      {[126, 238, 350, 462, 574, 650].map((x, index) => <GitNode key={x} x={x} y={158} stroke={index % 2 ? "#9b8fd4" : "#7aaa72"} label={`c${index + 1}`} />)}
      <rect x="245" y="70" width="270" height="54" rx="16" fill="#fffdf9" stroke="#e8e0d4" />
      <text x="380" y="104" textAnchor="middle">clear checkpoint</text>
    </>
  );
}

function PullRequestArt() {
  return (
    <>
      <rect x="116" y="72" width="528" height="156" rx="24" fill="#fffdf9" stroke="#e8e0d4" />
      <path d="M174 150 H370" stroke="#7aaa72" strokeWidth="9" strokeLinecap="round" />
      <path d="M390 150 H588" stroke="#9b8fd4" strokeWidth="9" strokeLinecap="round" />
      <GitNode x="174" y="150" /><GitNode x="370" y="150" /><GitNode x="588" y="150" stroke="#9b8fd4" />
      <path d="M398 106 h128 M398 132 h162" stroke="#d7cde8" strokeWidth="10" strokeLinecap="round" />
      <circle cx="176" cy="98" r="12" fill="#d4848c" /><text x="206" y="104">review</text>
    </>
  );
}

function RebasingArt() {
  return (
    <>
      <path d="M104 212 H640" stroke="#7aaa72" strokeWidth="9" strokeLinecap="round" />
      {[104, 240, 376, 512, 640].map((x) => <GitNode key={x} x={x} y={212} />)}
      <path d="M238 86 C318 46 416 46 520 86" stroke="#9b8fd4" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="2 16" />
      <path d="M238 118 C338 156 420 156 520 118" stroke="#9b8fd4" strokeWidth="8" fill="none" strokeLinecap="round" />
      <GitNode x={238} y={86} stroke="#9b8fd4" /><GitNode x={378} y={64} stroke="#9b8fd4" /><GitNode x={520} y={86} stroke="#9b8fd4" />
      <text x="340" y="132">replay commits</text>
    </>
  );
}

function ConflictsArt() {
  return (
    <>
      <rect x="190" y="58" width="380" height="190" rx="20" fill="#fffdf9" stroke="#e8e0d4" />
      <path d="M230 108 h190 M230 148 h120 M230 188 h190" stroke="#7aaa72" strokeWidth="10" strokeLinecap="round" />
      <path d="M230 128 h240 M230 168 h170" stroke="#d4848c" strokeWidth="10" strokeLinecap="round" />
      <text x="464" y="130">&lt;&lt;&lt;</text><text x="464" y="170">===</text><text x="464" y="210">&gt;&gt;&gt;</text>
      <circle cx="570" cy="86" r="26" fill="#f5d5d8" /><text x="570" y="94" textAnchor="middle">!</text>
    </>
  );
}

function GitignoreArt() {
  return (
    <>
      <rect x="140" y="72" width="260" height="160" rx="20" fill="#fffdf9" stroke="#e8e0d4" />
      {["node_modules/", ".env", "dist/", "*.log"].map((line, index) => <text key={line} x="178" y={118 + index * 30}>{line}</text>)}
      <path d="M484 84 L642 216" stroke="#d4848c" strokeWidth="14" strokeLinecap="round" />
      <path d="M642 84 L484 216" stroke="#d4848c" strokeWidth="14" strokeLinecap="round" />
      <text x="270" y="262" textAnchor="middle">ignored before commit</text>
    </>
  );
}

function StashingArt() {
  return (
    <>
      <path d="M126 206 H624" stroke="#7aaa72" strokeWidth="9" strokeLinecap="round" />
      {[126, 270, 414, 624].map((x) => <GitNode key={x} x={x} y={206} />)}
      <rect x="292" y="70" width="176" height="86" rx="18" fill="#fffdf9" stroke="#9b8fd4" strokeWidth="6" />
      <path d="M326 110 h108 M326 132 h82" stroke="#d7cde8" strokeWidth="9" strokeLinecap="round" />
      <path d="M380 158 V206" stroke="#9b8fd4" strokeWidth="8" strokeLinecap="round" strokeDasharray="8 10" />
      <text x="380" y="54" textAnchor="middle">stash shelf</text>
    </>
  );
}

function CommitMessagesArt() {
  return (
    <>
      <rect x="154" y="66" width="452" height="166" rx="22" fill="#fffdf9" stroke="#e8e0d4" />
      <path d="M200 112 h214" stroke="#3d3530" strokeWidth="12" strokeLinecap="round" />
      <path d="M200 150 h330 M200 182 h286" stroke="#9b8fd4" strokeWidth="10" strokeLinecap="round" opacity="0.75" />
      <circle cx="542" cy="112" r="28" fill="#c8d8c4" />
      <path d="M528 112 l10 10 l20-24" stroke="#7aaa72" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="380" y="264" textAnchor="middle">subject + context</text>
    </>
  );
}

function OpenSourceArt() {
  return (
    <>
      <circle cx="202" cy="126" r="44" fill="#fffdf9" stroke="#7aaa72" strokeWidth="7" />
      <circle cx="380" cy="176" r="44" fill="#fffdf9" stroke="#9b8fd4" strokeWidth="7" />
      <circle cx="558" cy="126" r="44" fill="#fffdf9" stroke="#d4848c" strokeWidth="7" />
      <path d="M242 140 C292 162 318 170 336 176 M424 176 C472 158 500 146 518 136" stroke="#6aa8d4" strokeWidth="8" fill="none" strokeLinecap="round" />
      <text x="202" y="132" textAnchor="middle">issue</text><text x="380" y="182" textAnchor="middle">PR</text><text x="558" y="132" textAnchor="middle">review</text>
      <text x="380" y="250" textAnchor="middle">collaborate in the open</text>
    </>
  );
}

function LicencesArt() {
  return (
    <>
      <rect x="244" y="52" width="272" height="198" rx="20" fill="#fffdf9" stroke="#e8e0d4" />
      <path d="M304 112 h152 M304 148 h118 M304 184 h152" stroke="#c8a055" strokeWidth="10" strokeLinecap="round" />
      <circle cx="288" cy="112" r="8" fill="#7aaa72" /><circle cx="288" cy="148" r="8" fill="#7aaa72" /><circle cx="288" cy="184" r="8" fill="#7aaa72" />
      <path d="M418 52 v58 h58" fill="#f5e4c4" stroke="#e8e0d4" />
      <text x="380" y="278" textAnchor="middle">permissions made visible</text>
    </>
  );
}

function Card({ children, large = false }) {
  return <article className={large ? "card large-card" : "card"}>{children}</article>;
}

function Button({ children, disabled = false, to, variant = "primary", full = false, onClick }) {
  const className = `button ${variant} ${full ? "full" : ""}`;
  return to ? <Link className={className} to={to}>{children}</Link> : <button className={className} disabled={disabled} onClick={onClick}>{children}</button>;
}

function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

function FeatureCard({ title, text, icon }) {
  return <Card><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p></Card>;
}

function Stat({ value, label }) {
  return <div className="stat"><strong>{value}</strong><span>{label}</span></div>;
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

function RepoFileTreeSkeleton() {
  return (
    <aside className="phase-file-tree repo-file-tree-skeleton" aria-label="Loading file tree">
      <Skeleton className="skeleton-input" />
      {Array.from({ length: 7 }).map((_, index) => <Skeleton className="skeleton-text wide" key={index} />)}
    </aside>
  );
}

function ReadmeSkeleton() {
  return (
    <div className="readme-render readme-render-skeleton" aria-label="Loading README">
      <Skeleton className="skeleton-heading" />
      <Skeleton lines={3} />
      <Skeleton className="skeleton-text medium" />
      <Skeleton lines={4} />
      <Skeleton className="skeleton-code" />
    </div>
  );
}

function ProfileStatsSkeleton() {
  return (
    <div className="stats profile-stats profile-stats-skeleton" aria-label="Loading profile stats">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="stat" key={index}>
          <Skeleton className="skeleton-stat-number" />
          <Skeleton className="skeleton-text short" />
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ title }) {
  return <div className="section-title"><h2>{title}</h2></div>;
}

function ActivityItem({ item, time }) {
  return <Card><div className="activity-item"><Sparkles size={18} /><span>{item}</span><time>{time}</time></div></Card>;
}

function ActivityCalendar() {
  return <Card><h3>Activity calendar</h3><div className="calendar-grid">{Array.from({ length: 35 }).map((_, index) => <span key={index} className={`level-${index % 5}`} />)}</div></Card>;
}

function RecentChanges({ repos: recentRepos = [] }) {
  return (
    <Card>
      <h3>Recent changes</h3>
      {recentRepos.map((repo) => <p key={repo.name}>{repo.name}: updated {repo.updated}</p>)}
      {recentRepos.length === 0 && <p>No GitHub repo changes synced yet.</p>}
    </Card>
  );
}

function Tabs({ tabs }) {
  const [active, setActive] = useState(tabs[0]);
  return <div><div className="tab-row">{tabs.map((tab) => <button className={active === tab ? "active" : ""} key={tab} onClick={() => setActive(tab)}>{tab}</button>)}</div><p>{active} view is ready for the MVP surface.</p></div>;
}

function Roadmap() {
  return <section className="roadmap">{["Foundation", "Core pages", "Profile + Workspace", "Signature features"].map((phase, index) => <Card key={phase}><Badge>Week {index + 1}</Badge><h3>{phase}</h3><p>{["Auth, routing, tokens, shared components.", "Landing, dashboard, repos, repo page, navigation.", "Illustrated desk, notes, todos, profile views.", "README Studio, Landing Designer, Learn centre."][index]}</p></Card>)}</section>;
}

function AvatarPicker() {
  return <div className="avatar-picker">{avatarVariants.map((style) => <button key={style} className={style} aria-label={`${style} avatar`}><IllustratedAvatar size={44} variant={style} /></button>)}</div>;
}

function PageFrame({ title, eyebrow, children }) {
  return <div className="page-frame">{(title || eyebrow) && <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>}{children}</div>;
}

function Footer() {
  return (
    <footer>
      <div className="footer-links">
        <Link to="/about">About</Link>
        <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
        <Link to="/settings/privacy">Privacy</Link>
        <Link to="/settings/danger">Terms</Link>
        <Link to="/explore">Status</Link>
      </div>
      <span className="copyright">forallcode2020 copyright</span>
    </footer>
  );
}

createRoot(document.getElementById("root")).render(<App />);
