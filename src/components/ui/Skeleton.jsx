export default function Skeleton({ className = "", lines = 1, variant = "block" }) {
  if (lines > 1) {
    return (
      <div className={`skeleton-stack ${className}`.trim()} aria-hidden="true">
        {Array.from({ length: lines }).map((_, index) => (
          <span className={`skeleton skeleton-${variant}`} key={index} />
        ))}
      </div>
    );
  }

  return <span className={`skeleton skeleton-${variant} ${className}`.trim()} aria-hidden="true" />;
}
