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
  rows = 4
}) {
  return (
    <label className="settings-input">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={readOnly}
          rows={rows}
        />
      ) : (
        <input
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
