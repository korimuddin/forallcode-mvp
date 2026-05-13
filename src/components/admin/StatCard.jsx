export default function StatCard({ label, value, delta, deltaLabel, accent = "#9b8fd4" }) {
  const hasDelta = delta !== undefined && delta !== null;
  const positive = Number(delta) >= 0;

  return (
    <div className="admin-stat-card" style={{ "--admin-stat-accent": accent }}>
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
      {hasDelta && (
        <div className={positive ? "admin-stat-delta positive" : "admin-stat-delta negative"}>
          {positive ? "↑" : "↓"} {Math.abs(delta)}% {deltaLabel}
        </div>
      )}
    </div>
  );
}
