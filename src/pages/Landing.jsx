import { BookOpen, FileCode2, Github, Home, Palette } from "lucide-react";
import { Link } from "react-router-dom";
import SignInGlobe from "../components/Globe/SignInGlobe";
import { useAuthSession, useDocumentTitle } from "../lib/hooks";
import { signInWithGitHub, supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

const PUBLIC_STATS_CACHE_KEY = "forallcode_public_stats";
const PUBLIC_STATS_CACHE_TTL = 60 * 60 * 1000;
const fallbackStatements = ["Learn Git visually", "Practice on real projects", "Explain what you built"];

export default function LandingPage() {
  useDocumentTitle("Home · ForAllCode");
  const { loggedIn } = useAuthSession();
  const [message, setMessage] = useState("");

  async function handleGitHubSignIn() {
    try {
      setMessage("");
      await signInWithGitHub();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <>
      <section className="hero landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">For beginners and career-switchers</p>
          <h1>ForAllCode</h1>
          <p>Learn Git by building a real project, then turn that work into a portfolio you can explain with confidence.</p>
          <div className="button-row">
            {loggedIn ? (
              <>
                <Button to="/dashboard">Go to dashboard</Button>
                <Button to="/learn" variant="soft">Explore Learn</Button>
              </>
            ) : (
              <>
                <Button onClick={handleGitHubSignIn}><Github size={18} />Start free with GitHub</Button>
                <Button to="/learn/commits" variant="ghost">Try a lesson first</Button>
              </>
            )}
          </div>
          {!loggedIn && <p className="hero-reassure">All visual lessons are free. No credit card. Your repositories stay on GitHub.</p>}
          {!loggedIn && message && <p className="auth-error landing-auth-error">{message}</p>}
        </div>
        <LandingDeskPreview />
      </section>

      {!loggedIn && <SignInGlobe />}

      <section className="feature-grid">
        {[
          ["Learn the next concept", "Understand commits and branches, then apply them to one small change.", <BookOpen />],
          ["Practice on a project", "Improve a README and check your pull request against GitHub.", <Home />],
          ["Explain your decisions", "Use the free project case-study template to describe your contribution and what you learned.", <FileCode2 />],
          ["Share your work", "Bring your projects, screenshots, and project stories together in a portfolio.", <Palette />]
        ].map(([title, text, icon]) => <FeatureCard key={title} title={title} text={text} icon={icon} />)}
      </section>

      {(
        <section className="band">
          <h2>How it works</h2>
          <div className="steps">
            {["Learn one concept", "Make a real change", "Explain the result"].map((step, index) => (
              <Card key={step}>
                <span className="step-number">{index + 1}</span>
                <h3>{step}</h3>
                <p>{["Start with a free visual lesson before connecting GitHub.", "Create a branch, improve a README, and open a pull request.", "Describe your decisions and share the project in your portfolio."][index]}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <PublicStats />
    </>
  );
}

function PublicStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;

    function readCachedStats() {
      try {
        const cached = window.sessionStorage.getItem(PUBLIC_STATS_CACHE_KEY);
        if (!cached) return null;
        const parsed = JSON.parse(cached);
        if (!parsed?.savedAt || Date.now() - parsed.savedAt > PUBLIC_STATS_CACHE_TTL) return null;
        return parsed.stats || null;
      } catch {
        return null;
      }
    }

    async function loadStats() {
      const cached = readCachedStats();
      if (cached && alive) {
        setStats(cached);
        return;
      }

      if (!supabase) return;

      const { data, error } = await supabase
        .from("public_stats")
        .select("repo_count,user_count,lessons_started")
        .maybeSingle();

      if (error || !data) return;

      const nextStats = {
        repoCount: Number(data.repo_count || 0),
        userCount: Number(data.user_count || 0),
        lessonsStarted: Number(data.lessons_started || 0)
      };

      try {
        window.sessionStorage.setItem(PUBLIC_STATS_CACHE_KEY, JSON.stringify({
          savedAt: Date.now(),
          stats: nextStats
        }));
      } catch {
        // Session storage can be unavailable in hardened browser modes.
      }

      if (alive) setStats(nextStats);
    }

    loadStats();
    return () => {
      alive = false;
    };
  }, []);

  const hasUsefulStats = stats
    && stats.repoCount >= 50
    && stats.userCount >= 50
    && stats.lessonsStarted >= 50;

  if (!hasUsefulStats) {
    return (
      <section className="value-statements" aria-label="ForAllCode values">
        {fallbackStatements.map((statement) => <span key={statement}>{statement}</span>)}
      </section>
    );
  }

  return (
    <section className="value-statements" aria-label="ForAllCode community stats">
      <span>{formatStat(stats.repoCount)} repos warmed up</span>
      <span>{formatStat(stats.userCount)} early users</span>
      <span>{formatStat(stats.lessonsStarted)} lessons started</span>
    </section>
  );
}

function formatStat(value) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    notation: "compact"
  }).format(value).toLowerCase();
}

function LandingDeskPreview() {
  return (
    <div className="desk-preview" aria-hidden="true">
      <div className="desk-window">
        <span />
        <span />
        <span />
      </div>
      <div className="desk-card one" />
      <div className="desk-card two" />
      <div className="desk-note" />
    </div>
  );
}

function Card({ children }) {
  return <article className="card">{children}</article>;
}

function Button({ children, disabled = false, to, variant = "primary", full = false, onClick, type = "button" }) {
  const className = `button ${variant} ${full ? "full" : ""}`;
  return to ? <Link className={className} to={to}>{children}</Link> : <button className={className} disabled={disabled} onClick={onClick} type={type}>{children}</button>;
}

function FeatureCard({ title, text, icon }) {
  return <Card><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p></Card>;
}
