import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, GitFork, Home, Lock, Palette, Settings, Star } from "lucide-react";
import IllustratedAvatar, { avatarVariants } from "../components/ui/IllustratedAvatar";
import { useDocumentTitle, useSignedInUserData } from "../lib/hooks";
import { createFeedEvent } from "../lib/createFeedEvent";
import { createNotification } from "../lib/notifications";
import { setUserPreference } from "../lib/preferences";
import { getCurrentSession, supabase, uploadProfileVisualImage } from "../lib/supabase";
import { PageFrame, Workspace, compressHeroImageToBlob, clamp, Button, RepoListSkeleton, Card, normalizeRepoHero, repoToHero, heroFontOptions, LanguagePill, Badge } from "./PageShared";

const currentUser = {
  username: "",
  name: "",
  pronouns: "",
  bio: "",
  location: "",
  email: "",
  website: "",
  joinDate: "March 2026",
  followers: 0,
  following: 0,
  stars: 0,
  repos: 0,
  avatarStyle: "sage"
};

function MyProfilePage() {
  useDocumentTitle("Profile");
  const { profile, repos: userRepos, loading } = useSignedInUserData();
  const visibleRepos = userRepos.length > 0 ? userRepos : [];
  return (
    <PageFrame>
      <ProfileHeader editable profileData={profile} repoCount={userRepos.length} />
      {profile?.username && <ProfilePortfolioActions username={profile.username} editable />}
      <Workspace compact />
      <div className="two-column">
        <PaginatedProfileRepos
          actions
          emptyText="Sign in with GitHub repo access to fill this profile with your repositories."
          emptyTitle="No synced repos yet"
          loading={loading}
          repos={visibleRepos}
        />
        <aside><ActivityCalendar /><RecentChanges repos={visibleRepos} /></aside>
      </div>
    </PageFrame>
  );
}

