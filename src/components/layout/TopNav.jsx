import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, BookOpen, ChevronDown, Code2, Menu, Search, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

const mockUser = {
  displayName: "Mira Patel",
  initials: "MP",
  avatarUrl: ""
};

const recentRepos = [
  { name: "orbit-readme", language: "TypeScript", colour: "#534AB7", path: "/mira/orbit-readme" },
  { name: "desk-notes", language: "CSS", colour: "#27500A", path: "/mira/desk-notes" },
  { name: "first-pr-path", language: "Python", colour: "#0C447C", path: "/mira/first-pr-path" }
];

const notifications = [
  "Lena starred orbit-readme",
  "Dev Collective published a workspace",
  "Mira completed Rebasing",
  "Kai forked first-pr-path",
  "Noor opened a pull request"
];

export default function TopNav() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(mockUser);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const loggedIn = Boolean(session);
  const showAppNav = true;
  const displayName = profile.displayName || session?.user?.email || mockUser.displayName;
  const firstName = displayName.split(" ")[0] || "Mira";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!supabase || !session?.user?.id) {
        setProfile(mockUser);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_style")
        .eq("id", session.user.id)
        .maybeSingle();

      setProfile({
        displayName: data?.display_name || session.user.user_metadata?.name || session.user.email || mockUser.displayName,
        initials: "",
        avatarUrl: ""
      });
    }

    loadProfile();
  }, [session]);

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    navigate("/login");
  }

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <Link className="brand" to={loggedIn ? "/dashboard" : "/"} aria-label="ForAllCode home">
          <span className="brand-mark"><img src="/forallcode-logo.png" alt="" /></span>
          <span>ForAllCode</span>
        </Link>
      </div>

      {showAppNav && (
        <nav className={mobileOpen ? "top-nav-center open" : "top-nav-center"} aria-label="Primary navigation">
          <button className="search-box" onClick={() => window.dispatchEvent(new Event("open-command"))}>
            <Search size={17} />
            <span>Search repos, users, lessons</span>
            <kbd>⌘K</kbd>
          </button>
          <span className="nav-divider" />
          <NavDropdown label="Repos" icon={<Code2 size={16} />}>
            <Link to="/repos">Your repos</Link>
            <Link to="/repos?filter=starred">Starred</Link>
            <Link to="/repos/new">+ New repository</Link>
            <span className="dropdown-divider" />
            {recentRepos.map((repo) => (
              <Link className="repo-dropdown-item" key={repo.name} to={repo.path}>
                <span className="language-dot" style={{ backgroundColor: repo.colour }} />
                {repo.name}
              </Link>
            ))}
          </NavDropdown>
          <NavDropdown label="Learn" icon={<BookOpen size={16} />}>
            <Link to="/learn/pull-requests">Continue: Pull Requests</Link>
            <div className="learn-progress">
              <span>Progress: Git foundations</span>
              <small><b style={{ width: "40%" }} /></small>
            </div>
            <span className="dropdown-divider" />
            <Link to="/learn">Browse all lessons</Link>
          </NavDropdown>
          <NavLink to="/explore">Explore</NavLink>
        </nav>
      )}

      <div className="top-nav-right">
        {showAppNav ? (
          <>
            <div className="dropdown click-dropdown">
              <button className="nav-icon-button" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications">
                <Bell size={18} />
                <b>3</b>
                <ChevronDown size={14} />
              </button>
              {notificationsOpen && (
                <div className="dropdown-menu notification-menu">
                  {notifications.map((item) => <p key={item}>{item}</p>)}
                  <button>Mark all read</button>
                  <Link to="/notifications">View all notifications</Link>
                </div>
              )}
            </div>
            <div className="dropdown click-dropdown">
              <button className="avatar-trigger" onClick={() => setAvatarOpen(!avatarOpen)} aria-label="Account menu">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span className="avatar-face">{profile.initials || initials}</span>}
                <span className="avatar-name">{firstName}</span>
                <ChevronDown size={14} />
              </button>
              {avatarOpen && (
                <div className="dropdown-menu avatar-menu">
                  <p>Signed in as {displayName}</p>
                  <span className="dropdown-divider" />
                  <Link to="/profile">My profile</Link>
                  <Link to="/workspace">My workspace</Link>
                  <Link to="/repos">My repos</Link>
                  <span className="dropdown-divider" />
                  <Link to="/settings/account">Settings</Link>
                  <span className="dropdown-divider" />
                  <button onClick={handleSignOut}>Sign out</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="logged-out-actions">
            <Link className="nav-ghost-button" to="/login">Sign in</Link>
            <Link className="nav-primary-button" to="/login">Get started</Link>
          </div>
        )}
        {showAppNav && (
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </div>
    </header>
  );
}

function NavDropdown({ label, icon, children }) {
  return (
    <div className="dropdown">
      <button className="nav-trigger">
        {icon}
        {label}
        <ChevronDown size={14} />
      </button>
      <div className="dropdown-menu">{children}</div>
    </div>
  );
}
