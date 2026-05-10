export default function SettingsInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  helpText = "",
  maxLength
}) {
  return (
    <label className="settings-input">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      {helpText && <small>{helpText}</small>}
    </label>
  );
}
