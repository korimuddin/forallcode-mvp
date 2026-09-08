import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Copy, Download, FileText, Folder, Grid3X3, GitFork, Palette, Pencil, Plus, Star, Upload } from "lucide-react";
import AsciiArtGenerator from "../components/repo/ascii_art_generator";
import TopicEditor from "../components/repo/TopicEditor";
import TopicPills from "../components/repo/TopicPills";
import Hint from "../components/ui/Hint";
import Skeleton from "../components/ui/Skeleton";
import { useDocumentTitle, useSignedInUserData } from "../lib/hooks";
import { createFeedEvent } from "../lib/createFeedEvent";
import { renderMarkdown } from "../lib/markdownRenderer";
import { createNotification } from "../lib/notifications";
import { fetchGitHubFileContent, fetchGitHubRepoArchive, fetchGitHubRepoOverview, forkGitHubRepository, getCurrentSession, saveGitHubRepositoryFile, saveRepoHeroToSupabase, supabase, uploadRepoHeroImage } from "../lib/supabase";
import { trackUsage } from "../lib/trackUsage";
import { useRepoAccess } from "../lib/useRepoAccess";
import { heroFontOptions, normalizeRepoHero, repoToHero, compressHeroImageToBlob, clamp, LanguagePill, Button, Badge, Card } from "./PageShared";

const notebookColorThemes = [
  {
    name: "Forest",
    colors: [
      { id: "forest-moss", label: "Moss", start: "#c8d8c4", end: "#7aaa72" },
      { id: "forest-pine", label: "Pine", start: "#a9c5a5", end: "#3f704d" },
      { id: "forest-fern", label: "Fern", start: "#d8e5c8", end: "#84a95b" },
      { id: "forest-bark", label: "Bark", start: "#c8b49a", end: "#74614f" },
      { id: "forest-canopy", label: "Canopy", start: "#b7d7bf", end: "#2f6f5e" }
    ]
  },
  {
    name: "Beach",
    colors: [
      { id: "beach-sand", label: "Sand", start: "#f5e4c4", end: "#d2a85f" },
      { id: "beach-coral", label: "Coral", start: "#f5d5d8", end: "#d98a8e" },
      { id: "beach-tide", label: "Tide", start: "#cce0f0", end: "#6aa8c8" },
      { id: "beach-shell", label: "Shell", start: "#fff1df", end: "#e3b78a" },
      { id: "beach-seafoam", label: "Seafoam", start: "#d8eee6", end: "#7abda7" }
    ]
  },
  {
    name: "Urban",
    colors: [
      { id: "urban-stone", label: "Stone", start: "#ddd8d2", end: "#8d8580" },
      { id: "urban-brick", label: "Brick", start: "#e8c3b4", end: "#9b5b4a" },
      { id: "urban-graphite", label: "Graphite", start: "#b9b4ae", end: "#4d4742" },
      { id: "urban-neon", label: "Neon", start: "#ddd5f0", end: "#9b8fd4" },
      { id: "urban-concrete", label: "Concrete", start: "#e8e0d4", end: "#a99d93" }
    ]
  },
  {
    name: "Night",
    colors: [
      { id: "night-indigo", label: "Indigo", start: "#b9c2e6", end: "#465089" },
      { id: "night-plum", label: "Plum", start: "#d4bfd8", end: "#744d7a" },
      { id: "night-moon", label: "Moon", start: "#ddd5f0", end: "#8074bd" },
      { id: "night-slate", label: "Slate", start: "#adb6c7", end: "#364157" },
      { id: "night-ember", label: "Ember", start: "#e5b3a5", end: "#8a4637" }
    ]
  },
  {
    name: "Morning",
    colors: [
      { id: "morning-sunrise", label: "Sunrise", start: "#f5d5d8", end: "#d88c9a" },
      { id: "morning-honey", label: "Honey", start: "#f5e4c4", end: "#c8a055" },
      { id: "morning-lilac", label: "Lilac", start: "#ddd5f0", end: "#9b8fd4" },
      { id: "morning-mint", label: "Mint", start: "#dcebd4", end: "#92b985" },
      { id: "morning-peach", label: "Peach", start: "#ffe0cc", end: "#d99a71" }
    ]
  },
  {
    name: "Arctic",
    colors: [
      { id: "arctic-frost", label: "Frost", start: "#e7f0f7", end: "#a9cce3" },
      { id: "arctic-glacier", label: "Glacier", start: "#cce0f0", end: "#5d93b8" },
      { id: "arctic-ice", label: "Ice", start: "#eef7f6", end: "#9ccbc6" },
      { id: "arctic-aurora", label: "Aurora", start: "#d6e8d8", end: "#7aaa72" },
      { id: "arctic-violet", label: "Violet", start: "#e2dcf5", end: "#9b8fd4" }
    ]
  }
];

const defaultNotebookColor = notebookColorThemes[0].colors[0];

const repos = [];

function CodebaseMapPanel({
  owner,
  repo,
  repoGraph,
  title = "See the shape of the work before it grows.",
  description = "ForAllCode shows the main branch, feature branches, forks, pull requests, and merges as a living diagram."
}) {
  return (
    <section className="codebase-map-section">
      <div className="codebase-map-copy">
        <p className="eyebrow">Visual codebase map</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <CodebaseDiagram owner={owner} repo={repo} repoGraph={repoGraph} />
      <div className="codebase-map-legend">
        <span><i className="main" /> Main branch</span>
        <span><i className="branch" /> Feature branch</span>
        <span><i className="fork" /> Fork</span>
        <span><i className="merge" /> Merge</span>
      </div>
    </section>
  );
}

function CodebaseDiagram({ owner = "origin", repo = "forallcode", repoGraph }) {
  const mainCommits = (repoGraph?.commits || []).slice(0, 6).reverse().map((commit, index, items) => ({
    x: 90 + index * (items.length > 1 ? 620 / (items.length - 1) : 0),
    y: 170,
    label: commit.hash || `c${index + 1}`
  }));
  const commits = mainCommits.length > 0 ? mainCommits : [{ x: 90, y: 170, label: "empty" }];
  const feature = (repoGraph?.branches || [])
    .filter((branch) => !branch.default)
    .slice(0, 2)
    .map((branch, index) => ({
      x: 330 + index * 130,
      y: 92,
      label: branch.name.length > 18 ? `${branch.name.slice(0, 15)}...` : branch.name
    }));
  const fork = (repoGraph?.forks || []).slice(0, 2).map((item, index) => ({
    x: 210 + index * 150,
    y: 260 + index * 30,
    label: item.owner || item.name
  }));
  const pull = repoGraph?.pulls?.[0];
  const defaultBranch = repoGraph?.defaultBranch || "main";

  return (
    <div className="codebase-diagram" aria-label="Visual diagram of main branch, forks, feature branches, and merges">
      <svg viewBox="0 0 800 380" role="img">
        <defs>
          <marker id="arrow-soft" markerHeight="8" markerWidth="8" orient="auto" refX="6" refY="3">
            <path d="M0,0 L0,6 L7,3 z" fill="#9c918c" />
          </marker>
        </defs>

        <path className="map-line main-line" d="M90 170 H710" />
        {feature.length > 0 && <path className="map-line branch-line" d="M330 170 C340 120 370 92 410 92 H460 C506 92 530 124 590 170" />}
        {fork.length > 0 && <path className="map-line fork-line" d="M210 170 C212 225 260 258 350 300 C432 332 492 302 590 170" />}
        {pull && <path className="map-line pr-line" d="M500 260 C545 244 570 212 590 170" markerEnd="url(#arrow-soft)" />}

        <rect x="54" y="26" width="196" height="54" rx="16" fill="#fffdf9" stroke="#e8e0d4" />
        <text x="74" y="58">{owner}/{repo}</text>

        {pull && (
          <>
            <rect x="586" y="244" width="146" height="54" rx="16" fill="#f5e4c4" stroke="#e8e0d4" />
            <text x="606" y="276">PR #{pull.number} {pull.state}</text>
          </>
        )}

        {commits.map((commit, index) => (
          <g key={commit.label}>
            <circle className={index === 4 ? "merge-node" : "main-node"} cx={commit.x} cy={commit.y} r="14" />
            <text x={commit.x} y="210" textAnchor="middle">{commit.label}</text>
          </g>
        ))}

        {feature.map((commit) => (
          <g key={commit.label}>
            <circle className="branch-node" cx={commit.x} cy={commit.y} r="13" />
            <text x={commit.x} y="66" textAnchor="middle">{commit.label}</text>
          </g>
        ))}

        {fork.map((commit) => (
          <g key={commit.label}>
            <circle className="fork-node" cx={commit.x} cy={commit.y} r="13" />
            <text x={commit.x} y={commit.y + 40} textAnchor="middle">{commit.label}</text>
          </g>
        ))}

        <text className="map-label" x="650" y="142">{defaultBranch}</text>
        {feature[0] && <text className="map-label" x="380" y="122">active branch</text>}
        {fork[0] && <text className="map-label" x="286" y="246">recent fork</text>}
      </svg>
    </div>
  );
}

