export const ADMIN_CHART_COLORS = {
  primary: "#9b8fd4",
  secondary: "#7aaa72",
  danger: "#d4848c",
  warning: "#c8a055",
  info: "#6aa8d4",
  neutral: "#9c918c"
};

export default function AdminChart({ title, subtitle, children, height = 200 }) {
  return (
    <section className="admin-chart-card">
      <div className="admin-chart-head">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="admin-chart-body" style={{ height }}>
        {children}
      </div>
    </section>
  );
}
