import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Rocket } from "lucide-react";
import DesignerPreview from "../components/landing-designer/DesignerPreview";

const ownerUsername = "mira";

export const landingThemes = [
  { name: "Lavender", key: "lavender", accent: "#9b8fd4", light: "#f0ecff", dark: "#7a6dc4" },
  { name: "Sage", key: "sage", accent: "#7aaa72", light: "#eef7ec", dark: "#27500A" },
  { name: "Rose", key: "rose", accent: "#d4848c", light: "#fdf0f1", dark: "#72243E" },
  { name: "Sky", key: "sky", accent: "#6aa8d4", light: "#edf6ff", dark: "#0C447C" },
  { name: "Amber", key: "amber", accent: "#c8a055", light: "#fff8ed", dark: "#633806" }
];

export const stylePresets = {
  cosy: {
    label: "Cosy",
    heroBackground: "linear-gradient(135deg, var(--light), var(--light2))",
    headingColor: "#3d3530",
    headingSize: "38px",
    headingWeight: "500",
    fontFamily: "Lora, serif",
    bodyColor: "#6b5f58",
    featureBg: "#fffdf9",
    featureBorder: "1px solid #e8e0d4",
    borderRadius: "16px",
    ctaBg: "var(--light)"
  },
  bold: {
    label: "Bold",
    heroBackground: "var(--accent)",
    headingColor: "#fffdf9",
    headingSize: "42px",
    headingWeight: "700",
    fontFamily: "DM Sans, sans-serif",
    bodyColor: "rgba(255,253,249,0.85)",
    featureBg: "rgba(255,253,249,0.12)",
    featureBorder: "1px solid rgba(255,253,249,0.2)",
    borderRadius: "12px",
    ctaBg: "var(--accent)"
  },
  minimal: {
    label: "Minimal",
    heroBackground: "#fffdf9",
    headingColor: "#3d3530",
    headingSize: "40px",
    headingWeight: "600",
    fontFamily: "DM Sans, sans-serif",
    bodyColor: "#6b5f58",
    featureBg: "#faf7f2",
    featureBorder: "1px solid #e8e0d4",
    borderRadius: "8px",
    ctaBg: "#faf7f2"
  }
};

const designerSections = [
  { key: "navigation", title: "Navigation", description: "Logo, links, CTA button" },
  { key: "hero", title: "Hero", description: "Headline, tagline, buttons" },
  { key: "features", title: "Features", description: "3-column icon + text grid" },
  { key: "cta", title: "CTA banner", description: "Big call to action" },
  { key: "footer", title: "Footer", description: "Links, copyright" }
];

const fontOptions = [
  { key: "lora", label: "Lora (serif)", description: "Elegant and warm", stack: "Lora, serif" },
  { key: "dm-sans", label: "DM Sans", description: "Clean and modern", stack: "DM Sans, sans-serif" }
];

export default function LandingDesigner() {
  const { username = ownerUsername, repo = "orbit-readme" } = useParams();
  const [activeSection, setActiveSection] = useState("navigation");
  const [theme, setTheme] = useState(landingThemes[0]);
  const [stylePreset, setStylePreset] = useState("cosy");
  const [viewport, setViewport] = useState("desktop");
  const [content, setContent] = useState({
    projectName: repo,
    tagline: "Readable projects from the first scroll.",
    ctaText: "Read the docs",
    secondaryCta: "View on GitHub"
  });
  const [font, setFont] = useState(fontOptions[0]);

  const isOwner = username === ownerUsername;
  const selectedPreset = stylePresets[stylePreset];

  const designerState = useMemo(() => ({
    activeSection,
    theme,
    stylePreset,
    preset: selectedPreset,
    viewport,
    content,
    font
  }), [activeSection, theme, stylePreset, selectedPreset, viewport, content, font]);

  const preview = useMemo(() => (
    <DesignerPreview
      activeSection={designerState.activeSection}
      content={designerState.content}
      font={designerState.font.key}
      repoName={repo}
      theme={designerState.theme}
      style={designerState.preset}
      username={username}
      viewport={designerState.viewport}
    />
  ), [designerState, repo, username]);

  if (!isOwner) {
    return <Navigate to={`/${username}/${repo}`} replace />;
  }

  function updateContent(key, value) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="landing-designer-page">
      <header className="landing-designer-header">
        <div className="landing-designer-path">
          <Link to={`/${username}/${repo}`} aria-label="Back to repository"><ArrowLeft size={17} /></Link>
          <span>{username}</span>
          <span>/</span>
          <strong>{repo}</strong>
          <span>/ landing page</span>
        </div>

        <div className="landing-designer-actions">
          <div className="designer-device-toggle" aria-label="Preview size">
            <button className={viewport === "desktop" ? "active" : ""} onClick={() => setViewport("desktop")} type="button">Desktop</button>
            <button className={viewport === "mobile" ? "active" : ""} onClick={() => setViewport("mobile")} type="button">Mobile</button>
          </div>
          <button className="designer-ghost-button" type="button"><Download size={14} />Export HTML</button>
          <button className="designer-publish-button" type="button"><Rocket size={14} />Publish</button>
        </div>
      </header>

      <div className="landing-designer-body">
        <aside className="landing-designer-panel">
          <PanelSection label="Sections">
            <div className="designer-section-list">
              {designerSections.map((section) => (
                <button
                  className={activeSection === section.key ? "active" : ""}
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  type="button"
                >
                  <span>{section.title}</span>
                  <small>{section.description}</small>
                </button>
              ))}
            </div>
          </PanelSection>

          <PanelSection label="Theme colour">
            <div className="designer-theme-swatches">
              {landingThemes.map((option) => (
                <button
                  className={theme.key === option.key ? "active" : ""}
                  key={option.key}
                  onClick={() => setTheme(option)}
                  style={{ background: option.accent }}
                  type="button"
                  aria-label={option.name}
                />
              ))}
            </div>
          </PanelSection>

          <PanelSection label="Style">
            <div className="designer-style-presets">
              {Object.entries(stylePresets).map(([key, preset]) => (
                <button className={stylePreset === key ? "active" : ""} key={key} onClick={() => setStylePreset(key)} type="button">
                  {preset.label}
                </button>
              ))}
            </div>
          </PanelSection>

          <PanelSection label="Content">
            <div className="designer-content-fields">
              <label>Project name<input value={content.projectName} onChange={(event) => updateContent("projectName", event.target.value)} /></label>
              <label>Tagline<input value={content.tagline} onChange={(event) => updateContent("tagline", event.target.value)} /></label>
              <label>CTA button text<input value={content.ctaText} onChange={(event) => updateContent("ctaText", event.target.value)} /></label>
              <label>Secondary CTA<input value={content.secondaryCta} onChange={(event) => updateContent("secondaryCta", event.target.value)} /></label>
            </div>
          </PanelSection>

          <PanelSection label="Font">
            <div className="designer-font-options">
              {fontOptions.map((option) => (
                <label className={font.key === option.key ? "active" : ""} key={option.key} style={{ fontFamily: option.stack }}>
                  <input type="radio" name="designer-font" checked={font.key === option.key} onChange={() => setFont(option)} />
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </label>
              ))}
            </div>
          </PanelSection>
        </aside>

        {preview}
      </div>
    </section>
  );
}

function PanelSection({ label, children }) {
  return (
    <section className="designer-panel-section">
      <h2>{label}</h2>
      {children}
    </section>
  );
}