function RepoPage() {
  const { username, repo } = useParams();
  useDocumentTitle(`${repo} · ${username}`);
  const { repos: userRepos } = useSignedInUserData();
  const data = userRepos.find((item) => item.name === repo && item.owner === username)
    || userRepos.find((item) => item.name === repo)
    || {
      name: repo,
      owner: username,
      description: "GitHub repository",
      language: "Code",
      stars: 0,
      forks: 0,
      updated: "Recently",
      private: false
  };
  const [activeTab, setActiveTab] = useState("Code");
  const [landingHtml, setLandingHtml] = useState("");
  const [repoDetails, setRepoDetails] = useState(null);
  const [repoRecord, setRepoRecord] = useState(null);
  const [repoTopics, setRepoTopics] = useState([]);
  const [topicEditorOpen, setTopicEditorOpen] = useState(false);
  const [topicStatus, setTopicStatus] = useState("");
  const [repoDetailsLoading, setRepoDetailsLoading] = useState(true);
  const [repoDetailsError, setRepoDetailsError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [openFile, setOpenFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(() => new Set());
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [downloadState, setDownloadState] = useState("");
  const [repoActionState, setRepoActionState] = useState("");
  const [repoActionMessage, setRepoActionMessage] = useState("");
  const [cloneMenuOpen, setCloneMenuOpen] = useState(false);
  const [addFileMenuOpen, setAddFileMenuOpen] = useState(false);
  const [createFileOpen, setCreateFileOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [fileActionState, setFileActionState] = useState("");
  const [fileActionMessage, setFileActionMessage] = useState("");
  const [editingFile, setEditingFile] = useState(false);
  const [activeNotebook, setActiveNotebook] = useState("");
  const [activeNotePath, setActiveNotePath] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [notebookName, setNotebookName] = useState("");
  const [notebookTheme, setNotebookTheme] = useState("Forest");
  const [selectedNotebookColorId, setSelectedNotebookColorId] = useState(defaultNotebookColor.id);
  const [notebooksCollapsed, setNotebooksCollapsed] = useState(false);
  const [pagesCollapsed, setPagesCollapsed] = useState(false);
  const [notebookColors, setNotebookColors] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`forallcode:notebook-colors:${username}/${repo}`) || "{}");
    } catch {
      return {};
    }
  });
  const [noteTitleOverrides, setNoteTitleOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`forallcode:note-titles:${username}/${repo}`) || "{}");
    } catch {
      return {};
    }
  });
  const [notesStatus, setNotesStatus] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [asciiModalOpen, setAsciiModalOpen] = useState(false);
  const [heroEditorOpen, setHeroEditorOpen] = useState(false);
  const [repoHero, setRepoHero] = useState({ title: "", image: "", positionX: 50, positionY: 50, fontFamily: heroFontOptions[0].value });
  const [heroDraft, setHeroDraft] = useState({ title: "", image: "", positionX: 50, positionY: 50, fontFamily: heroFontOptions[0].value });
  const [heroUploadState, setHeroUploadState] = useState("");
  const [heroToast, setHeroToast] = useState("");
  const heroPositionerRef = useRef(null);
  const addFileMenuRef = useRef(null);
  const cloneMenuRef = useRef(null);
  const noteTextareaRef = useRef(null);
  const uploadFileInputRef = useRef(null);
  const cloneUrl = `https://github.com/${username}/${repo}.git`;
  const notebookColorStorageKey = `forallcode:notebook-colors:${username}/${repo}`;
  const noteTitleStorageKey = `forallcode:note-titles:${username}/${repo}`;
  const notebooks = getRepoNotebooks(repoDetails?.files || []);
  const selectedNotebook = notebooks.find((notebook) => notebook.slug === activeNotebook) || notebooks[0] || null;
  const selectedNote = selectedNotebook?.notes.find((note) => note.path === activeNotePath) || selectedNotebook?.notes[0] || null;
  const activeNotebookTheme = notebookColorThemes.find((theme) => theme.name === notebookTheme) || notebookColorThemes[0];
  const selectedNotebookColor = notebookColorThemes.flatMap((theme) => theme.colors).find((color) => color.id === selectedNotebookColorId) || defaultNotebookColor;
  const { canPush, canManageRepo, canMerge } = useRepoAccess(repoRecord?.id, repoRecord?.owner_id);

  useEffect(() => {
    try {
      setNotebookColors(JSON.parse(localStorage.getItem(notebookColorStorageKey) || "{}"));
    } catch {
      setNotebookColors({});
    }
  }, [notebookColorStorageKey]);

  useEffect(() => {
    try {
      setNoteTitleOverrides(JSON.parse(localStorage.getItem(noteTitleStorageKey) || "{}"));
    } catch {
      setNoteTitleOverrides({});
    }
  }, [noteTitleStorageKey]);

  useEffect(() => {
    const normalizedHero = normalizeRepoHero(repoToHero(data), repo);
    setRepoHero(normalizedHero);
    setHeroDraft(normalizedHero);
  }, [
    repo,
    data.heroImageUrl,
    data.heroPositionX,
    data.heroPositionY,
    data.heroTitle,
    data.heroFont
  ]);

  useEffect(() => {
    if (!heroToast) return undefined;
    const timer = window.setTimeout(() => setHeroToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [heroToast]);

  useEffect(() => {
    function closeAddFileMenu(event) {
      if (!addFileMenuRef.current?.contains(event.target)) setAddFileMenuOpen(false);
      if (!cloneMenuRef.current?.contains(event.target)) setCloneMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeAddFileMenu);
    return () => document.removeEventListener("pointerdown", closeAddFileMenu);
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadRepoRecord() {
      if (!supabase) return;
      const { data: repository } = await supabase
        .from("repositories")
        .select("id, owner_id, profiles!repositories_owner_id_fkey!inner(username), repo_topics(topic)")
        .eq("name", repo)
        .eq("profiles.username", username)
        .maybeSingle();

      if (alive) {
        setRepoRecord(repository || null);
        setRepoTopics((repository?.repo_topics || []).map((item) => item.topic).sort());
      }
    }

    loadRepoRecord();
    return () => {
      alive = false;
    };
  }, [repo, username]);

  useEffect(() => {
    let alive = true;

    async function loadGitHubDetails() {
      setRepoDetailsLoading(true);
      setRepoDetailsError("");

      try {
        const session = await getCurrentSession();
        if (!session?.provider_token) {
          throw new Error("Sign in with GitHub to load live repo contents.");
        }

        const details = await fetchGitHubRepoOverview(username, repo, session.provider_token);
        if (alive) {
          setRepoDetails(details);
          setExpandedFolders(new Set());
          const readmeFile = details.files.find((item) => item.type === "file" && item.name.toLowerCase() === "readme.md");
          setSelectedFile(readmeFile || details.files.find((item) => item.type === "file") || null);
          setOpenFile(readmeFile ? {
            name: "README.md",
            path: readmeFile.path,
            content: details.readme,
            size: readmeFile.size || details.readme.length
          } : null);
        }
      } catch (error) {
        if (alive) {
          setRepoDetails(null);
          setRepoDetailsError(error.message || "Could not load this repository from GitHub.");
        }
      } finally {
        if (alive) setRepoDetailsLoading(false);
      }
    }

    loadGitHubDetails();
    return () => {
      alive = false;
    };
  }, [username, repo]);

  useEffect(() => {
    if (activeTab !== "Notes" || activeNotebook || notebooks.length === 0) return;
    const firstNotebook = notebooks[0];
    const firstNote = firstNotebook.notes[0];
    setActiveNotebook(firstNotebook.slug);
    if (firstNote) openNotePage(firstNote);
  }, [activeTab, activeNotebook, notebooks.length]);

  async function refreshRepoAfterFileChange(preferredPath = "") {
    const session = await getCurrentSession();
    if (!session?.provider_token) {
      throw new Error("Sign in with GitHub to refresh repository files.");
    }

    const details = await fetchGitHubRepoOverview(username, repo, session.provider_token);
    setRepoDetails(details);
    const visibleParents = getParentFolderPaths(preferredPath);
    setExpandedFolders(new Set(visibleParents));

    const preferredFile = preferredPath
      ? details.files.find((item) => item.type === "file" && item.path === preferredPath)
      : null;
    const readmeFile = details.files.find((item) => item.type === "file" && item.name.toLowerCase() === "readme.md");
    const nextFile = preferredFile || readmeFile || details.files.find((item) => item.type === "file") || null;
    setSelectedFile(nextFile);

    if (nextFile) {
      const content = await fetchGitHubFileContent(username, repo, nextFile.path, session.provider_token, details.defaultBranch);
      setOpenFile(content);
    } else {
      setOpenFile(readmeFile ? {
        name: "README.md",
        path: readmeFile.path,
        content: details.readme,
        size: readmeFile.size || details.readme.length
      } : null);
    }
  }

  async function openRepoFile(file) {
    if (file.type === "folder") return;
    setSelectedFile(file);
    setEditingFile(false);
    setFileLoading(true);
    setFileError("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub to open files.");
      }

      const content = await fetchGitHubFileContent(username, repo, file.path, session.provider_token, repoDetails?.defaultBranch);
      setOpenFile(content);
    } catch (error) {
      setOpenFile(null);
      setFileError(error.message || "Could not open this file from GitHub.");
    } finally {
      setFileLoading(false);
    }
  }

  function startEditingFile() {
    setEditingFile(true);
    setFileActionMessage("File editor opens in the next build step.");
  }

  function toggleRepoFolder(folder) {
    setExpandedFolders((current) => {
      const next = new Set(current);
      if (next.has(folder.path)) next.delete(folder.path);
      else next.add(folder.path);
      return next;
    });
  }

  async function downloadSelectedFile() {
    if (!selectedFile || selectedFile.type === "folder") return;
    setDownloadState("file");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub to download files.");
      }

      const content = openFile?.path === selectedFile.path
        ? openFile
        : await fetchGitHubFileContent(username, repo, selectedFile.path, session.provider_token, repoDetails?.defaultBranch);
      downloadBlob(new Blob([content.content || ""], { type: "text/plain;charset=utf-8" }), content.name || selectedFile.name);
    } catch (error) {
      setFileError(error.message || "Could not download this file from GitHub.");
    } finally {
      setDownloadState("");
    }
  }

  async function downloadRepositoryArchive() {
    setDownloadState("repo");
    setRepoActionMessage("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub to download this repository.");
      }

      const branch = repoDetails?.defaultBranch || "main";
      const archive = await fetchGitHubRepoArchive(username, repo, session.provider_token, branch);
      downloadBlob(archive, `${repo}-${branch}.zip`);
      setRepoActionMessage(`Downloading ${repo}-${branch}.zip`);
    } catch (error) {
      setRepoActionMessage(error.message || "Could not download this repository from GitHub.");
    } finally {
      setDownloadState("");
    }
  }

  async function forkRepository() {
    setRepoActionState("forking");
    setRepoActionMessage("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub repo access to fork this repository.");
      }

      const fork = await forkGitHubRepository(username, repo, session.provider_token);
      setRepoActionMessage(`Fork started: ${fork.full_name || fork.name}. GitHub may take a moment to finish copying files.`);
    } catch (error) {
      setRepoActionMessage(error.message || "Could not fork this repository from GitHub.");
    } finally {
      setRepoActionState("");
    }
  }

  async function copyCloneUrl() {
    setRepoActionMessage("");

    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(cloneUrl);
        } catch (error) {
          copyTextWithTemporaryInput(cloneUrl);
        }
      } else {
        copyTextWithTemporaryInput(cloneUrl);
      }
      setCloneMenuOpen(false);
      setRepoActionMessage("Clone URL copied.");
    } catch (error) {
      setRepoActionMessage("Could not copy automatically. Select the clone URL and copy it manually.");
    }
  }

  function copyTextWithTemporaryInput(value) {
    const input = document.createElement("input");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw new Error("Clipboard copy failed.");
  }

  function getCurrentRepoDirectory() {
    if (selectedFile?.type === "folder") return selectedFile.path;
    if (selectedFile?.path?.includes("/")) return selectedFile.path.split("/").slice(0, -1).join("/");
    return "";
  }

  function openCreateFileDialog() {
    const currentFolder = getCurrentRepoDirectory();
    setNewFilePath(currentFolder ? `${currentFolder}/new-file.md` : "new-file.md");
    setNewFileContent("");
    setFileActionMessage("");
    setCreateFileOpen(true);
    setAddFileMenuOpen(false);
  }

  function openUploadFilePicker() {
    setFileActionMessage("");
    setAddFileMenuOpen(false);
    uploadFileInputRef.current?.click();
  }

  async function createNewGitHubFile(event) {
    event.preventDefault();
    const path = normalizeGitHubFilePath(newFilePath);
    setFileActionState("creating");
    setFileActionMessage("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub repo access before creating files.");
      }

      await saveGitHubRepositoryFile({
        githubAccessToken: session.provider_token,
        owner: username,
        repo,
        path,
        content: newFileContent,
        branch: repoDetails?.defaultBranch,
        message: `Add ${path} via ForAllCode`
      });
      await refreshRepoAfterFileChange(path);
      setCreateFileOpen(false);
      setNewFilePath("");
      setNewFileContent("");
      setFileActionMessage(`${path} was saved to GitHub.`);
    } catch (error) {
      setFileActionMessage(error.message || "Could not create this file on GitHub.");
    } finally {
      setFileActionState("");
    }
  }

  async function uploadGitHubFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    const currentFolder = getCurrentRepoDirectory();
    setFileActionState("uploading");
    setFileActionMessage("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub repo access before uploading files.");
      }

      const uploadedPaths = [];
      for (const file of files) {
        const path = normalizeGitHubFilePath([currentFolder, file.name].filter(Boolean).join("/"));
        const contentBase64 = await readFileAsBase64(file);
        await saveGitHubRepositoryFile({
          githubAccessToken: session.provider_token,
          owner: username,
          repo,
          path,
          contentBase64,
          branch: repoDetails?.defaultBranch,
          message: `Upload ${path} via ForAllCode`
        });
        uploadedPaths.push(path);
      }

      await refreshRepoAfterFileChange(uploadedPaths[0]);
      setFileActionMessage(`${uploadedPaths.length} file${uploadedPaths.length === 1 ? "" : "s"} uploaded to GitHub.`);
    } catch (error) {
      setFileActionMessage(error.message || "Could not upload these files to GitHub.");
    } finally {
      setFileActionState("");
    }
  }

  async function createNotebook() {
    const slug = slugForPath(notebookName);
    if (!slug) {
      setNotesStatus("Add a notebook name first.");
      return;
    }

    setNotesSaving(true);
    setNotesStatus("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub repo access before creating notebooks.");
      }

      const path = `notes/${slug}/index.md`;
      const title = titleFromSlug(slug);
      await saveGitHubRepositoryFile({
        githubAccessToken: session.provider_token,
        owner: username,
        repo,
        path,
        content: `# ${title}\n\nStart your notebook here.\n`,
        branch: repoDetails?.defaultBranch,
        message: `Create ${title} notebook via ForAllCode`
      });
      await refreshRepoAfterFileChange(path);
      setActiveNotebook(slug);
      setActiveNotePath(path);
      setNoteContent(`# ${title}\n\nStart your notebook here.\n`);
      saveNotebookColor(slug, selectedNotebookColor);
      setNotebookName("");
      setNotesStatus(`${title} notebook created in GitHub.`);
    } catch (error) {
      setNotesStatus(error.message || "Could not create this notebook on GitHub.");
    } finally {
      setNotesSaving(false);
    }
  }

  function saveNotebookColor(slug, color) {
    if (!slug || !color) return;
    setNotebookColors((current) => {
      const next = { ...current, [slug]: color };
      localStorage.setItem(notebookColorStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function handleNotebookColorSelect(color) {
    setSelectedNotebookColorId(color.id);
    if (selectedNotebook?.slug) {
      saveNotebookColor(selectedNotebook.slug, color);
    }
  }

  function saveNoteTitleOverride(path, content) {
    if (!path) return;
    const title = getNoteTitleFromContent(content) || titleFromSlug(path.split("/").pop() || "");
    setNoteTitleOverrides((current) => {
      const next = { ...current, [path]: title };
      localStorage.setItem(noteTitleStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function getNoteDisplayName(note) {
    if (!note) return "";
    if (note.path === activeNotePath) {
      return getNoteTitleFromContent(noteContent) || noteTitleOverrides[note.path] || note.name;
    }
    return noteTitleOverrides[note.path] || note.name;
  }

  async function createNotePage() {
    const notebook = selectedNotebook?.slug || activeNotebook;
    if (!notebook) {
      setNotesStatus("Create or select a notebook first.");
      return;
    }

    const existingSlugs = new Set((selectedNotebook?.notes || []).map((note) => note.path.split("/").pop()?.replace(/\.md$/i, "")));
    let pageNumber = (selectedNotebook?.notes.length || 0) + 1;
    let slug = `page-${pageNumber}`;
    while (existingSlugs.has(slug)) {
      pageNumber += 1;
      slug = `page-${pageNumber}`;
    }
    const path = `notes/${notebook}/${slug}.md`;
    const title = "Untitled page";
    setNotesSaving(true);
    setNotesStatus("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub repo access before creating notes.");
      }

      const content = `# ${title}\n\n`;
      await saveGitHubRepositoryFile({
        githubAccessToken: session.provider_token,
        owner: username,
        repo,
        path,
        content,
        branch: repoDetails?.defaultBranch,
        message: `Create ${title} note via ForAllCode`
      });
      await refreshRepoAfterFileChange(path);
      setActiveNotebook(notebook);
      setActiveNotePath(path);
      setNoteContent(content);
      saveNoteTitleOverride(path, content);
      setNotesStatus(`${title} note created in GitHub.`);
    } catch (error) {
      setNotesStatus(error.message || "Could not create this note on GitHub.");
    } finally {
      setNotesSaving(false);
    }
  }

  async function openNotePage(note) {
    if (!note?.path) return;
    setNotesSaving(true);
    setNotesStatus("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub to open notes.");
      }

      const content = await fetchGitHubFileContent(username, repo, note.path, session.provider_token, repoDetails?.defaultBranch);
      setActiveNotebook(note.notebookSlug);
      setActiveNotePath(note.path);
      setNoteContent(content?.content || "");
      saveNoteTitleOverride(note.path, content?.content || "");
    } catch (error) {
      setNotesStatus(error.message || "Could not open this note from GitHub.");
    } finally {
      setNotesSaving(false);
    }
  }

  async function saveActiveNote() {
    if (!activeNotePath) {
      setNotesStatus("Create or select a note first.");
      return;
    }

    setNotesSaving(true);
    setNotesStatus("");

    try {
      const session = await getCurrentSession();
      if (!session?.provider_token) {
        throw new Error("Sign in with GitHub repo access before saving notes.");
      }

      await saveGitHubRepositoryFile({
        githubAccessToken: session.provider_token,
        owner: username,
        repo,
        path: activeNotePath,
        content: noteContent,
        branch: repoDetails?.defaultBranch,
        message: `Update ${activeNotePath} via ForAllCode Notes`
      });
      await refreshRepoAfterFileChange(activeNotePath);
      saveNoteTitleOverride(activeNotePath, noteContent);
      setNotesStatus("Note saved to GitHub.");
    } catch (error) {
      setNotesStatus(error.message || "Could not save this note to GitHub.");
    } finally {
      setNotesSaving(false);
    }
  }

  function insertIntoNoteAtCursor(markdown) {
    const textarea = noteTextareaRef.current;
    if (!textarea) {
      setNoteContent((current) => `${current}${markdown}`);
      return;
    }

    const selectionStart = textarea.selectionStart ?? noteContent.length;
    const selectionEnd = textarea.selectionEnd ?? noteContent.length;
    const nextContent = `${noteContent.slice(0, selectionStart)}${markdown}${noteContent.slice(selectionEnd)}`;
    const cursorPosition = selectionStart + markdown.length;
    setNoteContent(nextContent);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  async function handleHeroImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setHeroUploadState("uploading");
    setHeroToast("");

    try {
      const session = await getCurrentSession();
      const imageBlob = await compressHeroImageToBlob(file);
      const image = await uploadRepoHeroImage(session, username, repo, imageBlob);
      trackUsage(session.user.id, "hero_image_uploaded", {
        repo_name: repo,
        owner: username,
        size: imageBlob.size
      }).catch(() => {});
      const nextHero = {
        ...heroDraft,
        title: heroDraft.title || repo,
        image,
        positionX: heroDraft.positionX ?? 50,
        positionY: heroDraft.positionY ?? 50,
        fontFamily: heroDraft.fontFamily || heroFontOptions[0].value
      };
      await saveRepoHeroToSupabase(session, repo, nextHero);
      setHeroDraft(nextHero);
      setRepoHero(nextHero);
      setHeroToast("Hero image uploaded and saved.");
      setHeroUploadState("uploaded");
    } catch (error) {
      setHeroToast(error.message || "Choose a smaller image and try again.");
      setHeroUploadState("");
    } finally {
      event.target.value = "";
    }
  }

  function moveHeroImage(event) {
    if (event.type === "pointermove" && event.buttons !== 1) return;
    const bounds = heroPositionerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const positionX = clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100);
    const positionY = clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100);
    setHeroDraft((current) => ({ ...current, positionX, positionY }));
  }

  async function saveRepoHero() {
    const nextHero = {
      title: heroDraft.title || repo,
      image: heroDraft.image || "",
      positionX: heroDraft.positionX ?? 50,
      positionY: heroDraft.positionY ?? 50,
      fontFamily: heroDraft.fontFamily || heroFontOptions[0].value
    };

    try {
      setHeroUploadState("saving");
      const session = await getCurrentSession();
      await saveRepoHeroToSupabase(session, repo, nextHero);
      setRepoHero(nextHero);
      setHeroEditorOpen(false);
      setHeroToast("Hero saved.");
    } catch (error) {
      setHeroToast(error.message || "Could not save this hero.");
    } finally {
      setHeroUploadState("");
    }
  }

  async function saveRepoTopics(nextTopics) {
    if (!supabase || !repoRecord?.id) return;
    setTopicStatus("");

    try {
      const cleanedTopics = Array.from(new Set(nextTopics)).slice(0, 20);
      const current = new Set(repoTopics);
      const next = new Set(cleanedTopics);
      const toAdd = cleanedTopics.filter((topic) => !current.has(topic));
      const toRemove = repoTopics.filter((topic) => !next.has(topic));

      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("repo_topics")
          .delete()
          .eq("repo_id", repoRecord.id)
          .in("topic", toRemove);
        if (deleteError) throw deleteError;
      }

      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("repo_topics")
          .insert(toAdd.map((topic) => ({ repo_id: repoRecord.id, topic })));
        if (insertError) throw insertError;
      }

      setRepoTopics(cleanedTopics);
      setTopicEditorOpen(false);
      setTopicStatus("Topics saved.");
    } catch (error) {
      setTopicStatus(error.message || "Could not save topics.");
    }
  }

  function clearRepoHeroImage() {
    setHeroDraft((current) => ({ ...current, image: "", positionX: 50, positionY: 50 }));
  }

  useEffect(() => {
    async function loadPublishedLanding() {
      if (!supabase) return;

      const { data: repository } = await supabase
        .from("repositories")
        .select("landing_page_html")
        .eq("name", repo)
        .maybeSingle();

      if (repository?.landing_page_html) setLandingHtml(repository.landing_page_html);
    }

    loadPublishedLanding();
  }, [repo]);

  async function handleStarRepo() {
    if (!supabase) return;
    const session = await getCurrentSession();
    if (!session?.user?.id) return;

    const { data: repository } = await supabase
      .from("repositories")
      .select("id, owner_id, is_private, name")
      .eq("name", repo)
      .maybeSingle();
    const { data: actor } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!repository?.id) return;

    const { error: starError } = await supabase
      .from("stars")
      .upsert({ user_id: session.user.id, repo_id: repository.id }, { onConflict: "user_id,repo_id" });
    if (starError) {
      setRepoActionMessage(starError.message || "Could not star this repository.");
      return;
    }

    setRepoActionMessage("Repository added to your starred repos.");
    if (!repository.is_private) {
      createFeedEvent(supabase, {
        actorId: session.user.id,
        eventType: "repo_starred",
        repoId: repository.id,
        metadata: { repo_name: repository.name || repo }
      }).catch(() => {});
    }

    if (!repository.owner_id || repository.owner_id === session.user.id) return;
    await createNotification(supabase, {
      userId: repository.owner_id,
      type: "star",
      actorId: session.user.id,
      repoId: repository.id,
      message: `${actor?.display_name || "Someone"} starred your repo ${repo}`
    });
  }

  return (
    <div className="phase-repo-page">
      {landingHtml && <PublishedLanding html={landingHtml} />}
      <section
        className={repoHero.image ? "phase-repo-header has-hero-image" : "phase-repo-header"}
        style={repoHero.image ? {
          backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .82) 0%, rgba(20, 16, 14, .66) 34%, rgba(20, 16, 14, .26) 68%, rgba(20, 16, 14, .12) 100%), url("${repoHero.image}")`,
          backgroundPosition: `${repoHero.positionX ?? 50}% ${repoHero.positionY ?? 50}%`
        } : undefined}
      >
        <div className="repo-hero-content">
          <div className="repo-breadcrumb"><Link to="/repos">{username}</Link><b>/</b><strong>{repo}</strong></div>
          <h1 style={{ fontFamily: repoHero.fontFamily || heroFontOptions[0].value }}>{repoHero.title || repo}</h1>
          <p>{data.description}</p>
          <TopicPills editable={canManageRepo} onEdit={() => setTopicEditorOpen(true)} topics={repoTopics} />
          {topicStatus && <p className="repo-topic-status">{topicStatus}</p>}
          <div className="phase-repo-meta">
            <LanguagePill language={data.language} />
            <span><Star size={14} />{data.stars}</span>
            <span><GitFork size={14} />{data.forks}</span>
            <span>Updated {data.updated}</span>
          </div>
        </div>
        <div className="repo-header-actions">
          <div className="repo-primary-actions">
            <Button variant="soft" onClick={handleStarRepo}><Star size={16} />Star</Button>
            <Button variant="soft" onClick={forkRepository} disabled={repoActionState === "forking"}>
              <GitFork size={16} />{repoActionState === "forking" ? "Forking..." : <Hint term="fork">Fork</Hint>}
            </Button>
            <Button variant="soft" onClick={downloadRepositoryArchive} disabled={repoDetailsLoading || downloadState === "repo"}>
              <Download size={16} />{downloadState === "repo" ? "Downloading..." : "Download all"}
            </Button>
            <div className={cloneMenuOpen ? "clone-control open" : "clone-control"} ref={cloneMenuRef}>
              <button onClick={() => setCloneMenuOpen((open) => !open)} type="button"><Hint term="clone">Clone</Hint> <ChevronDown size={14} /></button>
              <div>
                <input readOnly value={cloneUrl} onFocus={(event) => event.target.select()} aria-label="Clone URL" />
                <button className="button soft" onClick={copyCloneUrl} type="button" aria-label="Copy clone URL"><Copy size={16} />Copy</button>
              </div>
            </div>
          </div>
          <button className="repo-hero-edit-button" onClick={() => setHeroEditorOpen(true)}>
            <Palette size={16} />Edit hero
          </button>
        </div>
        {repoActionMessage && <p className="repo-action-message" role="status">{repoActionMessage}</p>}
      </section>
      {heroEditorOpen && (
        <div className="repo-hero-modal-backdrop" onClick={() => setHeroEditorOpen(false)}>
          <div className="repo-hero-editor" role="dialog" aria-modal="true" aria-label="Edit repository hero" onClick={(event) => event.stopPropagation()}>
            <label>
              Overlay title
              <input value={heroDraft.title} onChange={(event) => setHeroDraft({ ...heroDraft, title: event.target.value })} placeholder={repo} />
            </label>
            <label>
              Title font
              <select value={heroDraft.fontFamily || heroFontOptions[0].value} onChange={(event) => setHeroDraft({ ...heroDraft, fontFamily: event.target.value })}>
                {heroFontOptions.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
              </select>
            </label>
            <label>
              Background image
              <input accept="image/*" type="file" onChange={handleHeroImageUpload} disabled={heroUploadState === "uploading" || heroUploadState === "saving"} />
            </label>
            {heroUploadState === "uploading" && <p className="repo-hero-upload-status">Compressing and uploading image...</p>}
            {heroToast && <p className="repo-hero-toast" role="status">{heroToast}</p>}
            {heroDraft.image && (
              <div className="repo-hero-position-field">
                <span>Hero image position</span>
                <div
                  className="repo-hero-positioner"
                  onPointerDown={moveHeroImage}
                  onPointerMove={moveHeroImage}
                  ref={heroPositionerRef}
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .82), rgba(20, 16, 14, .12)), url("${heroDraft.image}")`,
                    backgroundPosition: `${heroDraft.positionX ?? 50}% ${heroDraft.positionY ?? 50}%`
                  }}
                >
                  <strong style={{
                    fontFamily: heroDraft.fontFamily || heroFontOptions[0].value,
                    left: `${heroDraft.positionX ?? 50}%`,
                    top: `${heroDraft.positionY ?? 50}%`
                  }} />
                </div>
                <small>Drag inside the box to choose which part of the image appears in the hero banner.</small>
              </div>
            )}
            {heroDraft.image && <button className="text-button" onClick={clearRepoHeroImage}>Remove image</button>}
            <div className="repo-hero-editor-actions">
              <Button variant="soft" onClick={() => setHeroEditorOpen(false)} disabled={heroUploadState === "uploading" || heroUploadState === "saving"}>Cancel</Button>
              <Button onClick={saveRepoHero} disabled={heroUploadState === "uploading" || heroUploadState === "saving"}>
                {heroUploadState === "saving" ? "Saving..." : "Save hero"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {topicEditorOpen && (
        <TopicEditor
          onClose={() => setTopicEditorOpen(false)}
          onSave={saveRepoTopics}
          topics={repoTopics}
        />
      )}

      <div className="repo-tab-bar">
        {["Code", "Issues", "Pull requests", "Discussions", "Projects", "Insights", "Commits", "Branches", "Visual Map", "Notes", "Settings"].map((tab) => {
            if (tab === "Issues") return <Link className="repo-tab-link" key={tab} to={`/${username}/${repo}/issues`}>Issues</Link>;
            if (tab === "Pull requests") return <Link className="repo-tab-link" key={tab} to={`/${username}/${repo}/pulls`}><Hint term="pull-request">Pull requests</Hint></Link>;
            if (tab === "Discussions") return <Link className="repo-tab-link" key={tab} to={`/${username}/${repo}/discussions`}>Discussions</Link>;
            if (tab === "Projects") return <Link className="repo-tab-link" key={tab} to={`/${username}/${repo}/projects`}>Projects</Link>;
          if (tab === "Insights" && canMerge) return <Link className="repo-tab-link" key={tab} to={`/${username}/${repo}/insights`}>Insights</Link>;
          if (tab === "Insights") return null;
          const hintedTab = tab === "Commits" ? <Hint term="commit">Commits</Hint> : tab === "Branches" ? <Hint term="branch">Branches</Hint> : tab;
          return <button className={activeTab === tab ? "active" : ""} key={tab} onClick={() => setActiveTab(tab)}>{hintedTab}</button>;
        })}
      </div>

      {activeTab === "Code" && (
        <section className="phase-code-tab">
          <div className="repo-code-toolbar">
            <div>
              <strong>{repoDetails?.defaultBranch || "main"}</strong>
              <span>{fileActionState === "uploading" ? "Uploading to GitHub..." : fileActionState === "creating" ? "Creating file on GitHub..." : fileActionMessage || "Files are saved directly to GitHub."}</span>
            </div>
            <div className="add-file-control" ref={addFileMenuRef}>
              <button
                className="add-file-button"
                disabled={repoDetailsLoading || Boolean(repoDetailsError) || Boolean(fileActionState)}
                onClick={() => setAddFileMenuOpen((open) => !open)}
                type="button"
              >
                Add file <ChevronDown size={15} />
              </button>
              {addFileMenuOpen && (
                <div className="add-file-menu">
                  <button onClick={openCreateFileDialog} type="button"><Plus size={18} />Create new file</button>
                  <button onClick={openUploadFilePicker} type="button"><Upload size={18} />Upload files</button>
                </div>
              )}
              <input multiple onChange={uploadGitHubFiles} ref={uploadFileInputRef} type="file" hidden />
            </div>
          </div>
          {repoDetailsLoading ? (
            <>
              <RepoFileTreeSkeleton />
              <ReadmeSkeleton />
            </>
          ) : repoDetailsError ? (
            <RepoDataMessage title="Could not load GitHub files" text={repoDetailsError} />
          ) : (
            <>
              <aside className="phase-file-tree">
                <select value={repoDetails?.defaultBranch || "main"} onChange={() => {}}>
                  {(repoDetails?.branches?.length ? repoDetails.branches : [{ name: repoDetails?.defaultBranch || "main" }]).map((branch) => (
                    <option key={branch.name}>{branch.name}</option>
                  ))}
                </select>
                {getVisibleRepoTree(repoDetails?.files || [], expandedFolders).map((item) => (
                  <button
                    className={[
                      selectedFile?.path === item.path ? "active" : "",
                      item.type === "folder" ? "folder-toggle" : ""
                    ].filter(Boolean).join(" ")}
                    key={item.path}
                    onClick={() => item.type === "folder" ? toggleRepoFolder(item) : openRepoFile(item)}
                    title={item.path}
                    style={{ paddingLeft: `${12 + item.indent * 18}px` }}
                  >
                    {item.type === "folder" && (
                      <ChevronDown className={expandedFolders.has(item.path) ? "folder-chevron open" : "folder-chevron"} size={13} />
                    )}
                    {item.type === "folder" ? <Folder size={15} /> : <FileText size={15} />}
                    {item.name}
                  </button>
                ))}
                {repoDetails?.files?.length === 0 && <p className="empty-state">No files found in this repository.</p>}
              </aside>
              <FilePreview
                canEdit={canPush}
                error={fileError}
                file={openFile}
                loading={fileLoading}
                onDownload={downloadSelectedFile}
                onEdit={startEditingFile}
                repo={data}
                repoReadme={repoDetails?.readme}
                downloading={downloadState === "file"}
              />
            </>
          )}
        </section>
      )}

      {createFileOpen && (
        <div className="repo-hero-modal-backdrop" onClick={() => setCreateFileOpen(false)}>
          <form className="repo-file-editor" role="dialog" aria-modal="true" aria-label="Create new file" onClick={(event) => event.stopPropagation()} onSubmit={createNewGitHubFile}>
            <div>
              <p className="eyebrow">Add file</p>
              <h2>Create new file</h2>
              <p>Choose a path and write the first version. Saving commits it directly to GitHub.</p>
            </div>
            <label>
              File path
              <input value={newFilePath} onChange={(event) => setNewFilePath(event.target.value)} placeholder="docs/notes.md" />
            </label>
            <label>
              File content
              <textarea rows="12" value={newFileContent} onChange={(event) => setNewFileContent(event.target.value)} placeholder="# New file" />
            </label>
            {fileActionMessage && <p className="repo-hero-toast" role="status">{fileActionMessage}</p>}
            <div className="repo-hero-editor-actions">
              <Button variant="soft" onClick={() => setCreateFileOpen(false)} disabled={Boolean(fileActionState)} type="button">Cancel</Button>
              <Button disabled={Boolean(fileActionState)} type="submit">{fileActionState === "creating" ? "Saving..." : "Save to GitHub"}</Button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "Commits" && (
        <section className="phase-list-panel">
          {repoDetailsLoading && <RepoListLoading />}
          {!repoDetailsLoading && repoDetailsError && <RepoDataMessage title="Could not load GitHub commits" text={repoDetailsError} />}
          {!repoDetailsLoading && !repoDetailsError && (repoDetails?.commits || []).map((commit) => (
            <div className="commit-row" key={commit.hash}>
              <span className="phase-initials">{commit.author?.[0] || "?"}</span>
              <div><strong>{commit.message}</strong><p>{commit.author}</p></div>
              <code>{commit.hash}</code>
              <time>{commit.time}</time>
            </div>
          ))}
          {!repoDetailsLoading && !repoDetailsError && repoDetails?.commits?.length === 0 && <RepoDataMessage title="No commits found" text="GitHub did not return any commits for this repository." />}
        </section>
      )}

      {activeTab === "Branches" && (
        <section className="phase-list-panel">
          {repoDetailsLoading && <RepoListLoading />}
          {!repoDetailsLoading && repoDetailsError && <RepoDataMessage title="Could not load GitHub branches" text={repoDetailsError} />}
          {!repoDetailsLoading && !repoDetailsError && (repoDetails?.branches || []).map((branch) => (
            <div className="branch-row" key={branch.name}>
              <code>{branch.name}</code>
              {branch.default && <Badge>default</Badge>}
              <time>{branch.sha || branch.updated}</time>
            </div>
          ))}
          {!repoDetailsLoading && !repoDetailsError && repoDetails?.branches?.length === 0 && <RepoDataMessage title="No branches found" text="GitHub did not return any branches for this repository." />}
        </section>
      )}

      {activeTab === "Visual Map" && (
        <section className="repo-map-panel">
          {repoDetailsError && <RepoDataMessage title="Using limited map data" text={repoDetailsError} />}
          <CodebaseMapPanel
            owner={username}
            repo={repo}
            repoGraph={repoDetails}
            title="A visual map of this repository."
            description="Trace the main branch, active branches, forks, pull requests, and merge points before you open the file tree."
          />
        </section>
      )}

      {activeTab === "Settings" && (
        <section className="repo-settings-panel">
          <Card large>
            <h2>Repository settings</h2>
            <label>Rename repo<input defaultValue={repo} /></label>
            <label>Visibility<select defaultValue={data.private ? "private" : "public"}><option value="public">Public</option><option value="private">Private</option></select></label>
            <Button>Save changes</Button>
          </Card>
          <Card large>
            <h2>Danger zone</h2>
            <p>Delete repo requires typing <strong>{repo}</strong> to confirm.</p>
            <label>Confirmation<input placeholder={repo} /></label>
            <Button variant="soft">Delete repo</Button>
          </Card>
        </section>
      )}

      {activeTab === "Notes" && (
        <section className={`repo-notes-panel ${notebooksCollapsed ? "notebooks-collapsed" : ""} ${pagesCollapsed ? "pages-collapsed" : ""}`}>
          <div className="repo-notes-topbar">
            <strong>Repo Notes</strong>
            <span>Choose a notebook, then pick or create a page. Everything saves to GitHub under <code>notes/</code>.</span>
          </div>
          <div className="repo-notes-body">
            <aside className="repo-notes-sidebar">
              <button className="repo-panel-fold" onClick={() => setNotebooksCollapsed((value) => !value)} aria-label={notebooksCollapsed ? "Expand notebooks" : "Collapse notebooks"} type="button">
                {notebooksCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <span className="repo-panel-rail-label">Notebooks</span>
              <div className="repo-panel-inner">
                <div>
                  <p className="eyebrow">Repo notes</p>
                  <h3>Notebooks</h3>
                </div>
                <label>
                  New notebook
                  <div className="repo-notes-create-row">
                    <input value={notebookName} onChange={(event) => setNotebookName(event.target.value)} placeholder="Project notes" />
                    <button onClick={createNotebook} disabled={notesSaving} type="button">Create</button>
                  </div>
                </label>
                <div className="repo-notebook-colour-picker">
                  <span>Book colour</span>
                  <div className="repo-notebook-theme-row" aria-label="Book colour themes">
                    {notebookColorThemes.map((theme) => (
                      <button
                        className={theme.name === notebookTheme ? "active" : ""}
                        key={theme.name}
                        onClick={() => {
                          setNotebookTheme(theme.name);
                          handleNotebookColorSelect(theme.colors[0]);
                        }}
                        type="button"
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                  <div className="repo-notebook-swatch-row" aria-label={`${activeNotebookTheme.name} book colours`}>
                    {activeNotebookTheme.colors.map((color) => (
                      <button
                        aria-label={`${activeNotebookTheme.name} ${color.label}`}
                        className={color.id === selectedNotebookColorId ? "active" : ""}
                        key={color.id}
                        onClick={() => handleNotebookColorSelect(color)}
                        style={{ "--book-colour": color.end }}
                        title={color.label}
                        type="button"
                      />
                    ))}
                  </div>
                </div>
                <nav className="repo-notebook-list" aria-label="Notebooks">
                  {notebooks.map((notebook) => (
                    <button
                      className={notebook.slug === selectedNotebook?.slug ? "active" : ""}
                      key={notebook.slug}
                      onClick={() => {
                        setActiveNotebook(notebook.slug);
                        if (notebook.notes[0]) openNotePage(notebook.notes[0]);
                        else {
                          setActiveNotePath("");
                          setNoteContent("");
                        }
                      }}
                      type="button"
                    >
                      <span
                        className="repo-notebook-book"
                        style={{
                          "--book-colour": (notebookColors[notebook.slug] || defaultNotebookColor).end
                        }}
                        aria-hidden="true"
                      >
                        <BookOpen size={18} />
                      </span>
                      <span>{notebook.name}</span>
                    </button>
                  ))}
                  {notebooks.length === 0 && <p>Create your first notebook to start writing pages.</p>}
                </nav>
              </div>
            </aside>
            <div className="repo-notes-pages">
              <button className="repo-panel-fold" onClick={() => setPagesCollapsed((value) => !value)} aria-label={pagesCollapsed ? "Expand pages" : "Collapse pages"} type="button">
                {pagesCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <span className="repo-panel-rail-label">Pages</span>
              <div className="repo-panel-inner">
                <div>
                  <strong>Pages</strong>
                  <span>{selectedNotebook?.notes.length || 0} page{selectedNotebook?.notes.length === 1 ? "" : "s"}</span>
                </div>
                <button className="repo-add-page-button" onClick={createNotePage} disabled={!selectedNotebook || notesSaving} type="button">Add new page</button>
                <div className="repo-note-page-list">
                  {selectedNotebook?.notes.map((note) => (
                    <button className={note.path === activeNotePath ? "active" : ""} key={note.path} onClick={() => openNotePage(note)} type="button">
                      <FileText size={15} />
                      <span>{getNoteDisplayName(note)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="repo-note-editor">
              <div className="repo-note-editor-head">
                <div>
                  <p className="eyebrow">Markdown note</p>
                  <h3>{getNoteDisplayName(selectedNote) || activeNotePath || "Create a notebook to begin"}</h3>
                  <span className="repo-note-title-hint">The first line of this note becomes the page title.</span>
                </div>
                <div className="repo-note-editor-actions">
                  <button
                    className="repo-note-toolbar-button"
                    disabled={!activeNotePath || notesSaving}
                    onClick={() => setAsciiModalOpen(true)}
                    type="button"
                  >
                    <Grid3X3 size={14} />
                    ASCII
                  </button>
                  <Button onClick={saveActiveNote} disabled={!activeNotePath || notesSaving}>{notesSaving ? "Saving..." : "Save note"}</Button>
                </div>
              </div>
              <textarea
                ref={noteTextareaRef}
                value={noteContent}
                onChange={(event) => setNoteContent(event.target.value)}
                placeholder="# Your note"
                disabled={!activeNotePath || notesSaving}
              />
              {notesStatus && <p className="repo-notes-status">{notesStatus}</p>}
            </div>
          </div>
          <AsciiArtGenerator
            open={asciiModalOpen}
            onClose={() => setAsciiModalOpen(false)}
            onInsert={insertIntoNoteAtCursor}
          />
        </section>
      )}
    </div>
  );
}

function PublishedLanding({ html }) {
  return (
    <section className="published-landing-frame" aria-label="Published landing page">
      <iframe title="Published landing page" srcDoc={html} sandbox="" />
    </section>
  );
}

function ReadmePreview({ repo = repos[0], markdown }) {
  const fallback = `# ${repo.name}\n\n${repo.description || "No README.md found for this repository."}`;
  return <MarkdownPreview markdown={markdown || fallback} />;
}

function getVisibleRepoTree(files, expandedFolders) {
  return files.filter((item) => {
    const parts = item.path.split("/");
    if (parts.length === 1) return true;

    const parentPaths = parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join("/"));
    return parentPaths.every((path) => expandedFolders.has(path));
  });
}

function MarkdownPreview({ markdown, className = "readme-render" }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />;
}

function FilePreview({ canEdit = false, downloading, error, file, loading, onDownload, onEdit, repo, repoReadme }) {
  if (loading) return <ReadmeSkeleton />;

  if (error) return <RepoDataMessage title="Could not open file" text={error} />;

  if (!file) return <ReadmePreview repo={repo} markdown={repoReadme} />;

  const isMarkdown = file.name?.toLowerCase().endsWith(".md") || file.path?.toLowerCase().endsWith(".md");

  return (
    <section className="file-preview-panel">
      <div className="file-preview-header">
        <div>
          <p className="eyebrow">Open file</p>
          <h2>{file.path}</h2>
          <span>{formatFileSize(file.size)}</span>
        </div>
        <Button variant="soft" onClick={onDownload}>
          <Download size={16} />{downloading ? "Downloading..." : "Download file"}
        </Button>
        {canEdit && (
          <button className="file-edit-button" onClick={onEdit} type="button">
            <Pencil size={14} />Edit file
          </button>
        )}
      </div>
      {isMarkdown ? (
        <MarkdownPreview markdown={file.content || `# ${file.name}\n\nThis file is empty.`} />
      ) : (
        <pre className="file-code-preview"><code>{file.content || "This file is empty or could not be previewed as text."}</code></pre>
      )}
    </section>
  );
}

function downloadBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatFileSize(size = 0) {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeGitHubFilePath(path) {
  return String(path || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/");
}

function slugForPath(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromSlug(value) {
  return String(value || "")
    .replace(/\.(md|markdown)$/i, "")
    .split(/[-_]/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Untitled";
}

function getNoteTitleFromContent(content) {
  const firstLine = String(content || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine
    ?.replace(/^#{1,6}\s*/, "")
    .replace(/^[>*\-\d.)\s]+/, "")
    .trim()
    .slice(0, 80) || "";
}

function getRepoNotebooks(files = []) {
  const notebooks = new Map();
  files
    .filter((file) => file.type === "file" && /^notes\/[^/]+\/.+\.m(?:d|arkdown)$/i.test(file.path))
    .forEach((file) => {
      const [, notebookSlug] = file.path.split("/");
      if (!notebooks.has(notebookSlug)) {
        notebooks.set(notebookSlug, {
          slug: notebookSlug,
          name: titleFromSlug(notebookSlug),
          notes: []
        });
      }
      notebooks.get(notebookSlug).notes.push({
        name: titleFromSlug(file.name),
        notebookSlug,
        path: file.path
      });
    });

  return Array.from(notebooks.values())
    .map((notebook) => ({
      ...notebook,
      notes: notebook.notes.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getParentFolderPaths(path) {
  const cleanPath = normalizeGitHubFilePath(path);
  if (!cleanPath.includes("/")) return [];
  const parts = cleanPath.split("/").slice(0, -1);
  return parts.map((_, index) => parts.slice(0, index + 1).join("/"));
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = () => reject(new Error("Could not read this file before uploading."));
    reader.readAsDataURL(file);
  });
}

function RepoDataMessage({ title, text }) {
  return (
    <Card>
      <h3>{title}</h3>
      <p>{text}</p>
    </Card>
  );
}

function RepoListLoading() {
  return Array.from({ length: 4 }).map((_, index) => (
    <div className="commit-row" key={index}>
      <Skeleton className="skeleton-avatar" />
      <div>
        <Skeleton className="skeleton-text wide" />
        <Skeleton className="skeleton-text" />
      </div>
      <Skeleton className="skeleton-text" />
      <Skeleton className="skeleton-text" />
    </div>
  ));
}

function RepoFileTreeSkeleton() {
  return (
    <aside className="phase-file-tree repo-file-tree-skeleton" aria-label="Loading file tree">
      <Skeleton className="skeleton-input" />
      {Array.from({ length: 7 }).map((_, index) => <Skeleton className="skeleton-text wide" key={index} />)}
    </aside>
  );
}

function ReadmeSkeleton() {
  return (
    <div className="readme-render readme-render-skeleton" aria-label="Loading README">
      <Skeleton className="skeleton-heading" />
      <Skeleton lines={3} />
      <Skeleton className="skeleton-text medium" />
      <Skeleton lines={4} />
      <Skeleton className="skeleton-code" />
    </div>
  );
}

export { RepoPage };
