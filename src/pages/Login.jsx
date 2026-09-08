import { useState } from "react";
import { Github } from "lucide-react";
import { Link } from "react-router-dom";
import SignInGlobe from "../components/Globe/SignInGlobe";
import { useDocumentTitle } from "../lib/hooks";
import { isSupabaseConfigured, signInWithGitHub, signInWithPassword } from "../lib/supabase";

export default function LoginPage() {
  useDocumentTitle("Sign in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const githubSignIn = async () => {
    try {
      setMessage("");
      await signInWithGitHub();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const passwordSignIn = async () => {
    try {
      setMessage("");
      const { error } = await signInWithPassword(email, password);
      if (error) throw error;
      window.location.assign("/dashboard");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <PageFrame title="Welcome to ForAllCode" eyebrow="Sign in">
      <section className="auth-panel">
        <Card large>
          {!isSupabaseConfigured && <p className="auth-note">Supabase env vars are missing. Add them to `.env` to enable live sign in.</p>}
          <Button full onClick={githubSignIn}><Github size={18} />Continue with GitHub</Button>
          <div className="divider">or</div>
          <label>Email<input placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" placeholder="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {message && <p className="auth-error">{message}</p>}
          <Button variant="soft" full onClick={passwordSignIn}>Continue with email</Button>
          <Link to="/login">Forgot password?</Link>
        </Card>
        <SignInGlobe />
      </section>
    </PageFrame>
  );
}

function PageFrame({ title, eyebrow, children }) {
  return (
    <main className="page-frame">
      {(title || eyebrow) && (
        <header className="page-heading">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && <h1>{title}</h1>}
        </header>
      )}
      {children}
    </main>
  );
}

function Card({ children, large = false }) {
  return <article className={large ? "card large-card" : "card"}>{children}</article>;
}

function Button({ children, disabled = false, to, variant = "primary", full = false, onClick, type = "button" }) {
  const className = `button ${variant} ${full ? "full" : ""}`;
  return to ? <Link className={className} to={to}>{children}</Link> : <button className={className} disabled={disabled} onClick={onClick} type={type}>{children}</button>;
}
