import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, BookOpen, ChevronDown, Code2, Menu, Search, X } from "lucide-react";
import IllustratedAvatar from "../ui/IllustratedAvatar";
import { UpgradeButton } from "../ui/UpgradeButton";
import { getUserPreference } from "../../lib/preferences";
import { syncGitHubReposToSupabase, supabase } from "../../lib/supabase";
import { useSubscription } from "../../lib/useSubscription";

const mockUser = {
  displayName: "",
  username: "",
  initials: "MP",
  avatarUrl: "",
  avatarStyle: "sage"
};

export default function TopNav() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(mockUser);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [navRepos, setNavRepos] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchMode, setSearchMode] = useState("local");
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalResults, setGlobalResults] = useState([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState("");
  const { isPro } = useSubscription();
  const notificationsRef = useRef(null);
  const avatarRef = useRef(null);
  const searchRef = useRef(null);

  const loggedIn = Boolean(session);
  const showAppNav = loggedIn;
  const displayName = profile.displayName || session?.user?.email || "Account";
  const firstName = displayName.split(" ")[0] || "Account";
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
    async function loadNotifications() {
      if (!supabase || !session?.user?.id) {
        setNotificationItems([]);
        setUnreadCount(0);
        return undefined;
      }

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("read", false);
      setUnreadCount(count || 0);

      const { data } = await supabase
        .from("notifications")
        .select("*, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_style)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setNotificationItems(data);

      const channel = supabase
        .channel("notifications")
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${session.user.id}`
        }, (payload) => {
          setUnreadCount((current) => current + 1);
          setNotificationItems((current) => [payload.new, ...current].slice(0, 5));
          setToastMessage(payload.new.message || "New notification");
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    }

    let cleanup;
    loadNotifications().then((value) => {
      cleanup = value;
    });
    return () => cleanup?.();
  }, [session]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    async function loadProfile() {
      if (!supabase || !session?.user?.id) {
        setProfile(mockUser);
        return;
      }
      const localProfile = getUserPreference(session.user.id, "profile", null);

      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_style")
        .eq("id", session.user.id)
        .maybeSingle();

      setProfile({
        displayName: localProfile?.displayName || data?.display_name || session.user.user_metadata?.name || session.user.email || mockUser.displayName,
        username: localProfile?.username || data?.username || session.user.user_metadata?.user_name || session.user.user_metadata?.preferred_username || mockUser.username,
        initials: "",
        avatarUrl: localProfile?.avatarUrl || "",
        avatarStyle: localProfile?.avatarStyle || data?.avatar_style || mockUser.avatarStyle
      });
    }

    loadProfile();
  }, [session]);

  useEffect(() => {
    async function loadRepos() {
      if (!session?.user?.id) {
        setNavRepos([]);
        return;
      }

      if (session.provider_token) {
        const syncedRepos = await syncGitHubReposToSupabase(session);
        setNavRepos(syncedRepos.slice(0, 3).map((repo) => ({
          name: repo.name,
          language: repo.language,
          colour: languageColour(repo.language),
          path: `/${repo.owner}/${repo.name}`
        })));
        return;
      }

      if (!supabase) return;
      const { data } = await supabase
        .from("repositories")
        .select("name, language, profiles(username)")
        .eq("owner_id", session.user.id)
        .order("updated_at", { ascending: false })
        .limit(3);

      setNavRepos((data || []).map((repo) => ({
        name: repo.name,
        language: repo.language || "Code",
        colour: languageColour(repo.language),
        path: `/${repo.profiles?.username || profile.username || "me"}/${repo.name}`
      })));
    }

    loadRepos().catch(() => setNavRepos([]));
  }, [profile.username, session]);

  useEffect(() => {
    const closeMenusOnOutsideClick = (event) => {
      const clickedNotifications = notificationsRef.current?.contains(event.target);
      const clickedAvatar = avatarRef.current?.contains(event.target);
      const clickedSearch = searchRef.current?.contains(event.target);

      if (!clickedNotifications) setNotificationsOpen(false);
      if (!clickedAvatar) setAvatarOpen(false);
      if (!clickedSearch) setGlobalResults([]);
    };

    document.addEventListener("pointerdown", closeMenusOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeMenusOnOutsideClick);
  }, []);

  useEffect(() => {
    if (searchMode !== "global") return undefined;
    const query = globalQuery.trim();
    if (query.length < 2) {
      setGlobalResults([]);
      setGlobalSearchError("");
      setGlobalSearchLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setGlobalSearchLoading(true);
      setGlobalSearchError("");

      try {
        const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=6`, {
          headers: {
            Accept: "application/vnd.github+json",
            ...(session?.provider_token ? { Authorization: `Bearer ${session.provider_token}` } : {})
          },
          signal: controller.signal
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.message || "GitHub search failed.");
        setGlobalResults((payload.items || []).map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || "No description yet.",
          language: repo.language || "Code",
          stars: repo.stargazers_count || 0,
          url: repo.html_url
        })));
      } catch (error) {
        if (error.name !== "AbortError") {
          setGlobalResults([]);
          setGlobalSearchError(error.message || "Could not search GitHub.");
        }
      } finally {
        setGlobalSearchLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [globalQuery, searchMode, session]);

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    navigate("/login");
  }

  async function markAllNotificationsRead() {
    setUnreadCount(0);
    setNotificationItems((current) => current.map((item) => ({ ...item, read: true })));
    if (!supabase || !session?.user?.id) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", session.user.id)
      .eq("read", false);
  }

  return (
    <header className="top-nav">
      {toastMessage && <div className="notification-toast" role="status">{toastMessage}</div>}
      <div className="top-nav-left">
        <Link className="brand" to={loggedIn ? "/dashboard" : "/"} aria-label="ForAllCode home">
          <span className="brand-mark"><img src="/forallcode-logo.png" alt="" /></span>
          <span>ForAllCode</span>
        </Link>
      </div>

      {showAppNav && (
        <nav className={mobileOpen ? "top-nav-center open" : "top-nav-center"} aria-label="Primary navigation">
          <div className="nav-search-wrap" ref={searchRef}>
            <div className="search-box integrated-search-box">
              <Search size={17} />
              {searchMode === "local" ? (
                <button className="integrated-local-search" onClick={() => window.dispatchEvent(new Event("open-command"))} type="button">
                  <span>Search your repos, users, lessons</span>
                  <kbd>⌘K</kbd>
                </button>
              ) : (
                <label className="global-search-box">
                  <input
                    value={globalQuery}
                    onChange={(event) => setGlobalQuery(event.target.value)}
                    placeholder="Search all GitHub repos"
                    type="search"
                  />
                  {globalSearchLoading && <small>Searching...</small>}
                </label>
              )}
              <div className="search-scope-toggle" aria-label="Search scope">
              {["local", "global"].map((mode) => (
                <button
                  className={searchMode === mode ? "active" : ""}
                  key={mode}
                  onClick={() => {
                    setSearchMode(mode);
                    setGlobalResults([]);
                    setGlobalSearchError("");
                  }}
                  type="button"
                >
                  {mode === "local" ? "Local" : "Global"}
                </button>
              ))}
              </div>
            </div>
            {searchMode === "global" && (globalResults.length > 0 || globalSearchError || (globalQuery.trim().length >= 2 && !globalSearchLoading)) && (
              <div className="global-search-menu">
                {globalSearchError && <p>{globalSearchError}</p>}
                {!globalSearchError && globalResults.length === 0 && <p>No GitHub repositories found.</p>}
                {globalResults.map((repo) => (
                  <a href={repo.url} key={repo.id} target="_blank" rel="noreferrer">
                    <strong>{repo.fullName}</strong>
                    <span>{repo.description}</span>
                    <small>{repo.language} · {repo.stars.toLocaleString()} stars</small>
                  </a>
                ))}
              </div>
            )}
          </div>
          <span className="nav-divider" />
          <NavDropdown label="Repos" icon={<Code2 size={16} />}>
            <Link to="/repos">Your repos</Link>
            <Link to="/repos?filter=starred">Starred</Link>
            <Link to="/repos/new">+ New repository</Link>
            <span className="dropdown-divider" />
            {navRepos.map((repo) => (
              <Link className="repo-dropdown-item" key={repo.name} to={repo.path}>
                <span className="language-dot" style={{ backgroundColor: repo.colour }} />
                {repo.name}
              </Link>
            ))}
            {navRepos.length === 0 && <p className="dropdown-empty">No GitHub repos synced yet.</p>}
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
          <button className="nav-static-link" type="button" aria-disabled="true">Marketplace</button>
        </nav>
      )}

      <div className="top-nav-right">
        {showAppNav && (
          <>
            <div className="dropdown click-dropdown" ref={notificationsRef}>
              <button className="nav-icon-button" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications">
                <Bell size={18} />
                {unreadCount > 0 && <b aria-label={`${unreadCount} unread notifications`} />}
                <ChevronDown size={14} />
              </button>
              {notificationsOpen && (
                <div className="dropdown-menu notification-menu">
                  {notificationItems.slice(0, 5).map((item) => <NotificationDropdownItem item={item} key={item.id || item.created_at} />)}
                  {notificationItems.length === 0 && <p>No notifications yet.</p>}
                  <button onClick={markAllNotificationsRead}>Mark all as read</button>
                  <Link to="/notifications">View all notifications</Link>
                </div>
              )}
            </div>
            <div className="dropdown click-dropdown" ref={avatarRef}>
              <button className="avatar-trigger" onClick={() => setAvatarOpen(!avatarOpen)} aria-label="Account menu">
                <span className="avatar-face">
                  <IllustratedAvatar size={30} variant={profile.avatarStyle || "sage"} photoUrl={profile.avatarUrl} alt={initials} />
                </span>
                <span className="avatar-name">{firstName}</span>
                <ChevronDown size={14} />
              </button>
              {avatarOpen && (
                <div className="dropdown-menu avatar-menu">
                  <p>Signed in as {displayName}</p>
                  <div className="avatar-plan-row">
                    <span>{isPro ? "Pro" : "Free"} plan</span>
                    {!isPro && <UpgradeButton small />}
                  </div>
                  <span className="dropdown-divider" />
                  <Link to="/profile">My profile</Link>
                  <Link to="/workspace">My workspace</Link>
                  <Link to="/repos">My repos</Link>
                  <Link to="/stars">Starred repos</Link>
                  <span className="dropdown-divider" />
                  <Link to="/settings/account">Settings</Link>
                  <span className="dropdown-divider" />
                  <button onClick={handleSignOut}>Sign out</button>
                </div>
              )}
            </div>
          </>
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

function NotificationDropdownItem({ item }) {
  const actor = item.actor || {};
  return (
    <div className={`notification-dropdown-item ${item.read ? "" : "unread"}`}>
      <IllustratedAvatar size={28} variant={actor.avatar_style || "sage"} />
      <span>
        <strong>{item.message}</strong>
        <small>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</small>
      </span>
    </div>
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

function languageColour(language) {
  const colours = {
    TypeScript: "#534AB7",
    JavaScript: "#633806",
    Python: "#0C447C",
    CSS: "#27500A",
    Rust: "#72243E",
    Shell: "#633806",
    Go: "#0C447C"
  };
  return colours[language] || "#7a6dc4";
}
