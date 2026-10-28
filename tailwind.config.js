/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Noto Sans", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "Consolas", "Liberation Mono", "monospace"]
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        border: "var(--border)",
        accent: "var(--accent)",
        success: "var(--success)",
        danger: "var(--danger)",
        warn: "var(--warn)",
        cream: "var(--cream)",
        cream2: "var(--cream2)",
        cream3: "var(--cream3)",
        sage: "var(--sage)",
        sage2: "var(--sage2)",
        sage3: "var(--sage3)",
        lavender: "var(--lavender)",
        lavender2: "var(--lavender2)",
        lavender3: "var(--lavender3)",
        lavender4: "var(--lavender4)",
        rose: "var(--rose)",
        rose2: "var(--rose2)",
        rose3: "var(--rose3)",
        sky: "var(--sky)",
        sky2: "var(--sky2)",
        amber: "var(--amber)",
        amber2: "var(--amber2)",
        amber3: "var(--amber3)",
        ink: "var(--ink)",
        ink2: "var(--ink2)",
        ink3: "var(--ink3)",
        white: "var(--white)"
      },
      borderRadius: {
        card: "6px",
        large: "12px",
        hero: "12px",
        pill: "9999px"
      },
      boxShadow: {
        none: "none"
      }
    }
  },
  plugins: []
};
