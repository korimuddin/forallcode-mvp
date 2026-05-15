export default function ErrorState({ error, resource }) {
  const message = error?.message || "This GitHub link could not be rendered inside ForAllCode yet.";

  return (
    <div className="github-panel-error" role="alert">
      <span>!</span>
      <h3>{message}</h3>
      <p>
        {resource?.htmlUrl
          ? "You can still open the original page on GitHub from the panel header."
          : "Try another GitHub link, or open the original page directly."}
      </p>
    </div>
  );
}
