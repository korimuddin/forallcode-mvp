import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Check, ChevronDown, Lock } from "lucide-react";
import OnboardingFlow from "../components/onboarding/OnboardingFlow";
import { learnLessons, learnTracks } from "../data/learnLessons";
import { useAuthSession, useDocumentTitle, useIsMobile, useSignedInUserData } from "../lib/hooks";
import { createFeedEvent } from "../lib/createFeedEvent";
import { supabase } from "../lib/supabase";
import { trackUsage } from "../lib/trackUsage";
import { PageFrame, Button, Card } from "./PageShared";

const lessons = learnLessons;

const learnHeroSlides = [
  {
    eyebrow: "Did you know?",
    title: ".gitignore has been part of Git since the beginning.",
    text: "Git began on April 7, 2005, and ignore rules were designed early to help teams keep untracked local files out of shared history.",
    tone: "lavender",
    visual: "gitignore"
  },
  {
    eyebrow: "Live learning",
    title: "4k users are learning right now.",
    text: "Tiny daily Git lessons add up. Pick a topic, complete a visual step, and keep your project moving.",
    tone: "sage",
    visual: "stats"
  },
  {
    eyebrow: "More info",
    title: "Git becomes clearer when you can see the shape of the work.",
    text: "Branches, merges, conflicts, releases, and remotes all become easier once the history is visible.",
    tone: "amber",
    visual: "branches"
  },
  {
    eyebrow: "Course nudge",
    title: "Have you considered DevOps?",
    text: "Take a look at the DevOps track to understand CI/CD, environments, deployment strategies, and observability.",
    tone: "sky",
    visual: "devops"
  },
  {
    eyebrow: "Next step",
    title: "Start where you are. Move when ready.",
    text: "Beginner, Intermediate, Advanced, and DevOps tracks are suggestions, not locks.",
    tone: "rose",
    visual: "tracks"
  }
];

