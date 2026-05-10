/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        serif: ["Lora", "serif"],
        mono: ["DM Mono", "monospace"]
      },
      colors: {
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
        card: "12px",
        large: "20px",
        hero: "28px",
        pill: "30px"
      },
      boxShadow: {
        none: "none"
      }
    }
  },
  plugins: []
};
