const statusStyles = {
  active: { bg: "#c8d8c4", color: "#27500A" },
  pro: { bg: "#ddd5f0", color: "#7a6dc4" },
  free: { bg: "#f4efe6", color: "#9c918c" },
  cancelled: { bg: "#f5d5d8", color: "#72243E" },
  past_due: { bg: "#f5e4c4", color: "#633806" },
  suspended: { bg: "#3d3530", color: "#fffdf9" },
  online: { bg: "#c8d8c4", color: "#27500A" },
  degraded: { bg: "#f5e4c4", color: "#633806" },
  offline: { bg: "#f5d5d8", color: "#72243E" }
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.free;

  return (
    <span className="admin-status-badge" style={{ background: style.bg, color: style.color }}>
      {status}
    </span>
  );
}
