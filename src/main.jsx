import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileText,
  Folder,
  Grid3X3,
  Github,
  GitFork,
  Home,
  Lock,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";
import CommandPalette from "./components/layout/CommandPalette";
import TopNav from "./components/layout/TopNav";
import LockInOverlay from "./components/lockin/LockInOverlay";
import { AdminGuard } from "./components/admin/AdminGuard";
import FeedEvent from "./components/feed/FeedEvent";
import OnboardingFlow from "./components/onboarding/OnboardingFlow";
import AsciiArtGenerator from "./components/repo/ascii_art_generator";
import TopicEditor from "./components/repo/TopicEditor";
import TopicPills from "./components/repo/TopicPills";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import IllustratedAvatar, { avatarVariants } from "./components/ui/IllustratedAvatar";
import { LimitBanner } from "./components/ui/LimitBanner";
import Skeleton from "./components/ui/Skeleton";
import DeskIllustration from "./components/workspace/DeskIllustration";
import { learnLessons, learnTracks } from "./data/learnLessons";
import { applyAppearance, readAppearance } from "./lib/appearance";
import { useAuthSession, useDocumentTitle, useIsMobile, useSignedInUserData } from "./lib/hooks";
import { createFeedEvent } from "./lib/createFeedEvent";
import { renderMarkdown } from "./lib/markdownRenderer";
import { createNotification } from "./lib/notifications";
import { isAtLimit } from "./lib/plans";
import { getUserPreference, setUserPreference } from "./lib/preferences";
import { createGitHubRepository, fetchGitHubFileContent, fetchGitHubRepoArchive, fetchGitHubRepoOverview, forkGitHubRepository, getCurrentSession, isSupabaseConfigured, saveGitHubRepositoryFile, saveRepoHeroToSupabase, signInWithGitHub, signInWithPassword, supabase, uploadProfileVisualImage, uploadRepoHeroImage } from "./lib/supabase";
import { trackUsage } from "./lib/trackUsage";
import { LockInProvider, useLockIn } from "./lib/useLockIn";
import { useRepoAccess } from "./lib/useRepoAccess";
import { SubscriptionProvider, useSubscription } from "./lib/useSubscription";
import "./styles.css";
import "./styles/mobile.css";

