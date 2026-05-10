export default function SettingsSection({ title, description, children }) {
  return (
    <div className="settings-section">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
      <hr />
    </div>
  );
}
