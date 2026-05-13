import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bold,
  ChevronDown,
  Code2,
  Download,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Lock,
  Quote,
  Save,
  Strikethrough
} from "lucide-react";
import BlockInserter from "../components/readme/BlockInserter";
import { allReadmeTemplateOptions, readmeTemplates } from "../data/readmeTemplates";
import { useDocumentTitle } from "../lib/hooks";
import { renderMarkdown } from "../lib/markdownRenderer";
import { getCurrentSession, supabase } from "../lib/supabase";
import { trackUsage } from "../lib/trackUsage";
import { useSubscription } from "../lib/useSubscription";

const toolbarGroups = [
  [
    { label: "Bold", icon: Bold, action: "bold" },
    { label: "Italic", icon: Italic, action: "italic" },
    { label: "Strikethrough", icon: Strikethrough, action: "strike" }
  ],
  [
    { label: "Heading 1", icon: Heading1, action: "h1" },
    { label: "Heading 2", icon: Heading2, action: "h2" },
    { label: "Heading 3", icon: Heading3, action: "h3" }
  ],
  [
    { label: "Quote", icon: Quote, action: "quote" },
    { label: "Link", icon: Link2, action: "link" },
    { label: "Image", icon: Image, action: "image" }
  ],
  [
    { label: "Inline code", icon: Code2, action: "code" },
    { label: "Code block", text: "```", action: "codeBlock" }
  ],
  [
    { label: "Bulleted list", icon: List, action: "list" },
    { label: "Numbered list", icon: ListOrdered, action: "orderedList" }
  ]
];

