import { useSubscription } from "../../lib/useSubscription";
import { UpgradeButton } from "./UpgradeButton";

export function ProGate({ children, feature, description }) {
  const { isPro } = useSubscription();

  if (isPro) return children;

  return (
    <div style={{
      background: "linear-gradient(135deg, #f6f8fa, #ddf4ff)",
      border: "1px solid #b6e3ff",
      borderRadius: 16,
      padding: "24px 28px",
      textAlign: "center"
    }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>✦</div>
      <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif", fontSize: 16, color: "#1f2328", marginBottom: 6 }}>
        {feature} is a Pro feature
      </h3>
      <p style={{ fontSize: 13, color: "#656d76", marginBottom: 18, maxWidth: 320, margin: "0 auto 18px" }}>
        {description}
      </p>
      <UpgradeButton />
    </div>
  );
}
