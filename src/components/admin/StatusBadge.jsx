const statusStyles = {
  active: { bg: "#dafbe1", color: "#116329" },
  pro: { bg: "#ddf4ff", color: "#0550ae" },
  free: { bg: "#f6f8fa", color: "#6e7781" },
  cancelled: { bg: "#ffebe9", color: "#82071e" },
  past_due: { bg: "#fff8c5", color: "#7d4e00" },
  suspended: { bg: "#1f2328", color: "#ffffff" },
  online: { bg: "#dafbe1", color: "#116329" },
  degraded: { bg: "#fff8c5", color: "#7d4e00" },
  offline: { bg: "#ffebe9", color: "#82071e" }
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.free;

  return (
    <span className="admin-status-badge" style={{ background: style.bg, color: style.color }}>
      {status}
    </span>
  );
}
