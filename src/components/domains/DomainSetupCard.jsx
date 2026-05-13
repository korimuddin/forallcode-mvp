import DNSInstructions from "./DNSInstructions";

export default function DomainSetupCard({ domain, verifying = false, onRemove, onVerify, showInstructions = false }) {
  const repoName = domain.repositories?.name || "Landing page";

  return (
    <>
      <tr>
        <td><strong>{domain.domain}</strong></td>
        <td>{repoName}</td>
        <td>
          <span className={domain.verified ? "domain-status verified" : "domain-status pending"}>
            {domain.verified ? "Verified" : "Pending"}
          </span>
        </td>
        <td>{formatDate(domain.created_at)}</td>
        <td>
          <div className="domain-setup-actions">
            {!domain.verified && (
              <button className="settings-ghost" disabled={verifying} onClick={() => onVerify?.(domain)} type="button">
                {verifying ? "Checking..." : "Verify"}
              </button>
            )}
            <button className="settings-ghost danger" onClick={() => onRemove?.(domain)} type="button">Remove</button>
          </div>
        </td>
      </tr>
      {showInstructions && !domain.verified && (
        <tr className="domain-instructions-row">
          <td colSpan="5">
            <DNSInstructions
              domain={domain.domain}
              verificationToken={domain.verification_token}
              verifying={verifying}
              onVerify={() => onVerify?.(domain)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function formatDate(value) {
  if (!value) return "Just now";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
