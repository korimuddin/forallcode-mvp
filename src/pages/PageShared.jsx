import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Plus } from "lucide-react";
import { LimitBanner } from "../components/ui/LimitBanner";
import Skeleton from "../components/ui/Skeleton";
import DeskIllustration from "../components/workspace/DeskIllustration";
import { isAtLimit } from "../lib/plans";
import { getUserPreference, setUserPreference } from "../lib/preferences";
import { getCurrentSession, supabase } from "../lib/supabase";
import { trackUsage } from "../lib/trackUsage";
import { useSubscription } from "../lib/useSubscription";

const languageStyles = {
  TypeScript: ["#ddd5f0", "#534AB7"],
  JavaScript: ["#f5e4c4", "#633806"],
  Python: ["#cce0f0", "#0C447C"],
  CSS: ["#c8d8c4", "#27500A"],
  Rust: ["#f5d5d8", "#72243E"],
  Shell: ["#f5e4c4", "#633806"],
  Go: ["#cce0f0", "#0C447C"]
};

const heroFontOptions = [
  { label: "Lora", value: '"Lora", serif' },
  { label: "DM Sans", value: '"DM Sans", sans-serif' },
  { label: "DM Mono", value: '"DM Mono", monospace' },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Palatino", value: "Palatino, serif" },
  { label: "Trebuchet", value: '"Trebuchet MS", sans-serif' },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Courier", value: '"Courier New", monospace' }
];

function Workspace({ compact = false, interactive = false }) {
  const { isPro, limits, planId } = useSubscription();
  const [workspaceUserId, setWorkspaceUserId] = useState("");
  const [readyToPersist, setReadyToPersist] = useState(false);
  const [focus, setFocus] = useState(false);
  const [notes, setNotes] = useState([
    { id: 1, colour: "lavender", content: "Ship README Studio", x: 18, y: 22 },
    { id: 2, colour: "rose", content: "Review OAuth copy", x: 70, y: 18 },
    { id: 3, colour: "sage", content: "Lesson diagrams", x: 60, y: 64 }
  ]);
  const [todos, setTodos] = useState([
    { id: 1, content: "Sync GitHub repos", completed: true },
    { id: 2, content: "Draft public roadmap", completed: false },
    { id: 3, content: "Polish landing designer", completed: false }
  ]);
  const [deskTheme, setDeskTheme] = useState("classic");
  const [showClock, setShowClock] = useState(true);
  const [showDecorations, setShowDecorations] = useState(true);
  const [defaultNoteColour, setDefaultNoteColour] = useState("amber");

  useEffect(() => {
    let alive = true;

    async function loadWorkspacePreferences() {
      const session = await getCurrentSession();
      const userId = session?.user?.id || "local";
      const workspacePrefs = getUserPreference(userId, "workspace", null);
      const deskPrefs = getUserPreference(userId, "workspace-desk", null);
      if (!alive) return;

      setWorkspaceUserId(userId);
      if (workspacePrefs) {
        setFocus(Boolean(workspacePrefs.focusMode));
        setDeskTheme(workspacePrefs.deskTheme || "classic");
        setShowClock(workspacePrefs.showClock ?? true);
        setShowDecorations(workspacePrefs.showDecorations ?? true);
        setDefaultNoteColour(workspacePrefs.defaultNoteColour || "amber");
      }
      if (!workspacePrefs && supabase && session?.user?.id) {
        const { data: stored } = await supabase
          .from("workspace_settings")
          .select("desk_theme, show_clock, show_decorations, focus_mode, default_note_colour")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (!alive) return;
        if (stored) {
          setFocus(Boolean(stored.focus_mode));
          setDeskTheme(stored.desk_theme || "classic");
          setShowClock(stored.show_clock ?? true);
          setShowDecorations(stored.show_decorations ?? true);
          setDefaultNoteColour(stored.default_note_colour || "amber");
        }
      }
      if (deskPrefs) {
        setFocus(Boolean(deskPrefs.focus));
        setNotes(deskPrefs.notes || []);
        setTodos(deskPrefs.todos || []);
      }
      setReadyToPersist(true);
    }

    loadWorkspacePreferences();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!readyToPersist || !workspaceUserId || !interactive) return;
    setUserPreference(workspaceUserId, "workspace-desk", { focus, notes, todos });
  }, [focus, interactive, notes, readyToPersist, todos, workspaceUserId]);

  const stickyNoteAtLimit = isAtLimit(planId, "stickyNotes", notes.length);
  const addNote = () => {
    if (stickyNoteAtLimit) return;
    setNotes([...notes, { id: Date.now(), colour: defaultNoteColour, content: "New idea", x: 34, y: 56 }]);
    if (workspaceUserId && workspaceUserId !== "local") {
      trackUsage(workspaceUserId, "sticky_note_added").catch(() => {});
    }
  };
  return (
    <section className={compact ? "workspace compact" : "workspace"}>
      <div className="workspace-toolbar">
        <Button variant="soft" onClick={() => setFocus(!focus)}><Eye size={16} />Focus mode {focus ? "ON" : "OFF"}</Button>
        {interactive && !isPro && <span className="limit-indicator">Sticky notes: {notes.length} / {limits.stickyNotes}</span>}
        {interactive && <Button disabled={stickyNoteAtLimit} onClick={addNote}><Plus size={16} />Sticky note</Button>}
      </div>
      {interactive && !isPro && (
        <p className="workspace-limit-note">
          {notes.length} of {limits.stickyNotes} sticky notes used.
          {notes.length >= limits.stickyNotes - 1 && <Link to="/upgrade">Upgrade for unlimited →</Link>}
        </p>
      )}
      {interactive && <LimitBanner limitKey="stickyNotes" currentCount={notes.length} />}
      <div className={focus ? "desk focus-on" : "desk"}>
        <DeskIllustration theme={deskTheme} showClock={showClock} showDecorations={showDecorations} />
        {notes.map((note) => (
          <textarea
            key={note.id}
            className={`sticky ${note.colour}`}
            value={note.content}
            style={{ left: `${note.x}%`, top: `${note.y}%` }}
            onChange={(event) => setNotes(notes.map((item) => item.id === note.id ? { ...item, content: event.target.value } : item))}
            onDoubleClick={() => window.location.assign("/repos")}
            readOnly={!interactive}
          />
        ))}
        <div className="todo-paper">
          <strong>To-do</strong>
          {todos.map((todo) => (
            <label key={todo.id}>
              <input type="checkbox" checked={todo.completed} onChange={() => setTodos(todos.map((item) => item.id === todo.id ? { ...item, completed: !item.completed } : item))} />
              {todo.content}
            </label>
          ))}
        </div>
        {focus && <div className="focus-message">Focus is on</div>}
      </div>
    </section>
  );
}

