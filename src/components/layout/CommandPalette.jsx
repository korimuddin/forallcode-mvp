import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const defaultRepos = [
  { name: "orbit-readme", path: "/mira/orbit-readme", language: "TypeScript" },
  { name: "desk-notes", path: "/mira/desk-notes", language: "CSS" },
  { name: "first-pr-path", path: "/mira/first-pr-path", language: "Python" },
  { name: "soft-cli", path: "/mira/soft-cli", language: "Rust" }
];

const defaultLessons = [
  { title: "Branching", path: "/learn/branching" },
  { title: "Merging", path: "/learn/merging" },
  { title: "Pull Requests", path: "/learn/pull-requests" },
  { title: "Rebasing", path: "/learn/rebasing" }
];

const users = [
  { title: "Mira Patel", path: "/mira" },
  { title: "Lena Kim", path: "/lena" }
];

export default function CommandPalette({ repos = defaultRepos, lessons = defaultLessons }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const groups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = (value) => !normalized || value.toLowerCase().includes(normalized);

    return [
      {
        label: "Repos",
        items: repos
          .filter((repo) => matches(repo.name))
          .map((repo) => ({ title: repo.name, meta: repo.language, path: repo.path }))
      },
      {
        label: "Users",
        items: users.filter((user) => matches(user.title))
      },
      {
        label: "Lessons",
        items: lessons.filter((lesson) => matches(lesson.title))
      }
    ].filter((group) => group.items.length > 0);
  }, [lessons, query, repos]);

  const flatResults = groups.flatMap((group) => group.items);

  useEffect(() => {
    const openCommand = () => setOpen(true);
    const key = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (!open) return;
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(flatResults.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
      if (event.key === "Enter" && flatResults[activeIndex]) {
        event.preventDefault();
        navigate(flatResults[activeIndex].path);
        setOpen(false);
      }
    };

    window.addEventListener("open-command", openCommand);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("open-command", openCommand);
      window.removeEventListener("keydown", key);
    };
  }, [activeIndex, flatResults, navigate, open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  if (!open) return null;

  let resultIndex = -1;

  return (
    <div className="command-overlay" onClick={() => setOpen(false)}>
      <section className="command-palette" onClick={(event) => event.stopPropagation()}>
        <div className="command-input">
          <Search size={20} />
          <input
            autoFocus
            placeholder="Search repos, users, lessons..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="command-results">
          {groups.map((group) => (
            <div className="command-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => {
                resultIndex += 1;
                const selected = resultIndex === activeIndex;
                return (
                  <button
                    className={selected ? "active" : ""}
                    key={`${group.label}-${item.title}`}
                    onMouseEnter={() => setActiveIndex(resultIndex)}
                    onClick={() => {
                      navigate(item.path);
                      setOpen(false);
                    }}
                  >
                    <span>{item.title}</span>
                    {item.meta && <small>{item.meta}</small>}
                  </button>
                );
              })}
            </div>
          ))}
          {flatResults.length === 0 && <p className="command-empty">No results found.</p>}
        </div>
      </section>
    </div>
  );
}
