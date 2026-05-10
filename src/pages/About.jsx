import { Link } from "react-router-dom";
import { BookOpen, Home, Palette, Sparkles } from "lucide-react";

const differences = [
  {
    title: "Visual Git education built in",
    text: "Interactive diagrams for every core concept. Made for humans.",
    icon: BookOpen
  },
  {
    title: "Your workspace, not just your repos",
    text: "An illustrated desk that keeps active projects visible.",
    icon: Home
  },
  {
    title: "Beautiful project pages",
    text: "README Studio and Landing Designer. Your repos deserve to look good.",
    icon: Palette
  },
  {
    title: "Warm by design",
    text: "No cold greys, no intimidating density. A platform that feels like it was made by someone who loves craft and code.",
    icon: Sparkles
  }
];

export default function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <DecorativeHills />
        <span className="about-rocket" aria-hidden="true">🚀</span>
        <h1>ForAllCode</h1>
        <p className="about-tagline">Built for all who code.</p>
        <p className="about-hero-copy">
          Code shouldn't belong to the few. The tools, the knowledge, the platform, they should be for all of us.
        </p>
      </section>

      <section className="about-section">
        <h2>The name</h2>
        <p>
          ForAllCode is inspired by For All Mankind, the Apple TV+ alternate history series where the Soviet Union lands on the moon first, and the space race never ends. It's a story about what happens when humanity refuses to stop reaching.
        </p>
        <p>
          In that world, space isn't won by one nation. It becomes a destination for all of humanity. That's the spirit behind ForAllCode.
        </p>
        <blockquote>It's not about being first. It's about going further.</blockquote>
        <p>
          Code platforms today are built for people who already know how to code. Documentation assumes you know what a merge conflict is. Interfaces are dense and unforgiving. Beginners bounce off, and never come back.
        </p>
        <p>
          ForAllCode is the version of this platform where the door stays open. For all of us. For all who code.
        </p>
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
