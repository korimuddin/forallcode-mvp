import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, BookOpen, ChevronDown, Code2, Menu, Search, X } from "lucide-react";
import IllustratedAvatar from "../ui/IllustratedAvatar";
import { supabase } from "../../lib/supabase";

const mockUser = {
  displayName: "Mira Patel",
  initials: "MP",
  avatarUrl: "",
  avatarStyle: "sage"
};

const recentRepos = [
  { name: "orbit-readme", language: "TypeScript", colour: "#534AB7", path: "/mira/orbit-readme" },
  { name: "desk-notes", language: "CSS", colour: "#27500A", path: "/mira/desk-notes" },
  { name: "first-pr-path", language: "Python", colour: "#0C447C", path: "/mira/first-pr-path" }
];

const fallbackNotifications = [
  {
    id: "fallback-star",
    message: "Lena starred orbit-readme",
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    actor: { avatar_style: "rose" }
  },
  {
    id: "fallback-follow",
    message: "Kai followed you",
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    actor: { avatar_style: "sky" }
  },
  {
    id: "fallback-system",
    message: "README Studio draft saved",
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    actor: { avatar_style: "lavender" }
  }
];

export default function TopNav() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(mockUser);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState(fallbackNotifications);
  const [unreadCount, setUnreadCount] = useState(2);
  const [toastMessage, setToastMessage] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const notificationsRef = useRef(null);
  const avatarRef = useRef(null);

  const loggedIn = Boolean(session);
  const showAppNav = loggedIn;
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
    async function loadNotifications() {
      if (!supabase || !session?.user?.id) {
        setNotificationItems(fallbackNotifications);
        setUnreadCount(fallbackNotifications.filter((item) => !item.read).length);
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

      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_style")
        .eq("id", session.user.id)
        .maybeSingle();

      setProfile({
        displayName: data?.display_name || session.user.user_metadata?.name || session.user.email || mockUser.displayName,
        initials: "",
        avatarUrl: "",
        avatarStyle: data?.avatar_style || mockUser.avatarStyle
      });
    }

    loadProfile();
  }, [session]);

  useEffect(() => {
    const closeMenusOnOutsideClick = (event) => {
      const clickedNotifications = notificationsRef.current?.contains(event.target);
      const clickedAvatar = avatarRef.current?.contains(event.target);

      if (!clickedNotifications) setNotificationsOpen(false);
      if (!clickedAvatar) setAvatarOpen(false);
    };

    document.addEventListener("pointerdown", closeMenusOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeMenusOnOutsideClick);
  }, []);

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
