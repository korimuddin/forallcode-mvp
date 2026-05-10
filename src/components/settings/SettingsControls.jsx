import { Check, Lock } from "lucide-react";

export function SettingsPageHeader({ title, subtitle }) {
  return (
    <div className="settings-page-header">
      <p className="eyebrow">Settings</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

export function SettingsSaveButton({ status = "default", children = "Save changes", onClick, disabled = false }) {
  const label = status === "saving" ? "Saving..." : status === "saved" ? "Saved" : children;

  return (
    <button
      className={`settings-save-button ${status}`}
      disabled={disabled || status === "saving"}
      onClick={onClick}
      type="button"
    >
      {status === "saved" && <Check size={15} />}
      {label}
    </button>
  );
}

export function SettingsToggle({ label, description, checked, onChange, disabled = false, locked = false }) {
  return (
    <button
      className={`settings-toggle-row ${disabled ? "disabled" : ""}`}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      type="button"
    >
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <span className={`settings-toggle ${checked ? "on" : ""}`}>
        {locked ? <Lock size={12} /> : <i />}
      </span>
    </button>
  );
}

export function SettingsRadioCards({ value, options, onChange }) {
  return (
    <div className="settings-radio-cards">
      {options.map((option) => (
        <button
          className={value === option.value ? "active" : ""}
          disabled={option.disabled}
          key={option.value}
          onClick={() => !option.disabled && onChange?.(option.value)}
          type="button"
        >
          {option.preview && <span className="settings-card-preview">{option.preview}</span>}
          <strong>{option.label}</strong>
          {option.description && <small>{option.description}</small>}
          {option.disabled && <em>Coming soon</em>}
        </button>
      ))}
    </div>
  );
}

export function SettingsSwatches({ value, options, onChange }) {
  return (
    <div className="settings-swatch-row">
      {options.map((option) => (
        <button
          aria-label={option.label}
          className={value === option.value ? "active" : ""}
          key={option.value}
          onClick={() => onChange?.(option.value)}
          style={{ background: option.colour }}
          title={option.label}
          type="button"
        />
      ))}
    </div>
  );
}

export function SettingsActions({ children }) {
  return <div className="settings-actions">{children}</div>;
}
