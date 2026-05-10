import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileText,
  Folder,
  Github,
  GitFork,
  Home,
  Lock,
  MoreHorizontal,
  Palette,
  Plus,
  Settings,
  Sparkles,
  Star,
} from "lucide-react";
import CommandPalette from "./components/layout/CommandPalette";
import TopNav from "./components/layout/TopNav";
import IllustratedAvatar, { avatarVariants } from "./components/ui/IllustratedAvatar";
import { getCurrentSession, isSupabaseConfigured, signInWithGitHub, signInWithPassword } from "./lib/supabase";
import "./styles.css";

const currentUser = {
  username: "mira",
  name: "Mira Patel",
  pronouns: "she/her",
  bio: "Building gentler tools for first-time contributors and curious teams.",
  location: "London, UK",
  email: "mira@forallcode.dev",
  website: "mira.dev",
  joinDate: "March 2026",
  followers: 428,
  following: 91,
  stars: 2350,
  repos: 18,
  avatarStyle: "sage"
};

const languageStyles = {
  TypeScript: ["#ddd5f0", "#534AB7"],
  JavaScript: ["#f5e4c4", "#633806"],
  Python: ["#cce0f0", "#0C447C"],
  CSS: ["#c8d8c4", "#27500A"],
  Rust: ["#f5d5d8", "#72243E"],
  Shell: ["#f5e4c4", "#633806"],
  Go: ["#cce0f0", "#0C447C"]
};

const repos = [
  {
    name: "orbit-readme",
    owner: "mira",
    description: "README templates with visual onboarding blocks and launch-day polish.",
    language: "TypeScript",
    stars: 821,
    forks: 47,
    updated: "12 minutes ago",
    private: false,
    pinned: true,
    topic: "readme",
    landing: true
  },
  {
    name: "desk-notes",
    owner: "mira",
    description: "A Supabase-backed workspace desk for personal project planning.",
    language: "CSS",
    stars: 344,
    forks: 19,
    updated: "2 hours ago",
    private: false,
    pinned: true,
    topic: "workspace",
    landing: false
  },
  {
    name: "first-pr-path",
    owner: "mira",
    description: "Interactive Git lessons for people making their first open-source contribution.",
    language: "Python",
    stars: 692,
    forks: 58,
    updated: "Yesterday",
    private: false,
    pinned: true,
    topic: "learn",
    landing: true
  },
  {
    name: "soft-cli",
    owner: "mira",
    description: "A command-line Git helper that explains what it is about to do.",
    language: "Rust",
    stars: 493,
    forks: 23,
    updated: "3 days ago",
    private: true,
    pinned: false,
    topic: "cli",
    landing: false
  }
];

const lessons = [
  ["branching", "Branching", "beginner", "Try ideas without disturbing your main line of work."],
  ["merging", "Merging", "beginner", "Bring a finished branch home with confidence."],
  ["forking", "Forking", "beginner", "Make your own copy of a project before contributing."],
  ["commits", "Commits", "beginner", "Capture meaningful checkpoints and write useful messages."],
  ["pull-requests", "Pull Requests", "intermediate", "Turn your branch into a thoughtful proposal."],
  ["rebasing", "Rebasing", "intermediate", "Replay changes onto a fresher base when history needs tidying."],
  ["conflicts", "Resolving merge conflicts", "intermediate", "Understand why conflicts happen and resolve them calmly."],
  ["gitignore", "Gitignore", "beginner", "Keep generated files and secrets out of your repo."],
  ["stashing", "Stashing changes", "intermediate", "Temporarily shelve work while you switch context."],
  ["commit-messages", "Writing good commit messages", "beginner", "Leave future readers a clear trail."],
  ["open-source", "Open source contribution", "advanced", "Choose an issue, communicate well, and ship your first PR."],
  ["licences", "Licences explained simply", "beginner", "Pick a licence without getting lost in legal fog."]
];

const activities = [
  "Lena starred orbit-readme",
  "Dev Collective published a workspace",
  "Mira completed Rebasing",
  "Kai forked first-pr-path",
  "Noor opened a pull request in desk-notes"
];

const dashboardActivity = [
  { name: "Mira", initials: "MP", action: "updated orbit-readme with a new README Studio template", time: "4m ago", live: true },
  { name: "Mira", initials: "MP", action: "pinned desk-notes to the workspace", time: "28m ago", live: false },
  { name: "Kai", initials: "K", action: "forked first-pr-path for a workshop", time: "2h ago", live: false },
  { name: "Noor", initials: "N", action: "opened a pull request in soft-cli", time: "Yesterday", live: false }
];

const fileTreeItems = [
  { type: "folder", name: "src", indent: 0 },
  { type: "folder", name: "components", indent: 1 },
  { type: "file", name: "TopNav.jsx", indent: 2 },
  { type: "file", name: "CommandPalette.jsx", indent: 2 },
  { type: "file", name: "main.jsx", indent: 1 },
  { type: "file", name: "README.md", indent: 0 },
  { type: "file", name: "package.json", indent: 0 }
];

