import { useNavigate } from "react-router-dom";

export function UpgradeButton({ small = false }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/upgrade")}
      style={{
        background: "#0969da",
        color: "#ffffff",
        border: "none",
        borderRadius: 30,
        padding: small ? "5px 14px" : "10px 24px",
        fontSize: small ? 12 : 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
        whiteSpace: "nowrap"
      }}
      type="button"
    >
      {small ? "Upgrade" : "Upgrade to Pro →"}
    </button>
  );
}
