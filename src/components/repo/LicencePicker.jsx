const LICENCE_OPTIONS = [
  { label: "MIT", value: "mit" },
  { label: "Apache 2.0", value: "apache-2.0" },
  { label: "GPL 3.0", value: "gpl-3.0" },
  { label: "None", value: "none" }
];

export default function LicencePicker({ disabled = false, value, onChange }) {
  return (
    <label className="repo-create-field repo-create-picker">
      <span>Licence</span>
      <select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)}>
        {LICENCE_OPTIONS.map((licence) => (
          <option key={licence.value} value={licence.value}>{licence.label}</option>
        ))}
      </select>
    </label>
  );
}
