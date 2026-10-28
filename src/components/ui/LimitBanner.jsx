import { LIMIT_DESCRIPTIONS } from "../../lib/plans";
import { useSubscription } from "../../lib/useSubscription";
import { UpgradeButton } from "./UpgradeButton";

export function LimitBanner({ limitKey, currentCount }) {
  const { isPro, limits } = useSubscription();
  if (isPro) return null;

  const limit = limits[limitKey];
  if (!limit || limit === Infinity) return null;

  const atLimit = currentCount >= limit;
  const nearLimit = currentCount >= limit - 1 && !atLimit;

  if (!atLimit && !nearLimit) return null;

  return (
    <div style={{
      background: atLimit ? "#ffebe9" : "#fff8c5",
      border: `1px solid ${atLimit ? "#ffcecb" : "#eac54f"}`,
      borderRadius: 12,
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      fontSize: 13,
      color: "#1f2328",
      marginBottom: 16
    }}>
      <span>
        {atLimit
          ? `You've reached the free limit of ${LIMIT_DESCRIPTIONS[limitKey]?.(limit)}.`
          : `You're using ${currentCount} of ${limit} ${limitKey.replace(/([A-Z])/g, " $1").toLowerCase()}.`}
      </span>
      <UpgradeButton small />
    </div>
  );
}
