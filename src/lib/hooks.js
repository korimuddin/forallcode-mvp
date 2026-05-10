import { useEffect, useState } from "react";
import { getSessionIdentity, syncGitHubReposToSupabase, supabase, upsertProfileFromSession } from "./supabase";

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
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setChecked(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, checked, loggedIn: Boolean(session) };
}

export function useSignedInUserData() {
  const { session, checked, loggedIn } = useAuthSession();
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUserData() {
      if (!checked) return;
      if (!session?.user?.id) {
        setProfile(null);
        setRepos([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const identity = getSessionIdentity(session);
        setProfile({
          username: identity.username,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
          avatarStyle: "sage"
        });

        const storedProfile = await upsertProfileFromSession(session);
        if (!cancelled && storedProfile) {
          setProfile((current) => ({
            ...current,
            username: storedProfile.username || current?.username || identity.username,
            displayName: storedProfile.display_name || current?.displayName || identity.displayName,
            avatarStyle: storedProfile.avatar_style || current?.avatarStyle || "sage"
          }));
        }

        let nextRepos = [];
        if (session.provider_token) {
          nextRepos = await syncGitHubReposToSupabase(session);
        } else if (supabase) {
          const { data } = await supabase
            .from("repositories")
            .select("*")
            .eq("owner_id", session.user.id)
            .order("updated_at", { ascending: false });

          nextRepos = (data || []).map((repo) => ({
            githubRepoId: repo.github_repo_id,
            name: repo.name,
            owner: storedProfile?.username || identity.username,
            description: repo.description || "No description yet.",
            language: repo.language || "Code",
            private: Boolean(repo.is_private),
            stars: repo.stars_count || 0,
            forks: repo.forks_count || 0,
            updated: "Recently",
            updatedAt: repo.updated_at,
            createdAt: repo.created_at,
            pinned: false,
            topic: "repo",
            landing: false
          }));
        }

        if (!cancelled) setRepos(nextRepos);
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

  return { session, checked, loggedIn, profile, repos, loading, error };
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
