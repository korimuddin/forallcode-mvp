import { useEffect, useRef, useState } from "react";
import SettingsInput from "../../components/settings/SettingsInput";
import SettingsSection from "../../components/settings/SettingsSection";
import { SettingsActions, SettingsPageHeader, SettingsSaveButton, SettingsSwatches } from "../../components/settings/SettingsControls";
import IllustratedAvatar, { avatarVariants } from "../../components/ui/IllustratedAvatar";
import { getUserPreference, setUserPreference } from "../../lib/preferences";
import { supabase } from "../../lib/supabase";

const gradients = [
  "linear-gradient(135deg, #ddd5f0, #c8d8c4, #cce0f0)",
  "linear-gradient(135deg, #f5d5d8, #f5e4c4)",
  "linear-gradient(135deg, #cce0f0, #ddd5f0)",
  "linear-gradient(135deg, #c8d8c4, #f5e4c4)",
  "linear-gradient(135deg, #f5e4c4, #f5d5d8)",
  "linear-gradient(135deg, #ddd5f0, #f5d5d8)"
];

const gradientOptions = gradients.map((colour, index) => ({
  label: `Gradient ${index + 1}`,
  value: colour,
  colour
}));

const initialProfile = {
  displayName: "",
  username: "",
  bio: "",
  pronouns: "",
  location: "",
  website: "",
  github: "",
  twitter: "",
  linkedin: "",
  avatarStyle: "sage",
  avatarUrl: "",
  cover: gradients[0]
};

