import { useNavigate } from "react-router-dom";

export function UpgradeButton({ small = false }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/upgrade")}
      style={{
        background: "#9b8fd4",
        color: "#fffdf9",
        border: "none",
        borderRadius: 0,
        padding: small ? "5px 14px" : "10px 24px",
        fontSize: small ? 12 : 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "DM Sans, sans-serif",
        whiteSpace: "nowrap"
      }}
      type="button"
    >
      {small ? "Upgrade" : "Upgrade to Pro →"}
    </button>
  );
}
