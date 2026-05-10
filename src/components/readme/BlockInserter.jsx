import { useState } from "react";
import { X } from "lucide-react";

const badgeColors = [
  { label: "Lavender", value: "9b8fd4" },
  { label: "Sage", value: "7aaa72" },
  { label: "Rose", value: "d4848c" },
  { label: "Sky", value: "6aa8d4" },
  { label: "Amber", value: "c8a055" },
  { label: "Ink", value: "6b5f58" }
];

const heroBadgeOptions = ["version", "license", "language", "build"];
const codeLanguages = ["javascript", "typescript", "python", "bash", "rust", "go", "css", "sql", "json"];

const blockTypes = [
  { id: "hero", title: "Hero banner", description: "Project title, tagline, and badges." },
  { id: "badges", title: "Badge row", description: "Pastel shield badges for status and metadata." },
  { id: "features", title: "Feature grid", description: "Three compact cards in a README-safe table." },
  { id: "code", title: "Code block", description: "Language-aware fenced code snippet." },
  { id: "install", title: "Installation section", description: "Package install commands." },
  { id: "contributors", title: "Contributors section", description: "Contribution note and avatar wall." },
  { id: "divider", title: "Divider", description: "A clean horizontal break." }
];

function shield(label, message, color) {
  const encodedLabel = encodeURIComponent(label.trim() || "badge");
  const encodedMessage = encodeURIComponent(message.trim() || "text");
  return `https://img.shields.io/badge/${encodedLabel}-${encodedMessage}-${color}?style=flat-square`;
}

