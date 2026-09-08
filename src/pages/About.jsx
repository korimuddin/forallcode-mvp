import { Link } from "react-router-dom";
import { BookOpen, Home, Palette, Sparkles } from "lucide-react";
import { useDocumentTitle } from "../lib/hooks";

const differences = [
  {
    title: "Visual Git education built in",
    text: "Interactive diagrams for every core concept. Made for humans.",
    icon: BookOpen
  },
  {
    title: "Practice on real projects",
    text: "Make a README change on a branch and check your own pull request against GitHub.",
    icon: Home
  },
  {
    title: "Project stories, not just screenshots",
    text: "Explain the problem, your decisions, and what you learned with a free case-study template.",
    icon: Palette
  },
  {
    title: "A companion to GitHub",
    text: "Your repositories stay on GitHub. ForAllCode adds learning, project guidance, and a portfolio for your work.",
    icon: Sparkles
  }
];

export default function About() {
  useDocumentTitle("About");

  return (
    <main className="about-page">
      <section className="about-hero">
        <DecorativeHills />
        <img className="about-logo" src="/forallcode-logo.png" alt="ForAllCode logo" />
        <h1>ForAllCode</h1>
        <p className="about-tagline">Your first project, understood.</p>
        <p className="about-hero-copy">
          Code shouldn't belong to the few. The tools, the knowledge, the platform, they should be for all of us.
        </p>
      </section>

      <section className="about-section">
        <h2>Who we are</h2>
        <blockquote>
          ForAllCode helps self-taught beginners and career-switchers learn Git through real project work, then explain that work with confidence.
        </blockquote>
      </section>

      <section className="about-section">
        <h2>What makes ForAllCode different</h2>
        <div className="about-difference-grid">
          {differences.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <span><Icon size={22} /></span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-cta">
        <h2>Ready to join?</h2>
        <div className="button-row">
          <Link className="button" to="/login">Get started free →</Link>
          <Link className="button soft" to="/learn">Explore the learn centre →</Link>
        </div>
      </section>
    </main>
  );
}

function DecorativeHills() {
  return (
    <svg className="about-hills" viewBox="0 0 680 220" aria-hidden="true">
      <path d="M0 156 C92 116 132 128 206 160 C286 195 350 116 448 142 C520 162 580 116 680 92 V220 H0 Z" fill="#fffdf9" opacity="0.42" />
      <path d="M0 184 C118 132 198 176 282 154 C374 130 430 184 514 150 C586 122 626 146 680 126 V220 H0 Z" fill="#f4efe6" opacity="0.72" />
      <circle cx="116" cy="62" r="8" fill="#fffdf9" opacity="0.76" />
      <circle cx="548" cy="48" r="6" fill="#fffdf9" opacity="0.72" />
      <path d="M474 72 l7 17 17 7 -17 7 -7 17 -7 -17 -17 -7 17 -7z" fill="#fffdf9" opacity="0.72" />
    </svg>
  );
}
