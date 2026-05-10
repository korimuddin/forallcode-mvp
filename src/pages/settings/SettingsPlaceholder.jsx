export default function SettingsPlaceholder({ title, description }) {
  return (
    <div className="settings-placeholder">
      <p className="eyebrow">Settings</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
