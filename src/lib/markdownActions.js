export function installMarkdownActions() {
  const copy = async (event) => {
    const button = event.target instanceof Element ? event.target.closest("button[data-markdown-copy]") : null;
    if (!button) return;
    try {
      await navigator.clipboard.writeText(button.dataset.code || "");
      button.textContent = "Copied";
    } catch {
      button.textContent = "Copy failed";
    }
    window.setTimeout(() => { if (button.isConnected) button.textContent = "Copy"; }, 1600);
  };
  document.addEventListener("click", copy);
  return () => document.removeEventListener("click", copy);
}
