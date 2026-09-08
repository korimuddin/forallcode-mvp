import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { BookOpen, Code2, Compass, FileCode2, Home, Info, LayoutDashboard, PanelsTopLeft, Settings, ShoppingBag, Star, User } from "lucide-react";
import { useAuthSession } from "../../lib/hooks";
import { supabase } from "../../lib/supabase";

export default function CommunitySidebar() {
  const { session } = useAuthSession();
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    let alive = true;
    setProfile(null);
    if (supabase && session?.user?.id) {
      supabase.from("profiles").select("username").eq("id", session.user.id).maybeSingle()
        .then(({ data }) => { if (alive) setProfile(data); });
    }
    return () => { alive = false; };
  }, [session?.user?.id]);
  const groups = [
    { label: "Your space", links: [
      ["Home", "/dashboard", Home], ["Repositories", "/repos", Code2],
      ["Learn Git", "/learn", BookOpen], ["Workspace", "/workspace", PanelsTopLeft],
      ["Portfolio", profile?.username ? `/${encodeURIComponent(profile.username)}/portfolio` : "/profile", User]
    ] },
    { label: "Discover", links: [["Explore", "/explore", Compass], ["Starred repositories", "/stars", Star], ["Gists", "/gists", FileCode2], ["Course marketplace", "/marketplace", ShoppingBag]] },
    { label: "Resources", links: [["Settings", "/settings/account", Settings], ["Plans", "/upgrade", LayoutDashboard], ["About ForAllCode", "/about", Info]] }
  ];
  return (
    <aside className="community-sidebar" aria-label="Platform navigation">
      {groups.map(group => <nav aria-label={group.label} key={group.label}>
        <p>{group.label}</p>
        {group.links.map(([label, path, Icon]) => <NavLink key={path} to={path} end={path === "/repos" || path === "/dashboard"} className={({ isActive }) => isActive ? "community-nav-link active" : "community-nav-link"}>
          <Icon size={20} aria-hidden="true" /><span>{label}</span>
        </NavLink>)}
      </nav>)}
      <p className="community-sidebar-note">Learn. Build. Explain.</p>
    </aside>
  );
}
