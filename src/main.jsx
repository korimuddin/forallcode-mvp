import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
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
import { learnLessons, learnTracks } from "./data/learnLessons";
import { useAuthSession, useDocumentTitle, useIsMobile, useSignedInUserData } from "./lib/hooks";
import { renderMarkdown } from "./lib/markdownRenderer";
import { createNotification } from "./lib/notifications";
import { getUserPreference, setUserPreference } from "./lib/preferences";
import { createGitHubRepository, fetchGitHubFileContent, fetchGitHubRepoArchive, fetchGitHubRepoOverview, getCurrentSession, isSupabaseConfigured, saveRepoHeroToSupabase, signInWithGitHub, signInWithPassword, supabase, uploadProfileVisualImage, uploadRepoHeroImage } from "./lib/supabase";
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

const heroFontOptions = [
  { label: "Lora", value: '"Lora", serif' },
  { label: "DM Sans", value: '"DM Sans", sans-serif' },
  { label: "DM Mono", value: '"DM Mono", monospace' },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Palatino", value: "Palatino, serif" },
  { label: "Trebuchet", value: '"Trebuchet MS", sans-serif' },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Courier", value: '"Courier New", monospace' }
];

const repos = [];

const lessons = learnLessons;

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
      <Link className="entry-center-link" to="/home" aria-label="Enter ForAllCode" />
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
    <PageFrame>
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
  const navigate = useNavigate();
  const { profile } = useSignedInUserData();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [template, setTemplate] = useState("starter");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreateRepository() {
    setStatus("");
    setCreating(true);

    try {
      const session = await getCurrentSession();
      const createdRepo = await createGitHubRepository(session, {
        name,
        description,
        visibility,
        template
      });
      const owner = createdRepo.owner || profile?.username || "repo";
      navigate(`/${owner}/${createdRepo.name}`);
    } catch (error) {
      setStatus(error.message || "Could not create this repository.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageFrame title="Create a new repository" eyebrow="New repo">
      <section className="new-repo-layout">
        <div className="new-repo-form">
          <Card large>
            <h2>Repository details</h2>
            <label className="new-repo-field">
              <span>Repository name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="my-warm-project" />
            </label>
            <label className="new-repo-field">
              <span>Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A short, welcoming description for contributors." rows={4} />
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
            {status && <p className="repo-hero-toast" role="status">{status}</p>}
            <div className="button-row">
              <Button disabled={creating || !name.trim()} onClick={handleCreateRepository}>{creating ? "Creating..." : "Create repository"}</Button>
              <Button to="/repos" variant="soft">Cancel</Button>
            </div>
          </Card>
        </div>

        <CodebaseMapPanel owner={profile?.username || "origin"} repo={name || "new-repo"} />
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
  const [expandedFolders, setExpandedFolders] = useState(() => new Set());
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [downloadState, setDownloadState] = useState("");
  const [heroEditorOpen, setHeroEditorOpen] = useState(false);
  const [repoHero, setRepoHero] = useState({ title: "", image: "", positionX: 50, positionY: 50, fontFamily: heroFontOptions[0].value });
  const [heroDraft, setHeroDraft] = useState({ title: "", image: "", positionX: 50, positionY: 50, fontFamily: heroFontOptions[0].value });
  const [heroUploadState, setHeroUploadState] = useState("");
  const [heroToast, setHeroToast] = useState("");
  const heroPositionerRef = useRef(null);
  const cloneUrl = `https://github.com/${username}/${repo}.git`;

  useEffect(() => {
    const normalizedHero = normalizeRepoHero(repoToHero(data), repo);
    setRepoHero(normalizedHero);
    setHeroDraft(normalizedHero);
  }, [
    repo,
    data.heroImageUrl,
    data.heroPositionX,
    data.heroPositionY,
    data.heroTitle,
    data.heroFont
  ]);

  useEffect(() => {
    if (!heroToast) return undefined;
    const timer = window.setTimeout(() => setHeroToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [heroToast]);

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
          setExpandedFolders(new Set());
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

  function toggleRepoFolder(folder) {
    setExpandedFolders((current) => {
      const next = new Set(current);
      if (next.has(folder.path)) next.delete(folder.path);
      else next.add(folder.path);
      return next;
    });
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

  async function handleHeroImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setHeroUploadState("uploading");
    setHeroToast("");

    try {
      const session = await getCurrentSession();
      const imageBlob = await compressHeroImageToBlob(file);
      const image = await uploadRepoHeroImage(session, username, repo, imageBlob);
      const nextHero = {
        ...heroDraft,
        title: heroDraft.title || repo,
        image,
        positionX: heroDraft.positionX ?? 50,
        positionY: heroDraft.positionY ?? 50,
        fontFamily: heroDraft.fontFamily || heroFontOptions[0].value
      };
      await saveRepoHeroToSupabase(session, repo, nextHero);
      setHeroDraft(nextHero);
      setRepoHero(nextHero);
      setHeroToast("Hero image uploaded and saved.");
      setHeroUploadState("uploaded");
    } catch (error) {
      setHeroToast(error.message || "Choose a smaller image and try again.");
      setHeroUploadState("");
    } finally {
      event.target.value = "";
    }
  }

  function moveHeroImage(event) {
    if (event.type === "pointermove" && event.buttons !== 1) return;
    const bounds = heroPositionerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const positionX = clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100);
    const positionY = clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100);
    setHeroDraft((current) => ({ ...current, positionX, positionY }));
  }

  async function saveRepoHero() {
    const nextHero = {
      title: heroDraft.title || repo,
      image: heroDraft.image || "",
      positionX: heroDraft.positionX ?? 50,
      positionY: heroDraft.positionY ?? 50,
      fontFamily: heroDraft.fontFamily || heroFontOptions[0].value
    };

    try {
      setHeroUploadState("saving");
      const session = await getCurrentSession();
      await saveRepoHeroToSupabase(session, repo, nextHero);
      setRepoHero(nextHero);
      setHeroEditorOpen(false);
      setHeroToast("Hero saved.");
    } catch (error) {
      setHeroToast(error.message || "Could not save this hero.");
    } finally {
      setHeroUploadState("");
    }
  }

  function clearRepoHeroImage() {
    setHeroDraft((current) => ({ ...current, image: "", positionX: 50, positionY: 50 }));
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
      <section
        className={repoHero.image ? "phase-repo-header has-hero-image" : "phase-repo-header"}
        style={repoHero.image ? {
          backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .82) 0%, rgba(20, 16, 14, .66) 34%, rgba(20, 16, 14, .26) 68%, rgba(20, 16, 14, .12) 100%), url("${repoHero.image}")`,
          backgroundPosition: `${repoHero.positionX ?? 50}% ${repoHero.positionY ?? 50}%`
        } : undefined}
      >
        <div className="repo-hero-content">
          <div className="repo-breadcrumb"><Link to="/repos">{username}</Link><b>/</b><strong>{repo}</strong></div>
          <h1 style={{ fontFamily: repoHero.fontFamily || heroFontOptions[0].value }}>{repoHero.title || repo}</h1>
          <p>{data.description}</p>
          <div className="phase-repo-meta">
            <LanguagePill language={data.language} />
            <span><Star size={14} />{data.stars}</span>
            <span><GitFork size={14} />{data.forks}</span>
            <span>Updated {data.updated}</span>
          </div>
        </div>
        <div className="repo-header-actions">
          <div className="repo-primary-actions">
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
          <button className="repo-hero-edit-button" onClick={() => setHeroEditorOpen(true)}>
            <Palette size={16} />Edit hero
          </button>
        </div>
      </section>
      {heroEditorOpen && (
        <div className="repo-hero-modal-backdrop" onClick={() => setHeroEditorOpen(false)}>
          <div className="repo-hero-editor" role="dialog" aria-modal="true" aria-label="Edit repository hero" onClick={(event) => event.stopPropagation()}>
            <label>
              Overlay title
              <input value={heroDraft.title} onChange={(event) => setHeroDraft({ ...heroDraft, title: event.target.value })} placeholder={repo} />
            </label>
            <label>
              Title font
              <select value={heroDraft.fontFamily || heroFontOptions[0].value} onChange={(event) => setHeroDraft({ ...heroDraft, fontFamily: event.target.value })}>
                {heroFontOptions.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
              </select>
            </label>
            <label>
              Background image
              <input accept="image/*" type="file" onChange={handleHeroImageUpload} disabled={heroUploadState === "uploading" || heroUploadState === "saving"} />
            </label>
            {heroUploadState === "uploading" && <p className="repo-hero-upload-status">Compressing and uploading image...</p>}
            {heroToast && <p className="repo-hero-toast" role="status">{heroToast}</p>}
            {heroDraft.image && (
              <div className="repo-hero-position-field">
                <span>Hero image position</span>
                <div
                  className="repo-hero-positioner"
                  onPointerDown={moveHeroImage}
                  onPointerMove={moveHeroImage}
                  ref={heroPositionerRef}
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .82), rgba(20, 16, 14, .12)), url("${heroDraft.image}")`,
                    backgroundPosition: `${heroDraft.positionX ?? 50}% ${heroDraft.positionY ?? 50}%`
                  }}
                >
                  <strong style={{
                    fontFamily: heroDraft.fontFamily || heroFontOptions[0].value,
                    left: `${heroDraft.positionX ?? 50}%`,
                    top: `${heroDraft.positionY ?? 50}%`
                  }} />
                </div>
                <small>Drag inside the box to choose which part of the image appears in the hero banner.</small>
              </div>
            )}
            {heroDraft.image && <button className="text-button" onClick={clearRepoHeroImage}>Remove image</button>}
            <div className="repo-hero-editor-actions">
              <Button variant="soft" onClick={() => setHeroEditorOpen(false)} disabled={heroUploadState === "uploading" || heroUploadState === "saving"}>Cancel</Button>
              <Button onClick={saveRepoHero} disabled={heroUploadState === "uploading" || heroUploadState === "saving"}>
                {heroUploadState === "saving" ? "Saving..." : "Save hero"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
                {getVisibleRepoTree(repoDetails?.files || [], expandedFolders).map((item) => (
                  <button
                    className={[
                      selectedFile?.path === item.path ? "active" : "",
                      item.type === "folder" ? "folder-toggle" : ""
                    ].filter(Boolean).join(" ")}
                    key={item.path}
                    onClick={() => item.type === "folder" ? toggleRepoFolder(item) : openRepoFile(item)}
                    title={item.path}
                    style={{ paddingLeft: `${12 + item.indent * 18}px` }}
                  >
                    {item.type === "folder" && (
                      <ChevronDown className={expandedFolders.has(item.path) ? "folder-chevron open" : "folder-chevron"} size={13} />
                    )}
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
  const { session, checked } = useAuthSession();
  const [activeTrack, setActiveTrack] = useState("beginner");
  const [expandedTracks, setExpandedTracks] = useState(() => new Set(["beginner"]));
  const [active, setActive] = useState(lessons[0].slug);
  const [completedLessons, setCompletedLessons] = useState(() => new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingLeaving, setOnboardingLeaving] = useState(false);
  const [selectedComfort, setSelectedComfort] = useState("");
  const lesson = lessons.find((item) => item.slug === active) || lessons[0];
  const isFreeUser = true;

  useEffect(() => {
    let alive = true;

    async function loadLearnPreferences() {
      if (!checked) return;
      const fallback = typeof window !== "undefined" ? window.localStorage.getItem("learn_comfort_level") : "";

      if (!session?.user?.id || !supabase) {
        if (!alive) return;
        if (fallback) openRecommendedTrack(fallback);
        setShowOnboarding(!fallback);
        return;
      }

      const [{ data: profile }, { data: progress }] = await Promise.all([
        supabase.from("profiles").select("learn_comfort_level").eq("id", session.user.id).maybeSingle(),
        supabase.from("learn_progress").select("lesson_slug, completed").eq("user_id", session.user.id)
      ]);

      if (!alive) return;
      const comfort = profile?.learn_comfort_level || fallback;
      if (comfort) openRecommendedTrack(comfort);
      setShowOnboarding(!comfort);
      setCompletedLessons(new Set((progress || []).filter((item) => item.completed).map((item) => item.lesson_slug)));
    }

    loadLearnPreferences();
    return () => {
      alive = false;
    };
  }, [checked, session]);

  function openRecommendedTrack(trackId) {
    const track = learnTracks.find((item) => item.id === trackId) || learnTracks[0];
    const firstLesson = lessons.find((item) => item.track === track.track);
    setActiveTrack(track.id);
    setExpandedTracks(new Set([track.id]));
    if (firstLesson) setActive(firstLesson.slug);
  }

  async function chooseComfort(trackId) {
    setSelectedComfort(trackId);
    if (typeof window !== "undefined") window.localStorage.setItem("learn_comfort_level", trackId);

    if (session?.user?.id && supabase) {
      await supabase.from("profiles").update({ learn_comfort_level: trackId }).eq("id", session.user.id);
    }

    window.setTimeout(() => {
      setOnboardingLeaving(true);
      window.setTimeout(() => {
        openRecommendedTrack(trackId);
        setShowOnboarding(false);
        setOnboardingLeaving(false);
      }, 300);
    }, 400);
  }

  function toggleTrack(trackId) {
    setExpandedTracks((current) => {
      const next = new Set(current);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }

  function chooseLesson(slug) {
    const nextLesson = lessons.find((item) => item.slug === slug);
    if (nextLesson) {
      const track = learnTracks.find((item) => item.track === nextLesson.track);
      if (track) setActiveTrack(track.id);
    }
    setActive(slug);
  }

  async function markLessonComplete() {
    const next = new Set(completedLessons);
    next.add(lesson.slug);
    setCompletedLessons(next);

    if (session?.user?.id && supabase) {
      await supabase.from("learn_progress").upsert({
        user_id: session.user.id,
        lesson_slug: lesson.slug,
        completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: "user_id,lesson_slug" });
    }
  }

  if (showOnboarding) {
    return <LearnComfortCheck selected={selectedComfort} leaving={onboardingLeaving} onSelect={chooseComfort} />;
  }

  return (
    <PageFrame title="Learn Git visually" eyebrow="Learn">
      {isMobile && (
        <select className="learn-mobile-select" value={active} onChange={(event) => chooseLesson(event.target.value)} aria-label="Choose lesson">
          {lessons.map((item) => (
            <option key={item.slug} value={item.slug}>{item.title} - {item.tag}</option>
          ))}
        </select>
      )}
      <div className="learn-layout learn-library">
        <aside className="lesson-sidebar">
          {learnTracks.map((track) => {
            const trackLessons = lessons.filter((item) => item.track === track.track);
            const completed = trackLessons.filter((item) => completedLessons.has(item.slug)).length;
            const expanded = expandedTracks.has(track.id);
            return (
              <div className="learn-track-group" key={track.id}>
                <button className="learn-track-heading" onClick={() => toggleTrack(track.id)}>
                  <span>{track.subtitle}</span>
                  <ChevronDown className={expanded ? "open" : ""} size={14} />
                </button>
                {expanded && (
                  <>
                    <div className="learn-track-progress"><span style={{ width: `${trackLessons.length ? (completed / trackLessons.length) * 100 : 0}%`, background: track.color }} /></div>
                    {track.id === "advanced" && (
                      <>
                        {trackLessons.filter((item) => item.tag !== "devops").map((item) => (
                          <LessonSidebarButton active={active === item.slug} completed={completedLessons.has(item.slug)} freeLocked={isFreeUser && item.track > 1} key={item.slug} lesson={item} onClick={() => chooseLesson(item.slug)} />
                        ))}
                        <div className="devops-separator"><span>DevOps Track</span></div>
                        {trackLessons.filter((item) => item.tag === "devops").map((item) => (
                          <LessonSidebarButton active={active === item.slug} completed={completedLessons.has(item.slug)} freeLocked={isFreeUser} key={item.slug} lesson={item} onClick={() => chooseLesson(item.slug)} />
                        ))}
                      </>
                    )}
                    {track.id !== "advanced" && trackLessons.map((item) => (
                      <LessonSidebarButton active={active === item.slug} completed={completedLessons.has(item.slug)} freeLocked={isFreeUser && item.track > 1} key={item.slug} lesson={item} onClick={() => chooseLesson(item.slug)} />
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </aside>
        <article className="lesson-content">
          <LessonTag tag={lesson.tag} />
          <h2>{lesson.title}</h2>
          <p>{lesson.description}</p>
          <LessonIllustration lesson={lesson} />
          <div className="steps">
            {lesson.steps.map((step) => <Card key={step.title}><h3>{step.title}</h3><p>{step.body}</p></Card>)}
          </div>
          <Button onClick={markLessonComplete}><Check size={16} />{completedLessons.has(lesson.slug) ? "Completed" : "Mark as complete"}</Button>
        </article>
      </div>
    </PageFrame>
  );
}

function LearnComfortCheck({ selected, leaving, onSelect }) {
  const cards = [
    { id: "beginner", emoji: "🌱", title: "New to this", text: "I've heard of Git but haven't really used it, or I've only used it a little and things still feel unclear.", action: "Start with the basics →" },
    { id: "intermediate", emoji: "🌿", title: "Getting there", text: "I know the basics — commits, branches, push and pull. But I want to get more confident working with others.", action: "Jump to Intermediate →" },
    { id: "advanced", emoji: "🚀", title: "Pretty comfortable", text: "I use Git daily and work in teams. I want to go deeper — advanced workflows, DevOps, and shipping with confidence.", action: "Go to Advanced →" }
  ];

  return (
    <section className={leaving ? "learn-onboarding leaving" : "learn-onboarding"}>
      <p className="eyebrow">Learn Git visually</p>
      <h1>How comfortable are you <em>with Git right now?</em></h1>
      <p className="learn-onboarding-subtext">Be honest — there's no wrong answer. We'll start you in exactly the right place.</p>
      <div className="comfort-card-grid">
        {cards.map((card) => (
          <button className={`comfort-card ${card.id} ${selected === card.id ? "selected" : ""}`} key={card.id} onClick={() => onSelect(card.id)}>
            <span className="comfort-emoji">{card.emoji}</span>
            <strong>{card.title}</strong>
            <small>{card.text}</small>
            <b>{card.action}</b>
          </button>
        ))}
      </div>
      <p className="learn-reassurance">You can always switch tracks or go back to basics — these are suggestions, not locks.</p>
    </section>
  );
}

function LessonSidebarButton({ active, completed, freeLocked, lesson, onClick }) {
  return (
    <button className={active ? "active" : ""} onClick={onClick}>
      <i className={completed ? "lesson-dot complete" : "lesson-dot"} />
      <span>{lesson.title}</span>
      {freeLocked && <Lock size={13} />}
      <LessonTag tag={lesson.tag} compact />
    </button>
  );
}

function LessonTag({ tag, compact = false }) {
  return <span className={`lesson-tag ${tag} ${compact ? "compact" : ""}`}>{tag}</span>;
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
  const [workspaceUserId, setWorkspaceUserId] = useState("");
  const [readyToPersist, setReadyToPersist] = useState(false);
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
  const [defaultNoteColour, setDefaultNoteColour] = useState("amber");

  useEffect(() => {
    let alive = true;

    async function loadWorkspacePreferences() {
      const session = await getCurrentSession();
      const userId = session?.user?.id || "local";
      const workspacePrefs = getUserPreference(userId, "workspace", null);
      const deskPrefs = getUserPreference(userId, "workspace-desk", null);
      if (!alive) return;

      setWorkspaceUserId(userId);
      if (workspacePrefs) {
        setFocus(Boolean(workspacePrefs.focusMode));
        setDefaultNoteColour(workspacePrefs.defaultNoteColour || "amber");
      }
      if (deskPrefs) {
        setFocus(Boolean(deskPrefs.focus));
        setNotes(deskPrefs.notes || []);
        setTodos(deskPrefs.todos || []);
      }
      setReadyToPersist(true);
    }

    loadWorkspacePreferences();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!readyToPersist || !workspaceUserId || !interactive) return;
    setUserPreference(workspaceUserId, "workspace-desk", { focus, notes, todos });
  }, [focus, interactive, notes, readyToPersist, todos, workspaceUserId]);

  const addNote = () => setNotes([...notes, { id: Date.now(), colour: defaultNoteColour, content: "New idea", x: 34, y: 56 }]);
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
  const hero = normalizeRepoHero(repoToHero(repo), repo.name);

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
      {hero.image && (
        <div className="repo-card-hero" style={{
          backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .72), rgba(20, 16, 14, .2)), url("${hero.image}")`,
          backgroundPosition: `${hero.positionX ?? 50}% ${hero.positionY ?? 50}%`
        }}>
          <span style={{ fontFamily: hero.fontFamily || heroFontOptions[0].value }}>{hero.title || repo.name}</span>
        </div>
      )}
      <div className="repo-card-head"><h3><Link to={`/${repo.owner}/${repo.name}`}>{repo.name}</Link></h3>{repo.private && <Lock size={15} />}</div>
      <p>{repo.description}</p>
      <div className="repo-meta"><LanguagePill language={repo.language} /><span><Star size={14} />{repo.stars}</span><span><GitFork size={14} />{repo.forks}</span><span>{repo.updated}</span></div>
      {actions && <div className="card-actions"><Button variant="soft"><Home size={15} />Pin</Button><Button variant="soft" onClick={handleStarClick}><Star size={15} />Star</Button><Button to={`/${repo.owner}/${repo.name}/readme`} variant="soft">README</Button><Button to={`/${repo.owner}/${repo.name}/landing`} variant="soft">Landing</Button><Button variant="soft"><Settings size={15} /></Button></div>}
    </Card>
  );
}

function PhaseRepoCard({ repo }) {
  const navigate = useNavigate();
  const hero = normalizeRepoHero(repoToHero(repo), repo.name);

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
    <article
      className={hero.image ? "phase-repo-card has-repo-hero" : "phase-repo-card"}
      onClick={() => navigate(`/${repo.owner}/${repo.name}`)}
      style={hero.image ? {
        backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .86) 0%, rgba(20, 16, 14, .7) 38%, rgba(20, 16, 14, .32) 70%, rgba(20, 16, 14, .14) 100%), url("${hero.image}")`,
        backgroundPosition: `${hero.positionX ?? 50}% ${hero.positionY ?? 50}%`
      } : undefined}
    >
      <div className="phase-repo-title">
        <h3 style={{ fontFamily: hero.fontFamily || heroFontOptions[0].value }}>{hero.title || repo.name}</h3>
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
  return <span className="language-pill" style={{ backgroundColor: bg, color }}><span style={{ backgroundColor: color }} />{language}</span>;
}

function Avatar({ photoUrl = "", size = "normal", variant = currentUser.avatarStyle }) {
  const sizes = { tiny: 28, normal: 44, large: 112 };
  return <span className={`avatar ${size}`}><IllustratedAvatar photoUrl={photoUrl} size={sizes[size] || sizes.normal} variant={variant} /></span>;
}

function ProfileHeader({ editable = false, publicView = false, profileData = null, repoCount = currentUser.repos }) {
  const loadingStats = useInitialLoading();
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(() => profileDraftFromData(profileData));
  const [uploading, setUploading] = useState("");
  const [status, setStatus] = useState("");
  const coverPositionerRef = useRef(null);
  const displayName = profileData?.displayName || currentUser.name;
  const username = profileData?.username || currentUser.username;
  const avatarStyle = profileData?.avatarStyle || currentUser.avatarStyle;
  const avatarUrl = profileData?.avatarUrl || "";
  const coverGradient = profileData?.coverGradient || "linear-gradient(120deg, var(--lavender), var(--rose), var(--sage))";
  const coverImageUrl = profileData?.coverImageUrl || "";
  const coverPositionX = profileData?.coverPositionX ?? 50;
  const coverPositionY = profileData?.coverPositionY ?? 50;
  const pronouns = profileData?.pronouns || currentUser.pronouns;
  const bio = profileData?.bio || currentUser.bio;
  const location = profileData?.location || currentUser.location;
  const website = profileData?.website || currentUser.website;

  useEffect(() => {
    setDraft(profileDraftFromData(profileData));
  }, [profileData]);

  async function handleProfileImageUpload(event, kind) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(kind);
    setStatus("");

    try {
      const session = await getCurrentSession();
      const imageBlob = await compressHeroImageToBlob(file);
      const imageUrl = await uploadProfileVisualImage(session, kind, imageBlob);
      setDraft((current) => ({
        ...current,
        [kind === "avatar" ? "avatarUrl" : "coverImageUrl"]: imageUrl,
        coverPositionX: current.coverPositionX ?? 50,
        coverPositionY: current.coverPositionY ?? 50
      }));
      setStatus(`${kind === "avatar" ? "Profile picture" : "Cover image"} uploaded.`);
    } catch (error) {
      setStatus(error.message || "Could not upload this image.");
    } finally {
      setUploading("");
      event.target.value = "";
    }
  }

  function moveProfileCover(event) {
    if (event.type === "pointermove" && event.buttons !== 1) return;
    const bounds = coverPositionerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const positionX = clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100);
    const positionY = clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100);
    setDraft((current) => ({ ...current, coverPositionX: positionX, coverPositionY: positionY }));
  }

  async function saveProfileDraft() {
    setUploading("saving");
    setStatus("");

    try {
      const session = await getCurrentSession();
      if (!session?.user?.id || !supabase) throw new Error("Sign in before saving profile changes.");
      await supabase.from("profiles").update({
        display_name: draft.displayName,
        bio: draft.bio,
        pronouns: draft.pronouns,
        location: draft.location,
        website: draft.website,
        avatar_style: draft.avatarStyle,
        avatar_url: draft.avatarUrl,
        cover_gradient: draft.coverGradient,
        cover_image_url: draft.coverImageUrl,
        cover_position_x: draft.coverPositionX ?? 50,
        cover_position_y: draft.coverPositionY ?? 50
      }).eq("id", session.user.id);
      setUserPreference(session.user.id, "profile", {
        displayName: draft.displayName,
        bio: draft.bio,
        pronouns: draft.pronouns,
        location: draft.location,
        website: draft.website,
        avatarStyle: draft.avatarStyle,
        avatarUrl: draft.avatarUrl,
        coverGradient: draft.coverGradient,
        coverImageUrl: draft.coverImageUrl,
        coverPositionX: draft.coverPositionX,
        coverPositionY: draft.coverPositionY
      });
      setStatus("Profile saved.");
      setEditorOpen(false);
      window.location.reload();
    } catch (error) {
      setStatus(error.message || "Could not save your profile.");
    } finally {
      setUploading("");
    }
  }

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
      <div
        className={coverImageUrl ? "cover has-cover-image" : "cover"}
        style={coverImageUrl ? {
          backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .56), rgba(20, 16, 14, .08)), url("${coverImageUrl}")`,
          backgroundPosition: `${coverPositionX}% ${coverPositionY}%`
        } : { background: coverGradient }}
      />
      <div className="profile-content">
        <Avatar photoUrl={avatarUrl} size="large" variant={avatarStyle} />
        <div><h2>{displayName}</h2><p>@{username}{pronouns ? ` - ${pronouns}` : ""}</p><p>{bio}</p><p>{[location, website, `Joined ${currentUser.joinDate}`].filter(Boolean).join(" - ")}</p></div>
        <div className="profile-actions">{editable && <Button onClick={() => setEditorOpen(true)}>Edit profile</Button>}{publicView && <Button onClick={handleFollow}>Follow</Button>}<Button variant="soft">Message</Button></div>
      </div>
      {loadingStats ? (
        <ProfileStatsSkeleton />
      ) : (
        <div className="stats profile-stats"><Stat value={repoCount} label="repos" /><Stat value={currentUser.followers} label="followers" /><Stat value={currentUser.following} label="following" /><Stat value={currentUser.stars} label="stars" /></div>
      )}
      {editorOpen && (
        <div className="repo-hero-modal-backdrop" onClick={() => setEditorOpen(false)}>
          <div className="repo-hero-editor profile-editor-modal" role="dialog" aria-modal="true" aria-label="Edit profile" onClick={(event) => event.stopPropagation()}>
            <div className="profile-editor-preview">
              <div
                className="profile-editor-cover-preview"
                style={draft.coverImageUrl ? {
                  backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .56), rgba(20, 16, 14, .08)), url("${draft.coverImageUrl}")`,
                  backgroundPosition: `${draft.coverPositionX ?? 50}% ${draft.coverPositionY ?? 50}%`
                } : { background: draft.coverGradient }}
              />
              <Avatar photoUrl={draft.avatarUrl} size="large" variant={draft.avatarStyle} />
            </div>
            <div className="profile-editor-grid">
              <label>
                Display name
                <input value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} />
              </label>
              <label>
                Pronouns
                <input value={draft.pronouns} onChange={(event) => setDraft({ ...draft, pronouns: event.target.value })} placeholder="e.g. they/them" />
              </label>
            </div>
            <label>
              Bio
              <textarea value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} maxLength={160} />
            </label>
            <div className="profile-editor-grid">
              <label>
                Location
                <input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
              </label>
              <label>
                Website
                <input value={draft.website} onChange={(event) => setDraft({ ...draft, website: event.target.value })} />
              </label>
            </div>
            <label>
              Profile picture
              <input accept="image/*" type="file" onChange={(event) => handleProfileImageUpload(event, "avatar")} disabled={Boolean(uploading)} />
            </label>
            <div className="avatar-picker profile-avatar-picker">
              {avatarVariants.map((variant) => (
                <button className={draft.avatarStyle === variant ? "active" : ""} key={variant} onClick={() => setDraft({ ...draft, avatarStyle: variant })} type="button">
                  <IllustratedAvatar size={38} variant={variant} />
                </button>
              ))}
            </div>
            <label>
              Cover image
              <input accept="image/*" type="file" onChange={(event) => handleProfileImageUpload(event, "cover")} disabled={Boolean(uploading)} />
            </label>
            <div className="profile-cover-swatches">
              {profileCoverOptions.map((cover) => (
                <button className={draft.coverGradient === cover ? "active" : ""} key={cover} onClick={() => setDraft({ ...draft, coverGradient: cover, coverImageUrl: "" })} style={{ background: cover }} type="button" />
              ))}
            </div>
            {draft.coverImageUrl && (
              <div className="repo-hero-position-field">
                <span>Cover image position</span>
                <div
                  className="repo-hero-positioner"
                  onPointerDown={moveProfileCover}
                  onPointerMove={moveProfileCover}
                  ref={coverPositionerRef}
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .62), rgba(20, 16, 14, .1)), url("${draft.coverImageUrl}")`,
                    backgroundPosition: `${draft.coverPositionX ?? 50}% ${draft.coverPositionY ?? 50}%`
                  }}
                >
                  <strong style={{ left: `${draft.coverPositionX ?? 50}%`, top: `${draft.coverPositionY ?? 50}%` }} />
                </div>
              </div>
            )}
            {status && <p className="repo-hero-toast" role="status">{status}</p>}
            <div className="repo-hero-editor-actions">
              <Button variant="soft" onClick={() => setEditorOpen(false)} disabled={Boolean(uploading)}>Cancel</Button>
              <Button onClick={saveProfileDraft} disabled={Boolean(uploading)}>{uploading === "saving" ? "Saving..." : "Save profile"}</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function profileDraftFromData(profileData = {}) {
  return {
    displayName: profileData?.displayName || currentUser.name,
    pronouns: profileData?.pronouns || "",
    bio: profileData?.bio || "",
    location: profileData?.location || "",
    website: profileData?.website || "",
    avatarStyle: profileData?.avatarStyle || "sage",
    avatarUrl: profileData?.avatarUrl || "",
    coverGradient: profileData?.coverGradient || "linear-gradient(120deg, var(--lavender), var(--rose), var(--sage))",
    coverImageUrl: profileData?.coverImageUrl || "",
    coverPositionX: profileData?.coverPositionX ?? 50,
    coverPositionY: profileData?.coverPositionY ?? 50
  };
}

const profileCoverOptions = [
  "linear-gradient(120deg, var(--lavender), var(--rose), var(--sage))",
  "linear-gradient(120deg, var(--sky), var(--lavender), var(--white))",
  "linear-gradient(120deg, var(--sage), var(--amber), var(--white))",
  "linear-gradient(120deg, var(--rose), var(--amber), var(--lavender))",
  "linear-gradient(120deg, var(--cream3), var(--sky), var(--sage))",
  "linear-gradient(120deg, var(--ink2), var(--lavender3), var(--sky))"
];

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

function normalizeRepoHero(hero, repoName) {
  return {
    title: hero?.title || repoName || "",
    image: hero?.image || "",
    positionX: Number.isFinite(hero?.positionX) ? hero.positionX : 50,
    positionY: Number.isFinite(hero?.positionY) ? hero.positionY : 50,
    fontFamily: hero?.fontFamily || heroFontOptions[0].value
  };
}

function repoToHero(repo = {}) {
  return {
    title: repo.heroTitle || repo.name || "",
    image: repo.heroImageUrl || "",
    positionX: Number.isFinite(Number(repo.heroPositionX)) ? Number(repo.heroPositionX) : 50,
    positionY: Number.isFinite(Number(repo.heroPositionY)) ? Number(repo.heroPositionY) : 50,
    fontFamily: repo.heroFont || heroFontOptions[0].value
  };
}

function compressHeroImageToBlob(input, maxBytes = 900 * 1024, maxWidth = 1400) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(input);

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const qualities = [0.85, 0.75, 0.65, 0.55, 0.5];
      const widths = [maxWidth, 1200, 1000, 800];
      let widthIndex = 0;
      let qualityIndex = 0;

      const drawAtCurrentSize = () => {
        const scale = Math.min(1, widths[widthIndex] / image.width);
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      };

      const tryExport = () => {
        drawAtCurrentSize();
        const quality = qualities[qualityIndex];
        canvas.toBlob((blob) => {
          if (!blob) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Could not prepare this hero image."));
            return;
          }

          if (blob.size <= maxBytes) {
            URL.revokeObjectURL(objectUrl);
            resolve(blob);
            return;
          }

          qualityIndex += 1;
          if (qualityIndex >= qualities.length) {
            widthIndex += 1;
            qualityIndex = 0;
          }

          if (widthIndex >= widths.length) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("This image is still over 1MB after compression. Please choose a smaller image."));
            return;
          }

          tryExport();
        }, "image/jpeg", quality);
      };

      tryExport();
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not prepare this hero image."));
    };
    image.src = objectUrl;
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getVisibleRepoTree(files, expandedFolders) {
  return files.filter((item) => {
    const parts = item.path.split("/");
    if (parts.length === 1) return true;

    const parentPaths = parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join("/"));
    return parentPaths.every((path) => expandedFolders.has(path));
  });
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

function LessonIllustration({ lesson }) {
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
  const art = diagrams[lesson.slug] || <GeneratedLessonArt lesson={lesson} />;

  return (
    <figure className="git-diagram">
      <svg viewBox="0 0 760 300" role="img" aria-label={`${lesson.title} lesson illustration`}>
        <title>{lesson.title}</title>
        <desc>{lesson.description}</desc>
        <rect x="0" y="0" width="760" height="300" rx="28" fill="#f4efe6" />
        <circle cx="660" cy="58" r="58" fill="#ddd5f0" opacity="0.72" />
        <circle cx="92" cy="235" r="72" fill="#c8d8c4" opacity="0.55" />
        <path d="M60 252 C188 198 292 274 430 218 S620 206 704 142" stroke="#fffdf9" strokeWidth="26" fill="none" strokeLinecap="round" opacity="0.72" />
        {art}
      </svg>
    </figure>
  );
}

function GeneratedLessonArt({ lesson }) {
  const accent = lesson.tag === "devops" ? "#6aa8d4" : lesson.tag === "advanced" ? "#d4848c" : "#9b8fd4";
  const secondary = lesson.tag === "devops" ? "#cce0f0" : lesson.tag === "advanced" ? "#f5d5d8" : "#ddd5f0";
  const labels = lesson.steps.slice(0, 4).map((step) => step.title.split(" ").slice(0, 2).join(" "));

  if (lesson.tag === "devops") {
    return (
      <>
        <rect x="116" y="78" width="528" height="142" rx="24" fill="#fffdf9" stroke="#cce0f0" strokeWidth="6" />
        {labels.map((label, index) => {
          const x = 172 + index * 138;
          return (
            <g key={label}>
              {index > 0 && <path d={`M${x - 96} 150 H${x - 38}`} stroke="#6aa8d4" strokeWidth="8" strokeLinecap="round" />}
              <rect x={x - 36} y="118" width="72" height="64" rx="16" fill={index % 2 ? "#cce0f0" : "#fffdf9"} stroke="#6aa8d4" strokeWidth="5" />
              <text x={x} y="205" textAnchor="middle">{label}</text>
            </g>
          );
        })}
        <text x="380" y="64" textAnchor="middle">automated delivery pipeline</text>
      </>
    );
  }

  if (lesson.track === 3) {
    return (
      <>
        <path d="M114 206 H646" stroke="#d4848c" strokeWidth="9" strokeLinecap="round" />
        <path d="M180 206 C242 98 330 98 394 206" stroke="#9b8fd4" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M394 206 C446 110 536 110 606 206" stroke="#6aa8d4" strokeWidth="8" fill="none" strokeLinecap="round" />
        {[114, 246, 394, 526, 646].map((x, index) => <GitNode key={x} x={x} y={206} stroke={index % 2 ? accent : "#7aaa72"} label={index === 0 ? "base" : `a${index}`} />)}
        <rect x="246" y="62" width="268" height="60" rx="18" fill="#fffdf9" stroke={accent} strokeWidth="5" />
        <text x="380" y="99" textAnchor="middle">{labels[0] || lesson.title}</text>
      </>
    );
  }

  return (
    <>
      <rect x="116" y="70" width="528" height="162" rx="24" fill="#fffdf9" stroke="#e8e0d4" />
      <path d="M170 168 H590" stroke={accent} strokeWidth="9" strokeLinecap="round" />
      {labels.map((label, index) => {
        const x = 170 + index * 140;
        return (
          <g key={label}>
            <GitNode x={x} y={168} stroke={index % 2 ? "#7aaa72" : accent} />
            <rect x={x - 54} y="88" width="108" height="36" rx="12" fill={secondary} />
            <text x={x} y="112" textAnchor="middle">{label}</text>
          </g>
        );
      })}
      <text x="380" y="264" textAnchor="middle">practice with confidence</text>
    </>
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
