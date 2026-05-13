import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

export function permissionsForRole(role) {
  return {
    isOwner: role === "owner",
    isMaintainer: role === "owner" || role === "maintainer",
    isContributor: role !== null,
    canPush: role === "owner" || role === "maintainer" || role === "contributor",
    canManageRepo: role === "owner",
    canMerge: role === "owner" || role === "maintainer"
  };
}

export function useRepoAccess(repoId, ownerId) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadAccess() {
      setLoading(true);
      setError("");

      if (!supabase) {
        if (!alive) return;
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      const currentUser = userData?.user || null;

      if (!alive) return;
      setUser(currentUser);

      if (userError || !currentUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      if (ownerId && currentUser.id === ownerId) {
        setRole("owner");
        setLoading(false);
        return;
      }

      if (!repoId) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error: accessError } = await supabase
        .from("collaborators")
        .select("role")
        .eq("repo_id", repoId)
        .eq("user_id", currentUser.id)
        .eq("status", "accepted")
        .maybeSingle();

      if (!alive) return;
      if (accessError) {
        setError(accessError.message);
        setRole(null);
      } else {
        setRole(data?.role || null);
      }
      setLoading(false);
    }

    loadAccess();

    if (!supabase) {
      return () => {
        alive = false;
      };
    }

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadAccess();
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [ownerId, repoId]);

  const permissions = useMemo(() => permissionsForRole(role), [role]);

  return {
    user,
    role,
    loading,
    error,
    ...permissions
  };
}