function PublicProfile() {
  const { username } = useParams();
  useDocumentTitle(`${username}`);
  const { profile, repos: userRepos, activity } = useSignedInUserData();
  const isOwnProfile = username === profile?.username;
  const profileRepos = isOwnProfile ? userRepos : [];
  return (
    <PageFrame title={isOwnProfile ? profile.displayName : username} eyebrow={`@${username}`}>
      <ProfileHeader publicView profileData={isOwnProfile ? profile : { username, displayName: username }} repoCount={profileRepos.length} />
      <ProfilePortfolioActions username={username} editable={isOwnProfile} />
      <SectionTitle title="Repositories" />
      <PaginatedProfileRepos
        emptyText="Public repositories will appear here once they are synced."
        emptyTitle="No public GitHub repos yet"
        repos={profileRepos.map((repo) => ({ ...repo, owner: repo.owner || username }))}
      />
      <div className="two-column">
        <Card><h3>Public activity</h3>{activity.map((item) => <p key={item.id}>{item.name} {item.action}</p>)}{activity.length === 0 && <p>No public GitHub activity synced yet.</p>}</Card>
        <Card><h3>Skills and badges</h3><div className="tag-row">{["Git mentoring", "TypeScript", "Design systems", "Open source guide"].map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></Card>
      </div>
    </PageFrame>
  );
}

function ProfilePortfolioActions({ editable = false, username }) {
  if (!username) return null;
  return (
    <div className="profile-portfolio-actions" role="navigation" aria-label="Profile views">
      <Link className="profile-portfolio-tab" to={`/${username}/portfolio`}>Portfolio</Link>
      {editable && <Link className="button soft" to={`/${username}/portfolio?edit=1`}>Edit portfolio</Link>}
    </div>
  );
}

function PaginatedProfileRepos({ actions = false, emptyText, emptyTitle, loading = false, repos = [] }) {
  const [page, setPage] = useState(1);
  const reposPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(repos.length / reposPerPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * reposPerPage;
  const visibleRepos = repos.slice(start, start + reposPerPage);
  const pageItems = getPaginationItems(currentPage, totalPages);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (loading) {
    return (
      <section>
        <RepoListSkeleton />
      </section>
    );
  }

  return (
    <section className="profile-repos-section">
      {visibleRepos.length > 0 ? (
        <div className="profile-repo-list">
          {visibleRepos.map((repo) => <RepoCard key={`${repo.owner}-${repo.name}`} repo={repo} actions={actions} />)}
        </div>
      ) : (
        <Card><h3>{emptyTitle}</h3><p>{emptyText}</p></Card>
      )}
      {repos.length > reposPerPage && (
        <nav className="profile-pagination" aria-label="Repository pages">
          <button
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            type="button"
          >
            &larr;
          </button>
          {pageItems.map((item, index) => item === "ellipsis" ? (
            <span className="profile-pagination-ellipsis" key={`ellipsis-${index}`}>...</span>
          ) : (
            <button
              aria-current={item === currentPage ? "page" : undefined}
              className={item === currentPage ? "active" : ""}
              key={item}
              onClick={() => setPage(item)}
              type="button"
            >
              {item}
            </button>
          ))}
          <button
            aria-label="Next page"
            disabled={currentPage === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            type="button"
          >
            &rarr;
          </button>
        </nav>
      )}
    </section>
  );
}

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sorted = [...pages]
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b);
  const items = [];

  sorted.forEach((item, index) => {
    const previous = sorted[index - 1];
    if (previous && item - previous > 1) items.push("ellipsis");
    items.push(item);
  });

  return items;
}

function RepoCard({ repo, actions = false }) {
  const hero = normalizeRepoHero(repoToHero(repo), repo.name);

  async function handleStarClick() {
    if (!supabase) return;
    const session = await getCurrentSession();
    if (!session?.user?.id) return;
    const { data: repository } = await supabase
      .from("repositories")
      .select("id, owner_id, is_private, name")
      .eq("name", repo.name)
      .maybeSingle();
    const { data: actor } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle();
    if (repository?.id && !repository.is_private) {
      createFeedEvent(supabase, {
        actorId: session.user.id,
        eventType: "repo_starred",
        repoId: repository.id,
        metadata: { repo_name: repository.name || repo.name }
      }).catch(() => {});
    }
    if (!repository?.owner_id || repository.owner_id === session.user.id) return;
    await createNotification(supabase, {
      userId: repository.owner_id,
      type: "star",
      actorId: session.user.id,
      repoId: repository.id,
      message: `${actor?.display_name || "Someone"} starred your repo ${repo.name}`
    });
  }

  return (
    <Card>
      {hero.image && (
        <div className="repo-card-hero" style={{
          backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .72), rgba(20, 16, 14, .2)), url("${hero.image}")`,
          backgroundPosition: `${hero.positionX ?? 50}% ${hero.positionY ?? 50}%`
        }}>
          <span style={{ fontFamily: hero.fontFamily || heroFontOptions[0].value }}>{hero.title || repo.name}</span>
        </div>
      )}
      <div className="repo-card-head"><h3><Link to={`/${repo.owner}/${repo.name}`}>{repo.name}</Link></h3>{repo.private && <Lock size={15} />}</div>
      <p>{repo.description}</p>
      <div className="repo-meta"><LanguagePill language={repo.language} /><span><Star size={14} />{repo.stars}</span><span><GitFork size={14} />{repo.forks}</span><span>{repo.updated}</span></div>
      {actions && <div className="card-actions"><Button variant="soft"><Home size={15} />Pin</Button><Button variant="soft" onClick={handleStarClick}><Star size={15} />Star</Button><Button to={`/${repo.owner}/${repo.name}/readme`} variant="soft">README</Button><Button to={`/${repo.owner}/${repo.name}/landing`} variant="soft">Landing</Button><Button variant="soft"><Settings size={15} /></Button></div>}
    </Card>
  );
}

function Avatar({ photoUrl = "", size = "normal", variant = currentUser.avatarStyle }) {
  const sizes = { tiny: 28, normal: 44, large: 112 };
  return <span className={`avatar ${size}`}><IllustratedAvatar photoUrl={photoUrl} size={sizes[size] || sizes.normal} variant={variant} /></span>;
}

function ProfileHeader({ editable = false, publicView = false, profileData = null }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(() => profileDraftFromData(profileData));
  const [uploading, setUploading] = useState("");
  const [status, setStatus] = useState("");
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [bioMenuOpen, setBioMenuOpen] = useState(false);
  const coverPositionerRef = useRef(null);
  const quickAvatarInputRef = useRef(null);
  const displayName = profileData?.displayName || currentUser.name;
  const username = profileData?.username || currentUser.username;
  const avatarStyle = profileData?.avatarStyle || currentUser.avatarStyle;
  const avatarUrl = profileData?.avatarUrl || "";
  const [quickAvatarUrl, setQuickAvatarUrl] = useState(avatarUrl);
  const coverGradient = profileData?.coverGradient || "linear-gradient(120deg, var(--lavender), var(--rose), var(--sage))";
  const coverImageUrl = profileData?.coverImageUrl || "";
  const coverPositionX = profileData?.coverPositionX ?? 50;
  const coverPositionY = profileData?.coverPositionY ?? 50;
  const pronouns = profileData?.pronouns || currentUser.pronouns;
  const bio = profileData?.bio || currentUser.bio;
  const location = profileData?.location || currentUser.location;
  const website = profileData?.website || currentUser.website;
  const profileLinks = [
    { label: "Website", value: website },
    { label: "GitHub", value: profileData?.githubUrl || "" },
    { label: "Twitter/X", value: profileData?.twitterUrl || "" },
    { label: "LinkedIn", value: profileData?.linkedinUrl || "" }
  ].filter((item) => item.value);

  useEffect(() => {
    setDraft(profileDraftFromData(profileData));
  }, [profileData]);

  useEffect(() => {
    setQuickAvatarUrl(avatarUrl);
  }, [avatarUrl]);

  async function handleProfileImageUpload(event, kind) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(kind);
    setStatus("");

    try {
      const session = await getCurrentSession();
      const imageBlob = await compressHeroImageToBlob(file);
      const imageUrl = await uploadProfileVisualImage(session, kind, imageBlob);
      setDraft((current) => ({
        ...current,
        [kind === "avatar" ? "avatarUrl" : "coverImageUrl"]: imageUrl,
        coverPositionX: current.coverPositionX ?? 50,
        coverPositionY: current.coverPositionY ?? 50
      }));
      setStatus(`${kind === "avatar" ? "Profile picture" : "Cover image"} uploaded.`);
    } catch (error) {
      setStatus(error.message || "Could not upload this image.");
    } finally {
      setUploading("");
      event.target.value = "";
    }
  }

  async function handleQuickAvatarUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading("avatar");
    setStatus("");

    try {
      const session = await getCurrentSession();
      if (!session?.user?.id || !supabase) throw new Error("Sign in before updating your profile picture.");
      const imageBlob = await compressHeroImageToBlob(file);
      const imageUrl = await uploadProfileVisualImage(session, "avatar", imageBlob);
      await supabase.from("profiles").update({ avatar_url: imageUrl }).eq("id", session.user.id);
      setQuickAvatarUrl(imageUrl);
      setDraft((current) => ({ ...current, avatarUrl: imageUrl }));
      setStatus("Profile picture saved.");
    } catch (error) {
      setStatus(error.message || "Could not update your profile picture.");
    } finally {
      setUploading("");
      event.target.value = "";
    }
  }

  function moveProfileCover(event) {
    if (event.type === "pointermove" && event.buttons !== 1) return;
    const bounds = coverPositionerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const positionX = clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100);
    const positionY = clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100);
    setDraft((current) => ({ ...current, coverPositionX: positionX, coverPositionY: positionY }));
  }

  async function saveProfileDraft() {
    setUploading("saving");
    setStatus("");

    try {
      const session = await getCurrentSession();
      if (!session?.user?.id || !supabase) throw new Error("Sign in before saving profile changes.");
      await supabase.from("profiles").update({
        display_name: draft.displayName,
        bio: draft.bio,
        pronouns: draft.pronouns,
        location: draft.location,
        website: draft.website,
        avatar_style: draft.avatarStyle,
        avatar_url: draft.avatarUrl,
        cover_gradient: draft.coverGradient,
        cover_image_url: draft.coverImageUrl,
        cover_position_x: draft.coverPositionX ?? 50,
        cover_position_y: draft.coverPositionY ?? 50
      }).eq("id", session.user.id);
      setUserPreference(session.user.id, "profile", {
        displayName: draft.displayName,
        bio: draft.bio,
        pronouns: draft.pronouns,
        location: draft.location,
        website: draft.website,
        avatarStyle: draft.avatarStyle,
        avatarUrl: draft.avatarUrl,
        coverGradient: draft.coverGradient,
        coverImageUrl: draft.coverImageUrl,
        coverPositionX: draft.coverPositionX,
        coverPositionY: draft.coverPositionY
      });
      setStatus("Profile saved.");
      setEditorOpen(false);
      window.location.reload();
    } catch (error) {
      setStatus(error.message || "Could not save your profile.");
    } finally {
      setUploading("");
    }
  }

  async function handleFollow() {
    if (!supabase) return;
    const session = await getCurrentSession();
    if (!session?.user?.id) return;
    const { data: followedUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", currentUser.username)
      .maybeSingle();
    const { data: actor } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle();
    if (!followedUser?.id || followedUser.id === session.user.id) return;
    await createNotification(supabase, {
      userId: followedUser.id,
      type: "follow",
      actorId: session.user.id,
      message: `${actor?.display_name || "Someone"} followed you`
    });
  }

  return (
    <section className="profile-header">
      <div
        className={coverImageUrl ? "cover has-cover-image" : "cover"}
        style={coverImageUrl ? {
          backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .56), rgba(20, 16, 14, .08)), url("${coverImageUrl}")`,
          backgroundPosition: `${coverPositionX}% ${coverPositionY}%`
        } : { background: coverGradient }}
      />
      <div className="profile-content">
        <div className="profile-avatar-card">
          <button className="profile-avatar-preview-trigger" onClick={() => setAvatarPreviewOpen(true)} type="button" aria-label="View larger profile picture">
            <Avatar photoUrl={quickAvatarUrl} size="large" variant={avatarStyle} />
          </button>
          {editable && (
            <>
              <button
                aria-label="Edit profile picture"
                className="profile-avatar-edit"
                disabled={uploading === "avatar"}
                onClick={() => quickAvatarInputRef.current?.click()}
                type="button"
              >
                <Palette size={16} />
              </button>
              <input accept="image/*" hidden onChange={handleQuickAvatarUpload} ref={quickAvatarInputRef} type="file" />
            </>
          )}
        </div>
        <div className="profile-info-panel">
          <div className="profile-title-block">
            <h2>{displayName}</h2>
            <p>@{username}{pronouns ? ` - ${pronouns}` : ""}</p>
          </div>
          <div className="profile-details">
            {bio && <p className="profile-bio-summary">{bio}</p>}
            <p>{[location, `Joined ${currentUser.joinDate}`].filter(Boolean).join(" - ")}</p>
            {status && <small>{status}</small>}
          </div>
          <div className="profile-actions">{editable && <Button onClick={() => setEditorOpen(true)}>Edit profile</Button>}{publicView && <Button onClick={handleFollow}>Follow</Button>}<Button variant="soft">Message</Button></div>
          <button className="profile-bio-toggle" onClick={() => setBioMenuOpen((open) => !open)} type="button" aria-label="Toggle profile details" aria-expanded={bioMenuOpen}>
            <ChevronDown size={18} />
          </button>
          {bioMenuOpen && (
            <div className="profile-bio-menu">
              {bio && <p>{bio}</p>}
              {location && <p><strong>Location</strong><span>{location}</span></p>}
              <p><strong>Joined</strong><span>{currentUser.joinDate}</span></p>
              {profileLinks.length > 0 && (
                <div className="profile-bio-links">
                  {profileLinks.map((link) => (
                    <a href={ensureProfileUrl(link.value)} key={link.label} target="_blank" rel="noreferrer">{link.label}</a>
                  ))}
                </div>
              )}
              <button className="profile-bio-toggle profile-bio-toggle-expanded" onClick={() => setBioMenuOpen(false)} type="button" aria-label="Close profile details" aria-expanded="true">
                <ChevronDown size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
      {avatarPreviewOpen && (
        <div className="repo-hero-modal-backdrop" onClick={() => setAvatarPreviewOpen(false)}>
          <div className="profile-avatar-lightbox" role="dialog" aria-modal="true" aria-label="Profile picture preview" onClick={(event) => event.stopPropagation()}>
            <button className="profile-avatar-lightbox-close" onClick={() => setAvatarPreviewOpen(false)} type="button" aria-label="Close profile picture preview">×</button>
            <Avatar photoUrl={quickAvatarUrl} size="large" variant={avatarStyle} />
          </div>
        </div>
      )}
      {editorOpen && (
        <div className="repo-hero-modal-backdrop" onClick={() => setEditorOpen(false)}>
          <div className="repo-hero-editor profile-editor-modal" role="dialog" aria-modal="true" aria-label="Edit profile" onClick={(event) => event.stopPropagation()}>
            <div className="profile-editor-preview">
              <div
                className="profile-editor-cover-preview"
                style={draft.coverImageUrl ? {
                  backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .56), rgba(20, 16, 14, .08)), url("${draft.coverImageUrl}")`,
                  backgroundPosition: `${draft.coverPositionX ?? 50}% ${draft.coverPositionY ?? 50}%`
                } : { background: draft.coverGradient }}
              />
              <Avatar photoUrl={draft.avatarUrl} size="large" variant={draft.avatarStyle} />
            </div>
            <div className="profile-editor-grid">
              <label>
                Display name
                <input value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} />
              </label>
              <label>
                Pronouns
                <input value={draft.pronouns} onChange={(event) => setDraft({ ...draft, pronouns: event.target.value })} placeholder="e.g. they/them" />
              </label>
            </div>
            <label>
              Bio
              <textarea value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} maxLength={160} />
            </label>
            <div className="profile-editor-grid">
              <label>
                Location
                <input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
              </label>
              <label>
                Website
                <input value={draft.website} onChange={(event) => setDraft({ ...draft, website: event.target.value })} />
              </label>
            </div>
            <label>
              Profile picture
              <input accept="image/*" type="file" onChange={(event) => handleProfileImageUpload(event, "avatar")} disabled={Boolean(uploading)} />
            </label>
            <div className="avatar-picker profile-avatar-picker">
              {avatarVariants.map((variant) => (
                <button className={draft.avatarStyle === variant ? "active" : ""} key={variant} onClick={() => setDraft({ ...draft, avatarStyle: variant })} type="button">
                  <IllustratedAvatar size={38} variant={variant} />
                </button>
              ))}
            </div>
            <label>
              Cover image
              <input accept="image/*" type="file" onChange={(event) => handleProfileImageUpload(event, "cover")} disabled={Boolean(uploading)} />
            </label>
            <div className="profile-cover-swatches">
              {profileCoverOptions.map((cover) => (
                <button className={draft.coverGradient === cover ? "active" : ""} key={cover} onClick={() => setDraft({ ...draft, coverGradient: cover, coverImageUrl: "" })} style={{ background: cover }} type="button" />
              ))}
            </div>
            {draft.coverImageUrl && (
              <div className="repo-hero-position-field">
                <span>Cover image position</span>
                <div
                  className="repo-hero-positioner"
                  onPointerDown={moveProfileCover}
                  onPointerMove={moveProfileCover}
                  ref={coverPositionerRef}
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(20, 16, 14, .62), rgba(20, 16, 14, .1)), url("${draft.coverImageUrl}")`,
                    backgroundPosition: `${draft.coverPositionX ?? 50}% ${draft.coverPositionY ?? 50}%`
                  }}
                >
                  <strong style={{ left: `${draft.coverPositionX ?? 50}%`, top: `${draft.coverPositionY ?? 50}%` }} />
                </div>
              </div>
            )}
            {status && <p className="repo-hero-toast" role="status">{status}</p>}
            <div className="repo-hero-editor-actions">
              <Button variant="soft" onClick={() => setEditorOpen(false)} disabled={Boolean(uploading)}>Cancel</Button>
              <Button onClick={saveProfileDraft} disabled={Boolean(uploading)}>{uploading === "saving" ? "Saving..." : "Save profile"}</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function profileDraftFromData(profileData = {}) {
  return {
    displayName: profileData?.displayName || currentUser.name,
    pronouns: profileData?.pronouns || "",
    bio: profileData?.bio || "",
    location: profileData?.location || "",
    website: profileData?.website || "",
    avatarStyle: profileData?.avatarStyle || "sage",
    avatarUrl: profileData?.avatarUrl || "",
    coverGradient: profileData?.coverGradient || "linear-gradient(120deg, var(--lavender), var(--rose), var(--sage))",
    coverImageUrl: profileData?.coverImageUrl || "",
    coverPositionX: profileData?.coverPositionX ?? 50,
    coverPositionY: profileData?.coverPositionY ?? 50
  };
}

function ensureProfileUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "#";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

const profileCoverOptions = [
  "linear-gradient(120deg, var(--lavender), var(--rose), var(--sage))",
  "linear-gradient(120deg, var(--sky), var(--lavender), var(--white))",
  "linear-gradient(120deg, var(--sage), var(--amber), var(--white))",
  "linear-gradient(120deg, var(--rose), var(--amber), var(--lavender))",
  "linear-gradient(120deg, var(--cream3), var(--sky), var(--sage))",
  "linear-gradient(120deg, var(--ink2), var(--lavender3), var(--sky))"
];

function SectionTitle({ title }) {
  return <div className="section-title"><h2>{title}</h2></div>;
}

function ActivityCalendar() {
  return <Card><h3>Activity calendar</h3><div className="calendar-grid">{Array.from({ length: 35 }).map((_, index) => <span key={index} className={`level-${index % 5}`} />)}</div></Card>;
}

function RecentChanges({ repos: recentRepos = [] }) {
  return (
    <Card>
      <h3>Recent changes</h3>
      {recentRepos.map((repo) => <p key={repo.name}>{repo.name}: updated {repo.updated}</p>)}
      {recentRepos.length === 0 && <p>No GitHub repo changes synced yet.</p>}
    </Card>
  );
}

export { MyProfilePage, PublicProfile };
