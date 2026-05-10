function resolveToken(value, theme) {
  return value
    .replaceAll("var(--accent)", theme.accent)
    .replaceAll("var(--light2)", theme.light)
    .replaceAll("var(--light)", theme.light);
}

export default function LandingPagePreview({
  activeSection = "navigation",
  projectName,
  tagline,
  ctaText,
  secondaryCta,
  theme,
  style,
  font,
  viewport = "desktop"
}) {
  const fontFamily = font === "lora" ? "Lora, serif" : "DM Sans, sans-serif";
  const heroBackground = resolveToken(style.heroBackground, theme);
  const ctaBackground = resolveToken(style.ctaBg, theme);
  const isBold = style.label === "Bold";
  const isMobile = viewport === "mobile";
  const sectionRing = (section) => activeSection === section ? `0 0 0 3px ${theme.light}` : "none";

  return (
    <div className="landing-page-preview" style={{ fontFamily, color: style.headingColor }}>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: isMobile ? "16px 20px" : "16px 40px",
          borderBottom: "1px solid rgba(61,53,48,0.08)",
          boxShadow: sectionRing("navigation")
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 18 }}>{projectName}</span>
        <div style={{ display: isMobile ? "none" : "flex", gap: 20, fontSize: 14, opacity: 0.68 }}>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Docs</a>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>GitHub</a>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Blog</a>
        </div>
      </nav>

      <section
        style={{
          background: heroBackground,
          padding: isMobile ? "58px 20px" : "80px 40px",
          textAlign: "center",
          boxShadow: sectionRing("hero")
        }}
      >
        <h1
          style={{
            color: style.headingColor,
            fontSize: isMobile ? "30px" : style.headingSize,
            fontWeight: style.headingWeight,
            marginBottom: 12,
            lineHeight: 1.2
          }}
        >
          {projectName}
        </h1>
        <p
          style={{
            fontSize: isMobile ? 15 : 17,
            color: style.bodyColor,
            marginBottom: 32,
            maxWidth: isMobile ? 270 : 520,
            margin: "0 auto 32px"
          }}
        >
          {tagline}
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            maxWidth: isMobile ? 240 : "none",
            margin: isMobile ? "0 auto" : 0
          }}
        >
          <a
            href="#"
            style={{
              background: isBold ? "#fffdf9" : theme.accent,
              color: isBold ? theme.dark : "#fffdf9",
              padding: "12px 28px",
              borderRadius: 30,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              textAlign: "center",
              boxSizing: "border-box",
              width: isMobile ? "100%" : "auto"
            }}
          >
            {ctaText}
          </a>
          {secondaryCta && (
            <a
              href="#"
              style={{
                background: "transparent",
                color: isBold ? "#fffdf9" : theme.accent,
                padding: "12px 28px",
                borderRadius: 30,
                fontSize: 14,
                border: `1.5px solid ${isBold ? "#fffdf9" : theme.accent}`,
                textDecoration: "none",
                textAlign: "center",
                boxSizing: "border-box",
                width: isMobile ? "100%" : "auto"
              }}
            >
              {secondaryCta}
            </a>
          )}
        </div>
      </section>

      <section
        style={{
          padding: isMobile ? "40px 20px" : "56px 40px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: 16,
          background: isBold ? theme.dark : "#fffdf9",
          boxShadow: sectionRing("features")
        }}
      >
        {[
          { icon: "⚡", title: "Fast", desc: "Optimised from the ground up" },
          { icon: "◆", title: "Secure", desc: "Security baked in at every layer" },
          { icon: "↗", title: "Simple", desc: "Intuitive API, great defaults" }
        ].map((feature) => (
          <div
            key={feature.title}
            style={{
              background: resolveToken(style.featureBg, theme),
              border: style.featureBorder,
              borderRadius: style.borderRadius,
              padding: 20
            }}
          >
            <div style={{ color: theme.accent, fontSize: 24, marginBottom: 8 }}>{feature.icon}</div>
            <h3 style={{ color: isBold ? "#fffdf9" : "#3d3530", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              {feature.title}
            </h3>
            <p style={{ color: isBold ? "rgba(255,253,249,0.78)" : "#6b5f58", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
              {feature.desc}
            </p>
          </div>
        ))}
      </section>

      <section
        style={{
          padding: isMobile ? "42px 20px" : "56px 40px",
          textAlign: "center",
          background: ctaBackground,
          boxShadow: sectionRing("cta")
        }}
      >
        <h2 style={{ color: isBold ? "#fffdf9" : "#3d3530", fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
          Ready to build with {projectName}?
        </h2>
        <p style={{ color: isBold ? "rgba(255,253,249,0.82)" : "#6b5f58", fontSize: 15, marginBottom: 24 }}>
          Join developers shipping faster every day.
        </p>
        <a
          href="#"
          style={{
            background: isBold ? "#fffdf9" : theme.accent,
            color: isBold ? theme.dark : "#fffdf9",
            padding: "13px 32px",
            borderRadius: 30,
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-block"
          }}
        >
          {ctaText}
        </a>
      </section>

      <footer
        style={{
          padding: isMobile ? "24px 20px" : "24px 40px",
          borderTop: "1px solid #e8e0d4",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          gap: 16,
          fontSize: 12,
          color: "#9c918c",
          boxShadow: sectionRing("footer")
        }}
      >
        <span>{projectName} · Built with ForAllCode</span>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="#" style={{ color: "#9c918c", textDecoration: "none" }}>Docs</a>
          <a href="#" style={{ color: "#9c918c", textDecoration: "none" }}>GitHub</a>
          <a href="#" style={{ color: "#9c918c", textDecoration: "none" }}>Privacy</a>
        </div>
      </footer>
    </div>
  );
}
