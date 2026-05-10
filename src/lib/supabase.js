import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function signInWithGitHub() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  return supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes: "repo user:email",
      redirectTo: `${window.location.origin}/dashboard`
    }
  });
}

export async function syncGitHubRepos(githubAccessToken) {
  const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
    headers: { Authorization: `Bearer ${githubAccessToken}` }
  });

  if (!response.ok) {
    throw new Error("Could not sync GitHub repositories.");
  }

  return response.json();
}
