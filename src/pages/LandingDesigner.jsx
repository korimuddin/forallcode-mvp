import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Rocket } from "lucide-react";
import DesignerPreview from "../components/landing-designer/DesignerPreview";
import { LimitBanner } from "../components/ui/LimitBanner";
import { ProGate } from "../components/ui/ProGate";
import { useDocumentTitle, useIsMobile } from "../lib/hooks";
import { isAtLimit } from "../lib/plans";
import { getCurrentSession, supabase } from "../lib/supabase";
import { trackUsage } from "../lib/trackUsage";
import { useSubscription } from "../lib/useSubscription";

const ownerUsername = "";

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
  const { username = ownerUsername, repo = "" } = useParams();
  useDocumentTitle(`${repo} Landing Designer`);
  const isMobile = useIsMobile();
  const { planId } = useSubscription();
  const userIdRef = useRef(null);
  const [activeSection, setActiveSection] = useState("navigation");
  const [theme, setTheme] = useState(landingThemes[0]);
  const [stylePreset, setStylePreset] = useState("cosy");
  const [viewport, setViewport] = useState("desktop");
  const [publishState, setPublishState] = useState("idle");
  const [status, setStatus] = useState("Ready");
  const [content, setContent] = useState({
    projectName: repo,
    tagline: "Readable projects from the first scroll.",
    ctaText: "Read the docs",
    secondaryCta: "View on GitHub"
  });
  const [font, setFont] = useState(fontOptions[0]);
  const [landingPageCount, setLandingPageCount] = useState(0);
  const [currentRepoHasLanding, setCurrentRepoHasLanding] = useState(false);

  const isOwner = username === ownerUsername;
  const landingPageLimitReached = isAtLimit(planId, "landingPages", landingPageCount);
  const publishLocked = landingPageLimitReached && !currentRepoHasLanding;
  const selectedPreset = stylePresets[stylePreset];
  const effectiveViewport = isMobile ? "mobile" : viewport;

  const currentConfig = useMemo(() => ({
    projectName: content.projectName,
    tagline: content.tagline,
    ctaText: content.ctaText,
    secondaryCta: content.secondaryCta,
    theme: theme.key,
    style: stylePreset,
    font: font.key
  }), [content, theme.key, stylePreset, font.key]);

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
      viewport={effectiveViewport}
    />
  ), [designerState, effectiveViewport, repo, username]);

  useEffect(() => {
    async function loadSession() {
      const session = await getCurrentSession();
      const userId = session?.user?.id || null;
      userIdRef.current = userId;
      if (!supabase || !userId) return;

      const [{ count }, { data: currentRepo }] = await Promise.all([
        supabase
          .from("repositories")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", userId)
          .not("landing_page_html", "is", null),
        supabase
          .from("repositories")
          .select("landing_page_html")
          .eq("owner_id", userId)
          .eq("name", repo)
          .maybeSingle()
      ]);

      setLandingPageCount(count || 0);
      setCurrentRepoHasLanding(Boolean(currentRepo?.landing_page_html));
    }

    loadSession();
  }, [repo]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!supabase || !userIdRef.current) return;

      const { error } = await supabase
        .from("repositories")
        .update({ landing_page_config: currentConfig })
        .eq("owner_id", userIdRef.current)
        .eq("name", repo);

      if (!error) setStatus("Landing settings auto-saved");
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [currentConfig, repo]);

  if (!isOwner) {
    return <Navigate to={`/${username}/${repo}`} replace />;
  }

  function updateContent(key, value) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  function resolveStyleToken(value, themeData) {
    return value
      .replaceAll("var(--accent)", themeData.accent)
      .replaceAll("var(--light2)", themeData.light)
      .replaceAll("var(--light)", themeData.light);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function generateHTML(config) {
    const themeData = landingThemes.find((item) => item.key === config.theme) || landingThemes[0];
    const styleData = stylePresets[config.style] || stylePresets.cosy;
    const fontFamily = config.font === "lora" ? "Lora, serif" : "DM Sans, sans-serif";
    const projectName = escapeHtml(config.projectName);
    const tagline = escapeHtml(config.tagline);
    const ctaText = escapeHtml(config.ctaText);
    const secondaryCta = escapeHtml(config.secondaryCta);
    const isBold = styleData.label === "Bold";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${projectName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${fontFamily}; color: ${styleData.headingColor}; background: #fffdf9; }
    a { text-decoration: none; }
    nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 40px; border-bottom: 1px solid rgba(61,53,48,0.08); }
    .nav-brand { font-weight: 700; font-size: 18px; }
    .nav-links { display: flex; gap: 20px; font-size: 14px; opacity: 0.68; }
    .hero { background: ${resolveStyleToken(styleData.heroBackground, themeData)}; padding: 80px 40px; text-align: center; }
    .hero h1 { color: ${styleData.headingColor}; font-size: ${styleData.headingSize}; font-weight: ${styleData.headingWeight}; margin-bottom: 12px; line-height: 1.2; }
    .hero p { font-size: 17px; color: ${styleData.bodyColor}; max-width: 520px; margin: 0 auto 32px; }
    .button-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn-primary { background: ${isBold ? "#fffdf9" : themeData.accent}; color: ${isBold ? themeData.dark : "#fffdf9"}; padding: 12px 28px; border-radius: 30px; font-size: 14px; font-weight: 700; display: inline-block; }
    .btn-secondary { background: transparent; color: ${isBold ? "#fffdf9" : themeData.accent}; padding: 12px 28px; border-radius: 30px; font-size: 14px; border: 1.5px solid ${isBold ? "#fffdf9" : themeData.accent}; display: inline-block; }
    .features { padding: 56px 40px; display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; background: ${isBold ? themeData.dark : "#fffdf9"}; }
    .feature { background: ${resolveStyleToken(styleData.featureBg, themeData)}; border: ${styleData.featureBorder}; border-radius: ${styleData.borderRadius}; padding: 20px; }
    .feature .icon { color: ${themeData.accent}; font-size: 24px; margin-bottom: 8px; }
    .feature h3 { font-size: 14px; font-weight: 700; color: ${isBold ? "#fffdf9" : "#3d3530"}; margin-bottom: 4px; }
    .feature p { font-size: 13px; color: ${isBold ? "rgba(255,253,249,0.78)" : "#6b5f58"}; line-height: 1.5; }
    .cta-section { padding: 56px 40px; text-align: center; background: ${resolveStyleToken(styleData.ctaBg, themeData)}; }
    .cta-section h2 { font-size: 26px; font-weight: 700; color: ${isBold ? "#fffdf9" : "#3d3530"}; margin-bottom: 10px; }
    .cta-section p { color: ${isBold ? "rgba(255,253,249,0.82)" : "#6b5f58"}; font-size: 15px; margin-bottom: 24px; }
    footer { padding: 24px 40px; border-top: 1px solid #e8e0d4; display: flex; justify-content: space-between; gap: 16px; font-size: 12px; color: #9c918c; }
    footer div { display: flex; gap: 16px; }
    footer a { color: #9c918c; }
    @media (max-width: 640px) {
      nav, .hero, .features, .cta-section, footer { padding-left: 20px; padding-right: 20px; }
      .hero h1 { font-size: 30px; }
      .features { grid-template-columns: 1fr; }
      .nav-links { display: none; }
      footer { flex-direction: column; }
    }
  </style>
</head>
<body>
  <nav>
    <span class="nav-brand">${projectName}</span>
    <div class="nav-links">
      <a href="#">Docs</a><a href="#">GitHub</a><a href="#">Blog</a>
    </div>
  </nav>
  <section class="hero">
    <h1>${projectName}</h1>
    <p>${tagline}</p>
    <div class="button-row">
      <a href="#" class="btn-primary">${ctaText}</a>
      ${secondaryCta ? `<a href="#" class="btn-secondary">${secondaryCta}</a>` : ""}
    </div>
  </section>
  <section class="features">
    <div class="feature"><div class="icon">⚡</div><h3>Fast</h3><p>Optimised from the ground up.</p></div>
    <div class="feature"><div class="icon">◆</div><h3>Secure</h3><p>Security baked in at every layer.</p></div>
    <div class="feature"><div class="icon">↗</div><h3>Simple</h3><p>Intuitive API, great defaults.</p></div>
  </section>
  <section class="cta-section">
    <h2>Ready to build with ${projectName}?</h2>
    <p>Join developers shipping faster every day.</p>
    <a href="#" class="btn-primary">${ctaText}</a>
  </section>
  <footer>
    <span>${projectName} · Built with ForAllCode</span>
    <div><a href="#">Docs</a><a href="#">GitHub</a><a href="#">Privacy</a></div>
  </footer>
</body>
</html>`;
  }

  function handleExport() {
    const html = generateHTML(currentConfig);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "index.html";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("index.html downloaded");
  }

  async function handlePublish() {
    if (publishLocked) {
      setStatus("You've reached the free landing page limit. Upgrade to Pro for unlimited landing pages.");
      return;
    }

    setPublishState("publishing");
    setStatus("Publishing landing page");

    try {
      const session = await getCurrentSession();
      const userId = session?.user?.id || userIdRef.current;
      if (!supabase || !userId) throw new Error("Sign in before publishing.");

      const html = generateHTML(currentConfig);
      const { error } = await supabase
        .from("repositories")
        .update({
          landing_page_config: currentConfig,
          landing_page_html: html
        })
        .eq("owner_id", userId)
        .eq("name", repo);

      if (error) throw error;

      if (!currentRepoHasLanding) {
        setLandingPageCount((count) => count + 1);
        trackUsage(userId, "landing_page_created", { repo_name: repo }).catch(() => {});
      }
      setCurrentRepoHasLanding(true);
      setPublishState("published");
      setStatus(`Published at ${username}.forallcode.dev/${repo}`);
      window.setTimeout(() => setPublishState("idle"), 3000);
    } catch (error) {
      setPublishState("idle");
      setStatus(error.message || "Could not publish landing page");
    }
  }

  const publishButtonContent = {
    idle: <><Rocket size={14} />Publish</>,
    publishing: "Publishing…",
    published: "✓ Published"
  };

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
            <button className={effectiveViewport === "desktop" ? "active" : ""} onClick={() => setViewport("desktop")} type="button">Desktop</button>
            <button className={effectiveViewport === "mobile" ? "active" : ""} onClick={() => setViewport("mobile")} type="button">Mobile</button>
          </div>
          <button className="designer-ghost-button" type="button" onClick={handleExport}><Download size={14} />Export HTML</button>
          {publishLocked ? (
            <ProGate feature="Publishing more landing pages" description="Free users can publish one landing page. Upgrade to Pro to publish unlimited project pages.">
              <button className={`designer-publish-button ${publishState}`} type="button" onClick={handlePublish} disabled={publishState === "publishing"}>
                {publishButtonContent[publishState]}
              </button>
            </ProGate>
          ) : (
            <button className={`designer-publish-button ${publishState}`} type="button" onClick={handlePublish} disabled={publishState === "publishing"}>
              {publishButtonContent[publishState]}
            </button>
          )}
        </div>
      </header>
      <LimitBanner limitKey="landingPages" currentCount={landingPageCount} />

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
      <p className="landing-designer-status" aria-live="polite">{status}</p>
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
