export default function DNSInstructions({ domain, verificationToken, verifying = false, onVerify }) {
  if (!domain || !verificationToken) return null;

  return (
    <div className="dns-instructions-card">
      <h3>Set up {domain}</h3>
      <p>Add these two DNS records at your domain registrar.</p>

      <DNSRecord
        eyebrow="Step 1 - Verify ownership (TXT record)"
        rows={[
          ["Type", "TXT"],
          ["Host", "@"],
          ["Value", verificationToken],
          ["TTL", "3600"]
        ]}
      />

      <DNSRecord
        eyebrow="Step 2 - Point to ForAllCode (CNAME record)"
        rows={[
          ["Type", "CNAME"],
          ["Host", "www"],
          ["Value", "cname.forallcode.netlify.app"],
          ["TTL", "3600"]
        ]}
      />

      <p className="dns-instructions-muted">
        DNS changes can take up to 48 hours to propagate, though usually much faster.
      </p>
      <button className="settings-save-button" disabled={verifying} onClick={onVerify} type="button">
        {verifying ? "Verifying..." : "Verify now →"}
      </button>
    </div>
  );
}

function DNSRecord({ eyebrow, rows }) {
  return (
    <div className="dns-record-block">
      <div className="dns-record-eyebrow">{eyebrow}</div>
      <div className="dns-record-table">
        {rows.map(([label, value]) => (
          <div className="dns-record-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