export default function ReadmeStudio() {
  const { username = "", repo = "" } = useParams();
  useDocumentTitle(`${repo} README Studio`);
  const textareaRef = useRef(null);
  const sessionRef = useRef(null);
  const userIdRef = useRef(null);
  const { isPro } = useSubscription();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");
  const [markdown, setMarkdown] = useState(readmeTemplates.blank);
  const [renderedMarkdown, setRenderedMarkdown] = useState(readmeTemplates.blank);
  const [mobileView, setMobileView] = useState("edit");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [blockInserterOpen, setBlockInserterOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [status, setStatus] = useState("Ready");

  const isOwner = authChecked && username === currentUsername;

  useEffect(() => {
    async function loadReadme() {
      setStatus("Loading README");

      try {
        const session = await getCurrentSession();
        sessionRef.current = session;
        userIdRef.current = session?.user?.id || null;
        const metadata = session?.user?.user_metadata || {};
        setCurrentUsername(metadata.user_name || metadata.preferred_username || metadata.userName || "");

        if (supabase && session?.user?.id) {
          const { data } = await supabase
            .from("repositories")
            .select("readme_content")
            .eq("owner_id", session.user.id)
            .eq("name", repo)
            .maybeSingle();

          if (data?.readme_content) {
            setMarkdown(data.readme_content);
            setIsDirty(false);
            setStatus("Loaded from ForAllCode");
            return;
          }
        }

        if (session?.provider_token) {
          const response = await fetch(`https://api.github.com/repos/${username}/${repo}/readme`, {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
              Accept: "application/vnd.github.raw"
            }
          });

          if (response.ok) {
            setMarkdown(await response.text());
            setIsDirty(false);
            setStatus("Loaded from GitHub");
            return;
          }
        }

        setMarkdown(readmeTemplates.blank.replace("Project Name", repo));
        setIsDirty(false);
        setStatus("Starter template loaded");
      } catch {
        setMarkdown(readmeTemplates.blank.replace("Project Name", repo));
        setIsDirty(false);
        setStatus("Starter template loaded");
      } finally {
        setAuthChecked(true);
      }
    }

    loadReadme();
  }, [repo, username]);

  useEffect(() => {
    const timer = window.setTimeout(() => setRenderedMarkdown(markdown), 150);
    return () => window.clearTimeout(timer);
  }, [markdown]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (!isDirty || !supabase || !userIdRef.current) return;

      const { error } = await supabase
        .from("repositories")
        .update({ readme_content: markdown })
        .eq("owner_id", userIdRef.current)
        .eq("name", repo);

      if (!error) {
        setIsDirty(false);
        setStatus("Auto-saved to ForAllCode");
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, [isDirty, markdown, repo]);

  const counts = useMemo(() => {
    const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
    return { words, characters: markdown.length };
  }, [markdown]);

  if (!authChecked) {
    return (
      <section className="readme-studio-page">
        <Skeleton className="readme-studio-loading" />
      </section>
    );
  }

  if (!isOwner) {
    return <Navigate to={`/${username}/${repo}`} replace />;
  }

  function updateMarkdown(nextMarkdown) {
    setMarkdown(nextMarkdown);
    setIsDirty(true);
    if (saveState === "saved") setSaveState("idle");
  }

  function wrapSelection(before, after = before) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const newText = `${textarea.value.substring(0, start)}${before}${selected}${after}${textarea.value.substring(end)}`;

    updateMarkdown(newText);
    window.setTimeout(() => {
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = end + before.length;
      textarea.focus();
    }, 0);
  }

  function insertAtLineStart(prefix) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;
    updateMarkdown(`${textarea.value.substring(0, lineStart)}${prefix}${textarea.value.substring(lineStart)}`);
    window.setTimeout(() => {
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length;
      textarea.focus();
    }, 0);
  }

  function insertBlock(before, after = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    updateMarkdown(`${textarea.value.substring(0, start)}${before}${selected}${after}${textarea.value.substring(end)}`);
    window.setTimeout(() => textarea.focus(), 0);
  }

  function insertGeneratedBlock(blockMarkdown) {
    const textarea = textareaRef.current;
    if (!textarea) {
      updateMarkdown(`${markdown}${blockMarkdown}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextMarkdown = `${textarea.value.substring(0, start)}${blockMarkdown}${textarea.value.substring(end)}`;
    updateMarkdown(nextMarkdown);
    setStatus("Block inserted");

    window.setTimeout(() => {
      const cursor = start + blockMarkdown.length;
      textarea.selectionStart = cursor;
      textarea.selectionEnd = cursor;
      textarea.focus();
    }, 0);
  }

  function applyToolbarAction(action) {
    const actions = {
      bold: () => wrapSelection("**"),
      italic: () => wrapSelection("_"),
      strike: () => wrapSelection("~~"),
      h1: () => insertAtLineStart("# "),
      h2: () => insertAtLineStart("## "),
      h3: () => insertAtLineStart("### "),
      quote: () => insertAtLineStart("> "),
      link: () => wrapSelection("[", "](url)"),
      image: () => wrapSelection("![", "](image-url)"),
      code: () => wrapSelection("`"),
      codeBlock: () => insertBlock("\n```ts\n", "\n```\n"),
      list: () => insertAtLineStart("- "),
      orderedList: () => insertAtLineStart("1. ")
    };

    actions[action]?.();
  }

  function encodeBase64(content) {
    const bytes = new TextEncoder().encode(content);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
  }

  async function saveToSupabase(session) {
    const userId = session?.user?.id || userIdRef.current;
    if (!supabase || !userId) return;

    const { error } = await supabase
      .from("repositories")
      .update({ readme_content: markdown })
      .eq("owner_id", userId)
      .eq("name", repo);

    if (error) throw error;
  }

  async function handleSave() {
    setSaveState("saving");
    setStatus("Saving README");

    try {
      const session = sessionRef.current || await getCurrentSession();
      sessionRef.current = session;
      userIdRef.current = session?.user?.id || null;

      if (!session?.provider_token) {
        throw new Error("Missing GitHub provider token. Sign in with GitHub again before saving.");
      }

      await saveToSupabase(session);

      const contentsUrl = `https://api.github.com/repos/${username}/${repo}/contents/README.md`;
      const shaResponse = await fetch(contentsUrl, {
        headers: {
          Authorization: `Bearer ${session.provider_token}`,
          Accept: "application/vnd.github+json"
        }
      });

      let sha;
      if (shaResponse.ok) {
        const shaData = await shaResponse.json();
        sha = shaData.sha;
      } else if (shaResponse.status !== 404) {
        throw new Error("Could not read the current README from GitHub.");
      }

      const saveResponse = await fetch(contentsUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.provider_token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "docs: update README via ForAllCode README Studio",
          content: encodeBase64(markdown),
          ...(sha ? { sha } : {})
        })
      });

      if (!saveResponse.ok) {
        throw new Error("GitHub rejected the README update.");
      }

      setIsDirty(false);
      setSaveState("saved");
      setStatus("README saved to GitHub");
      trackUsage(session?.user?.id, "readme_saved", { repo_name: repo }).catch(() => {});
      window.setTimeout(() => setSaveState("idle"), 2000);
    } catch (error) {
      setSaveState("idle");
      setStatus(error.message || "Failed to save - check your GitHub connection");
    }
  }

  function handleExport() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "README.md";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Exported README.md");
  }

  function applyTemplate(template) {
    if (template.isPro && !isPro) {
      setStatus("Upgrade to Pro to use this README template.");
      setTemplatesOpen(false);
      return;
    }
    if (markdown.trim() && !window.confirm("Replace the current README content with this template?")) return;

    const templateContent = template.content || readmeTemplates[template.key];
    updateMarkdown(applyTemplateName(templateContent, repo));
    setTemplatesOpen(false);
    setStatus("Template loaded");
  }

  const saveButtonContent = {
    idle: <><Save size={14} />Save to repo</>,
    saving: "Saving…",
    saved: "✓ Saved"
  };

  return (
    <section className="readme-studio-page">
      <header className="readme-studio-header">
        <div className="readme-studio-path">
          <Link to={`/${username}/${repo}`} aria-label="Back to repository"><ArrowLeft size={17} /></Link>
          <span>{username}</span>
          <span>/</span>
          <strong>{repo}</strong>
          <span>/ README.md</span>
        </div>

        <div className="readme-studio-mobile-tabs" role="tablist" aria-label="README Studio view">
          <button className={mobileView === "edit" ? "active" : ""} onClick={() => setMobileView("edit")} type="button">Edit</button>
          <button className={mobileView === "preview" ? "active" : ""} onClick={() => setMobileView("preview")} type="button">Preview</button>
        </div>

        <div className="readme-studio-actions">
          <div className="readme-template-menu">
            <button className="readme-ghost-button" type="button" onClick={() => setTemplatesOpen(!templatesOpen)}>
              Templates <ChevronDown size={14} />
            </button>
            {templatesOpen && (
              <div className="readme-template-dropdown">
                {allReadmeTemplateOptions.map((template) => (
                  <button
                    className={template.isPro && !isPro ? "locked" : ""}
                    type="button"
                    key={template.id || template.key}
                    onClick={() => applyTemplate(template)}
                  >
                    <span className="readme-template-title">
                      <span>{template.emoji} {template.name || template.label}</span>
                      {template.isPro && (
                        <b className="readme-pro-badge">{isPro ? "PRO" : <><Lock size={10} /> PRO</>}</b>
                      )}
                    </span>
                    {template.description && <small>{template.description}</small>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="readme-ghost-button" type="button" onClick={handleExport}><Download size={14} />Export .md</button>
          <button className={`readme-save-button ${saveState}`} type="button" onClick={handleSave} disabled={saveState === "saving"}>
            {saveButtonContent[saveState]}
          </button>
        </div>
      </header>

      <div className="readme-studio-body">
        <section className={`readme-editor-column ${mobileView === "edit" ? "mobile-active" : ""}`} aria-label="Markdown editor">
          <div className="readme-editor-toolbar">
            {toolbarGroups.map((group, groupIndex) => (
              <div className="readme-toolbar-group" key={groupIndex}>
                {group.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.label} type="button" title={item.label} aria-label={item.label} onClick={() => applyToolbarAction(item.action)}>
                      {Icon ? <Icon size={15} /> : item.text}
                    </button>
                  );
                })}
              </div>
            ))}
            <button className="readme-insert-block-button" type="button" aria-haspopup="true" onClick={() => setBlockInserterOpen(!blockInserterOpen)}>
              + Insert block
            </button>
          </div>
          <div className="readme-editor-workspace">
            <textarea
              aria-label="README markdown"
              ref={textareaRef}
              value={markdown}
              onChange={(event) => updateMarkdown(event.target.value)}
              spellCheck="false"
            />
            <BlockInserter
              open={blockInserterOpen}
              onClose={() => setBlockInserterOpen(false)}
              onInsert={insertGeneratedBlock}
              githubUsername={username}
              repoName={repo}
            />
          </div>
        </section>

        <section className={`readme-preview-column ${mobileView === "preview" ? "mobile-active" : ""}`} aria-label="Live README preview">
          <div className="readme-preview-toolbar">
            <span>Preview</span>
            <span>{counts.words} words · {counts.characters} characters</span>
          </div>
          <div className="readme-preview-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(renderedMarkdown) }} />
        </section>
      </div>

      <p className="readme-studio-status" aria-live="polite">{status}</p>
    </section>
  );
}

function applyTemplateName(content, repo) {
  return content
    .replaceAll("Project Name", repo)
    .replaceAll("Product Name", repo)
    .replaceAll("project-name", repo)
    .replaceAll("library-name", repo)
    .replaceAll("cli-name", repo)
    .replaceAll("Game Name", repo)
    .replaceAll("App Name", repo)
    .replaceAll("Documentation Name", `${repo} docs`)
    .replaceAll("Analysis Title", `${repo} analysis`);
}