function CarouselHero({ slides, type }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex] || slides[0];

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [type, slides.length]);

  if (!activeSlide) return null;

  return (
    <section
      className={`carousel-hero ${type || ""} tone-${activeSlide.tone || "lavender"} ${activeSlide.image ? "has-image" : ""}`}
      style={activeSlide.image ? {
        backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .78), rgba(20, 16, 14, .24)), url("${activeSlide.image}")`,
        backgroundPosition: activeSlide.imagePosition || "50% 50%"
      } : undefined}
    >
      <div className="carousel-hero-copy">
        <p className="eyebrow">{activeSlide.eyebrow}</p>
        <h1>{activeSlide.title}</h1>
        <p>{activeSlide.text}</p>
        {activeSlide.meta && <span>{activeSlide.meta}</span>}
      </div>
      {type === "learn" && activeSlide.visual && <LearnHeroVisual kind={activeSlide.visual} />}
      {activeSlide.visual === "computer" && <AnimatedComputer />}
      <div className="carousel-dots" aria-label="Hero slides">
        {slides.map((slide, index) => (
          <button
            aria-label={`Show slide ${index + 1}`}
            className={index === activeIndex ? "active" : ""}
            key={`${slide.title}-${index}`}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}

function LearnHeroVisual({ kind }) {
  if (kind === "stats") {
    return (
      <div className="learn-hero-visual visual-stats" aria-hidden="true">
        <div className="visual-card">
          <strong>4k</strong>
          <span>learning now</span>
        </div>
        <i className="pulse one" />
        <i className="pulse two" />
        <i className="pulse three" />
      </div>
    );
  }

  if (kind === "branches") {
    return (
      <div className="learn-hero-visual visual-branches" aria-hidden="true">
        <svg viewBox="0 0 260 200" role="img">
          <path d="M48 158 C84 122 90 78 130 78 C170 78 174 124 214 46" />
          <path d="M48 158 C94 158 112 146 148 132 C178 120 192 132 220 156" />
          <circle cx="48" cy="158" r="13" />
          <circle cx="130" cy="78" r="13" />
          <circle cx="214" cy="46" r="13" />
          <circle cx="220" cy="156" r="13" />
        </svg>
      </div>
    );
  }

  if (kind === "devops") {
    return (
      <div className="learn-hero-visual visual-devops" aria-hidden="true">
        <div className="deploy-ring">
          <span>CI</span>
          <span>Test</span>
          <span>Ship</span>
        </div>
        <div className="rocket-trail" />
      </div>
    );
  }

  if (kind === "tracks") {
    return (
      <div className="learn-hero-visual visual-tracks" aria-hidden="true">
        <div className="track beginner">Beginner</div>
        <div className="track intermediate">Intermediate</div>
        <div className="track advanced">Advanced</div>
      </div>
    );
  }

  return (
    <div className="learn-hero-visual visual-gitignore" aria-hidden="true">
      <div className="file-card">
        <strong>.gitignore</strong>
        <span>node_modules/</span>
        <span>.env.local</span>
        <span>dist/</span>
      </div>
      <i className="floating-dot one" />
      <i className="floating-dot two" />
    </div>
  );
}

function AnimatedComputer() {
  return (
    <div className="animated-computer" aria-hidden="true">
      <div className="computer-screen">
        <i />
        <i />
        <i />
      </div>
      <div className="computer-base" />
      <div className="computer-spark one" />
      <div className="computer-spark two" />
    </div>
  );
}

function LearnPage() {
  useDocumentTitle("Learn");
  const isMobile = useIsMobile();
  const { session, checked } = useAuthSession();
  const { profile: signedInProfile, repos: signedInRepos } = useSignedInUserData();
  const { lessonSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewedLessonsRef = useRef(new Set());
  const [activeTrack, setActiveTrack] = useState("beginner");
  const [expandedTracks, setExpandedTracks] = useState(() => new Set(["beginner"]));
  const [active, setActive] = useState(lessons[0].slug);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogTag, setCatalogTag] = useState("all");
  const [completedLessons, setCompletedLessons] = useState(() => new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFullOnboarding, setShowFullOnboarding] = useState(false);
  const [onboardingLeaving, setOnboardingLeaving] = useState(false);
  const [selectedComfort, setSelectedComfort] = useState("");
  const lesson = lessons.find((item) => item.slug === active) || lessons[0];
  const isFreeUser = true;
  const showCatalog = searchParams.get("view") === "catalog" && !lessonSlug;

  useEffect(() => {
    let alive = true;

    async function loadLearnPreferences() {
      if (!checked) return;
      const fallback = typeof window !== "undefined" ? window.localStorage.getItem("learn_comfort_level") : "";

      if (!session?.user?.id || !supabase) {
        if (!alive) return;
        if (fallback) openRecommendedTrack(fallback);
        setShowOnboarding(!fallback);
        return;
      }

      const [{ data: profile }, { data: progress }] = await Promise.all([
        supabase.from("profiles").select("learn_comfort_level").eq("id", session.user.id).maybeSingle(),
        supabase.from("learn_progress").select("lesson_slug, completed").eq("user_id", session.user.id)
      ]);

      if (!alive) return;
      const comfort = profile?.learn_comfort_level || fallback;
      if (comfort) openRecommendedTrack(comfort);
      setShowOnboarding(!comfort);
      setCompletedLessons(new Set((progress || []).filter((item) => item.completed).map((item) => item.lesson_slug)));
    }

    loadLearnPreferences();
    return () => {
      alive = false;
    };
  }, [checked, session]);

  useEffect(() => {
    if (!lessonSlug) return;
    const selectedLesson = lessons.find((item) => item.slug === lessonSlug);
    if (!selectedLesson) return;
    const track = learnTracks.find((item) => item.track === selectedLesson.track);
    if (track) {
      setActiveTrack(track.id);
      setExpandedTracks((current) => new Set([...current, track.id]));
    }
    setActive(selectedLesson.slug);
    setShowOnboarding(false);
  }, [lessonSlug]);

  useEffect(() => {
    if (!checked || showOnboarding || !session?.user?.id || !lesson?.slug) return;
    const viewKey = `${session.user.id}:${lesson.slug}`;
    if (viewedLessonsRef.current.has(viewKey)) return;
    viewedLessonsRef.current.add(viewKey);
    trackUsage(session.user.id, "lesson_viewed", {
      lesson_slug: lesson.slug,
      track: lesson.track,
      tag: lesson.tag
    }).catch(() => {});
  }, [checked, lesson?.slug, session?.user?.id, showOnboarding]);

  function openRecommendedTrack(trackId) {
    const track = learnTracks.find((item) => item.id === trackId) || learnTracks[0];
    const firstLesson = lessons.find((item) => item.track === track.track);
    setActiveTrack(track.id);
    setExpandedTracks(new Set([track.id]));
    if (firstLesson) setActive(firstLesson.slug);
  }

  async function chooseComfort(trackId) {
    setSelectedComfort(trackId);
    if (typeof window !== "undefined") window.localStorage.setItem("learn_comfort_level", trackId);

    if (session?.user?.id && supabase) {
      await supabase.from("profiles").update({ learn_comfort_level: trackId }).eq("id", session.user.id);
    }

    window.setTimeout(() => {
      setOnboardingLeaving(true);
      window.setTimeout(() => {
        openRecommendedTrack(trackId);
        setShowOnboarding(false);
        setOnboardingLeaving(false);
      }, 300);
    }, 400);
  }

  function toggleTrack(trackId) {
    setExpandedTracks((current) => {
      const next = new Set(current);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }

  function chooseLesson(slug) {
    const nextLesson = lessons.find((item) => item.slug === slug);
    if (nextLesson) {
      const track = learnTracks.find((item) => item.track === nextLesson.track);
      if (track) {
        setActiveTrack(track.id);
        setExpandedTracks((current) => new Set([...current, track.id]));
      }
    }
    setActive(slug);
  }

  function openCatalogLesson(slug) {
    chooseLesson(slug);
    navigate(`/learn/${slug}`);
  }

  async function markLessonComplete() {
    const wasComplete = completedLessons.has(lesson.slug);
    const next = new Set(completedLessons);
    next.add(lesson.slug);
    setCompletedLessons(next);

    if (session?.user?.id && supabase) {
      await supabase.from("learn_progress").upsert({
        user_id: session.user.id,
        lesson_slug: lesson.slug,
        completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: "user_id,lesson_slug" });
      if (!wasComplete) {
        trackUsage(session.user.id, "lesson_completed", { lesson_slug: lesson.slug }).catch(() => {});
        createFeedEvent(supabase, {
          actorId: session.user.id,
          eventType: "lesson_completed",
          metadata: {
            lesson_slug: lesson.slug,
            lesson_title: lesson.title,
            track: lesson.track,
            track_name: learnTracks.find((track) => track.track === lesson.track)?.label || lesson.track
          }
        }).catch(() => {});
      }
    }
  }

  if (showOnboarding && !showCatalog) {
    return <LearnComfortCheck selected={selectedComfort} leaving={onboardingLeaving} onSelect={chooseComfort} />;
  }

  if (showCatalog) {
    return (
      <PageFrame title="Lesson catalog" eyebrow="Learn">
        {showFullOnboarding && session?.user && (
          <OnboardingFlow
            user={session.user}
            profile={signedInProfile}
            repos={signedInRepos}
            onComplete={() => setShowFullOnboarding(false)}
          />
        )}
        <CarouselHero slides={learnHeroSlides} type="learn" />
        <section className="learn-replay-tour">
          <div>
            <p className="eyebrow">Need a refresher?</p>
            <h2>Replay the ForAllCode tour whenever you like.</h2>
          </div>
          <button className="button soft" disabled={!session?.user} onClick={() => setShowFullOnboarding(true)} type="button">
            Replay onboarding
          </button>
        </section>
        <LearnCatalog
          completedLessons={completedLessons}
          onOpenLesson={openCatalogLesson}
          query={catalogQuery}
          selectedTag={catalogTag}
          setQuery={setCatalogQuery}
          setSelectedTag={setCatalogTag}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Learn Git visually" eyebrow="Learn">
      {showFullOnboarding && session?.user && (
        <OnboardingFlow
          user={session.user}
          profile={signedInProfile}
          repos={signedInRepos}
          onComplete={() => setShowFullOnboarding(false)}
        />
      )}
      <CarouselHero slides={learnHeroSlides} type="learn" />
      <section className="learn-replay-tour">
        <div>
          <p className="eyebrow">Need a refresher?</p>
          <h2>Replay the ForAllCode tour whenever you like.</h2>
        </div>
        <button className="button soft" disabled={!session?.user} onClick={() => setShowFullOnboarding(true)} type="button">
          Replay onboarding
        </button>
      </section>
      <section className="learn-cert-card">
        <div>
          <p className="eyebrow">Certification</p>
          <h2>ForAllCode Certificates</h2>
          <p>Earn public certificates for Git Fundamentals, Git for Teams, Command Line Essentials, and Open Source contribution, then share them with collaborators, employers, or your profile.</p>
        </div>
        <div className="learn-cert-actions">
          <Button to="/certification/git-fundamentals" variant="soft">Git Fundamentals</Button>
          <Button to="/certification/git-for-teams" variant="soft">Git for Teams</Button>
          <Button to="/certification/command-line-essentials" variant="soft">Command Line</Button>
          <Button to="/certification/open-source-contributor" variant="soft">Open Source</Button>
        </div>
      </section>
      {isMobile && (
        <select className="learn-mobile-select" value={active} onChange={(event) => chooseLesson(event.target.value)} aria-label="Choose lesson">
          {lessons.map((item) => (
            <option key={item.slug} value={item.slug}>{item.title} - {item.tag}</option>
          ))}
        </select>
      )}
      <div className="learn-layout learn-library">
        <aside className="lesson-sidebar">
          {learnTracks.map((track) => {
            const trackLessons = lessons.filter((item) => item.track === track.track);
            const completed = trackLessons.filter((item) => completedLessons.has(item.slug)).length;
            const expanded = expandedTracks.has(track.id);
            return (
              <div className="learn-track-group" key={track.id}>
                <button className="learn-track-heading" onClick={() => toggleTrack(track.id)}>
                  <span>{track.subtitle}</span>
                  <ChevronDown className={expanded ? "open" : ""} size={14} />
                </button>
                {expanded && (
                  <>
                    <div className="learn-track-progress"><span style={{ width: `${trackLessons.length ? (completed / trackLessons.length) * 100 : 0}%`, background: track.color }} /></div>
                    {track.id === "advanced" && (
                      <>
                        {trackLessons.filter((item) => item.tag !== "devops").map((item) => (
                          <LessonSidebarButton active={active === item.slug} completed={completedLessons.has(item.slug)} freeLocked={isFreeUser && item.track > 1} key={item.slug} lesson={item} onClick={() => chooseLesson(item.slug)} />
                        ))}
                        <div className="devops-separator"><span>DevOps Track</span></div>
                        {trackLessons.filter((item) => item.tag === "devops").map((item) => (
                          <LessonSidebarButton active={active === item.slug} completed={completedLessons.has(item.slug)} freeLocked={isFreeUser} key={item.slug} lesson={item} onClick={() => chooseLesson(item.slug)} />
                        ))}
                      </>
                    )}
                    {track.id !== "advanced" && trackLessons.map((item) => (
                      <LessonSidebarButton active={active === item.slug} completed={completedLessons.has(item.slug)} freeLocked={isFreeUser && item.track > 1} key={item.slug} lesson={item} onClick={() => chooseLesson(item.slug)} />
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </aside>
        <article className="lesson-content">
          <LessonTag tag={lesson.tag} />
          <h2>{lesson.title}</h2>
          <p>{lesson.description}</p>
          <LessonIllustration lesson={lesson} />
          <div className="steps">
            {lesson.steps.map((step) => <Card key={step.title}><h3>{step.title}</h3><p>{step.body}</p></Card>)}
          </div>
          <Button onClick={markLessonComplete}><Check size={16} />{completedLessons.has(lesson.slug) ? "Completed" : "Mark as complete"}</Button>
        </article>
      </div>
    </PageFrame>
  );
}

function LearnComfortCheck({ selected, leaving, onSelect }) {
  const cards = [
    { id: "beginner", emoji: "🌱", title: "New to this", text: "I've heard of Git but haven't really used it, or I've only used it a little and things still feel unclear.", action: "Start with the basics →" },
    { id: "intermediate", emoji: "🌿", title: "Getting there", text: "I know the basics — commits, branches, push and pull. But I want to get more confident working with others.", action: "Jump to Intermediate →" },
    { id: "advanced", emoji: "🚀", title: "Pretty comfortable", text: "I use Git daily and work in teams. I want to go deeper — advanced workflows, DevOps, and shipping with confidence.", action: "Go to Advanced →" }
  ];

  return (
    <section className={leaving ? "learn-onboarding leaving" : "learn-onboarding"}>
      <p className="eyebrow">Learn Git visually</p>
      <h1>How comfortable are you <em>with Git right now?</em></h1>
      <p className="learn-onboarding-subtext">Be honest — there's no wrong answer. We'll start you in exactly the right place.</p>
      <div className="comfort-card-grid">
        {cards.map((card) => (
          <button className={`comfort-card ${card.id} ${selected === card.id ? "selected" : ""}`} key={card.id} onClick={() => onSelect(card.id)}>
            <span className="comfort-emoji">{card.emoji}</span>
            <strong>{card.title}</strong>
            <small>{card.text}</small>
            <b>{card.action}</b>
          </button>
        ))}
      </div>
      <p className="learn-reassurance">You can always switch tracks or go back to basics — these are suggestions, not locks.</p>
      <div className="learn-onboarding-cert-links">
        <Link className="learn-cert-onboarding-link" to="/certification/git-fundamentals">Explore the Git Fundamentals Certificate</Link>
        <Link className="learn-cert-onboarding-link" to="/certification/git-for-teams">Explore the Git for Teams Certificate</Link>
        <Link className="learn-cert-onboarding-link" to="/certification/command-line-essentials">Explore the Command Line Essentials Certificate</Link>
        <Link className="learn-cert-onboarding-link" to="/certification/open-source-contributor">Explore the Open Source Contributor Certificate</Link>
      </div>
    </section>
  );
}

function LearnCatalog({ completedLessons, onOpenLesson, query, selectedTag, setQuery, setSelectedTag }) {
  const allTags = Array.from(new Set(lessons.map((item) => item.tag))).sort();
  const normalisedQuery = query.trim().toLowerCase();

  function lessonMatches(lesson, track) {
    const searchableText = [
      lesson.title,
      lesson.description,
      lesson.tag,
      lesson.slug,
      track.title,
      track.subtitle,
      ...lesson.steps.flatMap((step) => [step.title, step.body])
    ].join(" ").toLowerCase();

    const matchesSearch = !normalisedQuery || searchableText.includes(normalisedQuery);
    const matchesTag = selectedTag === "all" || lesson.tag === selectedTag;
    return matchesSearch && matchesTag;
  }

  const groupedLessons = learnTracks.map((track) => ({
    ...track,
    lessons: lessons.filter((lesson) => lesson.track === track.track && lessonMatches(lesson, track))
  }));
  const resultCount = groupedLessons.reduce((total, track) => total + track.lessons.length, 0);

  return (
    <section className="learn-catalog">
      <div className="learn-catalog-header">
        <div>
          <p className="eyebrow">Course catalog</p>
          <h2>Browse every lesson</h2>
          <p>Search by subject, skill, workflow, or tag, then jump straight into the right course.</p>
        </div>
        <span>{resultCount} lessons</span>
      </div>

      <div className="learn-catalog-toolbar">
        <label className="learn-catalog-search">
          <span>Search lessons</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search branching, DevOps, conflicts..."
          />
        </label>
        <div className="learn-catalog-tags" aria-label="Filter lessons by tag">
          <button className={selectedTag === "all" ? "active" : ""} onClick={() => setSelectedTag("all")}>All</button>
          {allTags.map((tag) => (
            <button className={selectedTag === tag ? "active" : ""} key={tag} onClick={() => setSelectedTag(tag)}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="learn-catalog-tracks">
        {groupedLessons.map((track) => (
          <div className="learn-catalog-track" key={track.id}>
            <div className="learn-catalog-track-title">
              <span style={{ backgroundColor: track.color }} />
              <div>
                <h3>{track.title}</h3>
                <p>{track.subtitle}</p>
              </div>
            </div>
            {track.lessons.length > 0 ? (
              <div className="learn-catalog-grid">
                {track.lessons.map((lesson) => {
                  const complete = completedLessons.has(lesson.slug);
                  return (
                    <article className="learn-catalog-card" key={lesson.slug}>
                      <div className="learn-catalog-card-top">
                        <LessonTag tag={lesson.tag} compact />
                        {complete && <span className="learn-catalog-complete"><Check size={13} /> Complete</span>}
                      </div>
                      <h4>{lesson.title}</h4>
                      <p>{lesson.description}</p>
                      <div className="learn-catalog-meta">
                        <span>{lesson.steps.length} steps</span>
                        <span>{track.subtitle}</span>
                      </div>
                      <Button onClick={() => onOpenLesson(lesson.slug)} variant="soft">Open lesson</Button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="learn-catalog-empty">No {track.title.toLowerCase()} lessons match this search yet.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function LessonSidebarButton({ active, completed, freeLocked, lesson, onClick }) {
  return (
    <button className={active ? "active" : ""} onClick={onClick}>
      <i className={completed ? "lesson-dot complete" : "lesson-dot"} />
      <span>{lesson.title}</span>
      {freeLocked && <Lock size={13} />}
      <LessonTag tag={lesson.tag} compact />
    </button>
  );
}

function LessonTag({ tag, compact = false }) {
  return <span className={`lesson-tag ${tag} ${compact ? "compact" : ""}`}>{tag}</span>;
}

function LessonIllustration({ lesson }) {
  const diagrams = {
    branching: <BranchingArt />,
    merging: <MergingArt />,
    forking: <ForkingArt />,
    commits: <CommitsArt />,
    "pull-requests": <PullRequestArt />,
    rebasing: <RebasingArt />,
    conflicts: <ConflictsArt />,
    gitignore: <GitignoreArt />,
    stashing: <StashingArt />,
    "commit-messages": <CommitMessagesArt />,
    "open-source": <OpenSourceArt />,
    licences: <LicencesArt />
  };
  const art = diagrams[lesson.slug] || <GeneratedLessonArt lesson={lesson} />;

  return (
    <figure className="git-diagram">
      <svg viewBox="0 0 760 300" role="img" aria-label={`${lesson.title} lesson illustration`}>
        <title>{lesson.title}</title>
        <desc>{lesson.description}</desc>
        <rect x="0" y="0" width="760" height="300" rx="28" fill="#f4efe6" />
        <circle cx="660" cy="58" r="58" fill="#ddd5f0" opacity="0.72" />
        <circle cx="92" cy="235" r="72" fill="#c8d8c4" opacity="0.55" />
        <path d="M60 252 C188 198 292 274 430 218 S620 206 704 142" stroke="#fffdf9" strokeWidth="26" fill="none" strokeLinecap="round" opacity="0.72" />
        {art}
      </svg>
    </figure>
  );
}

function GeneratedLessonArt({ lesson }) {
  const accent = lesson.tag === "devops" ? "#6aa8d4" : lesson.tag === "advanced" ? "#d4848c" : "#9b8fd4";
  const secondary = lesson.tag === "devops" ? "#cce0f0" : lesson.tag === "advanced" ? "#f5d5d8" : "#ddd5f0";
  const labels = lesson.steps.slice(0, 4).map((step) => step.title.split(" ").slice(0, 2).join(" "));

  if (lesson.tag === "devops") {
    return (
      <>
        <rect x="116" y="78" width="528" height="142" rx="24" fill="#fffdf9" stroke="#cce0f0" strokeWidth="6" />
        {labels.map((label, index) => {
          const x = 172 + index * 138;
          return (
            <g key={label}>
              {index > 0 && <path d={`M${x - 96} 150 H${x - 38}`} stroke="#6aa8d4" strokeWidth="8" strokeLinecap="round" />}
              <rect x={x - 36} y="118" width="72" height="64" rx="16" fill={index % 2 ? "#cce0f0" : "#fffdf9"} stroke="#6aa8d4" strokeWidth="5" />
              <text x={x} y="205" textAnchor="middle">{label}</text>
            </g>
          );
        })}
        <text x="380" y="64" textAnchor="middle">automated delivery pipeline</text>
      </>
    );
  }

  if (lesson.track === 3) {
    return (
      <>
        <path d="M114 206 H646" stroke="#d4848c" strokeWidth="9" strokeLinecap="round" />
        <path d="M180 206 C242 98 330 98 394 206" stroke="#9b8fd4" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M394 206 C446 110 536 110 606 206" stroke="#6aa8d4" strokeWidth="8" fill="none" strokeLinecap="round" />
        {[114, 246, 394, 526, 646].map((x, index) => <GitNode key={x} x={x} y={206} stroke={index % 2 ? accent : "#7aaa72"} label={index === 0 ? "base" : `a${index}`} />)}
        <rect x="246" y="62" width="268" height="60" rx="18" fill="#fffdf9" stroke={accent} strokeWidth="5" />
        <text x="380" y="99" textAnchor="middle">{labels[0] || lesson.title}</text>
      </>
    );
  }

  return (
    <>
      <rect x="116" y="70" width="528" height="162" rx="24" fill="#fffdf9" stroke="#e8e0d4" />
      <path d="M170 168 H590" stroke={accent} strokeWidth="9" strokeLinecap="round" />
      {labels.map((label, index) => {
        const x = 170 + index * 140;
        return (
          <g key={label}>
            <GitNode x={x} y={168} stroke={index % 2 ? "#7aaa72" : accent} />
            <rect x={x - 54} y="88" width="108" height="36" rx="12" fill={secondary} />
            <text x={x} y="112" textAnchor="middle">{label}</text>
          </g>
        );
      })}
      <text x="380" y="264" textAnchor="middle">practice with confidence</text>
    </>
  );
}

function GitNode({ x, y, fill = "#fffdf9", stroke = "#7aaa72", label }) {
  return (
    <>
      <circle cx={x} cy={y} r="20" fill={fill} stroke={stroke} strokeWidth="7" />
      {label && <text x={x} y={y + 52} textAnchor="middle">{label}</text>}
    </>
  );
}

function BranchingArt() {
  return (
    <>
      <path d="M100 190 C240 190 326 190 660 190" stroke="#7aaa72" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M230 190 C292 92 418 92 506 190" stroke="#9b8fd4" strokeWidth="9" fill="none" strokeLinecap="round" />
      {[100, 230, 380, 530, 660].map((x) => <GitNode key={x} x={x} y={190} />)}
      {[326, 430].map((x) => <GitNode key={x} x={x} y={104} stroke="#9b8fd4" />)}
      <text x="98" y="244">main</text><text x="320" y="64">feature branch</text>
    </>
  );
}

function MergingArt() {
  return (
    <>
      <path d="M96 205 C220 205 354 205 640 205" stroke="#7aaa72" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M188 205 C284 100 420 100 532 205" stroke="#d4848c" strokeWidth="9" fill="none" strokeLinecap="round" />
      {[96, 188, 330, 532, 640].map((x) => <GitNode key={x} x={x} y={205} />)}
      {[286, 410].map((x) => <GitNode key={x} x={x} y={112} stroke="#d4848c" />)}
      <circle cx="532" cy="205" r="34" fill="none" stroke="#9b8fd4" strokeWidth="4" strokeDasharray="8 8" />
      <text x="490" y="258">merge commit</text>
    </>
  );
}

function ForkingArt() {
  return (
    <>
      <rect x="110" y="92" width="190" height="132" rx="22" fill="#fffdf9" stroke="#9b8fd4" strokeWidth="6" />
      <rect x="460" y="92" width="190" height="132" rx="22" fill="#fffdf9" stroke="#7aaa72" strokeWidth="6" />
      <path d="M300 158 C360 116 404 116 460 158" stroke="#6aa8d4" strokeWidth="8" fill="none" strokeLinecap="round" markerEnd="url(#forkArrow)" />
      <defs><marker id="forkArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0 0 L8 3 L0 6 Z" fill="#6aa8d4" /></marker></defs>
      <text x="205" y="142" textAnchor="middle">upstream</text><text x="555" y="142" textAnchor="middle">your fork</text>
      <path d="M156 184 h98 M506 184 h98" stroke="#e8e0d4" strokeWidth="10" strokeLinecap="round" />
    </>
  );
}

function CommitsArt() {
  return (
    <>
      <path d="M126 158 H650" stroke="#7aaa72" strokeWidth="9" strokeLinecap="round" />
      {[126, 238, 350, 462, 574, 650].map((x, index) => <GitNode key={x} x={x} y={158} stroke={index % 2 ? "#9b8fd4" : "#7aaa72"} label={`c${index + 1}`} />)}
      <rect x="245" y="70" width="270" height="54" rx="16" fill="#fffdf9" stroke="#e8e0d4" />
      <text x="380" y="104" textAnchor="middle">clear checkpoint</text>
    </>
  );
}

function PullRequestArt() {
  return (
    <>
      <rect x="116" y="72" width="528" height="156" rx="24" fill="#fffdf9" stroke="#e8e0d4" />
      <path d="M174 150 H370" stroke="#7aaa72" strokeWidth="9" strokeLinecap="round" />
      <path d="M390 150 H588" stroke="#9b8fd4" strokeWidth="9" strokeLinecap="round" />
      <GitNode x="174" y="150" /><GitNode x="370" y="150" /><GitNode x="588" y="150" stroke="#9b8fd4" />
      <path d="M398 106 h128 M398 132 h162" stroke="#d7cde8" strokeWidth="10" strokeLinecap="round" />
      <circle cx="176" cy="98" r="12" fill="#d4848c" /><text x="206" y="104">review</text>
    </>
  );
}

function RebasingArt() {
  return (
    <>
      <path d="M104 212 H640" stroke="#7aaa72" strokeWidth="9" strokeLinecap="round" />
      {[104, 240, 376, 512, 640].map((x) => <GitNode key={x} x={x} y={212} />)}
      <path d="M238 86 C318 46 416 46 520 86" stroke="#9b8fd4" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="2 16" />
      <path d="M238 118 C338 156 420 156 520 118" stroke="#9b8fd4" strokeWidth="8" fill="none" strokeLinecap="round" />
      <GitNode x={238} y={86} stroke="#9b8fd4" /><GitNode x={378} y={64} stroke="#9b8fd4" /><GitNode x={520} y={86} stroke="#9b8fd4" />
      <text x="340" y="132">replay commits</text>
    </>
  );
}

function ConflictsArt() {
  return (
    <>
      <rect x="190" y="58" width="380" height="190" rx="20" fill="#fffdf9" stroke="#e8e0d4" />
      <path d="M230 108 h190 M230 148 h120 M230 188 h190" stroke="#7aaa72" strokeWidth="10" strokeLinecap="round" />
      <path d="M230 128 h240 M230 168 h170" stroke="#d4848c" strokeWidth="10" strokeLinecap="round" />
      <text x="464" y="130">&lt;&lt;&lt;</text><text x="464" y="170">===</text><text x="464" y="210">&gt;&gt;&gt;</text>
      <circle cx="570" cy="86" r="26" fill="#f5d5d8" /><text x="570" y="94" textAnchor="middle">!</text>
    </>
  );
}

function GitignoreArt() {
  return (
    <>
      <rect x="140" y="72" width="260" height="160" rx="20" fill="#fffdf9" stroke="#e8e0d4" />
      {["node_modules/", ".env", "dist/", "*.log"].map((line, index) => <text key={line} x="178" y={118 + index * 30}>{line}</text>)}
      <path d="M484 84 L642 216" stroke="#d4848c" strokeWidth="14" strokeLinecap="round" />
      <path d="M642 84 L484 216" stroke="#d4848c" strokeWidth="14" strokeLinecap="round" />
      <text x="270" y="262" textAnchor="middle">ignored before commit</text>
    </>
  );
}

function StashingArt() {
  return (
    <>
      <path d="M126 206 H624" stroke="#7aaa72" strokeWidth="9" strokeLinecap="round" />
      {[126, 270, 414, 624].map((x) => <GitNode key={x} x={x} y={206} />)}
      <rect x="292" y="70" width="176" height="86" rx="18" fill="#fffdf9" stroke="#9b8fd4" strokeWidth="6" />
      <path d="M326 110 h108 M326 132 h82" stroke="#d7cde8" strokeWidth="9" strokeLinecap="round" />
      <path d="M380 158 V206" stroke="#9b8fd4" strokeWidth="8" strokeLinecap="round" strokeDasharray="8 10" />
      <text x="380" y="54" textAnchor="middle">stash shelf</text>
    </>
  );
}

function CommitMessagesArt() {
  return (
    <>
      <rect x="154" y="66" width="452" height="166" rx="22" fill="#fffdf9" stroke="#e8e0d4" />
      <path d="M200 112 h214" stroke="#3d3530" strokeWidth="12" strokeLinecap="round" />
      <path d="M200 150 h330 M200 182 h286" stroke="#9b8fd4" strokeWidth="10" strokeLinecap="round" opacity="0.75" />
      <circle cx="542" cy="112" r="28" fill="#c8d8c4" />
      <path d="M528 112 l10 10 l20-24" stroke="#7aaa72" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="380" y="264" textAnchor="middle">subject + context</text>
    </>
  );
}

function OpenSourceArt() {
  return (
    <>
      <circle cx="202" cy="126" r="44" fill="#fffdf9" stroke="#7aaa72" strokeWidth="7" />
      <circle cx="380" cy="176" r="44" fill="#fffdf9" stroke="#9b8fd4" strokeWidth="7" />
      <circle cx="558" cy="126" r="44" fill="#fffdf9" stroke="#d4848c" strokeWidth="7" />
      <path d="M242 140 C292 162 318 170 336 176 M424 176 C472 158 500 146 518 136" stroke="#6aa8d4" strokeWidth="8" fill="none" strokeLinecap="round" />
      <text x="202" y="132" textAnchor="middle">issue</text><text x="380" y="182" textAnchor="middle">PR</text><text x="558" y="132" textAnchor="middle">review</text>
      <text x="380" y="250" textAnchor="middle">collaborate in the open</text>
    </>
  );
}

function LicencesArt() {
  return (
    <>
      <rect x="244" y="52" width="272" height="198" rx="20" fill="#fffdf9" stroke="#e8e0d4" />
      <path d="M304 112 h152 M304 148 h118 M304 184 h152" stroke="#c8a055" strokeWidth="10" strokeLinecap="round" />
      <circle cx="288" cy="112" r="8" fill="#7aaa72" /><circle cx="288" cy="148" r="8" fill="#7aaa72" /><circle cx="288" cy="184" r="8" fill="#7aaa72" />
      <path d="M418 52 v58 h58" fill="#f5e4c4" stroke="#e8e0d4" />
      <text x="380" y="278" textAnchor="middle">permissions made visible</text>
    </>
  );
}

export { LearnPage };
