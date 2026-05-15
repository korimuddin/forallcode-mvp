import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, RefreshCcw, X } from "lucide-react";
import { githubApi } from "../../lib/githubApi";
import { useAuthSession } from "../../lib/hooks";
import { parseGitHubUrl } from "../../lib/githubUrlParser";
import { mountGitHubLinkInterceptor } from "../../interceptor";
import ErrorState from "./ErrorState";
import FileRenderer from "./FileRenderer";
import IssuesRenderer from "./IssuesRenderer";
import PullsRenderer from "./PullsRenderer";
import RepoRenderer from "./RepoRenderer";
import UserRenderer from "./UserRenderer";

export const GitHubPanelContext = createContext(null);

async function loadGitHubResource(resource, token, refresh = false) {
  const options = { token, refresh };

  if (resource.type === "repo") {
    const [repo, readmeResult, contentsResult] = await Promise.all([
      githubApi.repo(resource.owner, resource.repo, options),
      githubApi.readme(resource.owner, resource.repo, options).catch(() => null),
      githubApi.contents(resource.owner, resource.repo, "", "", options).catch(() => [])
    ]);
    return { repo, readme: readmeResult, contents: contentsResult };
  }

  if (resource.type === "file" || resource.type === "tree") {
    const contents = await githubApi.contents(resource.owner, resource.repo, resource.path, resource.branch, options);
    return { contents };
  }

  if (resource.type === "issues") {
    const issues = await githubApi.issues(resource.owner, resource.repo, options);
    return { issues };
  }

  if (resource.type === "issue") {
    const [issue, comments] = await Promise.all([
      githubApi.issue(resource.owner, resource.repo, resource.number, options),
      githubApi.issueComments(resource.owner, resource.repo, resource.number, options).catch(() => [])
    ]);
    return { issue, comments };
  }

  if (resource.type === "pulls") {
    const pulls = await githubApi.pulls(resource.owner, resource.repo, options);
    return { pulls };
  }

  if (resource.type === "pull") {
    const pull = await githubApi.pull(resource.owner, resource.repo, resource.number, options);
    return { pull };
  }

  if (resource.type === "user") {
    const [user, repos] = await Promise.all([
      githubApi.user(resource.username, options),
      githubApi.userRepos(resource.username, options).catch(() => [])
    ]);
    return { user, repos };
  }

  if (resource.type === "org") {
    const org = await githubApi.org(resource.org, options);
    return { org, repos: [] };
  }

  throw new Error("This GitHub URL is not supported yet.");
}

function renderResource(resource, payload) {
  if (!resource) return null;

  if (resource.type === "repo") return <RepoRenderer payload={payload} resource={resource} />;
  if (resource.type === "file" || resource.type === "tree") return <FileRenderer payload={payload} resource={resource} />;
  if (resource.type === "issues" || resource.type === "issue") return <IssuesRenderer payload={payload} resource={resource} />;
  if (resource.type === "pulls" || resource.type === "pull") return <PullsRenderer payload={payload} resource={resource} />;
  if (resource.type === "user" || resource.type === "org") return <UserRenderer payload={payload} resource={resource} />;

  return null;
}

function titleFor(resource) {
  if (!resource) return "GitHub";
  if (resource.type === "user") return `@${resource.username}`;
  if (resource.type === "org") return resource.org;
  if (resource.type === "file" || resource.type === "tree") return resource.path || resource.repo;
  if (resource.type === "issues") return `${resource.repo} issues`;
  if (resource.type === "issue") return `${resource.repo} issue #${resource.number}`;
  if (resource.type === "pulls") return `${resource.repo} pull requests`;
  if (resource.type === "pull") return `${resource.repo} PR #${resource.number}`;
  return `${resource.owner}/${resource.repo}`;
}

export function GitHubPanelProvider({ children }) {
  const { session } = useAuthSession();
  const [resource, setResource] = useState(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const closeButtonRef = useRef(null);
  const panelRef = useRef(null);

  const closePanel = useCallback(() => {
    setResource(null);
    setPayload(null);
    setError(null);
  }, []);

  const openGitHubPanel = useCallback((url) => {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      setResource({ type: "unsupported", htmlUrl: url });
      setError(new Error("This GitHub URL is not supported yet."));
      return;
    }
    setResource(parsed);
  }, []);

  const refreshResource = useCallback(async () => {
    if (!resource || resource.type === "unsupported") return;
    setLoading(true);
    setError(null);
    try {
      const nextPayload = await loadGitHubResource(resource, session?.provider_token, true);
      setPayload(nextPayload);
    } catch (loadError) {
      setPayload(null);
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [resource, session?.provider_token]);

  useEffect(() => mountGitHubLinkInterceptor(openGitHubPanel), [openGitHubPanel]);

  useEffect(() => {
    if (!resource || resource.type === "unsupported") return undefined;
    let alive = true;
    setLoading(true);
    setError(null);
    setPayload(null);

    loadGitHubResource(resource, session?.provider_token)
      .then((nextPayload) => {
        if (alive) setPayload(nextPayload);
      })
      .catch((loadError) => {
        if (alive) setError(loadError);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [resource, session?.provider_token]);

  useEffect(() => {
    if (!resource) return undefined;
    const previousActive = document.activeElement;
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function handleKeyDown(event) {
      if (event.key === "Escape") closePanel();
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll("a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus?.();
    };
  }, [closePanel, resource]);

  const contextValue = useMemo(() => ({ openGitHubPanel, closePanel }), [openGitHubPanel, closePanel]);
  const open = Boolean(resource);

  return (
    <GitHubPanelContext.Provider value={contextValue}>
      {children}
      {open && <button className="github-panel-scrim" aria-label="Close GitHub panel" onClick={closePanel} type="button" />}
      <aside
        aria-busy={loading ? "true" : "false"}
        aria-label="GitHub content panel"
        aria-modal="true"
        className={open ? "github-panel open" : "github-panel"}
        ref={panelRef}
        role="dialog"
      >
        {resource && (
          <>
            <header className="github-panel-header">
              <div>
                <p className="eyebrow">GitHub preview</p>
                <h2>{titleFor(resource)}</h2>
              </div>
              <div className="github-panel-header-actions">
                {resource.htmlUrl && (
                  <a className="button ghost" data-github-bypass="true" href={resource.htmlUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={15} /> GitHub
                  </a>
                )}
                <button className="button ghost" disabled={loading || resource.type === "unsupported"} onClick={refreshResource} type="button">
                  <RefreshCcw size={15} /> Refresh
                </button>
                <button className="github-panel-close" onClick={closePanel} ref={closeButtonRef} type="button" aria-label="Close GitHub panel">
                  <X size={18} />
                </button>
              </div>
            </header>
            <div className="github-panel-body">
              {loading && (
                <div className="github-panel-loading">
                  <span />
                  <p>Fetching from GitHub...</p>
                </div>
              )}
              {!loading && error && <ErrorState error={error} resource={resource} />}
              {!loading && !error && renderResource(resource, payload)}
            </div>
          </>
        )}
      </aside>
    </GitHubPanelContext.Provider>
  );
}

export default GitHubPanelProvider;
