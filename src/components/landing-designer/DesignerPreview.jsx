import LandingPagePreview from "./LandingPagePreview";

export default function DesignerPreview({
  activeSection,
  content,
  font,
  repoName,
  theme,
  style,
  username,
  viewport
}) {
  return (
    <section className="designer-preview-shell" aria-label="Landing page live preview">
      <div className={`designer-browser-frame ${viewport === "mobile" ? "mobile" : ""}`}>
        <div className="designer-browser-topbar">
          <span className="traffic-light rose" />
          <span className="traffic-light amber" />
          <span className="traffic-light sage" />
          <div className="designer-url-bar">{username}.forallcode.dev/{repoName}</div>
        </div>
        <div className="designer-browser-content">
          <LandingPagePreview
            activeSection={activeSection}
            projectName={content.projectName}
            tagline={content.tagline}
            ctaText={content.ctaText}
            secondaryCta={content.secondaryCta}
            theme={theme}
            style={style}
            font={font}
            viewport={viewport}
          />
        </div>
      </div>
    </section>
  );
}
