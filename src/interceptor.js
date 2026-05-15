import { isGitHubUrl } from "./lib/githubUrlParser";

export function mountGitHubLinkInterceptor(openGitHubPanel) {
  function handleClick(event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = event.target?.closest?.("a[href]");
    if (!anchor || anchor.dataset.githubBypass === "true") return;

    const url = anchor.href;
    if (!isGitHubUrl(url)) return;

    event.preventDefault();
    openGitHubPanel(url);
  }

  document.addEventListener("click", handleClick);
  return () => document.removeEventListener("click", handleClick);
}
