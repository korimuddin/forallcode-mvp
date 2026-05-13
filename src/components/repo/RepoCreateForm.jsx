import { AlertCircle, CheckCircle2, Globe2, Lock, Sparkles } from "lucide-react";
import GitignoreTemplatePicker from "./GitignoreTemplatePicker";
import LicencePicker from "./LicencePicker";

export const REPO_CREATE_TEMPLATES = [
  { id: "react", name: "React starter", emoji: "⚛", gitignore: "Node", readme: true, licence: "mit" },
  { id: "python", name: "Python project", emoji: "🐍", gitignore: "Python", readme: true, licence: "mit" },
  { id: "docs", name: "Documentation", emoji: "📄", gitignore: "Node", readme: true, licence: "none" },
  { id: "portfolio", name: "Portfolio", emoji: "✦", gitignore: "Node", readme: true, licence: "none" },
  { id: "blank", name: "Blank", emoji: "○", gitignore: null, readme: false, licence: "none" }
];

export default function RepoCreateForm({
  availability,
  creating,
  disabled,
  form,
  onBlurName,
  onChange,
  onSubmit,
  ownerOptions,
  privateRepoLimitReached,
  status
}) {
  function update(field, value) {
    onChange({ ...form, [field]: value });
  }

  function applyTemplate(template) {
    onChange({
      ...form,
      templateId: template.id,
      addReadme: template.readme,
      addGitignore: Boolean(template.gitignore),
      gitignoreTemplate: template.gitignore || form.gitignoreTemplate,
      addLicence: template.licence !== "none",
      licenceId: template.licence
    });
  }

  const nameMessage = availability.message && (
    <p className={`repo-create-name-state ${availability.status}`}>
      {availability.status === "available" && <CheckCircle2 size={16} />}
      {availability.status === "taken" && <AlertCircle size={16} />}
      {availability.status === "invalid" && <AlertCircle size={16} />}
      {availability.status === "checking" && <Sparkles size={16} />}
      {availability.message}
    </p>
  );

  return (
    <form className="repo-create-form" onSubmit={onSubmit}>
      <div className="repo-create-owner-row">
        <label className="repo-create-field">
          <span>Owner</span>
          <select value={form.owner} onChange={(event) => update("owner", event.target.value)}>
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
          </select>
        </label>
        <label className="repo-create-field repo-create-name-field">
          <span>Repository name</span>
          <input
            aria-invalid={availability.status === "taken" || availability.status === "invalid"}
            onBlur={onBlurName}
            onChange={(event) => update("name", event.target.value)}
            placeholder="my-warm-project"
            value={form.name}
          />
          {nameMessage}
        </label>
      </div>

      <label className="repo-create-field">
        <span>Description</span>
        <textarea
          onChange={(event) => update("description", event.target.value)}
          placeholder="A short, welcoming description for contributors."
          rows={2}
          value={form.description}
        />
      </label>

      <div className="repo-create-section">
        <span className="repo-create-section-title">Visibility</span>
        <div className="repo-create-visibility">
          <button
            className={form.visibility === "public" ? "active public" : "public"}
            onClick={() => update("visibility", "public")}
            type="button"
          >
            <Globe2 size={18} />
            <span><strong>Public</strong><small>Anyone can see this repository.</small></span>
          </button>
          <button
            className={form.visibility === "private" ? "active private" : "private"}
            disabled={privateRepoLimitReached}
            onClick={() => update("visibility", "private")}
            type="button"
          >
            <Lock size={18} />
            <span><strong>Private</strong><small>Only people you invite can see it.</small></span>
          </button>
        </div>
      </div>

      <div className="repo-create-section">
        <span className="repo-create-section-title">Start with a template</span>
        <div className="repo-template-grid">
          {REPO_CREATE_TEMPLATES.map((template) => (
            <button
              className={form.templateId === template.id ? "active" : ""}
              key={template.id}
              onClick={() => applyTemplate(template)}
              type="button"
            >
              <span>{template.emoji}</span>
              <strong>{template.name}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="repo-create-section">
        <span className="repo-create-section-title">Initialize repository</span>
        <label className="repo-create-checkbox">
          <input checked={form.addReadme} onChange={(event) => update("addReadme", event.target.checked)} type="checkbox" />
          <span>Add README</span>
        </label>
        <label className="repo-create-checkbox">
          <input checked={form.addGitignore} onChange={(event) => update("addGitignore", event.target.checked)} type="checkbox" />
          <span>Add .gitignore</span>
        </label>
        {form.addGitignore && (
          <GitignoreTemplatePicker value={form.gitignoreTemplate} onChange={(value) => update("gitignoreTemplate", value)} />
        )}
        <label className="repo-create-checkbox">
          <input checked={form.addLicence} onChange={(event) => update("addLicence", event.target.checked)} type="checkbox" />
          <span>Choose licence</span>
        </label>
        {form.addLicence && (
          <LicencePicker value={form.licenceId} onChange={(value) => update("licenceId", value)} />
        )}
      </div>

      {status && <p className="repo-create-status" role="status">{status}</p>}

      <button className="repo-create-submit" disabled={disabled || creating} type="submit">
        {creating ? "Creating repository..." : "Create repository"}
      </button>
    </form>
  );
}
