import React, { lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import CommandPalette from "./components/layout/CommandPalette";
import TopNav from "./components/layout/TopNav";
import LockInOverlay from "./components/lockin/LockInOverlay";
import { AdminGuard } from "./components/admin/AdminGuard";
import GitHubPanelProvider from "./components/GitHubPanel/GitHubPanel";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import ParticleBackground from "./components/ui/ParticleBackground";
import Skeleton from "./components/ui/Skeleton";
import { applyAppearance, readAppearance } from "./lib/appearance";
import { useAuthSession, useDocumentTitle } from "./lib/hooks";
import { getCurrentSession, supabase } from "./lib/supabase";
import { trackUsage } from "./lib/trackUsage";
import { LockInProvider, useLockIn } from "./lib/useLockIn";
import { SubscriptionProvider } from "./lib/useSubscription";
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
const LandingPage = lazy(() => import("./pages/Landing"));
const LandingDesigner = lazy(() => import("./pages/LandingDesigner"));
const LoginPage = lazy(() => import("./pages/Login"));
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
const ReposPage = lazy(() => import("./pages/Repos"));
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

const DashboardPage = lazy(() => import("./pages/AppPages").then(({ DashboardPage }) => ({ default: DashboardPage })));
const WorkspacePage = lazy(() => import("./pages/AppPages").then(({ WorkspacePage }) => ({ default: WorkspacePage })));
const MyProfilePage = lazy(() => import("./pages/AppPages").then(({ MyProfilePage }) => ({ default: MyProfilePage })));
const PublicProfile = lazy(() => import("./pages/AppPages").then(({ PublicProfile }) => ({ default: PublicProfile })));
const RepoPage = lazy(() => import("./pages/AppPages").then(({ RepoPage }) => ({ default: RepoPage })));
const LearnPage = lazy(() => import("./pages/AppPages").then(({ LearnPage }) => ({ default: LearnPage })));

function App() {
  useEffect(() => {
    function handleUnhandledRejection(event) {
      reportToSentry(event.reason);
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  return (
    <ErrorBoundary>
      <SubscriptionProvider>
        <LockInProvider>
          <BrowserRouter>
            <GitHubPanelProvider>
              <AppearanceRuntime />
              <AppRoutes />
            </GitHubPanelProvider>
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
      <ParticleBackground />
      {isActive && <LockInOverlay />}
      {completionMessage && <div className="lockin-toast" role="status">{completionMessage}</div>}
      {!isEntryPage && !isPortfolioPage && !isCertificatePage && <CommandPalette />}
      <div className={isEntryPage ? "app-shell entry-shell" : isPortfolioPage ? "app-shell portfolio-shell" : isCertificatePage ? "app-shell certificate-shell" : "app-shell"}>
        {!isEntryPage && !isPortfolioPage && !isCertificatePage && <TopNav />}
        {!isEntryPage && !isPortfolioPage && !isCertificatePage && <ImpersonationBanner />}
        <main>
          <ChunkLoadBoundary key={location.pathname}>
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
          </ChunkLoadBoundary>
        </main>
        {!isEntryPage && !isPortfolioPage && !isCertificatePage && <Footer />}
      </div>
    </>
  );
}

class ChunkLoadBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    reportToSentry(error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="route-error-card" role="alert">
        <h1>Something went wrong.</h1>
        <p>Refresh to get the newest version of ForAllCode.</p>
        <button type="button" onClick={() => window.location.reload()}>Refresh</button>
      </div>
    );
  }
}

function reportToSentry(error) {
  if (typeof window === "undefined") return;
  const sentry = window.Sentry;
  if (!sentry?.captureException) return;
  sentry.captureException(error instanceof Error ? error : new Error(String(error || "Unhandled rejection")));
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

function PageFrame({ title, eyebrow, children }) {
  return <div className="page-frame">{(title || eyebrow) && <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>}{children}</div>;
}

function Card({ children, large = false }) {
  return <article className={large ? "card large-card" : "card"}>{children}</article>;
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
