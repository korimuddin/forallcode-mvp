import { useEffect, useState } from "react";
import { getUserPreference } from "./preferences";
import { reportGlobeSignIn } from "./reportGlobeSignIn";
import { getSessionIdentity, mapStoredRepository, syncGitHubActivity, syncGitHubReposToSupabase, supabase, upsertProfileFromSession } from "./supabase";

export function useAuthSession() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setChecked(true);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
      reportGlobeSignIn(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setChecked(true);
      if (event === "SIGNED_IN") {
        reportGlobeSignIn(nextSession);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, checked, loggedIn: Boolean(session) };
}

export function useSignedInUserData() {
  const { session, checked, loggedIn } = useAuthSession();
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUserData() {
      if (!checked) return;
      if (!session?.user?.id) {
        setProfile(null);
        setRepos([]);
        setActivity([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const impersonatingId = typeof window !== "undefined"
          ? window.sessionStorage.getItem("impersonating_user_id")
          : "";

        if (impersonatingId && supabase) {
          const { data: impersonatedProfile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", impersonatingId)
            .single();
          if (profileError) throw profileError;

          const { data: impersonatedRepos, error: reposError } = await supabase
            .from("repositories")
            .select("*")
            .eq("owner_id", impersonatingId)
            .order("updated_at", { ascending: false });
          if (reposError) throw reposError;

          if (!cancelled) {
            setProfile({
              username: impersonatedProfile.username,
              displayName: impersonatedProfile.display_name || impersonatedProfile.username,
              bio: impersonatedProfile.bio || "",
              pronouns: impersonatedProfile.pronouns || "",
              location: impersonatedProfile.location || "",
              website: impersonatedProfile.website || "",
              avatarStyle: impersonatedProfile.avatar_style || "sage",
              avatarUrl: impersonatedProfile.avatar_url || "",
              coverGradient: impersonatedProfile.cover_gradient || "",
              coverImageUrl: impersonatedProfile.cover_image_url || "",
              coverPositionX: impersonatedProfile.cover_position_x ?? 50,
              coverPositionY: impersonatedProfile.cover_position_y ?? 50,
              professionalTitle: impersonatedProfile.professional_title || "",
              skills: impersonatedProfile.skills || [],
              onboardingCompleted: impersonatedProfile.onboarding_completed,
              onboardingGoal: impersonatedProfile.onboarding_goal || "",
              gitComfortLevel: impersonatedProfile.git_comfort_level || "",
              impersonating: true
            });
            setRepos((impersonatedRepos || []).map((repo) => mapStoredRepository(repo, impersonatedProfile.username)));
            setActivity([]);
          }
          return;
        }

        const identity = getSessionIdentity(session);
        const localProfile = getUserPreference(session.user.id, "profile", null);
        setProfile({
          username: identity.username,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
          avatarStyle: "sage",
          ...localProfile
        });

        const storedProfile = await upsertProfileFromSession(session);
        if (!cancelled && storedProfile) {
          setProfile((current) => ({
            ...current,
            username: storedProfile.username || current?.username || identity.username,
            displayName: storedProfile.display_name || current?.displayName || identity.displayName,
            bio: storedProfile.bio || current?.bio || "",
            pronouns: storedProfile.pronouns || current?.pronouns || "",
            location: storedProfile.location || current?.location || "",
            website: storedProfile.website || current?.website || "",
            githubUrl: storedProfile.github_url || current?.githubUrl || "",
            twitterUrl: storedProfile.twitter_url || current?.twitterUrl || "",
            linkedinUrl: storedProfile.linkedin_url || current?.linkedinUrl || "",
            avatarStyle: storedProfile.avatar_style || current?.avatarStyle || "sage",
            avatarUrl: storedProfile.avatar_url || current?.avatarUrl || identity.avatarUrl,
            coverGradient: storedProfile.cover_gradient || current?.coverGradient || "",
            coverImageUrl: storedProfile.cover_image_url || current?.coverImageUrl || "",
            coverPositionX: storedProfile.cover_position_x ?? current?.coverPositionX ?? 50,
            coverPositionY: storedProfile.cover_position_y ?? current?.coverPositionY ?? 50,
            professionalTitle: storedProfile.professional_title || current?.professionalTitle || "",
            skills: storedProfile.skills || current?.skills || [],
            onboardingCompleted: storedProfile.onboarding_completed,
            onboardingGoal: storedProfile.onboarding_goal || current?.onboardingGoal || "",
            gitComfortLevel: storedProfile.git_comfort_level || current?.gitComfortLevel || ""
          }));
        }

        let nextRepos = [];
        let nextActivity = [];
        if (session.provider_token) {
          const [syncedRepos, syncedActivity] = await Promise.all([
            syncGitHubReposToSupabase(session),
            syncGitHubActivity(session).catch(() => [])
          ]);
          nextRepos = syncedRepos;
          nextActivity = syncedActivity;
        } else if (supabase) {
          const { data } = await supabase
            .from("repositories")
            .select("*")
            .eq("owner_id", session.user.id)
            .order("updated_at", { ascending: false });

          nextRepos = (data || []).map((repo) => mapStoredRepository(repo, storedProfile?.username || identity.username));
        }

        if (!cancelled) setRepos(nextRepos);
        if (!cancelled) setActivity(nextActivity);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Could not load your GitHub data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUserData();
    return () => {
      cancelled = true;
    };
  }, [checked, session]);

  return { session, checked, loggedIn, profile, repos, activity, loading, error };
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  ));

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return isMobile;
}

export function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return undefined;
    const previousTitle = document.title;
    document.title = title.includes("ForAllCode") ? title : `${title} · ForAllCode`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