const About = lazy(() => import("./pages/About"));
const AdminFeedback = lazy(() => import("./pages/AdminFeedback"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminCourseStats = lazy(() => import("./pages/admin/AdminCourseStats"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminDataUsage = lazy(() => import("./pages/admin/AdminDataUsage"));
const AdminMarketplace = lazy(() => import("./pages/admin/AdminMarketplace"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminPlaceholder = lazy(() => import("./pages/admin/AdminPlaceholder"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem"));
const AdminTraffic = lazy(() => import("./pages/admin/AdminTraffic"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const CertificateView = lazy(() => import("./pages/CertificateView"));
const CertificationAssessment = lazy(() => import("./pages/CertificationAssessment"));
const CertificationInfo = lazy(() => import("./pages/CertificationInfo"));
const CertificationResult = lazy(() => import("./pages/CertificationResult"));
const CLIAssessment = lazy(() => import("./pages/CLIAssessment"));
const CLICertInfo = lazy(() => import("./pages/CLICertInfo"));
const CLIResult = lazy(() => import("./pages/CLIResult"));
const CourseCreate = lazy(() => import("./pages/CourseCreate"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Explore = lazy(() => import("./pages/Explore"));
const GitTeamsAssessment = lazy(() => import("./pages/GitTeamsAssessment"));
const GitTeamsCertInfo = lazy(() => import("./pages/GitTeamsCertInfo"));
const GitTeamsResult = lazy(() => import("./pages/GitTeamsResult"));
const DiscussionDetail = lazy(() => import("./pages/DiscussionDetail"));
const DiscussionList = lazy(() => import("./pages/DiscussionList"));
const DiscussionNew = lazy(() => import("./pages/DiscussionNew"));
const GistDetail = lazy(() => import("./pages/GistDetail"));
const GistList = lazy(() => import("./pages/GistList"));
const GistNew = lazy(() => import("./pages/GistNew"));
const IssueList = lazy(() => import("./pages/IssueList"));
const LandingDesigner = lazy(() => import("./pages/LandingDesigner"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Notifications = lazy(() => import("./pages/Notifications"));
const OpenSourceAssessment = lazy(() => import("./pages/OpenSourceAssessment"));
const OpenSourceCertInfo = lazy(() => import("./pages/OpenSourceCertInfo"));
const OpenSourceResult = lazy(() => import("./pages/OpenSourceResult"));
const PRList = lazy(() => import("./pages/PRList"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const ProjectBoard = lazy(() => import("./pages/ProjectBoard"));
const ReadmeStudio = lazy(() => import("./pages/ReadmeStudio"));
const RepoInsights = lazy(() => import("./pages/RepoInsights"));
const RepoNew = lazy(() => import("./pages/RepoNew"));
const SearchPage = lazy(() => import("./pages/Search"));
const StarsPage = lazy(() => import("./pages/Stars"));
const SettingsAccount = lazy(() => import("./pages/settings/SettingsAccount"));
const SettingsAppearance = lazy(() => import("./pages/settings/SettingsAppearance"));
const SettingsDanger = lazy(() => import("./pages/settings/SettingsDanger"));
const SettingsDomains = lazy(() => import("./pages/settings/SettingsDomains"));
const SettingsIntegrations = lazy(() => import("./pages/settings/SettingsIntegrations"));
const SettingsLayout = lazy(() => import("./pages/settings/SettingsLayout"));
const SettingsNotifications = lazy(() => import("./pages/settings/SettingsNotifications"));
const SettingsPrivacy = lazy(() => import("./pages/settings/SettingsPrivacy"));
const SettingsProfile = lazy(() => import("./pages/settings/SettingsProfile"));
const SettingsWorkspace = lazy(() => import("./pages/settings/SettingsWorkspace"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const UpgradeSuccess = lazy(() => import("./pages/UpgradeSuccess"));

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

const notebookColorThemes = [
  {
    name: "Forest",
    colors: [
      { id: "forest-moss", label: "Moss", start: "#c8d8c4", end: "#7aaa72" },
      { id: "forest-pine", label: "Pine", start: "#a9c5a5", end: "#3f704d" },
      { id: "forest-fern", label: "Fern", start: "#d8e5c8", end: "#84a95b" },
      { id: "forest-bark", label: "Bark", start: "#c8b49a", end: "#74614f" },
      { id: "forest-canopy", label: "Canopy", start: "#b7d7bf", end: "#2f6f5e" }
    ]
  },
  {
    name: "Beach",
    colors: [
      { id: "beach-sand", label: "Sand", start: "#f5e4c4", end: "#d2a85f" },
      { id: "beach-coral", label: "Coral", start: "#f5d5d8", end: "#d98a8e" },
      { id: "beach-tide", label: "Tide", start: "#cce0f0", end: "#6aa8c8" },
      { id: "beach-shell", label: "Shell", start: "#fff1df", end: "#e3b78a" },
      { id: "beach-seafoam", label: "Seafoam", start: "#d8eee6", end: "#7abda7" }
    ]
  },
  {
    name: "Urban",
    colors: [
      { id: "urban-stone", label: "Stone", start: "#ddd8d2", end: "#8d8580" },
      { id: "urban-brick", label: "Brick", start: "#e8c3b4", end: "#9b5b4a" },
      { id: "urban-graphite", label: "Graphite", start: "#b9b4ae", end: "#4d4742" },
      { id: "urban-neon", label: "Neon", start: "#ddd5f0", end: "#9b8fd4" },
      { id: "urban-concrete", label: "Concrete", start: "#e8e0d4", end: "#a99d93" }
    ]
  },
  {
    name: "Night",
    colors: [
      { id: "night-indigo", label: "Indigo", start: "#b9c2e6", end: "#465089" },
      { id: "night-plum", label: "Plum", start: "#d4bfd8", end: "#744d7a" },
      { id: "night-moon", label: "Moon", start: "#ddd5f0", end: "#8074bd" },
      { id: "night-slate", label: "Slate", start: "#adb6c7", end: "#364157" },
      { id: "night-ember", label: "Ember", start: "#e5b3a5", end: "#8a4637" }
    ]
  },
  {
    name: "Morning",
    colors: [
      { id: "morning-sunrise", label: "Sunrise", start: "#f5d5d8", end: "#d88c9a" },
      { id: "morning-honey", label: "Honey", start: "#f5e4c4", end: "#c8a055" },
      { id: "morning-lilac", label: "Lilac", start: "#ddd5f0", end: "#9b8fd4" },
      { id: "morning-mint", label: "Mint", start: "#dcebd4", end: "#92b985" },
      { id: "morning-peach", label: "Peach", start: "#ffe0cc", end: "#d99a71" }
    ]
  },
  {
    name: "Arctic",
    colors: [
      { id: "arctic-frost", label: "Frost", start: "#e7f0f7", end: "#a9cce3" },
      { id: "arctic-glacier", label: "Glacier", start: "#cce0f0", end: "#5d93b8" },
      { id: "arctic-ice", label: "Ice", start: "#eef7f6", end: "#9ccbc6" },
      { id: "arctic-aurora", label: "Aurora", start: "#d6e8d8", end: "#7aaa72" },
      { id: "arctic-violet", label: "Violet", start: "#e2dcf5", end: "#9b8fd4" }
    ]
  }
];

const defaultNotebookColor = notebookColorThemes[0].colors[0];

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
      <SubscriptionProvider>
        <LockInProvider>
          <BrowserRouter>
            <AppearanceRuntime />
            <AppRoutes />
          </BrowserRouter>
        </LockInProvider>
      </SubscriptionProvider>
    </ErrorBoundary>
  );
}

function AppearanceRuntime() {
  useEffect(() => {
    const applyStored = () => applyAppearance(readAppearance());
    applyStored();
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener?.("change", applyStored);
    window.addEventListener("storage", applyStored);
    return () => {
      media?.removeEventListener?.("change", applyStored);
      window.removeEventListener("storage", applyStored);
    };
  }, []);

  return null;
}

function AppRoutes() {
  const location = useLocation();
  const isEntryPage = location.pathname === "/";
  const isPortfolioPage = /^\/[^/]+\/portfolio\/?$/.test(location.pathname);
  const isCertificatePage = /^\/certificates\/[^/]+\/?$/.test(location.pathname);
  const { session, checked } = useAuthSession();
  const { completionMessage, isActive } = useLockIn();

  useEffect(() => {
    if (!checked || isEntryPage) return;
    trackUsage(session?.user?.id, "page_view", {
      path: location.pathname,
      referrer: document.referrer || "",
      user_agent: navigator.userAgent || ""
    }).catch(() => {});
  }, [checked, isEntryPage, location.pathname, session?.user?.id]);

  return (
    <>
      {isActive && <LockInOverlay />}
      {completionMessage && <div className="lockin-toast" role="status">{completionMessage}</div>}
      {!isEntryPage && !isPortfolioPage && !isCertificatePage && <CommandPalette />}
      <div className={isEntryPage ? "app-shell entry-shell" : isPortfolioPage ? "app-shell portfolio-shell" : isCertificatePage ? "app-shell certificate-shell" : "app-shell"}>
        {!isEntryPage && !isPortfolioPage && !isCertificatePage && <TopNav />}
        {!isEntryPage && !isPortfolioPage && !isCertificatePage && <ImpersonationBanner />}
        <main>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<EntryPage />} />
              <Route path="/home" element={<LandingPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/learn/:lessonSlug" element={<LearnPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/profile" element={<MyProfilePage />} />
              <Route path="/repos" element={<ReposPage />} />
              <Route path="/repos/new" element={<RepoNew />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/stars" element={<StarsPage />} />
              <Route path="/gists" element={<GistList />} />
              <Route path="/gists/new" element={<GistNew />} />
              <Route path="/gists/:id" element={<GistDetail />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/upgrade/success" element={<UpgradeSuccess />} />
              <Route path="/certification/git-fundamentals" element={<CertificationInfo />} />
              <Route path="/certification/git-fundamentals/assessment" element={<CertificationAssessment />} />
              <Route path="/certification/git-fundamentals/result" element={<CertificationResult />} />
              <Route path="/certification/git-for-teams" element={<GitTeamsCertInfo />} />
              <Route path="/certification/git-for-teams/assessment" element={<GitTeamsAssessment />} />
              <Route path="/certification/git-for-teams/result" element={<GitTeamsResult />} />
              <Route path="/certification/command-line-essentials" element={<CLICertInfo />} />
              <Route path="/certification/command-line-essentials/assessment" element={<CLIAssessment />} />
              <Route path="/certification/command-line-essentials/result" element={<CLIResult />} />
              <Route path="/certification/open-source-contributor" element={<OpenSourceCertInfo />} />
              <Route path="/certification/open-source-contributor/assessment" element={<OpenSourceAssessment />} />
              <Route path="/certification/open-source-contributor/result" element={<OpenSourceResult />} />
              <Route path="/certificates/:verificationCode" element={<CertificateView />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/create" element={<CourseCreate />} />
              <Route path="/marketplace/:slug" element={<CourseDetail />} />
              <Route
                path="/admin"
                element={(
                  <AdminGuard>
                    <AdminLayout />
                  </AdminGuard>
                )}
              >
                <Route index element={<Navigate to="/admin/overview" replace />} />
                <Route path="overview" element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="courses" element={<AdminCourseStats />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="data" element={<AdminDataUsage />} />
                <Route path="traffic" element={<AdminTraffic />} />
                <Route path="subscriptions" element={<AdminSubscriptions />} />
                <Route path="marketplace" element={<AdminMarketplace />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="system" element={<AdminSystem />} />
                <Route path="feedback" element={<AdminFeedback />} />
              </Route>
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="/settings/account" replace />} />
                <Route path="account" element={<SettingsAccount />} />
                <Route path="profile" element={<SettingsProfile />} />
                <Route path="workspace" element={<SettingsWorkspace />} />
                <Route path="appearance" element={<SettingsAppearance />} />
                <Route path="notifications" element={<SettingsNotifications />} />
                <Route path="integrations" element={<SettingsIntegrations />} />
                <Route path="domains" element={<SettingsDomains />} />
                <Route path="privacy" element={<SettingsPrivacy />} />
                <Route path="danger" element={<SettingsDanger />} />
              </Route>
              <Route path="/:username/:repo/issues" element={<IssueList />} />
              <Route path="/:username/:repo/pulls" element={<PRList />} />
              <Route path="/:username/:repo/discussions/new" element={<DiscussionNew />} />
              <Route path="/:username/:repo/discussions/:number" element={<DiscussionDetail />} />
              <Route path="/:username/:repo/discussions" element={<DiscussionList />} />
              <Route path="/:username/:repo/projects" element={<ProjectBoard />} />
              <Route path="/:username/:repo/insights" element={<RepoInsights />} />
              <Route path="/:username/:repo/readme" element={<ReadmeStudio />} />
              <Route path="/:username/:repo/landing" element={<LandingDesigner />} />
              <Route path="/:username/:repo" element={<RepoPage />} />
              <Route path="/:username/portfolio" element={<Portfolio />} />
              <Route path="/:username" element={<PublicProfile />} />
            </Routes>
          </Suspense>
        </main>
        {!isEntryPage && !isPortfolioPage && !isCertificatePage && <Footer />}
      </div>
    </>
  );
}

function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState(() => (
    typeof window !== "undefined"
      ? {
          id: window.sessionStorage.getItem("impersonating_user_id"),
          username: window.sessionStorage.getItem("impersonating_username")
        }
      : { id: "", username: "" }
  ));

  if (!impersonating.id) return null;

  function exitImpersonation() {
    window.sessionStorage.removeItem("impersonating_user_id");
    window.sessionStorage.removeItem("impersonating_username");
    setImpersonating({ id: "", username: "" });
    window.location.href = "/admin/users";
  }

  return (
    <div className="impersonation-banner">
      <span>Impersonating @{impersonating.username || "user"}</span>
      <button onClick={exitImpersonation} type="button">Exit impersonation</button>
    </div>
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
      {profile?.username && <ProfilePortfolioActions username={profile.username} editable />}
      <Workspace compact />
      <div className="two-column">
        <PaginatedProfileRepos
          actions
          emptyText="Sign in with GitHub repo access to fill this profile with your repositories."
          emptyTitle="No synced repos yet"
          loading={loading}
          repos={visibleRepos}
        />
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
      <ProfilePortfolioActions username={username} editable={isOwnProfile} />
      <SectionTitle title="Repositories" />
      <PaginatedProfileRepos
        emptyText="Public repositories will appear here once they are synced."
        emptyTitle="No public GitHub repos yet"
        repos={profileRepos.map((repo) => ({ ...repo, owner: repo.owner || username }))}
      />
      <div className="two-column">
        <Card><h3>Public activity</h3>{activity.map((item) => <p key={item.id}>{item.name} {item.action}</p>)}{activity.length === 0 && <p>No public GitHub activity synced yet.</p>}</Card>
        <Card><h3>Skills and badges</h3><div className="tag-row">{["Git mentoring", "TypeScript", "Design systems", "Open source guide"].map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></Card>
      </div>
    </PageFrame>
  );
}

function ProfilePortfolioActions({ editable = false, username }) {
  if (!username) return null;
  return (
    <div className="profile-portfolio-actions" role="navigation" aria-label="Profile views">
      <Link className="profile-portfolio-tab" to={`/${username}/portfolio`}>Portfolio</Link>
      {editable && <Link className="button soft" to={`/${username}/portfolio?edit=1`}>Edit portfolio</Link>}
    </div>
  );
}

function PaginatedProfileRepos({ actions = false, emptyText, emptyTitle, loading = false, repos = [] }) {
  const [page, setPage] = useState(1);
  const reposPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(repos.length / reposPerPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * reposPerPage;
  const visibleRepos = repos.slice(start, start + reposPerPage);
  const pageItems = getPaginationItems(currentPage, totalPages);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (loading) {
    return (
      <section>
        <RepoListSkeleton />
      </section>
    );
  }

  return (
    <section className="profile-repos-section">
      {visibleRepos.length > 0 ? (
        <div className="profile-repo-list">
          {visibleRepos.map((repo) => <RepoCard key={`${repo.owner}-${repo.name}`} repo={repo} actions={actions} />)}
        </div>
      ) : (
        <Card><h3>{emptyTitle}</h3><p>{emptyText}</p></Card>
      )}
      {repos.length > reposPerPage && (
        <nav className="profile-pagination" aria-label="Repository pages">
          <button
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            type="button"
          >
            &larr;
          </button>
          {pageItems.map((item, index) => item === "ellipsis" ? (
            <span className="profile-pagination-ellipsis" key={`ellipsis-${index}`}>...</span>
          ) : (
            <button
              aria-current={item === currentPage ? "page" : undefined}
              className={item === currentPage ? "active" : ""}
              key={item}
              onClick={() => setPage(item)}
              type="button"
            >
              {item}
            </button>
          ))}
          <button
            aria-label="Next page"
            disabled={currentPage === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            type="button"
          >
            &rarr;
          </button>
        </nav>
      )}
    </section>
  );
}

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sorted = [...pages]
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b);
  const items = [];

  sorted.forEach((item, index) => {
    const previous = sorted[index - 1];
    if (previous && item - previous > 1) items.push("ellipsis");
    items.push(item);
  });

  return items;
}

function ReposPage() {
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
    <PageFrame title="" eyebrow="">
      <CarouselHero slides={repoHeroSlides} type="repos" />
      <div className="repos-page-header">
        <h1>Repositories</h1>
        <div className="repos-header-actions">
          <Button variant="soft"><Github size={16} />Import from GitHub</Button>
          <div className="new-repo-action-stack">
            <Button to="/repos/new"><Plus size={16} />New repository</Button>
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
        <div className="repo-empty-state">
          <Github size={54} />
          <h2>Could not load GitHub repositories</h2>
          <p>{error}</p>
          <Button variant="soft" onClick={() => window.location.reload()}>Try again</Button>
        </div>
      ) : filtered.length > 0 ? (
        <div className={`phase-repo-list ${layout}`}>{filtered.map((repo) => <PhaseRepoCard key={repo.name} repo={repo} />)}</div>
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
  const { planId } = useSubscription();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [template, setTemplate] = useState("starter");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [privateRepoCount, setPrivateRepoCount] = useState(0);
  const privateRepoLimitReached = isAtLimit(planId, "privateRepos", privateRepoCount);
  const privateRepoAtLimit = visibility === "private" && privateRepoLimitReached;

  useEffect(() => {
    let alive = true;

    async function loadPrivateRepoCount() {
      const session = await getCurrentSession();
      if (!supabase || !session?.user?.id) return;
      const { count } = await supabase
        .from("repositories")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", session.user.id)
        .eq("is_private", true);
      if (alive) setPrivateRepoCount(count || 0);
    }

    loadPrivateRepoCount();
    return () => {
      alive = false;
    };
  }, []);

  async function handleCreateRepository() {
    setStatus("");

    if (visibility === "private" && isAtLimit(planId, "privateRepos", privateRepoCount)) {
      setStatus("You've reached the free private repo limit. Upgrade to Pro for unlimited private repositories.");
      return;
    }

    setCreating(true);

    try {
      const session = await getCurrentSession();
      const createdRepo = await createGitHubRepository(session, {
        name,
        description,
        visibility,
        template
      });
      if (visibility === "private") {
        trackUsage(session?.user?.id, "private_repo_created", { repo_name: createdRepo.name || name }).catch(() => {});
      }
      if (visibility !== "private" && session?.user?.id && supabase) {
        const { data: storedRepo } = await supabase
          .from("repositories")
          .select("id")
          .eq("owner_id", session.user.id)
          .eq("name", createdRepo.name || name)
          .maybeSingle();
        createFeedEvent(supabase, {
          actorId: session.user.id,
          eventType: "repo_created",
          repoId: storedRepo?.id || null,
          metadata: { repo_name: createdRepo.name || name }
        }).catch(() => {});
      }
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
                <button
                  className={visibility === value ? "active" : ""}
                  disabled={value === "private" && privateRepoLimitReached}
                  key={value}
                  onClick={() => setVisibility(value)}
                  type="button"
                >
                  <strong>{title}</strong>
                  <small>{text}</small>
                </button>
              ))}
            </div>
            <LimitBanner limitKey="privateRepos" currentCount={privateRepoCount} />
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
              <Button disabled={creating || !name.trim() || privateRepoAtLimit} onClick={handleCreateRepository}>{creating ? "Creating..." : "Create repository"}</Button>
              <Button to="/repos" variant="soft">Cancel</Button>
            </div>
          </Card>
        </div>

        <CodebaseMapPanel owner={profile?.username || "origin"} repo={name || "new-repo"} />
      </section>
    </PageFrame>
  );
}

const learnHeroSlides = [
  {
    eyebrow: "Did you know?",
    title: ".gitignore has been part of Git since the beginning.",
    text: "Git began on April 7, 2005, and ignore rules were designed early to help teams keep untracked local files out of shared history.",
    tone: "lavender",
    visual: "gitignore"
  },
  {
    eyebrow: "Live learning",
    title: "4k users are learning right now.",
    text: "Tiny daily Git lessons add up. Pick a topic, complete a visual step, and keep your project moving.",
    tone: "sage",
    visual: "stats"
  },
  {
    eyebrow: "More info",
    title: "Git becomes clearer when you can see the shape of the work.",
    text: "Branches, merges, conflicts, releases, and remotes all become easier once the history is visible.",
    tone: "amber",
    visual: "branches"
  },
  {
    eyebrow: "Course nudge",
    title: "Have you considered DevOps?",
    text: "Take a look at the DevOps track to understand CI/CD, environments, deployment strategies, and observability.",
    tone: "sky",
    visual: "devops"
  },
  {
    eyebrow: "Next step",
    title: "Start where you are. Move when ready.",
    text: "Beginner, Intermediate, Advanced, and DevOps tracks are suggestions, not locks.",
    tone: "rose",
    visual: "tracks"
  }
];

function buildRepoHeroSlides(reposForHero) {
  const repoSlides = reposForHero.slice(0, 3).map((repo) => ({
    eyebrow: "Your repository",
    title: repo.name,
    text: repo.description || "A synced GitHub repository ready to explore visually.",
    meta: `${repo.language || "Code"} · ${repo.stars || 0} stars · Updated ${repo.updated || "recently"}`,
    image: repo.heroImageUrl,
    imagePosition: `${repo.heroPositionX ?? 50}% ${repo.heroPositionY ?? 50}%`,
    tone: "repo"
  }));

  const fallbackRepoSlides = [
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
      eyebrow: "Visual workspace",
      title: "See the project before you open a single file.",
      text: "Branches, forks, merges, and pull requests all have a shape. ForAllCode helps you read it.",
      tone: "sky"
    }
  ];

  return [
    ...repoSlides,
    ...fallbackRepoSlides
  ].slice(0, 3).concat([
    {
      eyebrow: "Repository momentum",
      title: "Code is easier to join when it welcomes people in.",
      text: "Use project pages, README Studio, and visual maps to turn your repos into friendly workspaces.",
      tone: "amber"
    },
    {
      eyebrow: "Placeholder",
      title: "Your next project can start right here.",
      text: "Create a repo, pick a starter, and let the project take shape.",
      tone: "computer",
      visual: "computer"
    }
  ]);
}

function CarouselHero({ slides, type }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex] || slides[0];

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [type, slides.length]);

  if (!activeSlide) return null;

  return (
    <section
      className={`carousel-hero ${type || ""} tone-${activeSlide.tone || "lavender"} ${activeSlide.image ? "has-image" : ""}`}
      style={activeSlide.image ? {
        backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .78), rgba(20, 16, 14, .24)), url("${activeSlide.image}")`,
        backgroundPosition: activeSlide.imagePosition || "50% 50%"
      } : undefined}
    >
      <div className="carousel-hero-copy">
        <p className="eyebrow">{activeSlide.eyebrow}</p>
        <h1>{activeSlide.title}</h1>
        <p>{activeSlide.text}</p>
        {activeSlide.meta && <span>{activeSlide.meta}</span>}
      </div>
      {type === "learn" && activeSlide.visual && <LearnHeroVisual kind={activeSlide.visual} />}
      {activeSlide.visual === "computer" && <AnimatedComputer />}
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

function LearnHeroVisual({ kind }) {
  if (kind === "stats") {
    return (
      <div className="learn-hero-visual visual-stats" aria-hidden="true">
        <div className="visual-card">
          <strong>4k</strong>
          <span>learning now</span>
        </div>
        <i className="pulse one" />
        <i className="pulse two" />
        <i className="pulse three" />
      </div>
    );
  }

  if (kind === "branches") {
    return (
      <div className="learn-hero-visual visual-branches" aria-hidden="true">
        <svg viewBox="0 0 260 200" role="img">
          <path d="M48 158 C84 122 90 78 130 78 C170 78 174 124 214 46" />
          <path d="M48 158 C94 158 112 146 148 132 C178 120 192 132 220 156" />
          <circle cx="48" cy="158" r="13" />
          <circle cx="130" cy="78" r="13" />
          <circle cx="214" cy="46" r="13" />
          <circle cx="220" cy="156" r="13" />
        </svg>
      </div>
    );
  }

  if (kind === "devops") {
    return (
      <div className="learn-hero-visual visual-devops" aria-hidden="true">
        <div className="deploy-ring">
          <span>CI</span>
          <span>Test</span>
          <span>Ship</span>
        </div>
        <div className="rocket-trail" />
      </div>
    );
  }

  if (kind === "tracks") {
    return (
      <div className="learn-hero-visual visual-tracks" aria-hidden="true">
        <div className="track beginner">Beginner</div>
        <div className="track intermediate">Intermediate</div>
        <div className="track advanced">Advanced</div>
      </div>
    );
  }

  return (
    <div className="learn-hero-visual visual-gitignore" aria-hidden="true">
      <div className="file-card">
        <strong>.gitignore</strong>
        <span>node_modules/</span>
        <span>.env.local</span>
        <span>dist/</span>
      </div>
      <i className="floating-dot one" />
      <i className="floating-dot two" />
    </div>
  );
}

function AnimatedComputer() {
  return (
    <div className="animated-computer" aria-hidden="true">
      <div className="computer-screen">
        <i />
        <i />
        <i />
      </div>
      <div className="computer-base" />
      <div className="computer-spark one" />
      <div className="computer-spark two" />
    </div>
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
  const [repoRecord, setRepoRecord] = useState(null);
  const [repoTopics, setRepoTopics] = useState([]);
  const [topicEditorOpen, setTopicEditorOpen] = useState(false);
  const [topicStatus, setTopicStatus] = useState("");
  const [repoDetailsLoading, setRepoDetailsLoading] = useState(true);
  const [repoDetailsError, setRepoDetailsError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [openFile, setOpenFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(() => new Set());
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [downloadState, setDownloadState] = useState("");
  const [repoActionState, setRepoActionState] = useState("");
  const [repoActionMessage, setRepoActionMessage] = useState("");
  const [cloneMenuOpen, setCloneMenuOpen] = useState(false);
  const [addFileMenuOpen, setAddFileMenuOpen] = useState(false);
  const [createFileOpen, setCreateFileOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [fileActionState, setFileActionState] = useState("");
  const [fileActionMessage, setFileActionMessage] = useState("");
  const [editingFile, setEditingFile] = useState(false);
  const [activeNotebook, setActiveNotebook] = useState("");
  const [activeNotePath, setActiveNotePath] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [notebookName, setNotebookName] = useState("");
  const [notebookTheme, setNotebookTheme] = useState("Forest");
  const [selectedNotebookColorId, setSelectedNotebookColorId] = useState(defaultNotebookColor.id);
  const [notebooksCollapsed, setNotebooksCollapsed] = useState(false);
  const [pagesCollapsed, setPagesCollapsed] = useState(false);
  const [notebookColors, setNotebookColors] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`forallcode:notebook-colors:${username}/${repo}`) || "{}");
    } catch {
      return {};
    }
  });
  const [noteTitleOverrides, setNoteTitleOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`forallcode:note-titles:${username}/${repo}`) || "{}");
    } catch {
      return {};
    }
  });
  const [notesStatus, setNotesStatus] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [asciiModalOpen, setAsciiModalOpen] = useState(false);
  const [heroEditorOpen, setHeroEditorOpen] = useState(false);
  const [repoHero, setRepoHero] = useState({ title: "", image: "", positionX: 50, positionY: 50, fontFamily: heroFontOptions[0].value });
  const [heroDraft, setHeroDraft] = useState({ title: "", image: "", positionX: 50, positionY: 50, fontFamily: heroFontOptions[0].value });
  const [heroUploadState, setHeroUploadState] = useState("");
  const [heroToast, setHeroToast] = useState("");
  const heroPositionerRef = useRef(null);
  const addFileMenuRef = useRef(null);
  const cloneMenuRef = useRef(null);
  const noteTextareaRef = useRef(null);
  const uploadFileInputRef = useRef(null);
  const cloneUrl = `https://github.com/${username}/${repo}.git`;
  const notebookColorStorageKey = `forallcode:notebook-colors:${username}/${repo}`;
  const noteTitleStorageKey = `forallcode:note-titles:${username}/${repo}`;
  const notebooks = getRepoNotebooks(repoDetails?.files || []);
  const selectedNotebook = notebooks.find((notebook) => notebook.slug === activeNotebook) || notebooks[0] || null;
  const selectedNote = selectedNotebook?.notes.find((note) => note.path === activeNotePath) || selectedNotebook?.notes[0] || null;
  const activeNotebookTheme = notebookColorThemes.find((theme) => theme.name === notebookTheme) || notebookColorThemes[0];
  const selectedNotebookColor = notebookColorThemes.flatMap((theme) => theme.colors).find((color) => color.id === selectedNotebookColorId) || defaultNotebookColor;
  const { canPush, canManageRepo, canMerge } = useRepoAccess(repoRecord?.id, repoRecord?.owner_id);

  useEffect(() => {
    try {
      setNotebookColors(JSON.parse(localStorage.getItem(notebookColorStorageKey) || "{}"));
    } catch {
      setNotebookColors({});
    }
  }, [notebookColorStorageKey]);

  useEffect(() => {
    try {
      setNoteTitleOverrides(JSON.parse(localStorage.getItem(noteTitleStorageKey) || "{}"));
    } catch {
      setNoteTitleOverrides({});
    }
  }, [noteTitleStorageKey]);

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
    function closeAddFileMenu(event) {
      if (!addFileMenuRef.current?.contains(event.target)) setAddFileMenuOpen(false);
      if (!cloneMenuRef.current?.contains(event.target)) setCloneMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeAddFileMenu);
    return () => document.removeEventListener("pointerdown", closeAddFileMenu);
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadRepoRecord() {
      if (!supabase) return;
      const { data: repository } = await supabase
        .from("repositories")
        .select("id, owner_id, profiles!repositories_owner_id_fkey!inner(username), repo_topics(topic)")
        .eq("name", repo)
        .eq("profiles.username", username)
        .maybeSingle();

      if (alive) {
        setRepoRecord(repository || null);
        setRepoTopics((repository?.repo_topics || []).map((item) => item.topic).sort());
      }
    }

    loadRepoRecord();
    return () => {
      alive = false;
    };
  }, [repo, username]);

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

  useEffect(() => {
    if (activeTab !== "Notes" || activeNotebook || notebooks.length === 0) return;
    const firstNotebook = notebooks[0];
    const firstNote = firstNotebook.notes[0];
    setActiveNotebook(firstNotebook.slug);
    if (firstNote) openNotePage(firstNote);
  }, [activeTab, activeNotebook, notebooks.length]);

  async function refreshRepoAfterFileChange(preferredPath = "") {
    const session = await getCurrentSession();
    if (!session?.provider_token) {
      throw new Error("Sign in with GitHub to refresh repository files.");
    }

    const details = await fetchGitHubRepoOverview(username, repo, session.provider_token);
    setRepoDetails(details);
    const visibleParents = getParentFolderPaths(preferredPath);
    setExpandedFolders(new Set(visibleParents));

    const preferredFile = preferredPath
      ? details.files.find((item) => item.type === "file" && item.path === preferredPath)
      : null;
    const readmeFile = details.files.find((item) => item.type === "file" && item.name.toLowerCase() === "readme.md");
    const nextFile = preferredFile || readmeFile || details.files.find((item) => item.type === "file") || null;
    setSelectedFile(nextFile);

    if (nextFile) {
      const content = await fetchGitHubFileContent(username, repo, nextFile.path, session.provider_token, details.defaultBranch);
      setOpenFile(content);
    } else {
      setOpenFile(readmeFile ? {
        name: "README.md",
        path: readmeFile.path,
        content: details.readme,
        size: readmeFile.size || details.readme.length
      } : null);
    }
  }

  async function openRepoFile(file) {
    if (file.type === "folder") return;
    setSelectedFile(file);
    setEditingFile(false);
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

  function startEditingFile() {
    setEditingFile(true);
    setFileActionMessage("File editor opens in the next build step.");
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
    setRepoActionMessage("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub to download this repository.");
      }

      const branch = repoDetails?.defaultBranch || "main";
      const archive = await fetchGitHubRepoArchive(username, repo, session.provider_token, branch);
      downloadBlob(archive, `${repo}-${branch}.zip`);
      setRepoActionMessage(`Downloading ${repo}-${branch}.zip`);
    } catch (error) {
      setRepoActionMessage(error.message || "Could not download this repository from GitHub.");
    } finally {
      setDownloadState("");
    }
  }

  async function forkRepository() {
    setRepoActionState("forking");
    setRepoActionMessage("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub repo access to fork this repository.");
      }

      const fork = await forkGitHubRepository(username, repo, session.provider_token);
      setRepoActionMessage(`Fork started: ${fork.full_name || fork.name}. GitHub may take a moment to finish copying files.`);
    } catch (error) {
      setRepoActionMessage(error.message || "Could not fork this repository from GitHub.");
    } finally {
      setRepoActionState("");
    }
  }

  async function copyCloneUrl() {
    setRepoActionMessage("");

    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(cloneUrl);
        } catch (error) {
          copyTextWithTemporaryInput(cloneUrl);
        }
      } else {
        copyTextWithTemporaryInput(cloneUrl);
      }
      setCloneMenuOpen(false);
      setRepoActionMessage("Clone URL copied.");
    } catch (error) {
      setRepoActionMessage("Could not copy automatically. Select the clone URL and copy it manually.");
    }
  }

  function copyTextWithTemporaryInput(value) {
    const input = document.createElement("input");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw new Error("Clipboard copy failed.");
  }

  function getCurrentRepoDirectory() {
    if (selectedFile?.type === "folder") return selectedFile.path;
    if (selectedFile?.path?.includes("/")) return selectedFile.path.split("/").slice(0, -1).join("/");
    return "";
  }

  function openCreateFileDialog() {
    const currentFolder = getCurrentRepoDirectory();
    setNewFilePath(currentFolder ? `${currentFolder}/new-file.md` : "new-file.md");
    setNewFileContent("");
    setFileActionMessage("");
    setCreateFileOpen(true);
    setAddFileMenuOpen(false);
  }

  function openUploadFilePicker() {
    setFileActionMessage("");
    setAddFileMenuOpen(false);
    uploadFileInputRef.current?.click();
  }

  async function createNewGitHubFile(event) {
    event.preventDefault();
    const path = normalizeGitHubFilePath(newFilePath);
    setFileActionState("creating");
    setFileActionMessage("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub repo access before creating files.");
      }

      await saveGitHubRepositoryFile({
        githubAccessToken: session.provider_token,
        owner: username,
        repo,
        path,
        content: newFileContent,
        branch: repoDetails?.defaultBranch,
        message: `Add ${path} via ForAllCode`
      });
      await refreshRepoAfterFileChange(path);
      setCreateFileOpen(false);
      setNewFilePath("");
      setNewFileContent("");
      setFileActionMessage(`${path} was saved to GitHub.`);
    } catch (error) {
      setFileActionMessage(error.message || "Could not create this file on GitHub.");
    } finally {
      setFileActionState("");
    }
  }

  async function uploadGitHubFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    const currentFolder = getCurrentRepoDirectory();
    setFileActionState("uploading");
    setFileActionMessage("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub repo access before uploading files.");
      }

      const uploadedPaths = [];
      for (const file of files) {
        const path = normalizeGitHubFilePath([currentFolder, file.name].filter(Boolean).join("/"));
        const contentBase64 = await readFileAsBase64(file);
        await saveGitHubRepositoryFile({
          githubAccessToken: session.provider_token,
          owner: username,
          repo,
          path,
          contentBase64,
          branch: repoDetails?.defaultBranch,
          message: `Upload ${path} via ForAllCode`
        });
        uploadedPaths.push(path);
      }

      await refreshRepoAfterFileChange(uploadedPaths[0]);
      setFileActionMessage(`${uploadedPaths.length} file${uploadedPaths.length === 1 ? "" : "s"} uploaded to GitHub.`);
    } catch (error) {
      setFileActionMessage(error.message || "Could not upload these files to GitHub.");
    } finally {
      setFileActionState("");
    }
  }

  async function createNotebook() {
    const slug = slugForPath(notebookName);
    if (!slug) {
      setNotesStatus("Add a notebook name first.");
      return;
    }

    setNotesSaving(true);
    setNotesStatus("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub repo access before creating notebooks.");
      }

      const path = `notes/${slug}/index.md`;
      const title = titleFromSlug(slug);
      await saveGitHubRepositoryFile({
        githubAccessToken: session.provider_token,
        owner: username,
        repo,
        path,
        content: `# ${title}\n\nStart your notebook here.\n`,
        branch: repoDetails?.defaultBranch,
        message: `Create ${title} notebook via ForAllCode`
      });
      await refreshRepoAfterFileChange(path);
      setActiveNotebook(slug);
      setActiveNotePath(path);
      setNoteContent(`# ${title}\n\nStart your notebook here.\n`);
      saveNotebookColor(slug, selectedNotebookColor);
      setNotebookName("");
      setNotesStatus(`${title} notebook created in GitHub.`);
    } catch (error) {
      setNotesStatus(error.message || "Could not create this notebook on GitHub.");
    } finally {
      setNotesSaving(false);
    }
  }

  function saveNotebookColor(slug, color) {
    if (!slug || !color) return;
    setNotebookColors((current) => {
      const next = { ...current, [slug]: color };
      localStorage.setItem(notebookColorStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function handleNotebookColorSelect(color) {
    setSelectedNotebookColorId(color.id);
    if (selectedNotebook?.slug) {
      saveNotebookColor(selectedNotebook.slug, color);
    }
  }

  function saveNoteTitleOverride(path, content) {
    if (!path) return;
    const title = getNoteTitleFromContent(content) || titleFromSlug(path.split("/").pop() || "");
    setNoteTitleOverrides((current) => {
      const next = { ...current, [path]: title };
      localStorage.setItem(noteTitleStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function getNoteDisplayName(note) {
    if (!note) return "";
    if (note.path === activeNotePath) {
      return getNoteTitleFromContent(noteContent) || noteTitleOverrides[note.path] || note.name;
    }
    return noteTitleOverrides[note.path] || note.name;
  }

  async function createNotePage() {
    const notebook = selectedNotebook?.slug || activeNotebook;
    if (!notebook) {
      setNotesStatus("Create or select a notebook first.");
      return;
    }

    const existingSlugs = new Set((selectedNotebook?.notes || []).map((note) => note.path.split("/").pop()?.replace(/\.md$/i, "")));
    let pageNumber = (selectedNotebook?.notes.length || 0) + 1;
    let slug = `page-${pageNumber}`;
    while (existingSlugs.has(slug)) {
      pageNumber += 1;
      slug = `page-${pageNumber}`;
    }
    const path = `notes/${notebook}/${slug}.md`;
    const title = "Untitled page";
    setNotesSaving(true);
    setNotesStatus("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub repo access before creating notes.");
      }

      const content = `# ${title}\n\n`;
      await saveGitHubRepositoryFile({
        githubAccessToken: session.provider_token,
        owner: username,
        repo,
        path,
        content,
        branch: repoDetails?.defaultBranch,
        message: `Create ${title} note via ForAllCode`
      });
      await refreshRepoAfterFileChange(path);
      setActiveNotebook(notebook);
      setActiveNotePath(path);
      setNoteContent(content);
      saveNoteTitleOverride(path, content);
      setNotesStatus(`${title} note created in GitHub.`);
    } catch (error) {
      setNotesStatus(error.message || "Could not create this note on GitHub.");
    } finally {
      setNotesSaving(false);
    }
  }

  async function openNotePage(note) {
    if (!note?.path) return;
    setNotesSaving(true);
    setNotesStatus("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub to open notes.");
      }

      const content = await fetchGitHubFileContent(username, repo, note.path, session.provider_token, repoDetails?.defaultBranch);
      setActiveNotebook(note.notebookSlug);
      setActiveNotePath(note.path);
      setNoteContent(content?.content || "");
      saveNoteTitleOverride(note.path, content?.content || "");
    } catch (error) {
      setNotesStatus(error.message || "Could not open this note from GitHub.");
    } finally {
      setNotesSaving(false);
    }
  }

  async function saveActiveNote() {
    if (!activeNotePath) {
      setNotesStatus("Create or select a note first.");
      return;
    }

    setNotesSaving(true);
    setNotesStatus("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub repo access before saving notes.");
      }

      await saveGitHubRepositoryFile({
        githubAccessToken: session.provider_token,
        owner: username,
        repo,
        path: activeNotePath,
        content: noteContent,
        branch: repoDetails?.defaultBranch,
        message: `Update ${activeNotePath} via ForAllCode Notes`
      });
      await refreshRepoAfterFileChange(activeNotePath);
      saveNoteTitleOverride(activeNotePath, noteContent);
      setNotesStatus("Note saved to GitHub.");
    } catch (error) {
      setNotesStatus(error.message || "Could not save this note to GitHub.");
    } finally {
      setNotesSaving(false);
    }
  }

  function insertIntoNoteAtCursor(markdown) {
    const textarea = noteTextareaRef.current;
    if (!textarea) {
      setNoteContent((current) => `${current}${markdown}`);
      return;
    }

    const selectionStart = textarea.selectionStart ?? noteContent.length;
    const selectionEnd = textarea.selectionEnd ?? noteContent.length;
    const nextContent = `${noteContent.slice(0, selectionStart)}${markdown}${noteContent.slice(selectionEnd)}`;
    const cursorPosition = selectionStart + markdown.length;
    setNoteContent(nextContent);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
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
      trackUsage(session.user.id, "hero_image_uploaded", {
        repo_name: repo,
        owner: username,
        size: imageBlob.size
      }).catch(() => {});
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

  async function saveRepoTopics(nextTopics) {
    if (!supabase || !repoRecord?.id) return;
    setTopicStatus("");

    try {
      const cleanedTopics = Array.from(new Set(nextTopics)).slice(0, 20);
      const current = new Set(repoTopics);
      const next = new Set(cleanedTopics);
      const toAdd = cleanedTopics.filter((topic) => !current.has(topic));
      const toRemove = repoTopics.filter((topic) => !next.has(topic));

      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("repo_topics")
          .delete()
          .eq("repo_id", repoRecord.id)
          .in("topic", toRemove);
        if (deleteError) throw deleteError;
      }

      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("repo_topics")
          .insert(toAdd.map((topic) => ({ repo_id: repoRecord.id, topic })));
        if (insertError) throw insertError;
      }

      setRepoTopics(cleanedTopics);
      setTopicEditorOpen(false);
      setTopicStatus("Topics saved.");
    } catch (error) {
      setTopicStatus(error.message || "Could not save topics.");
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
      .select("id, owner_id, is_private, name")
      .eq("name", repo)
      .maybeSingle();
    const { data: actor } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!repository?.id) return;

    const { error: starError } = await supabase
      .from("stars")
      .upsert({ user_id: session.user.id, repo_id: repository.id }, { onConflict: "user_id,repo_id" });
    if (starError) {
      setRepoActionMessage(starError.message || "Could not star this repository.");
      return;
    }

    setRepoActionMessage("Repository added to your starred repos.");
    if (!repository.is_private) {
      createFeedEvent(supabase, {
        actorId: session.user.id,
        eventType: "repo_starred",
        repoId: repository.id,
        metadata: { repo_name: repository.name || repo }
      }).catch(() => {});
    }

    if (!repository.owner_id || repository.owner_id === session.user.id) return;
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
          <TopicPills editable={canManageRepo} onEdit={() => setTopicEditorOpen(true)} topics={repoTopics} />
          {topicStatus && <p className="repo-topic-status">{topicStatus}</p>}
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
            <Button variant="soft" onClick={forkRepository} disabled={repoActionState === "forking"}>
              <GitFork size={16} />{repoActionState === "forking" ? "Forking..." : "Fork"}
            </Button>
            <Button variant="soft" onClick={downloadRepositoryArchive} disabled={repoDetailsLoading || downloadState === "repo"}>
              <Download size={16} />{downloadState === "repo" ? "Downloading..." : "Download all"}
            </Button>
            <div className={cloneMenuOpen ? "clone-control open" : "clone-control"} ref={cloneMenuRef}>
              <button onClick={() => setCloneMenuOpen((open) => !open)} type="button">Clone <ChevronDown size={14} /></button>
              <div>
                <input readOnly value={cloneUrl} onFocus={(event) => event.target.select()} aria-label="Clone URL" />
                <button className="button soft" onClick={copyCloneUrl} type="button" aria-label="Copy clone URL"><Copy size={16} />Copy</button>
              </div>
            </div>
          </div>
          <button className="repo-hero-edit-button" onClick={() => setHeroEditorOpen(true)}>
            <Palette size={16} />Edit hero
          </button>
        </div>
        {repoActionMessage && <p className="repo-action-message" role="status">{repoActionMessage}</p>}
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
      {topicEditorOpen && (
        <TopicEditor
          onClose={() => setTopicEditorOpen(false)}
          onSave={saveRepoTopics}
          topics={repoTopics}
        />
      )}

      <div className="repo-tab-bar">
        {["Code", "Issues", "Pull requests", "Discussions", "Projects", "Insights", "Commits", "Branches", "Visual Map", "Notes", "Settings"].map((tab) => {
            if (tab === "Issues") return <Link className="repo-tab-link" key={tab} to={`/${username}/${repo}/issues`}>Issues</Link>;
            if (tab === "Pull requests") return <Link className="repo-tab-link" key={tab} to={`/${username}/${repo}/pulls`}>Pull requests</Link>;
            if (tab === "Discussions") return <Link className="repo-tab-link" key={tab} to={`/${username}/${repo}/discussions`}>Discussions</Link>;
            if (tab === "Projects") return <Link className="repo-tab-link" key={tab} to={`/${username}/${repo}/projects`}>Projects</Link>;
          if (tab === "Insights" && canMerge) return <Link className="repo-tab-link" key={tab} to={`/${username}/${repo}/insights`}>Insights</Link>;
          if (tab === "Insights") return null;
          return <button className={activeTab === tab ? "active" : ""} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>;
        })}
      </div>

      {activeTab === "Code" && (
        <section className="phase-code-tab">
          <div className="repo-code-toolbar">
            <div>
              <strong>{repoDetails?.defaultBranch || "main"}</strong>
              <span>{fileActionState === "uploading" ? "Uploading to GitHub..." : fileActionState === "creating" ? "Creating file on GitHub..." : fileActionMessage || "Files are saved directly to GitHub."}</span>
            </div>
            <div className="add-file-control" ref={addFileMenuRef}>
              <button
                className="add-file-button"
                disabled={repoDetailsLoading || Boolean(repoDetailsError) || Boolean(fileActionState)}
                onClick={() => setAddFileMenuOpen((open) => !open)}
                type="button"
              >
                Add file <ChevronDown size={15} />
              </button>
              {addFileMenuOpen && (
                <div className="add-file-menu">
                  <button onClick={openCreateFileDialog} type="button"><Plus size={18} />Create new file</button>
                  <button onClick={openUploadFilePicker} type="button"><Upload size={18} />Upload files</button>
                </div>
              )}
              <input multiple onChange={uploadGitHubFiles} ref={uploadFileInputRef} type="file" hidden />
            </div>
          </div>
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
                canEdit={canPush}
                error={fileError}
                file={openFile}
                loading={fileLoading}
                onDownload={downloadSelectedFile}
                onEdit={startEditingFile}
                repo={data}
                repoReadme={repoDetails?.readme}
                downloading={downloadState === "file"}
              />
            </>
          )}
        </section>
      )}

      {createFileOpen && (
        <div className="repo-hero-modal-backdrop" onClick={() => setCreateFileOpen(false)}>
          <form className="repo-file-editor" role="dialog" aria-modal="true" aria-label="Create new file" onClick={(event) => event.stopPropagation()} onSubmit={createNewGitHubFile}>
            <div>
              <p className="eyebrow">Add file</p>
              <h2>Create new file</h2>
              <p>Choose a path and write the first version. Saving commits it directly to GitHub.</p>
            </div>
            <label>
              File path
              <input value={newFilePath} onChange={(event) => setNewFilePath(event.target.value)} placeholder="docs/notes.md" />
            </label>
            <label>
              File content
              <textarea rows="12" value={newFileContent} onChange={(event) => setNewFileContent(event.target.value)} placeholder="# New file" />
            </label>
            {fileActionMessage && <p className="repo-hero-toast" role="status">{fileActionMessage}</p>}
            <div className="repo-hero-editor-actions">
              <Button variant="soft" onClick={() => setCreateFileOpen(false)} disabled={Boolean(fileActionState)} type="button">Cancel</Button>
              <Button disabled={Boolean(fileActionState)} type="submit">{fileActionState === "creating" ? "Saving..." : "Save to GitHub"}</Button>
            </div>
          </form>
        </div>
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

      {activeTab === "Notes" && (
        <section className={`repo-notes-panel ${notebooksCollapsed ? "notebooks-collapsed" : ""} ${pagesCollapsed ? "pages-collapsed" : ""}`}>
          <div className="repo-notes-topbar">
            <strong>Repo Notes</strong>
            <span>Choose a notebook, then pick or create a page. Everything saves to GitHub under <code>notes/</code>.</span>
          </div>
          <div className="repo-notes-body">
            <aside className="repo-notes-sidebar">
              <button className="repo-panel-fold" onClick={() => setNotebooksCollapsed((value) => !value)} aria-label={notebooksCollapsed ? "Expand notebooks" : "Collapse notebooks"} type="button">
                {notebooksCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <span className="repo-panel-rail-label">Notebooks</span>
              <div className="repo-panel-inner">
                <div>
                  <p className="eyebrow">Repo notes</p>
                  <h3>Notebooks</h3>
                </div>
                <label>
                  New notebook
                  <div className="repo-notes-create-row">
                    <input value={notebookName} onChange={(event) => setNotebookName(event.target.value)} placeholder="Project notes" />
                    <button onClick={createNotebook} disabled={notesSaving} type="button">Create</button>
                  </div>
                </label>
                <div className="repo-notebook-colour-picker">
                  <span>Book colour</span>
                  <div className="repo-notebook-theme-row" aria-label="Book colour themes">
                    {notebookColorThemes.map((theme) => (
                      <button
                        className={theme.name === notebookTheme ? "active" : ""}
                        key={theme.name}
                        onClick={() => {
                          setNotebookTheme(theme.name);
                          handleNotebookColorSelect(theme.colors[0]);
                        }}
                        type="button"
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                  <div className="repo-notebook-swatch-row" aria-label={`${activeNotebookTheme.name} book colours`}>
                    {activeNotebookTheme.colors.map((color) => (
                      <button
                        aria-label={`${activeNotebookTheme.name} ${color.label}`}
                        className={color.id === selectedNotebookColorId ? "active" : ""}
                        key={color.id}
                        onClick={() => handleNotebookColorSelect(color)}
                        style={{ "--book-colour": color.end }}
                        title={color.label}
                        type="button"
                      />
                    ))}
                  </div>
                </div>
                <nav className="repo-notebook-list" aria-label="Notebooks">
                  {notebooks.map((notebook) => (
                    <button
                      className={notebook.slug === selectedNotebook?.slug ? "active" : ""}
                      key={notebook.slug}
                      onClick={() => {
                        setActiveNotebook(notebook.slug);
                        if (notebook.notes[0]) openNotePage(notebook.notes[0]);
                        else {
                          setActiveNotePath("");
                          setNoteContent("");
                        }
                      }}
                      type="button"
                    >
                      <span
                        className="repo-notebook-book"
                        style={{
                          "--book-colour": (notebookColors[notebook.slug] || defaultNotebookColor).end
                        }}
                        aria-hidden="true"
                      >
                        <BookOpen size={18} />
                      </span>
                      <span>{notebook.name}</span>
                    </button>
                  ))}
                  {notebooks.length === 0 && <p>Create your first notebook to start writing pages.</p>}
                </nav>
              </div>
            </aside>
            <div className="repo-notes-pages">
              <button className="repo-panel-fold" onClick={() => setPagesCollapsed((value) => !value)} aria-label={pagesCollapsed ? "Expand pages" : "Collapse pages"} type="button">
                {pagesCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <span className="repo-panel-rail-label">Pages</span>
              <div className="repo-panel-inner">
                <div>
                  <strong>Pages</strong>
                  <span>{selectedNotebook?.notes.length || 0} page{selectedNotebook?.notes.length === 1 ? "" : "s"}</span>
                </div>
                <button className="repo-add-page-button" onClick={createNotePage} disabled={!selectedNotebook || notesSaving} type="button">Add new page</button>
                <div className="repo-note-page-list">
                  {selectedNotebook?.notes.map((note) => (
                    <button className={note.path === activeNotePath ? "active" : ""} key={note.path} onClick={() => openNotePage(note)} type="button">
                      <FileText size={15} />
                      <span>{getNoteDisplayName(note)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="repo-note-editor">
              <div className="repo-note-editor-head">
                <div>
                  <p className="eyebrow">Markdown note</p>
                  <h3>{getNoteDisplayName(selectedNote) || activeNotePath || "Create a notebook to begin"}</h3>
                  <span className="repo-note-title-hint">The first line of this note becomes the page title.</span>
                </div>
                <div className="repo-note-editor-actions">
                  <button
                    className="repo-note-toolbar-button"
                    disabled={!activeNotePath || notesSaving}
                    onClick={() => setAsciiModalOpen(true)}
                    type="button"
                  >
                    <Grid3X3 size={14} />
                    ASCII
                  </button>
                  <Button onClick={saveActiveNote} disabled={!activeNotePath || notesSaving}>{notesSaving ? "Saving..." : "Save note"}</Button>
                </div>
              </div>
              <textarea
                ref={noteTextareaRef}
                value={noteContent}
                onChange={(event) => setNoteContent(event.target.value)}
                placeholder="# Your note"
                disabled={!activeNotePath || notesSaving}
              />
              {notesStatus && <p className="repo-notes-status">{notesStatus}</p>}
            </div>
          </div>
          <AsciiArtGenerator
            open={asciiModalOpen}
            onClose={() => setAsciiModalOpen(false)}
            onInsert={insertIntoNoteAtCursor}
          />
        </section>
      )}
    </div>
  );
}

function LearnPage() {
  useDocumentTitle("Learn");
  const isMobile = useIsMobile();
  const { session, checked } = useAuthSession();
  const { profile: signedInProfile, repos: signedInRepos } = useSignedInUserData();
  const { lessonSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewedLessonsRef = useRef(new Set());
  const [activeTrack, setActiveTrack] = useState("beginner");
  const [expandedTracks, setExpandedTracks] = useState(() => new Set(["beginner"]));
  const [active, setActive] = useState(lessons[0].slug);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogTag, setCatalogTag] = useState("all");
  const [completedLessons, setCompletedLessons] = useState(() => new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFullOnboarding, setShowFullOnboarding] = useState(false);
  const [onboardingLeaving, setOnboardingLeaving] = useState(false);
  const [selectedComfort, setSelectedComfort] = useState("");
  const lesson = lessons.find((item) => item.slug === active) || lessons[0];
  const isFreeUser = true;
  const showCatalog = searchParams.get("view") === "catalog" && !lessonSlug;

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

  useEffect(() => {
    if (!lessonSlug) return;
    const selectedLesson = lessons.find((item) => item.slug === lessonSlug);
    if (!selectedLesson) return;
    const track = learnTracks.find((item) => item.track === selectedLesson.track);
    if (track) {
      setActiveTrack(track.id);
      setExpandedTracks((current) => new Set([...current, track.id]));
    }
    setActive(selectedLesson.slug);
    setShowOnboarding(false);
  }, [lessonSlug]);

  useEffect(() => {
    if (!checked || showOnboarding || !session?.user?.id || !lesson?.slug) return;
    const viewKey = `${session.user.id}:${lesson.slug}`;
    if (viewedLessonsRef.current.has(viewKey)) return;
    viewedLessonsRef.current.add(viewKey);
    trackUsage(session.user.id, "lesson_viewed", {
      lesson_slug: lesson.slug,
      track: lesson.track,
      tag: lesson.tag
    }).catch(() => {});
  }, [checked, lesson?.slug, session?.user?.id, showOnboarding]);

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
      if (track) {
        setActiveTrack(track.id);
        setExpandedTracks((current) => new Set([...current, track.id]));
      }
    }
    setActive(slug);
  }

  function openCatalogLesson(slug) {
    chooseLesson(slug);
    navigate(`/learn/${slug}`);
  }

  async function markLessonComplete() {
    const wasComplete = completedLessons.has(lesson.slug);
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
      if (!wasComplete) {
        trackUsage(session.user.id, "lesson_completed", { lesson_slug: lesson.slug }).catch(() => {});
        createFeedEvent(supabase, {
          actorId: session.user.id,
          eventType: "lesson_completed",
          metadata: {
            lesson_slug: lesson.slug,
            lesson_title: lesson.title,
            track: lesson.track,
            track_name: learnTracks.find((track) => track.track === lesson.track)?.label || lesson.track
          }
        }).catch(() => {});
      }
    }
  }

  if (showOnboarding && !showCatalog) {
    return <LearnComfortCheck selected={selectedComfort} leaving={onboardingLeaving} onSelect={chooseComfort} />;
  }

  if (showCatalog) {
    return (
      <PageFrame title="Lesson catalog" eyebrow="Learn">
        {showFullOnboarding && session?.user && (
          <OnboardingFlow
            user={session.user}
            profile={signedInProfile}
            repos={signedInRepos}
            onComplete={() => setShowFullOnboarding(false)}
          />
        )}
        <CarouselHero slides={learnHeroSlides} type="learn" />
        <section className="learn-replay-tour">
          <div>
            <p className="eyebrow">Need a refresher?</p>
            <h2>Replay the ForAllCode tour whenever you like.</h2>
          </div>
          <button className="button soft" disabled={!session?.user} onClick={() => setShowFullOnboarding(true)} type="button">
            Replay onboarding
          </button>
        </section>
        <LearnCatalog
          completedLessons={completedLessons}
          onOpenLesson={openCatalogLesson}
          query={catalogQuery}
          selectedTag={catalogTag}
          setQuery={setCatalogQuery}
          setSelectedTag={setCatalogTag}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Learn Git visually" eyebrow="Learn">
      {showFullOnboarding && session?.user && (
        <OnboardingFlow
          user={session.user}
          profile={signedInProfile}
          repos={signedInRepos}
          onComplete={() => setShowFullOnboarding(false)}
        />
      )}
      <CarouselHero slides={learnHeroSlides} type="learn" />
      <section className="learn-replay-tour">
        <div>
          <p className="eyebrow">Need a refresher?</p>
          <h2>Replay the ForAllCode tour whenever you like.</h2>
        </div>
        <button className="button soft" disabled={!session?.user} onClick={() => setShowFullOnboarding(true)} type="button">
          Replay onboarding
        </button>
      </section>
      <section className="learn-cert-card">
        <div>
          <p className="eyebrow">Certification</p>
          <h2>ForAllCode Certificates</h2>
          <p>Earn public certificates for Git Fundamentals, Git for Teams, Command Line Essentials, and Open Source contribution, then share them with collaborators, employers, or your profile.</p>
        </div>
        <div className="learn-cert-actions">
          <Button to="/certification/git-fundamentals" variant="soft">Git Fundamentals</Button>
          <Button to="/certification/git-for-teams" variant="soft">Git for Teams</Button>
          <Button to="/certification/command-line-essentials" variant="soft">Command Line</Button>
          <Button to="/certification/open-source-contributor" variant="soft">Open Source</Button>
        </div>
      </section>
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
      <div className="learn-onboarding-cert-links">
        <Link className="learn-cert-onboarding-link" to="/certification/git-fundamentals">Explore the Git Fundamentals Certificate</Link>
        <Link className="learn-cert-onboarding-link" to="/certification/git-for-teams">Explore the Git for Teams Certificate</Link>
        <Link className="learn-cert-onboarding-link" to="/certification/command-line-essentials">Explore the Command Line Essentials Certificate</Link>
        <Link className="learn-cert-onboarding-link" to="/certification/open-source-contributor">Explore the Open Source Contributor Certificate</Link>
      </div>
    </section>
  );
}

function LearnCatalog({ completedLessons, onOpenLesson, query, selectedTag, setQuery, setSelectedTag }) {
  const allTags = Array.from(new Set(lessons.map((item) => item.tag))).sort();
  const normalisedQuery = query.trim().toLowerCase();

  function lessonMatches(lesson, track) {
    const searchableText = [
      lesson.title,
      lesson.description,
      lesson.tag,
      lesson.slug,
      track.title,
      track.subtitle,
      ...lesson.steps.flatMap((step) => [step.title, step.body])
    ].join(" ").toLowerCase();

    const matchesSearch = !normalisedQuery || searchableText.includes(normalisedQuery);
    const matchesTag = selectedTag === "all" || lesson.tag === selectedTag;
    return matchesSearch && matchesTag;
  }

  const groupedLessons = learnTracks.map((track) => ({
    ...track,
    lessons: lessons.filter((lesson) => lesson.track === track.track && lessonMatches(lesson, track))
  }));
  const resultCount = groupedLessons.reduce((total, track) => total + track.lessons.length, 0);

  return (
    <section className="learn-catalog">
      <div className="learn-catalog-header">
        <div>
          <p className="eyebrow">Course catalog</p>
          <h2>Browse every lesson</h2>
          <p>Search by subject, skill, workflow, or tag, then jump straight into the right course.</p>
        </div>
        <span>{resultCount} lessons</span>
      </div>

      <div className="learn-catalog-toolbar">
        <label className="learn-catalog-search">
          <span>Search lessons</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search branching, DevOps, conflicts..."
          />
        </label>
        <div className="learn-catalog-tags" aria-label="Filter lessons by tag">
          <button className={selectedTag === "all" ? "active" : ""} onClick={() => setSelectedTag("all")}>All</button>
          {allTags.map((tag) => (
            <button className={selectedTag === tag ? "active" : ""} key={tag} onClick={() => setSelectedTag(tag)}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="learn-catalog-tracks">
        {groupedLessons.map((track) => (
          <div className="learn-catalog-track" key={track.id}>
            <div className="learn-catalog-track-title">
              <span style={{ backgroundColor: track.color }} />
              <div>
                <h3>{track.title}</h3>
                <p>{track.subtitle}</p>
              </div>
            </div>
            {track.lessons.length > 0 ? (
              <div className="learn-catalog-grid">
                {track.lessons.map((lesson) => {
                  const complete = completedLessons.has(lesson.slug);
                  return (
                    <article className="learn-catalog-card" key={lesson.slug}>
                      <div className="learn-catalog-card-top">
                        <LessonTag tag={lesson.tag} compact />
                        {complete && <span className="learn-catalog-complete"><Check size={13} /> Complete</span>}
                      </div>
                      <h4>{lesson.title}</h4>
                      <p>{lesson.description}</p>
                      <div className="learn-catalog-meta">
                        <span>{lesson.steps.length} steps</span>
                        <span>{track.subtitle}</span>
                      </div>
                      <Button onClick={() => onOpenLesson(lesson.slug)} variant="soft">Open lesson</Button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="learn-catalog-empty">No {track.title.toLowerCase()} lessons match this search yet.</p>
            )}
          </div>
        ))}
      </div>
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
  const { isPro, limits, planId } = useSubscription();
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
  const [deskTheme, setDeskTheme] = useState("classic");
  const [showClock, setShowClock] = useState(true);
  const [showDecorations, setShowDecorations] = useState(true);
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
        setDeskTheme(workspacePrefs.deskTheme || "classic");
        setShowClock(workspacePrefs.showClock ?? true);
        setShowDecorations(workspacePrefs.showDecorations ?? true);
        setDefaultNoteColour(workspacePrefs.defaultNoteColour || "amber");
      }
      if (!workspacePrefs && supabase && session?.user?.id) {
        const { data: stored } = await supabase
          .from("workspace_settings")
          .select("desk_theme, show_clock, show_decorations, focus_mode, default_note_colour")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (!alive) return;
        if (stored) {
          setFocus(Boolean(stored.focus_mode));
          setDeskTheme(stored.desk_theme || "classic");
          setShowClock(stored.show_clock ?? true);
          setShowDecorations(stored.show_decorations ?? true);
          setDefaultNoteColour(stored.default_note_colour || "amber");
        }
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

  const stickyNoteAtLimit = isAtLimit(planId, "stickyNotes", notes.length);
  const addNote = () => {
    if (stickyNoteAtLimit) return;
    setNotes([...notes, { id: Date.now(), colour: defaultNoteColour, content: "New idea", x: 34, y: 56 }]);
    if (workspaceUserId && workspaceUserId !== "local") {
      trackUsage(workspaceUserId, "sticky_note_added").catch(() => {});
    }
  };
  return (
    <section className={compact ? "workspace compact" : "workspace"}>
      <div className="workspace-toolbar">
        <Button variant="soft" onClick={() => setFocus(!focus)}><Eye size={16} />Focus mode {focus ? "ON" : "OFF"}</Button>
        {interactive && !isPro && <span className="limit-indicator">Sticky notes: {notes.length} / {limits.stickyNotes}</span>}
        {interactive && <Button disabled={stickyNoteAtLimit} onClick={addNote}><Plus size={16} />Sticky note</Button>}
      </div>
      {interactive && !isPro && (
        <p className="workspace-limit-note">
          {notes.length} of {limits.stickyNotes} sticky notes used.
          {notes.length >= limits.stickyNotes - 1 && <Link to="/upgrade">Upgrade for unlimited →</Link>}
        </p>
      )}
      {interactive && <LimitBanner limitKey="stickyNotes" currentCount={notes.length} />}
      <div className={focus ? "desk focus-on" : "desk"}>
        <DeskIllustration theme={deskTheme} showClock={showClock} showDecorations={showDecorations} />
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

function RepoCard({ repo, actions = false }) {
  const hero = normalizeRepoHero(repoToHero(repo), repo.name);

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

function ProfileHeader({ editable = false, publicView = false, profileData = null }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(() => profileDraftFromData(profileData));
  const [uploading, setUploading] = useState("");
  const [status, setStatus] = useState("");
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [bioMenuOpen, setBioMenuOpen] = useState(false);
  const coverPositionerRef = useRef(null);
  const quickAvatarInputRef = useRef(null);
  const displayName = profileData?.displayName || currentUser.name;
  const username = profileData?.username || currentUser.username;
  const avatarStyle = profileData?.avatarStyle || currentUser.avatarStyle;
  const avatarUrl = profileData?.avatarUrl || "";
  const [quickAvatarUrl, setQuickAvatarUrl] = useState(avatarUrl);
  const coverGradient = profileData?.coverGradient || "linear-gradient(120deg, var(--lavender), var(--rose), var(--sage))";
  const coverImageUrl = profileData?.coverImageUrl || "";
  const coverPositionX = profileData?.coverPositionX ?? 50;
  const coverPositionY = profileData?.coverPositionY ?? 50;
  const pronouns = profileData?.pronouns || currentUser.pronouns;
  const bio = profileData?.bio || currentUser.bio;
  const location = profileData?.location || currentUser.location;
  const website = profileData?.website || currentUser.website;
  const profileLinks = [
    { label: "Website", value: website },
    { label: "GitHub", value: profileData?.githubUrl || "" },
    { label: "Twitter/X", value: profileData?.twitterUrl || "" },
    { label: "LinkedIn", value: profileData?.linkedinUrl || "" }
  ].filter((item) => item.value);

  useEffect(() => {
    setDraft(profileDraftFromData(profileData));
  }, [profileData]);

  useEffect(() => {
    setQuickAvatarUrl(avatarUrl);
  }, [avatarUrl]);

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

  async function handleQuickAvatarUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading("avatar");
    setStatus("");

    try {
      const session = await getCurrentSession();
      if (!session?.user?.id || !supabase) throw new Error("Sign in before updating your profile picture.");
      const imageBlob = await compressHeroImageToBlob(file);
      const imageUrl = await uploadProfileVisualImage(session, "avatar", imageBlob);
      await supabase.from("profiles").update({ avatar_url: imageUrl }).eq("id", session.user.id);
      setQuickAvatarUrl(imageUrl);
      setDraft((current) => ({ ...current, avatarUrl: imageUrl }));
      setStatus("Profile picture saved.");
    } catch (error) {
      setStatus(error.message || "Could not update your profile picture.");
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
        <div className="profile-avatar-card">
          <button className="profile-avatar-preview-trigger" onClick={() => setAvatarPreviewOpen(true)} type="button" aria-label="View larger profile picture">
            <Avatar photoUrl={quickAvatarUrl} size="large" variant={avatarStyle} />
          </button>
          {editable && (
            <>
              <button
                aria-label="Edit profile picture"
                className="profile-avatar-edit"
                disabled={uploading === "avatar"}
                onClick={() => quickAvatarInputRef.current?.click()}
                type="button"
              >
                <Palette size={16} />
              </button>
              <input accept="image/*" hidden onChange={handleQuickAvatarUpload} ref={quickAvatarInputRef} type="file" />
            </>
          )}
        </div>
        <div className="profile-info-panel">
          <div className="profile-title-block">
            <h2>{displayName}</h2>
            <p>@{username}{pronouns ? ` - ${pronouns}` : ""}</p>
          </div>
          <div className="profile-details">
            {bio && <p className="profile-bio-summary">{bio}</p>}
            <p>{[location, `Joined ${currentUser.joinDate}`].filter(Boolean).join(" - ")}</p>
            {status && <small>{status}</small>}
          </div>
          <div className="profile-actions">{editable && <Button onClick={() => setEditorOpen(true)}>Edit profile</Button>}{publicView && <Button onClick={handleFollow}>Follow</Button>}<Button variant="soft">Message</Button></div>
          <button className="profile-bio-toggle" onClick={() => setBioMenuOpen((open) => !open)} type="button" aria-label="Toggle profile details" aria-expanded={bioMenuOpen}>
            <ChevronDown size={18} />
          </button>
          {bioMenuOpen && (
            <div className="profile-bio-menu">
              {bio && <p>{bio}</p>}
              {location && <p><strong>Location</strong><span>{location}</span></p>}
              <p><strong>Joined</strong><span>{currentUser.joinDate}</span></p>
              {profileLinks.length > 0 && (
                <div className="profile-bio-links">
                  {profileLinks.map((link) => (
                    <a href={ensureProfileUrl(link.value)} key={link.label} target="_blank" rel="noreferrer">{link.label}</a>
                  ))}
                </div>
              )}
              <button className="profile-bio-toggle profile-bio-toggle-expanded" onClick={() => setBioMenuOpen(false)} type="button" aria-label="Close profile details" aria-expanded="true">
                <ChevronDown size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
      {avatarPreviewOpen && (
        <div className="repo-hero-modal-backdrop" onClick={() => setAvatarPreviewOpen(false)}>
          <div className="profile-avatar-lightbox" role="dialog" aria-modal="true" aria-label="Profile picture preview" onClick={(event) => event.stopPropagation()}>
            <button className="profile-avatar-lightbox-close" onClick={() => setAvatarPreviewOpen(false)} type="button" aria-label="Close profile picture preview">×</button>
            <Avatar photoUrl={quickAvatarUrl} size="large" variant={avatarStyle} />
          </div>
        </div>
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

function ensureProfileUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "#";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
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

function FilePreview({ canEdit = false, downloading, error, file, loading, onDownload, onEdit, repo, repoReadme }) {
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
        {canEdit && (
          <button className="file-edit-button" onClick={onEdit} type="button">
            <Pencil size={14} />Edit file
          </button>
        )}
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

function normalizeGitHubFilePath(path) {
  return String(path || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/");
}

function slugForPath(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromSlug(value) {
  return String(value || "")
    .replace(/\.(md|markdown)$/i, "")
    .split(/[-_]/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Untitled";
}

function getNoteTitleFromContent(content) {
  const firstLine = String(content || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine
    ?.replace(/^#{1,6}\s*/, "")
    .replace(/^[>*\-\d.)\s]+/, "")
    .trim()
    .slice(0, 80) || "";
}

function getRepoNotebooks(files = []) {
  const notebooks = new Map();
  files
    .filter((file) => file.type === "file" && /^notes\/[^/]+\/.+\.m(?:d|arkdown)$/i.test(file.path))
    .forEach((file) => {
      const [, notebookSlug] = file.path.split("/");
      if (!notebooks.has(notebookSlug)) {
        notebooks.set(notebookSlug, {
          slug: notebookSlug,
          name: titleFromSlug(notebookSlug),
          notes: []
        });
      }
      notebooks.get(notebookSlug).notes.push({
        name: titleFromSlug(file.name),
        notebookSlug,
        path: file.path
      });
    });

  return Array.from(notebooks.values())
    .map((notebook) => ({
      ...notebook,
      notes: notebook.notes.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getParentFolderPaths(path) {
  const cleanPath = normalizeGitHubFilePath(path);
  if (!cleanPath.includes("/")) return [];
  const parts = cleanPath.split("/").slice(0, -1);
  return parts.map((_, index) => parts.slice(0, index + 1).join("/"));
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = () => reject(new Error("Could not read this file before uploading."));
    reader.readAsDataURL(file);
  });
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

function Button({ children, disabled = false, to, variant = "primary", full = false, onClick, type = "button" }) {
  const className = `button ${variant} ${full ? "full" : ""}`;
  return to ? <Link className={className} to={to}>{children}</Link> : <button className={className} disabled={disabled} onClick={onClick} type={type}>{children}</button>;
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

applyAppearance(readAppearance());
createRoot(document.getElementById("root")).render(<App />);