const commits = [
  { hash: "406fa61", message: "Restore top navigation styling", author: "Korim", time: "18 minutes ago" },
  { hash: "2f1179d", message: "Add Supabase config and Phase 2 navigation", author: "Korim", time: "1 hour ago" },
  { hash: "fe6bb74", message: "Update branding and appearance settings", author: "Korim", time: "Today" }
];

const branches = [
  { name: "main", default: true, updated: "18 minutes ago" },
  { name: "codex/phase-2-pages", default: false, updated: "1 hour ago" },
  { name: "studio-redesign", default: false, updated: "Yesterday" }
];

function App() {
  return (
    <BrowserRouter>
      <CommandPalette />
      <div className="app-shell">
        <TopNav />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/profile" element={<MyProfilePage />} />
            <Route path="/repos" element={<ReposPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/settings" element={<Navigate to="/settings/account" replace />} />
            <Route path="/settings/:tab" element={<SettingsPage />} />
            <Route path="/:username/:repo/readme" element={<ReadmeStudio />} />
            <Route path="/:username/:repo/landing" element={<LandingDesigner />} />
            <Route path="/:username/:repo" element={<RepoPage />} />
            <Route path="/:username" element={<PublicProfile />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

function LandingPage() {
  return (
    <>
      <section className="hero landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">A warmer place to build</p>
          <h1>Code lives here. Understanding does too.</h1>
          <p>ForAllCode turns repositories into friendly workspaces, explains Git visually, and helps projects greet new contributors beautifully.</p>
          <div className="button-row">
            <Button to="/login">Get started</Button>
            <Button to="/learn" variant="soft">Explore Learn</Button>
          </div>
        </div>
        <DeskPreview compact />
      </section>
      <section className="feature-grid">
        {[
          ["Workspace", "An illustrated desk where active projects become sticky notes.", <Home />],
          ["Learn", "Interactive Git diagrams that teach what happened and why.", <BookOpen />],
          ["README Studio", "A live editor for beautiful project introductions.", <FileCode2 />],
          ["Landing Designer", "Publish a pastel project page without leaving the repo.", <Palette />]
        ].map(([title, text, icon]) => <FeatureCard key={title} title={title} text={text} icon={icon} />)}
      </section>
      <section className="band">
        <h2>How it works</h2>
        <div className="steps">
          {["Connect GitHub", "Set up workspace", "Start learning"].map((step, index) => (
            <Card key={step}><span className="step-number">{index + 1}</span><h3>{step}</h3><p>{["Sync repositories securely with OAuth.", "Pin the work that matters today.", "Continue lessons beside real projects."][index]}</p></Card>
          ))}
        </div>
      </section>
      <section className="stats">
        <Stat value="12k" label="repos warmed up" />
        <Stat value="2.8k" label="early users" />
        <Stat value="36" label="visual lessons" />
      </section>
    </>
  );
}

function AboutPage() {
  return (
    <PageFrame title="For all people who code" eyebrow="About">
      <div className="split">
        <Card large>
          <h2>Inspired by the race that never ended</h2>
          <p>ForAllCode borrows its spirit from <em>For All Mankind</em>: an alternate history where ambition becomes more inclusive because the horizon keeps widening.</p>
          <p>Our question is smaller and closer to the keyboard: what if developer tools were built for all people, not just experienced engineers?</p>
        </Card>
        <Card large>
          <h2>Different from GitHub</h2>
          <ul className="check-list">
            <li>Visual Git education sits beside your real work.</li>
            <li>Profiles include a private illustrated workspace.</li>
            <li>READMEs and project landing pages are first-class creative tools.</li>
            <li>Every surface is designed to reduce intimidation.</li>
          </ul>
          <Button to="/login">Join the MVP</Button>
        </Card>
      </div>
      <Roadmap />
    </PageFrame>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const githubSignIn = async () => {
    try {
      setMessage("");
      await signInWithGitHub();
    } catch (error) {
      setMessage(error.message);
    }
  };
  const passwordSignIn = async () => {
    try {
      setMessage("");
      const { error } = await signInWithPassword(email, password);
      if (error) throw error;
      window.location.assign("/dashboard");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <PageFrame title="Welcome to ForAllCode" eyebrow="Sign in">
      <section className="auth-panel">
        <Card large>
          {!isSupabaseConfigured && <p className="auth-note">Supabase env vars are missing. Add them to `.env` to enable live sign in.</p>}
          <Button full onClick={githubSignIn}><Github size={18} />Continue with GitHub</Button>
          <div className="divider">or</div>
          <label>Email<input placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" placeholder="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {message && <p className="auth-error">{message}</p>}
          <Button variant="soft" full onClick={passwordSignIn}>Continue with email</Button>
          <Link to="/login">Forgot password?</Link>
        </Card>
        <Card large>
          <h2>Sign up flow</h2>
          <ol className="flow-list">
            <li>GitHub OAuth</li>
            <li>Pick username</li>
            <li>Choose illustrated avatar</li>
            <li>Redirect to dashboard</li>
          </ol>
          <AvatarPicker />
        </Card>
      </section>
    </PageFrame>
  );
}

function AuthCallback() {
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    getCurrentSession()
      .then((session) => {
        if (session) {
          window.location.replace("/dashboard");
        } else {
          setMessage("No Supabase session was found. Please try signing in again.");
        }
      })
      .catch((error) => setMessage(error.message));
  }, []);

  return (
    <PageFrame title="Signing you in" eyebrow="Auth">
      <Card large><p>{message}</p></Card>
    </PageFrame>
  );
}

function DashboardPage() {
  return (
    <PageFrame title="" eyebrow="">
      <section className="phase-dashboard-hero">
        <div>
          <p className="eyebrow">FORALLCODE</p>
          <h1>Welcome back, {currentUser.name}</h1>
          <p>Your workspace is ready. Pick up where you left off, follow the work, and keep the useful ideas in sight.</p>
        </div>
        <svg viewBox="0 0 420 180" aria-hidden="true">
          <path d="M16 150c78-86 142-86 220 0s128 54 168-2" />
          <path d="M80 170c58-52 110-52 160 0s96 26 132-8" />
        </svg>
        <div className="carousel-dots phase-dots">{Array.from({ length: 5 }).map((_, index) => <span key={index} className={index === 0 ? "active" : ""} />)}</div>
      </section>

      <div className="phase-dashboard-grid">
        <section>
          <div className="phase-section-head">
            <div><p className="eyebrow">FOLLOWED</p><h2>Users and projects</h2></div>
            <Link to="/following">Manage</Link>
          </div>
          <Card>
            {dashboardActivity.map((item) => (
              <div className="phase-activity-row" key={`${item.name}-${item.action}`}>
                <span className="phase-initials">{item.initials}</span>
                <div><strong>{item.name}</strong><p>{item.action}</p></div>
                {item.live && <span className="live-pill">Live</span>}
                <time>{item.time}</time>
              </div>
            ))}
            <p className="empty-helper">Follow some developers to see their activity here.</p>
          </Card>

          <div className="phase-section-head compact">
            <div><p className="eyebrow">EDUCATION</p></div>
          </div>
          <Card>
            <div className="education-callout">
              <h3>Continue learning</h3>
              <p>Start with Branching</p>
              <span><b /></span>
              <Button to="/learn" variant="soft">Continue →</Button>
            </div>
          </Card>
        </section>

        <aside>
          <div className="phase-section-head">
            <div><p className="eyebrow">FEATURED</p><h2>Workspaces and projects</h2></div>
            <Link to="/explore">Explore</Link>
          </div>
          {repos.slice(0, 2).map((repo, index) => (
            <Link className={`featured-project-card card-${index + 1}`} key={repo.name} to={`/${repo.owner}/${repo.name}`}>
              <div>
                <h3>{repo.name}</h3>
                <p>{repo.description}</p>
                <div><span>{repo.stars} stars</span><span>Active</span></div>
              </div>
            </Link>
          ))}
        </aside>
      </div>
    </PageFrame>
  );
}

function WorkspacePage() {
  return (
    <PageFrame title="My Workspace" eyebrow="Private desk">
      <Workspace interactive />
    </PageFrame>
  );
}

function MyProfilePage() {
  return (
    <PageFrame title="My Profile" eyebrow="Profile">
      <ProfileHeader editable />
      <Workspace compact />
      <div className="two-column">
        <section>{repos.map((repo) => <RepoCard key={repo.name} repo={repo} actions />)}</section>
        <aside><ActivityCalendar /><RecentChanges /></aside>
      </div>
    </PageFrame>
  );
}

function PublicProfile() {
  const { username } = useParams();
  return (
    <PageFrame title={username === currentUser.username ? currentUser.name : "Lena Kim"} eyebrow={`@${username}`}>
      <ProfileHeader publicView />
      <SectionTitle title="Pinned repos" />
      <div className="repo-grid">{repos.filter((repo) => repo.pinned).map((repo) => <RepoCard key={repo.name} repo={{ ...repo, owner: username }} />)}</div>
      <div className="two-column">
        <Card><h3>Public activity</h3>{activities.map((item) => <p key={item}>{item}</p>)}</Card>
        <Card><h3>Skills and badges</h3><div className="tag-row">{["Git mentoring", "TypeScript", "Design systems", "Open source guide"].map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></Card>
      </div>
    </PageFrame>
  );
}

function ReposPage() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [sort, setSort] = useState("updated");
  const languages = [...new Set(repos.map((repo) => repo.language))];
  const filtered = repos
    .filter((repo) => (language === "all" || repo.language === language))
    .filter((repo) => (visibility === "all" || (visibility === "private" ? repo.private : !repo.private)))
    .filter((repo) => repo.name.toLowerCase().includes(query.toLowerCase()) || repo.description.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === "stars") return b.stars - a.stars;
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <PageFrame title="" eyebrow="">
      <div className="repos-page-header">
        <h1>Repositories</h1>
        <div>
          <Button variant="soft"><Github size={16} />Import from GitHub</Button>
          <Button to="/repos/new"><Plus size={16} />New repository</Button>
        </div>
      </div>
      <div className="phase-filter-bar">
        <input placeholder="Search repositories..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="all">All languages</option>
          {languages.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
          <option value="all">All</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="updated">Recently updated</option>
          <option value="stars">Stars</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>
      {filtered.length > 0 ? (
        <div className="phase-repo-list">{filtered.map((repo) => <PhaseRepoCard key={repo.name} repo={repo} />)}</div>
      ) : (
        <div className="repo-empty-state">
          <Folder size={54} />
          <h2>No repositories yet</h2>
          <p>Create your first repo or import from GitHub to get started.</p>
          <div className="button-row"><Button to="/repos/new"><Plus size={16} />New repository</Button><Button variant="soft"><Github size={16} />Import from GitHub</Button></div>
        </div>
      )}
    </PageFrame>
  );
}

function RepoPage() {
  const { username, repo } = useParams();
  const data = repos.find((item) => item.name === repo) || repos[0];
  const [activeTab, setActiveTab] = useState("Code");
  const cloneUrl = `https://github.com/${username}/${repo}.git`;

  return (
    <div className="phase-repo-page">
      <section className="phase-repo-header">
        <div className="repo-breadcrumb"><span>{username}</span><b>/</b><strong>{repo}</strong></div>
        <p>{data.description}</p>
        <div className="phase-repo-meta">
          <LanguagePill language={data.language} />
          <span><Star size={14} />{data.stars}</span>
          <span><GitFork size={14} />{data.forks}</span>
          <span>Updated {data.updated}</span>
        </div>
        <div className="repo-header-actions">
          <Button variant="soft"><Star size={16} />Star</Button>
          <Button variant="soft"><GitFork size={16} />Fork</Button>
          <div className="clone-control">
            <button>Clone <ChevronDown size={14} /></button>
            <div><input readOnly value={cloneUrl} /><Button variant="soft"><Copy size={16} /></Button></div>
          </div>
        </div>
      </section>

      <div className="repo-tab-bar">
        {["Code", "Commits", "Branches", "Settings"].map((tab) => (
          <button className={activeTab === tab ? "active" : ""} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      {activeTab === "Code" && (
        <section className="phase-code-tab">
          <aside className="phase-file-tree">
            <select><option>main</option><option>codex/phase-2-pages</option><option>studio-redesign</option></select>
            {fileTreeItems.map((item) => (
              <button key={`${item.name}-${item.indent}`} style={{ paddingLeft: `${12 + item.indent * 18}px` }}>
                {item.type === "folder" ? <Folder size={15} /> : <FileText size={15} />}
                {item.name}
              </button>
            ))}
          </aside>
          <ReadmePreview repo={data} />
        </section>
      )}

      {activeTab === "Commits" && (
        <section className="phase-list-panel">
          {commits.map((commit) => (
            <div className="commit-row" key={commit.hash}>
              <span className="phase-initials">{commit.author[0]}</span>
              <div><strong>{commit.message}</strong><p>{commit.author}</p></div>
              <code>{commit.hash}</code>
              <time>{commit.time}</time>
            </div>
          ))}
        </section>
      )}

      {activeTab === "Branches" && (
        <section className="phase-list-panel">
          {branches.map((branch) => (
            <div className="branch-row" key={branch.name}>
              <code>{branch.name}</code>
              {branch.default && <Badge>default</Badge>}
              <time>{branch.updated}</time>
            </div>
          ))}
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
    </div>
  );
}

function ReadmeStudio() {
  const [markdown, setMarkdown] = useState(`# Orbit README\n\n> A friendly project introduction.\n\n## Features\n\n- Beautiful hero banners\n- Badge pills\n- Live preview\n\n\`\`\`ts\nexport const hello = \"ForAllCode\";\n\`\`\``);
  const [raw, setRaw] = useState(false);
  return (
    <PageFrame title="README Studio" eyebrow="Editor">
      <div className="studio-actions">
        {["Blank", "Library+package", "Personal project", "Open source", "Portfolio"].map((template) => <Button key={template} variant="soft">{template}</Button>)}
        <Button variant="soft"><Download size={16} />Export .md</Button>
        <Button>Save to repo</Button>
      </div>
      <div className="studio">
        <aside className="insert-panel">
          {["Hero banner", "Badge pills", "Feature grid", "Code block", "Image", "Divider"].map((block) => <button key={block} onClick={() => setMarkdown(`${markdown}\n\n## ${block}\nDescribe this section here.`)}><Plus size={15} />{block}</button>)}
          <label>Gradient<select><option>Lavender sunrise</option><option>Sage meadow</option><option>Rose amber</option></select></label>
          <label>Code language<select><option>TypeScript</option><option>Python</option><option>Shell</option></select></label>
        </aside>
        <textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} />
        <section className="readme-render">
          <div className="preview-toggle"><Button variant="soft" onClick={() => setRaw(!raw)}>{raw ? "Preview" : "Raw markdown"}</Button><Button variant="soft">Desktop</Button><Button variant="soft">Mobile</Button></div>
          {raw ? <pre>{markdown}</pre> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>}
        </section>
      </div>
    </PageFrame>
  );
}

function LandingDesigner() {
  const [state, setState] = useState({ colour: "lavender", style: "Cosy", name: "Orbit README", tagline: "Readable projects from the first scroll.", cta: "Read the docs", font: "Lora" });
  const update = (key, value) => setState({ ...state, [key]: value });
  return (
    <PageFrame title="Landing Page Designer" eyebrow="Live builder">
      <div className="designer">
        <aside className="control-panel">
          {["Nav", "Hero", "Features", "CTA", "Footer"].map((section) => <button key={section}>{section}</button>)}
          <label>Project name<input value={state.name} onChange={(event) => update("name", event.target.value)} /></label>
          <label>Tagline<input value={state.tagline} onChange={(event) => update("tagline", event.target.value)} /></label>
          <label>CTA text<input value={state.cta} onChange={(event) => update("cta", event.target.value)} /></label>
          <label>Style preset<select value={state.style} onChange={(event) => update("style", event.target.value)}><option>Cosy</option><option>Bold</option><option>Minimal</option></select></label>
          <label>Font<select value={state.font} onChange={(event) => update("font", event.target.value)}><option>Lora</option><option>DM Sans</option></select></label>
          <div className="swatches">{["lavender", "sage", "rose", "sky", "amber"].map((colour) => <button className={colour} key={colour} onClick={() => update("colour", colour)} aria-label={colour} />)}</div>
          <Button variant="soft"><Download size={16} />Export HTML</Button>
          <Button>Publish</Button>
        </aside>
        <section className={`landing-preview ${state.colour}`}>
          <nav><strong>{state.name}</strong><span>Docs</span><span>Examples</span><Button variant="soft">{state.cta}</Button></nav>
          <div><h2 style={{ fontFamily: state.font }}>{state.name}</h2><p>{state.tagline}</p><Button>{state.cta}</Button></div>
          <div className="mini-features"><Card>Fast setup</Card><Card>Clear examples</Card><Card>Friendly docs</Card></div>
        </section>
      </div>
    </PageFrame>
  );
}

function LearnPage() {
  const [active, setActive] = useState(lessons[0][0]);
  const lesson = lessons.find((item) => item[0] === active);
  return (
    <PageFrame title="Learn Git visually" eyebrow="Learn">
      <div className="learn-layout">
        <aside className="lesson-sidebar">
          {["New to Git", "Getting comfortable", "Going further"].map((track) => <h3 key={track}>{track}</h3>)}
          {lessons.map(([slug, title, level], index) => (
            <button key={slug} className={active === slug ? "active" : ""} onClick={() => setActive(slug)}>
              <span>{title}</span>{index > 2 && <Lock size={13} />}<Badge>{level}</Badge>
            </button>
          ))}
        </aside>
        <article className="lesson-content">
          <Badge>{lesson[2]}</Badge>
          <h2>{lesson[1]}</h2>
          <p>{lesson[3]}</p>
          <GitDiagram />
          <div className="steps">
            {["Start from main", "Make a focused change", "Compare your work", "Complete the lesson"].map((step) => <Card key={step}><h3>{step}</h3><p>Each step connects the diagram to the command and the reason behind it.</p></Card>)}
          </div>
          <Button><Check size={16} />Mark as complete</Button>
        </article>
      </div>
    </PageFrame>
  );
}

function ExplorePage() {
  return (
    <PageFrame title="Explore" eyebrow="Public discovery">
      <div className="filter-bar"><input placeholder="Search public repos and users" /><select><option>All languages</option><option>TypeScript</option><option>Python</option></select><select><option>Trending this week</option><option>Featured</option></select></div>
      <SectionTitle title="Featured repos" />
      <div className="repo-grid">{repos.map((repo) => <RepoCard key={repo.name} repo={repo} />)}</div>
      <SectionTitle title="Active public workspaces" />
      <div className="feature-grid">{["Lena's docs table", "Kai's CSS lab", "Noor's first PR path"].map((item) => <Card key={item}><DeskPreview compact /><h3>{item}</h3></Card>)}</div>
    </PageFrame>
  );
}

function SettingsPage() {
  const { tab = "account" } = useParams();
  const tabs = ["account", "profile", "workspace", "notifications", "integrations", "privacy", "appearance", "danger"];
  return (
    <PageFrame title="Settings" eyebrow={tab}>
      <div className="settings-layout">
        <aside>{tabs.map((item) => <NavLink key={item} to={`/settings/${item}`}>{item}</NavLink>)}</aside>
        <section>
          <Card large>
            <h2>{tab[0].toUpperCase() + tab.slice(1)}</h2>
            <SettingsFields tab={tab} />
          </Card>
        </section>
      </div>
    </PageFrame>
  );
}

function SettingsFields({ tab }) {
  if (tab === "appearance") {
    return <AppearanceSettings />;
  }

  const common = {
    account: ["Display name", "Email address", "Password", "Connected GitHub account", "Two-factor authentication"],
    profile: ["Avatar style", "Cover image", "Bio", "Pronouns", "Location", "Website", "Social links"],
    workspace: ["Desk theme", "Sticky note colour defaults", "Focus mode", "Show clock", "Show decorations"],
    notifications: ["Stars", "New followers", "Comments", "Lesson reminders", "Weekly digest", "Security alerts"],
    integrations: ["GitHub connected", "Netlify deploy", "Vercel deploy", "Slack notifications"],
    privacy: ["Default repo visibility", "Profile visibility", "Show workspace publicly", "Show activity calendar"],
    appearance: ["Theme", "Accent colour", "Font size", "Reduce motion", "Density"],
    danger: ["Export all data", "Make all repos private", "Delete account"]
  };
  return <div className="settings-fields">{(common[tab] || common.account).map((field) => <label key={field}>{field}<input placeholder={field.includes("Delete") ? "Type confirmation phrase" : field} /></label>)}</div>;
}

function AppearanceSettings() {
  const [theme, setTheme] = useState("Light");
  const themes = [
    ["Light", "Cream surfaces, warm ink, and the default pastel accents."],
    ["Dark", "Deep navy surfaces with soft cream text and muted pastels."],
    ["System", "Follows the user's operating system preference."],
    ["Cosy", "Warmer cream, sage details, and a softer workspace feel."],
    ["Night owl", "Low-light workspace palette for evening sessions."],
    ["Garden", "Fresh sage surfaces, cream panels, and calm green accents."],
    ["Sunrise", "Amber highlights with rose warmth for an optimistic morning feel."],
    ["Ocean", "Soft sky blues and cream surfaces for a clearer focus mode."],
    ["Notebook", "Paper-like creams with ink-forward contrast and quiet controls."],
    ["Aurora", "Lavender, sky, and sage blended into a more expressive workspace."]
  ];
  const activeTheme = themes.find(([name]) => name === theme);

  return (
    <div className="appearance-settings">
      <label className="theme-select">
        Theme
        <select value={theme} onChange={(event) => setTheme(event.target.value)}>
          {themes.map(([name]) => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <div className={`theme-preview theme-${theme.toLowerCase().replace(" ", "-")}`}>
        <div>
          <Badge>{activeTheme[0]}</Badge>
          <h3>{activeTheme[0]} theme</h3>
          <p>{activeTheme[1]}</p>
        </div>
        <span />
        <span />
        <span />
      </div>
      <div className="settings-fields">
        <label>Accent colour<select><option>Lavender</option><option>Sage</option><option>Rose</option><option>Sky</option><option>Amber</option></select></label>
        <label>Font size<select><option>Default</option><option>Large</option></select></label>
        <label>Reduce motion<select><option>Off</option><option>On</option></select></label>
        <label>Density<select><option>Comfortable</option><option>Compact</option></select></label>
      </div>
    </div>
  );
}

function Workspace({ compact = false, interactive = false }) {
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
  const addNote = () => setNotes([...notes, { id: Date.now(), colour: "amber", content: "New idea", x: 34, y: 56 }]);
  return (
    <section className={compact ? "workspace compact" : "workspace"}>
      <div className="workspace-toolbar">
        <Button variant="soft" onClick={() => setFocus(!focus)}><Eye size={16} />Focus mode {focus ? "ON" : "OFF"}</Button>
        {interactive && <Button onClick={addNote}><Plus size={16} />Sticky note</Button>}
      </div>
      <div className={focus ? "desk focus-on" : "desk"}>
        <DeskIllustration />
        {notes.map((note) => (
          <textarea
            key={note.id}
            className={`sticky ${note.colour}`}
            value={note.content}
            style={{ left: `${note.x}%`, top: `${note.y}%` }}
            onChange={(event) => setNotes(notes.map((item) => item.id === note.id ? { ...item, content: event.target.value } : item))}
            onDoubleClick={() => window.location.assign(`/mira/${repos[0].name}`)}
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

function DeskPreview() {
  return <div className="desk-preview"><DeskIllustration /></div>;
}

function DeskIllustration() {
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setDate(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const minute = date.getMinutes() * 6;
  const hour = (date.getHours() % 12) * 30 + date.getMinutes() / 2;
  return (
    <svg viewBox="0 0 900 520" role="img" aria-label="Pastel illustrated workspace desk">
      <rect x="18" y="18" width="864" height="484" rx="28" fill="#f4efe6" stroke="#e8e0d4" />
      <rect x="185" y="70" width="360" height="210" rx="20" fill="#fffdf9" stroke="#e8e0d4" />
      <rect x="215" y="100" width="300" height="150" rx="12" fill="#3d3530" opacity=".9" />
      <path d="M248 134h142M248 166h210M248 198h118M248 230h174" stroke="#c8d8c4" strokeWidth="9" strokeLinecap="round" />
      <rect x="292" y="288" width="150" height="16" rx="8" fill="#c4b8e8" />
      <rect x="214" y="326" width="316" height="82" rx="18" fill="#fffdf9" stroke="#e8e0d4" />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={236 + i * 22} y="348" width="14" height="12" rx="4" fill="#ddd5f0" />)}
      <rect x="615" y="92" width="76" height="86" rx="18" fill="#f5e4c4" stroke="#e8e0d4" />
      <path d="M690 116c42 0 42 42 0 42" fill="none" stroke="#e8e0d4" strokeWidth="10" />
      <path d="M640 70c-8-18 8-28 0-44M668 70c-8-18 8-28 0-44" stroke="#9c918c" strokeWidth="5" strokeLinecap="round" />
      <circle cx="748" cy="118" r="54" fill="#fffdf9" stroke="#e8e0d4" />
      <line x1="748" y1="118" x2="748" y2="84" stroke="#7a6dc4" strokeWidth="5" transform={`rotate(${minute} 748 118)`} />
      <line x1="748" y1="118" x2="748" y2="94" stroke="#3d3530" strokeWidth="6" transform={`rotate(${hour} 748 118)`} />
      <circle cx="748" cy="118" r="5" fill="#3d3530" />
      <rect x="650" y="325" width="92" height="88" rx="18" fill="#c8d8c4" stroke="#e8e0d4" />
      <path d="M696 325c-42-54-98-28-54 10M696 325c34-68 92-32 44 8" fill="#a8c4a2" />
      <rect x="640" y="410" width="116" height="26" rx="13" fill="#e8e0d4" />
      <circle cx="110" cy="104" r="11" fill="#d4848c" />
      <rect x="86" y="114" width="116" height="86" rx="10" fill="#f5d5d8" stroke="#e8e0d4" transform="rotate(-8 144 157)" />
      <circle cx="775" cy="322" r="11" fill="#7aaa72" />
      <rect x="733" y="334" width="112" height="82" rx="10" fill="#c8d8c4" stroke="#e8e0d4" transform="rotate(7 789 375)" />
    </svg>
  );
}

function RepoCard({ repo, actions = false }) {
  return (
    <Card>
      <div className="repo-card-head"><h3><Link to={`/${repo.owner}/${repo.name}`}>{repo.name}</Link></h3>{repo.private && <Lock size={15} />}</div>
      <p>{repo.description}</p>
      <div className="repo-meta"><LanguagePill language={repo.language} /><span><Star size={14} />{repo.stars}</span><span><GitFork size={14} />{repo.forks}</span><span>{repo.updated}</span></div>
      {actions && <div className="card-actions"><Button variant="soft"><Home size={15} />Pin</Button><Button variant="soft"><Star size={15} />Star</Button><Button to={`/${repo.owner}/${repo.name}/readme`} variant="soft">README</Button><Button to={`/${repo.owner}/${repo.name}/landing`} variant="soft">Landing</Button><Button variant="soft"><Settings size={15} /></Button></div>}
    </Card>
  );
}

function PhaseRepoCard({ repo }) {
  const navigate = useNavigate();

  return (
    <article className="phase-repo-card" onClick={() => navigate(`/${repo.owner}/${repo.name}`)}>
      <div className="phase-repo-title">
        <h3>{repo.name}</h3>
        <span>{repo.private ? "Private" : "Public"}</span>
      </div>
      <p>{repo.description}</p>
      <div className="phase-repo-meta">
        <LanguagePill language={repo.language} />
        <span><Star size={14} />{repo.stars}</span>
        <span>Updated {repo.updated}</span>
      </div>
      <div className="phase-repo-actions" onClick={(event) => event.stopPropagation()}>
        <button type="button">Pin to workspace</button>
        <button type="button">★ Star</button>
        <Link to={`/${repo.owner}/${repo.name}/readme`}>README Studio</Link>
        <Link to={`/${repo.owner}/${repo.name}/landing`}>Landing Designer</Link>
        <button type="button" aria-label="Repo settings"><MoreHorizontal size={16} /></button>
      </div>
    </article>
  );
}

function LanguagePill({ language }) {
  const [bg, color] = languageStyles[language] || languageStyles.TypeScript;
  return <span className="language-pill" style={{ backgroundColor: bg, color }}><span style={{ backgroundColor: color }} />{language}</span>;
}

function Avatar({ size = "normal" }) {
  const sizes = { tiny: 28, normal: 44, large: 112 };
  return <span className={`avatar ${size}`}><IllustratedAvatar size={sizes[size] || sizes.normal} variant={currentUser.avatarStyle} /></span>;
}

function ProfileHeader({ editable = false, publicView = false }) {
  return (
    <section className="profile-header">
      <div className="cover" />
      <div className="profile-content">
        <Avatar size="large" />
        <div><h2>{currentUser.name}</h2><p>@{currentUser.username} - {currentUser.pronouns}</p><p>{currentUser.bio}</p><p>{currentUser.location} - {currentUser.website} - Joined {currentUser.joinDate}</p></div>
        <div className="profile-actions">{editable && <Button>Edit profile</Button>}{publicView && <Button>Follow</Button>}<Button variant="soft">Message</Button></div>
      </div>
      <div className="stats profile-stats"><Stat value={currentUser.repos} label="repos" /><Stat value={currentUser.followers} label="followers" /><Stat value={currentUser.following} label="following" /><Stat value={currentUser.stars} label="stars" /></div>
    </section>
  );
}

function ProjectLanding({ repo }) {
  return <section className="project-landing"><h2>{repo.name}</h2><p>{repo.description}</p><Button>Open project</Button></section>;
}

function RepoToolbar({ repo }) {
  return (
    <div className="repo-toolbar">
      <p>{repo.description}</p>
      <LanguagePill language={repo.language} />
      <Button variant="soft"><Star size={16} />Star</Button>
      <Button variant="soft"><GitFork size={16} />Fork</Button>
      <select><option>main</option><option>studio-redesign</option></select>
      <code>git clone https://forallcode.dev/{repo.owner}/{repo.name}.git</code>
      <Button variant="soft"><Copy size={16} /></Button>
    </div>
  );
}

function FileTree() {
  return <aside className="file-tree">{["src", "src/components", "src/App.tsx", "README.md", "package.json", ".gitignore"].map((file) => <button key={file}><FileCode2 size={15} />{file}</button>)}</aside>;
}

function ReadmePreview({ repo = repos[0] }) {
  return <section className="readme-render"><ReactMarkdown remarkPlugins={[remarkGfm]}>{`# ${repo.name}\n\n${repo.description}\n\n## Highlights\n\n- Warm project intro\n- Contributor-friendly setup\n- Copyable code samples\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nUpdated ${repo.updated} - 128 commits - 5 contributors`}</ReactMarkdown></section>;
}

function GitDiagram() {
  return (
    <svg className="git-diagram" viewBox="0 0 760 260" role="img" aria-label="Interactive Git graph">
      <path d="M80 172 C220 172 270 172 390 172 S560 172 680 172" stroke="#7aaa72" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M224 172 C290 82 390 82 476 172" stroke="#9b8fd4" strokeWidth="9" fill="none" strokeLinecap="round" />
      {[80, 220, 390, 540, 680].map((x) => <circle key={x} cx={x} cy="172" r="22" fill="#fffdf9" stroke="#7aaa72" strokeWidth="8" />)}
      {[300, 400].map((x) => <circle key={x} cx={x} cy="92" r="22" fill="#fffdf9" stroke="#9b8fd4" strokeWidth="8" />)}
      <text x="66" y="224">main</text><text x="286" y="52">feature</text><text x="520" y="224">merge</text>
    </svg>
  );
}

function Card({ children, large = false }) {
  return <article className={large ? "card large-card" : "card"}>{children}</article>;
}

function Button({ children, to, variant = "primary", full = false, onClick }) {
  const className = `button ${variant} ${full ? "full" : ""}`;
  return to ? <Link className={className} to={to}>{children}</Link> : <button className={className} onClick={onClick}>{children}</button>;
}

function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

function FeatureCard({ title, text, icon }) {
  return <Card><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p></Card>;
}

function Stat({ value, label }) {
  return <div className="stat"><strong>{value}</strong><span>{label}</span></div>;
}

function SectionTitle({ title }) {
  return <div className="section-title"><h2>{title}</h2></div>;
}

function ActivityItem({ item, time }) {
  return <Card><div className="activity-item"><Sparkles size={18} /><span>{item}</span><time>{time}</time></div></Card>;
}

function ActivityCalendar() {
  return <Card><h3>Activity calendar</h3><div className="calendar-grid">{Array.from({ length: 35 }).map((_, index) => <span key={index} className={`level-${index % 5}`} />)}</div></Card>;
}

function RecentChanges() {
  return <Card><h3>Recent changes</h3>{repos.map((repo) => <p key={repo.name}>{repo.name}: updated {repo.updated}</p>)}</Card>;
}

function Tabs({ tabs }) {
  const [active, setActive] = useState(tabs[0]);
  return <div><div className="tab-row">{tabs.map((tab) => <button className={active === tab ? "active" : ""} key={tab} onClick={() => setActive(tab)}>{tab}</button>)}</div><p>{active} view is ready for the MVP surface.</p></div>;
}

function Roadmap() {
  return <section className="roadmap">{["Foundation", "Core pages", "Profile + Workspace", "Signature features"].map((phase, index) => <Card key={phase}><Badge>Week {index + 1}</Badge><h3>{phase}</h3><p>{["Auth, routing, tokens, shared components.", "Landing, dashboard, repos, repo page, navigation.", "Illustrated desk, notes, todos, profile views.", "README Studio, Landing Designer, Learn centre."][index]}</p></Card>)}</section>;
}

function AvatarPicker() {
  return <div className="avatar-picker">{avatarVariants.map((style) => <button key={style} className={style} aria-label={`${style} avatar`}><IllustratedAvatar size={44} variant={style} /></button>)}</div>;
}

function PageFrame({ title, eyebrow, children }) {
  return <div className="page-frame">{(title || eyebrow) && <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>}{children}</div>;
}

function Footer() {
  return (
    <footer>
      <div className="footer-links">
        <Link to="/about">About</Link>
        <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
        <Link to="/settings/privacy">Privacy</Link>
        <Link to="/settings/danger">Terms</Link>
        <Link to="/explore">Status</Link>
      </div>
      <span className="copyright">forallcode2020 copyright</span>
    </footer>
  );
}

createRoot(document.getElementById("root")).render(<App />);
