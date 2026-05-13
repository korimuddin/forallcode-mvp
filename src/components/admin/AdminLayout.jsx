import { Link, NavLink, Outlet } from "react-router-dom";

const adminNavItems = [
  { icon: "📊", label: "Overview", to: "/admin/overview" },
  { icon: "👥", label: "Users", to: "/admin/users" },
  { icon: "📚", label: "Course stats", to: "/admin/courses" },
  { icon: "🗄", label: "Data usage", to: "/admin/data" },
  { icon: "🌐", label: "Traffic", to: "/admin/traffic" },
  { icon: "💳", label: "Subscriptions", to: "/admin/subscriptions" },
  { icon: "🏪", label: "Marketplace", to: "/admin/marketplace" },
  { icon: "🔔", label: "Notifications", to: "/admin/notifications" },
  { icon: "⚙️", label: "System health", to: "/admin/system" }
];

export function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div className="admin-page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-title">Admin</div>
        <nav className="admin-nav">
          {adminNavItems.map((item) => (
            <NavLink key={item.to} className="admin-nav-item" to={item.to}>
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <Link className="admin-back-link" to="/dashboard">
          ← Back to ForAllCode
        </Link>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}