export default function BlockInserter({ open, onClose, onInsert, githubUsername, repoName }) {
  const [active, setActive] = useState("hero");
  const [hero, setHero] = useState({
    name: repoName || "Project Name",
    tagline: "Tagline goes here",
    badges: ["version", "license"],
    gradient: "lavender"
  });
  const [badges, setBadges] = useState([{ label: "version", text: "1.0.0", color: "9b8fd4", url: "" }]);
  const [features, setFeatures] = useState([
    { icon: "⚡", title: "Fast", description: "Zero runtime deps" },
    { icon: "♿", title: "Accessible", description: "WAI-ARIA friendly" },
    { icon: "🎨", title: "Themeable", description: "CSS variables" }
  ]);
  const [code, setCode] = useState({ language: "javascript", value: "// code here" });
  const [packageName, setPackageName] = useState(repoName || "your-package");
  const [contributors, setContributors] = useState({ username: githubUsername || "username", repo: repoName || "repo" });

  function insert(markdown) {
    onInsert(`\n\n${markdown.trim()}\n\n`);
  }

  function updateBadge(index, key, value) {
    setBadges((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }

  function updateFeature(index, key, value) {
    setFeatures((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }

  function toggleHeroBadge(value) {
    setHero((current) => ({
      ...current,
      badges: current.badges.includes(value)
        ? current.badges.filter((badge) => badge !== value)
        : [...current.badges, value]
    }));
  }

  function generateHero() {
    const badgeMap = {
      version: `<img src="${shield("version", "1.0.0", "9b8fd4")}" alt="version"/>`,
      license: `<img src="${shield("license", "MIT", "7aaa72")}" alt="license"/>`,
      language: `<img src="${shield("language", "TypeScript", "6aa8d4")}" alt="language"/>`,
      build: `<img src="${shield("build", "passing", "c8a055")}" alt="build"/>`
    };

    return `<div align="center">
  <h1>🚀 ${hero.name}</h1>
  <p><em>${hero.tagline}</em></p>
  ${hero.badges.map((badge) => badgeMap[badge]).join("\n  ")}
</div>

---`;
  }

  function generateBadges() {
    return badges.map((badge) => {
      const image = `![${badge.label}](${shield(badge.label, badge.text, badge.color)})`;
      return badge.url ? `[${image}](${badge.url})` : image;
    }).join("\n");
  }

  function generateFeatures() {
    return `<table>
  <tr>
${features.map((feature) => `    <td align="center"><b>${feature.icon} ${feature.title}</b><br/>${feature.description}</td>`).join("\n")}
  </tr>
</table>`;
  }

  function generateInstallation() {
    return `## Installation

\`\`\`bash
npm install ${packageName}
# or
yarn add ${packageName}
\`\`\``;
  }

  function generateContributors() {
    return `## Contributors

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.

[![Contributors](https://contrib.rocks/image?repo=${contributors.username}/${contributors.repo})](https://github.com/${contributors.username}/${contributors.repo}/graphs/contributors)`;
  }

  function submitActive(event) {
    event.preventDefault();
    const generators = {
      hero: generateHero,
      badges: generateBadges,
      features: generateFeatures,
      code: () => `\`\`\`${code.language}\n${code.value}\n\`\`\``,
      install: generateInstallation,
      contributors: generateContributors
    };
    insert(generators[active]());
  }

  function renderForm() {
    if (active === "divider") {
      return (
        <div className="block-inserter-form">
          <p>Insert a simple horizontal divider at the current cursor position.</p>
          <button type="button" className="block-inserter-submit" onClick={() => insert("---")}>Insert →</button>
        </div>
      );
    }

    if (active === "hero") {
      return (
        <form className="block-inserter-form" onSubmit={submitActive}>
          <label>Project name<input value={hero.name} onChange={(event) => setHero({ ...hero, name: event.target.value })} /></label>
          <label>Tagline<input value={hero.tagline} onChange={(event) => setHero({ ...hero, tagline: event.target.value })} /></label>
          <fieldset>
            <legend>Badges</legend>
            <div className="block-chip-row">
              {heroBadgeOptions.map((badge) => (
                <button className={hero.badges.includes(badge) ? "active" : ""} key={badge} type="button" onClick={() => toggleHeroBadge(badge)}>{badge}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Gradient</legend>
            <div className="block-swatch-row">
              {["lavender", "sage", "rose", "sky", "amber"].map((gradient) => (
                <button className={`${gradient} ${hero.gradient === gradient ? "active" : ""}`} key={gradient} type="button" onClick={() => setHero({ ...hero, gradient })} aria-label={gradient} />
              ))}
            </div>
          </fieldset>
          <button className="block-inserter-submit" type="submit">Insert →</button>
        </form>
      );
    }

    if (active === "badges") {
      return (
        <form className="block-inserter-form" onSubmit={submitActive}>
          {badges.map((badge, index) => (
            <div className="badge-form-row" key={index}>
              <label>Label<input value={badge.label} onChange={(event) => updateBadge(index, "label", event.target.value)} /></label>
              <label>Text<input value={badge.text} onChange={(event) => updateBadge(index, "text", event.target.value)} /></label>
              <label>URL<input value={badge.url} placeholder="optional" onChange={(event) => updateBadge(index, "url", event.target.value)} /></label>
              <div className="block-swatch-row">
                {badgeColors.map((color) => (
                  <button className={badge.color === color.value ? "active" : ""} key={color.value} type="button" style={{ background: `#${color.value}` }} onClick={() => updateBadge(index, "color", color.value)} aria-label={color.label} />
                ))}
              </div>
            </div>
          ))}
          <button type="button" className="block-secondary-button" onClick={() => setBadges([...badges, { label: "badge", text: "text", color: "9b8fd4", url: "" }])}>+ Add another badge</button>
          <button className="block-inserter-submit" type="submit">Insert →</button>
        </form>
      );
    }

    if (active === "features") {
      return (
        <form className="block-inserter-form" onSubmit={submitActive}>
          {features.map((feature, index) => (
            <div className="feature-form-row" key={index}>
              <label>Icon<input maxLength="2" value={feature.icon} onChange={(event) => updateFeature(index, "icon", event.target.value)} /></label>
              <label>Title<input value={feature.title} onChange={(event) => updateFeature(index, "title", event.target.value)} /></label>
              <label>Description<input value={feature.description} onChange={(event) => updateFeature(index, "description", event.target.value)} /></label>
            </div>
          ))}
          <button className="block-inserter-submit" type="submit">Insert →</button>
        </form>
      );
    }

    if (active === "code") {
      return (
        <form className="block-inserter-form" onSubmit={submitActive}>
          <label>Language<select value={code.language} onChange={(event) => setCode({ ...code, language: event.target.value })}>{codeLanguages.map((language) => <option key={language} value={language}>{language}</option>)}</select></label>
          <label>Code<textarea rows="6" value={code.value} onChange={(event) => setCode({ ...code, value: event.target.value })} /></label>
          <button className="block-inserter-submit" type="submit">Insert →</button>
        </form>
      );
    }

    if (active === "install") {
      return (
        <form className="block-inserter-form" onSubmit={submitActive}>
          <label>Package name<input value={packageName} onChange={(event) => setPackageName(event.target.value)} /></label>
          <button className="block-inserter-submit" type="submit">Insert →</button>
        </form>
      );
    }

    return (
      <form className="block-inserter-form" onSubmit={submitActive}>
        <label>GitHub username<input value={contributors.username} onChange={(event) => setContributors({ ...contributors, username: event.target.value })} /></label>
        <label>Repo name<input value={contributors.repo} onChange={(event) => setContributors({ ...contributors, repo: event.target.value })} /></label>
        <button className="block-inserter-submit" type="submit">Insert →</button>
      </form>
    );
  }

  return (
    <aside className={`block-inserter ${open ? "open" : ""}`} aria-hidden={!open}>
      <div className="block-inserter-inner">
        <div className="block-inserter-header">
          <h2>Insert block</h2>
          <button type="button" onClick={onClose} aria-label="Close insert block"><X size={16} /></button>
        </div>

        <div className="block-card-list">
          {blockTypes.map((block) => (
            <button className={active === block.id ? "active" : ""} key={block.id} type="button" onClick={() => setActive(block.id)}>
              <span>{block.title}</span>
              <small>{block.description}</small>
            </button>
          ))}
        </div>

        {renderForm()}
      </div>
    </aside>
  );
}
