export const ADMIN_CHART_COLORS = {
  primary: "#0969da",
  secondary: "#1a7f37",
  danger: "#cf222e",
  warning: "#9a6700",
  info: "#6aa8d4",
  neutral: "#6e7781"
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