export default function SettingsProfile() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(initialProfile);
  const [status, setStatus] = useState("default");
  const [pickerOpen, setPickerOpen] = useState(false);
  const uploadRef = useRef(null);
  const coverUploadRef = useRef(null);

  useEffect(() => {
    async function loadProfile() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const nextSession = data.session;
      setSession(nextSession);
      if (!nextSession?.user?.id) return;
      const metadata = nextSession.user.user_metadata || {};
      const metadataProfile = {
        displayName: metadata.full_name || metadata.name || metadata.user_name || "",
        username: metadata.user_name || metadata.preferred_username || "",
        github: metadata.user_name ? `https://github.com/${metadata.user_name}` : ""
      };
      const localProfile = getUserPreference(nextSession.user.id, "profile", null);

      setProfile((current) => ({
        ...current,
        ...metadataProfile,
        ...localProfile
      }));

      const { data: storedProfile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", nextSession.user.id)
        .maybeSingle();

      if (storedProfile && !localProfile && !error) {
        setProfile((current) => ({
          ...current,
          displayName: storedProfile.display_name || current.displayName,
          username: storedProfile.username || current.username,
          bio: storedProfile.bio || current.bio,
          pronouns: storedProfile.pronouns || current.pronouns,
          location: storedProfile.location || current.location,
          website: storedProfile.website || current.website,
          avatarStyle: storedProfile.avatar_style || current.avatarStyle,
          cover: storedProfile.cover_gradient || current.cover,
          github: storedProfile.github_url || current.github,
          twitter: storedProfile.twitter_url || current.twitter,
          linkedin: storedProfile.linkedin_url || current.linkedin
        }));
      }
    }

    loadProfile();
  }, []);

  function updateProfile(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function handleImagePreview(event, key) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateProfile(key, String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setStatus("saving");
    if (session?.user?.id) setUserPreference(session.user.id, "profile", profile);
    if (supabase && session?.user?.id) {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          display_name: profile.displayName,
          username: profile.username,
          bio: profile.bio,
          pronouns: profile.pronouns,
          location: profile.location,
          website: profile.website,
          avatar_style: profile.avatarStyle,
          cover_gradient: profile.cover,
          github_url: profile.github,
          twitter_url: profile.twitter,
          linkedin_url: profile.linkedin
        }, { onConflict: "id" });
      if (error) console.warn("Could not sync profile settings to Supabase.", error);
    }
    setStatus("saved");
    setTimeout(() => setStatus("default"), 1800);
  }

  return (
    <div className="settings-tab">
      <SettingsPageHeader title="Profile" subtitle="This is how others see you on ForAllCode." />

      <SettingsSection title="Avatar">
        <div className="settings-avatar-row">
          <IllustratedAvatar size={80} variant={profile.avatarStyle} photoUrl={profile.avatarUrl} />
          <div className="settings-button-row">
            <button className="settings-ghost" onClick={() => uploadRef.current?.click()} type="button">Upload photo</button>
            <button className="settings-ghost" onClick={() => setPickerOpen((open) => !open)} type="button">Choose character</button>
            <input accept="image/*" hidden onChange={(event) => handleImagePreview(event, "avatarUrl")} ref={uploadRef} type="file" />
          </div>
        </div>
        {pickerOpen && (
          <>
            <div className="settings-avatar-picker">
              {avatarVariants.map((variant) => (
                <button className={profile.avatarStyle === variant ? "active" : ""} key={variant} onClick={() => updateProfile("avatarStyle", variant)} type="button">
                  <IllustratedAvatar size={64} variant={variant} />
                </button>
              ))}
            </div>
            <div className="settings-actions inline">
              <SettingsSaveButton status={status} onClick={handleSave}>Use this avatar</SettingsSaveButton>
            </div>
          </>
        )}
      </SettingsSection>

      <SettingsSection title="Cover image">
        <div className="settings-cover-preview" style={{ background: profile.cover }} />
        <div className="settings-button-row">
          <button className="settings-ghost" onClick={() => coverUploadRef.current?.click()} type="button">Upload image</button>
          <input accept="image/*" hidden onChange={(event) => handleImagePreview(event, "cover")} ref={coverUploadRef} type="file" />
          <SettingsSwatches value={profile.cover} options={gradientOptions} onChange={(value) => updateProfile("cover", value)} />
        </div>
      </SettingsSection>

      <SettingsSection title="Basic info">
        <div className="settings-fields">
          <SettingsInput label="Display name" value={profile.displayName} onChange={(value) => updateProfile("displayName", value)} />
          <SettingsInput label="Username" value={profile.username} onChange={(value) => updateProfile("username", value)} helpText={`forallcode.dev/${profile.username || "username"}`} />
        </div>
        <SettingsInput label="Bio" value={profile.bio} onChange={(value) => updateProfile("bio", value)} maxLength={160} multiline helpText={`${profile.bio.length}/160 characters`} />
        <div className="settings-fields">
          <SettingsInput label="Pronouns" value={profile.pronouns} onChange={(value) => updateProfile("pronouns", value)} placeholder="e.g. she/her, they/them" />
          <SettingsInput label="Location" value={profile.location} onChange={(value) => updateProfile("location", value)} placeholder="Edinburgh, Scotland" />
        </div>
        <SettingsInput label="Website" value={profile.website} onChange={(value) => updateProfile("website", value)} placeholder="https://yoursite.com" />
      </SettingsSection>

      <SettingsSection title="Social links">
        <SettingsInput label="GitHub" value={profile.github} onChange={(value) => updateProfile("github", value)} placeholder="https://github.com/username" />
        <SettingsInput label="Twitter/X" value={profile.twitter} onChange={(value) => updateProfile("twitter", value)} placeholder="https://twitter.com/username" />
        <SettingsInput label="LinkedIn" value={profile.linkedin} onChange={(value) => updateProfile("linkedin", value)} placeholder="https://linkedin.com/in/username" />
      </SettingsSection>

      <SettingsSection title="Profile preview">
        <div className="settings-profile-preview">
          <div className="settings-profile-cover" style={{ background: profile.cover }} />
          <div className="settings-profile-preview-body">
            <IllustratedAvatar size={70} variant={profile.avatarStyle} photoUrl={profile.avatarUrl} />
            <h3>{profile.displayName || "Your name"}</h3>
            <span>@{profile.username || "username"}</span>
            <p>{profile.bio || "Your bio will appear here."}</p>
          </div>
        </div>
        <SettingsActions><SettingsSaveButton status={status} onClick={handleSave} /></SettingsActions>
      </SettingsSection>
    </div>
  );
}