function LanguagePill({ language }) {
  const [bg, color] = languageStyles[language] || languageStyles.TypeScript;
  return <span className="language-pill" style={{ backgroundColor: bg, color }}><span style={{ backgroundColor: color }} />{language}</span>;
}

function normalizeRepoHero(hero, repoName) {
  return {
    title: hero?.title || repoName || "",
    image: hero?.image || "",
    positionX: Number.isFinite(hero?.positionX) ? hero.positionX : 50,
    positionY: Number.isFinite(hero?.positionY) ? hero.positionY : 50,
    fontFamily: hero?.fontFamily || heroFontOptions[0].value
  };
}

function repoToHero(repo = {}) {
  return {
    title: repo.heroTitle || repo.name || "",
    image: repo.heroImageUrl || "",
    positionX: Number.isFinite(Number(repo.heroPositionX)) ? Number(repo.heroPositionX) : 50,
    positionY: Number.isFinite(Number(repo.heroPositionY)) ? Number(repo.heroPositionY) : 50,
    fontFamily: repo.heroFont || heroFontOptions[0].value
  };
}

function compressHeroImageToBlob(input, maxBytes = 900 * 1024, maxWidth = 1400) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(input);

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const qualities = [0.85, 0.75, 0.65, 0.55, 0.5];
      const widths = [maxWidth, 1200, 1000, 800];
      let widthIndex = 0;
      let qualityIndex = 0;

      const drawAtCurrentSize = () => {
        const scale = Math.min(1, widths[widthIndex] / image.width);
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      };

      const tryExport = () => {
        drawAtCurrentSize();
        const quality = qualities[qualityIndex];
        canvas.toBlob((blob) => {
          if (!blob) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Could not prepare this hero image."));
            return;
          }

          if (blob.size <= maxBytes) {
            URL.revokeObjectURL(objectUrl);
            resolve(blob);
            return;
          }

          qualityIndex += 1;
          if (qualityIndex >= qualities.length) {
            widthIndex += 1;
            qualityIndex = 0;
          }

          if (widthIndex >= widths.length) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("This image is still over 1MB after compression. Please choose a smaller image."));
            return;
          }

          tryExport();
        }, "image/jpeg", quality);
      };

      tryExport();
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not prepare this hero image."));
    };
    image.src = objectUrl;
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function Card({ children, large = false }) {
  return <article className={large ? "card large-card" : "card"}>{children}</article>;
}

function Button({ children, disabled = false, to, variant = "primary", full = false, onClick, type = "button" }) {
  const className = `button ${variant} ${full ? "full" : ""}`;
  return to ? <Link className={className} to={to}>{children}</Link> : <button className={className} disabled={disabled} onClick={onClick} type={type}>{children}</button>;
}

function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

function RepoListSkeleton() {
  return (
    <div className="phase-repo-list" aria-label="Loading repositories">
      {Array.from({ length: 4 }).map((_, index) => (
        <article className="phase-repo-card" key={index}>
          <Skeleton className="skeleton-text medium" />
          <Skeleton className="skeleton-text wide" />
          <div className="phase-repo-meta">
            <Skeleton className="skeleton-pill" />
            <Skeleton className="skeleton-text short" />
            <Skeleton className="skeleton-text short" />
          </div>
        </article>
      ))}
    </div>
  );
}

function PageFrame({ title, eyebrow, children }) {
  return <div className="page-frame">{(title || eyebrow) && <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>}{children}</div>;
}

export { PageFrame, Card, Button, RepoListSkeleton, Workspace, compressHeroImageToBlob, clamp, normalizeRepoHero, heroFontOptions, repoToHero, LanguagePill, Badge };
