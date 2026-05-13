const GITIGNORE_TEMPLATES = ["Node", "Python", "React", "Rust", "Go", "Java", "Swift", "Ruby", "PHP", "C++"];

export default function GitignoreTemplatePicker({ disabled = false, value, onChange }) {
  return (
    <label className="repo-create-field repo-create-picker">
      <span>.gitignore template</span>
      <select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)}>
        {GITIGNORE_TEMPLATES.map((template) => (
          <option key={template} value={template}>{template}</option>
        ))}
      </select>
    </label>
  );
}
