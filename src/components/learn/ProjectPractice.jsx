import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ExternalLink } from "lucide-react";
import { verifyPracticePullRequest, repositoryPath } from "../../lib/projectJourney";
import { trackUsage } from "../../lib/trackUsage";
import "../../styles/project-journey.css";

export default function ProjectPractice({ session, repos = [] }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);

  function changeUrl(value) {
    controller.current?.abort();
    setBusy(false);
    setUrl(value);
    setResult(null);
    setError("");
  }

  async function check(event) {
    event.preventDefault();
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const evidence = await verifyPracticePullRequest(url, session?.provider_token, fetch, request.signal);
      if (request.signal.aborted) return;
      setResult(evidence);
      trackUsage(session?.user?.id, "project_practice_verified", { task: "readme-pull-request", merged: evidence.merged }).catch(() => {});
    } catch (checkError) {
      if (!request.signal.aborted) setError(checkError.message || "Could not check this pull request.");
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  }

  return (
    <section className="project-practice" id="project-practice" aria-labelledby="practice-heading">
      <h2 id="practice-heading">Try it on a real project</h2>
      <p>Make a small README improvement: explain what your project does and how someone can run it.</p>
      <ol>
        <li>Choose your own practice repository. Create a branch for the change.</li>
        <li>Edit README.md on that branch and commit with a message explaining why.</li>
        <li>Open a pull request on GitHub. Review the diff before merging.</li>
      </ol>
      <div className="journey-secondary">
        <Link to="/repos/new">Create a practice repository</Link>
        {repos.slice(0, 3).map(repo => <a key={repositoryPath(repo)} href={`https://github.com${repositoryPath(repo)}`} target="_blank" rel="noreferrer">{repo.name}<ExternalLink size={14} /></a>)}
      </div>
      <form onSubmit={check}>
        <label htmlFor="practice-pr-url">Your GitHub pull request URL</label>
        <input id="practice-pr-url" type="url" required value={url} onChange={event => changeUrl(event.target.value)} placeholder="https://github.com/your-name/your-project/pull/1" />
        <button className="button" type="submit" disabled={busy || !session?.provider_token}>{busy ? "Checking GitHub..." : "Check my pull request"}</button>
      </form>
      {!session?.provider_token && <p><Link to={session?.user ? "/settings/integrations" : "/login"}>{session?.user ? "Reconnect GitHub" : "Sign in with GitHub"}</Link> to check work authored by your account.</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {result && <div role="status" className="practice-result"><Check size={18} aria-hidden="true" /><div><strong>README change verified on GitHub</strong><p><a href={result.url} target="_blank" rel="noreferrer">{result.title}</a> · {result.merged ? "Merged" : result.state === "closed" ? "Closed without merging" : "Open for review"}</p><p>Next, explain one decision you made and how you checked the result.</p></div></div>}
      <p className="journey-disclosure">This read-only check confirms your authorship and a README addition in the pull request. It does not judge code quality, certify skill, or modify GitHub. The result is shown for this session; you can check the URL again later.</p>
    </section>
  );
}
