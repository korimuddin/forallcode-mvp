import { useSubscription } from "../../lib/useSubscription";
import { UpgradeButton } from "./UpgradeButton";

export function ProGate({ children, feature, description }) {
  const { isPro } = useSubscription();

  if (isPro) return children;

  return (
    <div style={{
      background: "linear-gradient(135deg, #f4efe6, #ddd5f0)",
      border: "1px solid #c4b8e8",
      borderRadius: 0,
      padding: "24px 28px",
      textAlign: "center"
    }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>✦</div>
      <h3 style={{ fontFamily: "Lora, serif", fontSize: 16, color: "#3d3530", marginBottom: 6 }}>
        {feature} is a Pro feature
      </h3>
      <p style={{ fontSize: 13, color: "#6b5f58", marginBottom: 18, maxWidth: 320, margin: "0 auto 18px" }}>
        {description}
      </p>
      <UpgradeButton />
    </div>
  );
}
