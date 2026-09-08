import { supabase } from "./supabase";

export async function functionFetch(url, options = {}) {
  const { data, error } = supabase ? await supabase.auth.getSession() : { data: null };
  if (error || !data?.session?.access_token) throw new Error("Sign in to continue.");
  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${data.session.access_token}` }
  });
}
