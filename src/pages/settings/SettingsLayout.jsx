import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  Brush,
  Github,
  Globe,
  Lock,
  Monitor,
  Shield,
  TriangleAlert,
  User,
  UserCircle
} from "lucide-react";
import { useDocumentTitle } from "../../lib/hooks";
import { useSubscription } from "../../lib/useSubscription";

const settingsGroups = [
  {
    label: "Your account",
    items: [
      { label: "Account", path: "account", icon: UserCircle },
      { label: "Profile", path: "profile", icon: User },
      { label: "Workspace", path: "workspace", icon: Monitor },
      { label: "Appearance", path: "appearance", icon: Brush }
    ]
  },
  {
    label: "Privacy and data",
    items: [
      { label: "Notifications", path: "notifications", icon: Bell },
      { label: "Integrations", path: "integrations", icon: Github },
      { label: "Domains", path: "domains", icon: Globe },
      { label: "Privacy", path: "privacy", icon: Shield },
      { label: "Danger zone", path: "danger", icon: TriangleAlert, danger: true }
    ]
  }
];

export default function SettingsLayout() {
  const location = useLocation();
  const { isPro } = useSubscription();
  const activeSegment = location.pathname.split("/").filter(Boolean).pop() || "account";
  const title = activeSegment.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
  useDocumentTitle(`${title} settings`);

  return (
    <div className="settings-shell">
      <aside className="settings-sidebar" aria-label="Settings navigation">
        <h1>Settings</h1>
        {settingsGroups.map((group) => (
          <nav key={group.label} aria-label={group.label}>
            <p>{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  className={({ isActive }) => [
                    "settings-nav-item",
                    item.danger ? "danger" : "",
                    isActive ? "active" : ""
                  ].filter(Boolean).join(" ")}
                  key={item.path}
                  to={item.path}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.path === "account" && <b className="settings-plan-badge">{isPro ? "Pro" : "Free"}</b>}
                </NavLink>
              );
            })}
          </nav>
        ))}
      </aside>
      <main className="settings-content">
        <Outlet />
      </main>
    </div>
  );
}
