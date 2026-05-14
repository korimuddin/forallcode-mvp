export default function SettingsInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  helpText = "",
  maxLength,
  readOnly = false,
  multiline = false,
  rows = 4,
  hideLabel = false
}) {
  return (
    <label className="settings-input">
      {!hideLabel && <span>{label}</span>}
      {multiline ? (
        <textarea
          aria-label={hideLabel ? label : undefined}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={readOnly}
          rows={rows}
        />
      ) : (
        <input
          aria-label={hideLabel ? label : undefined}
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={readOnly}
        />
      )}
      {helpText && <small>{helpText}</small>}
    </label>
  );
}
