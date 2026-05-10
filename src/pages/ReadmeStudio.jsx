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
  Quote,
  Save,
  Strikethrough
} from "lucide-react";
import { renderMarkdown } from "../lib/markdownRenderer";
import { getCurrentSession, supabase } from "../lib/supabase";

const ownerUsername = "mira";

const templates = {
  blank: `# Orbit README

> A friendly project introduction.

## Features

- Beautiful hero banners
- Badge pills
- Live preview

\`\`\`ts
export const hello = "ForAllCode";
\`\`\`
`,
  package: `# Package README

Install, import, and ship with a project page that explains the useful parts first.

## Install

\`\`\`bash
npm install package-name
\`\`\`

## Usage

\`\`\`ts
import { createThing } from "package-name";
\`\`\`
`,
  project: `# Personal Project

A gentle overview of what this project does, why it exists, and how to run it.

## Getting started

1. Clone the repo
2. Install dependencies
3. Run the app locally
`,
  openSource: `# Open Source Project

Thanks for visiting. This README explains how to use the project and how to contribute.

## Contributing

- Pick an issue
- Start a focused branch
- Open a thoughtful pull request
`,
  portfolio: `# Portfolio Project

A polished case study for a project worth showing.

## Highlights

- Problem solved
- Design decisions
- Technical details
`
};

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
  const { username = ownerUsername, repo = "orbit-readme" } = useParams();
  const textareaRef = useRef(null);
  const [markdown, setMarkdown] = useState(templates.blank);
  const [renderedMarkdown, setRenderedMarkdown] = useState(templates.blank);
  const [mobileView, setMobileView] = useState("edit");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [status, setStatus] = useState("Ready");

  const isOwner = username === ownerUsername;

  useEffect(() => {
    async function loadReadme() {
      setStatus("Loading README");

      try {
        const session = await getCurrentSession();

        if (supabase && session?.user?.id) {
          const { data } = await supabase
            .from("repositories")
            .select("readme_content")
            .eq("owner_id", session.user.id)
            .eq("name", repo)
            .maybeSingle();

          if (data?.readme_content) {
            setMarkdown(data.readme_content);
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
            setStatus("Loaded from GitHub");
            return;
          }
        }

        setMarkdown(templates.blank.replace("Orbit README", repo));
        setStatus("Starter template loaded");
      } catch {
        setMarkdown(templates.blank.replace("Orbit README", repo));
        setStatus("Starter template loaded");
      }
    }

    loadReadme();
  }, [repo, username]);

  useEffect(() => {
    const timer = window.setTimeout(() => setRenderedMarkdown(markdown), 150);
    return () => window.clearTimeout(timer);
  }, [markdown]);

  const counts = useMemo(() => {
    const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
    return { words, characters: markdown.length };
  }, [markdown]);

  if (!isOwner) {
    return <Navigate to={`/${username}/${repo}`} replace />;
  }

  function wrapSelection(before, after = before) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const newText = `${textarea.value.substring(0, start)}${before}${selected}${after}${textarea.value.substring(end)}`;

    setMarkdown(newText);
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
    setMarkdown(`${textarea.value.substring(0, lineStart)}${prefix}${textarea.value.substring(lineStart)}`);
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
    setMarkdown(`${textarea.value.substring(0, start)}${before}${selected}${after}${textarea.value.substring(end)}`);
    window.setTimeout(() => textarea.focus(), 0);
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

  function exportMarkdown() {
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
    setMarkdown(template.replace("Orbit README", repo));
    setTemplatesOpen(false);
    setStatus("Template loaded");
  }

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
                <button type="button" onClick={() => applyTemplate(templates.blank)}>Blank</button>
                <button type="button" onClick={() => applyTemplate(templates.package)}>Library+package</button>
                <button type="button" onClick={() => applyTemplate(templates.project)}>Personal project</button>
                <button type="button" onClick={() => applyTemplate(templates.openSource)}>Open source</button>
                <button type="button" onClick={() => applyTemplate(templates.portfolio)}>Portfolio</button>
              </div>
            )}
          </div>
          <button className="readme-ghost-button" type="button" onClick={exportMarkdown}><Download size={14} />Export .md</button>
          <button className="readme-save-button" type="button"><Save size={14} />Save to repo</button>
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
            <button className="readme-insert-block-button" type="button" aria-haspopup="true">+ Insert block</button>
          </div>
          <textarea
            aria-label="README markdown"
            ref={textareaRef}
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            spellCheck="false"
          />
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
