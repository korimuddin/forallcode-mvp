import { supabase } from "./supabase";

const recent = new Map();

export async function reportError(error, info = {}) {
  if (!supabase) return;
  const message = String(error?.message || "Unexpected application error").slice(0, 500);
  const now = Date.now();
  if (now - (recent.get(message) || 0) < 60_000) return;
  recent.set(message, now);
  if (recent.size > 50) recent.delete(recent.keys().next().value);
  try {
    const { data } = await supabase.auth.getSession();
    await supabase.from("error_log").insert({
      user_id: data?.session?.user?.id || null,
      error_message: message,
      error_stack: String(info.componentStack || error?.stack || "").slice(0, 2000),
      page_path: window.location.pathname
    });
  } catch {
    // Telemetry failures must not recurse into the global rejection handler.
  }
}
