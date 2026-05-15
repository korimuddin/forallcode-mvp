import hljs from "highlight.js";
import { Copy, Download } from "lucide-react";
import { decodeGitHubBase64 } from "../../lib/githubApi";

function extensionFor(path = "") {
  return path.split(".").pop() || "";
}

function highlight(code, path) {
  const extension = extensionFor(path);
  const language = hljs.getLanguage(extension) ? extension : "";
  return language
    ? hljs.highlight(code, { language }).value
    : hljs.highlightAuto(code).value;
}

function copy(value) {
  navigator.clipboard?.writeText(value).catch(() => {});
}

function downloadFile(name, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name || "github-file.txt";
  link.click();
  URL.revokeObjectURL(url);
}

export default function FileRenderer({ payload, resource }) {
  const contents = payload?.contents;
  const items = Array.isArray(contents) ? contents : [];

  if (items.length) {
    return (
      <div className="github-panel-resource">
        <div className="github-repo-hero compact">
          <p className="eyebrow">{resource.owner} / {resource.repo}</p>
          <h2>{resource.path || resource.branch || "Repository tree"}</h2>
          <p>Browse this GitHub folder without leaving ForAllCode.</p>
        </div>
        <div className="github-file-list large">
          {items.map((item) => (
            <a href={item.html_url} key={item.sha || item.path}>
              <span>{item.type === "dir" ? "Folder" : "File"}</span>
              <strong>{item.path}</strong>
            </a>
          ))}
        </div>
      </div>
    );
  }

  const file = contents;
  if (!file) return null;

  const content = file.content ? decodeGitHubBase64(file.content) : "";
  const lineCount = content ? content.split("\n").length : 0;
  const highlighted = highlight(content, file.name || resource.path);

  return (
    <div className="github-panel-resource">
      <div className="github-repo-hero compact">
        <p className="eyebrow">{resource.owner} / {resource.repo}</p>
        <h2>{file.path || resource.path}</h2>
        <div className="github-panel-meta">
          <span>{lineCount} lines</span>
          <span>{file.size?.toLocaleString?.() || file.size || 0} bytes</span>
          {resource.branch && <span>{resource.branch}</span>}
        </div>
        <div className="github-panel-actions">
          <button className="button soft" onClick={() => copy(content)} type="button"><Copy size={15} /> Copy code</button>
          <button className="button soft" onClick={() => downloadFile(file.name, content)} type="button"><Download size={15} /> Download file</button>
          {file.download_url && <a className="button ghost" data-github-bypass="true" href={file.download_url} target="_blank" rel="noreferrer">View raw</a>}
        </div>
      </div>
      <pre className="github-code-view"><code dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
    </div>
  );
}
