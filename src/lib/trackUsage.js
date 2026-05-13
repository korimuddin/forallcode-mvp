import { supabase } from "./supabase";

export async function trackUsage(userId, eventType, metadata = {}) {
  if (!supabase || !userId) return;
  await supabase.from("usage_events").insert({ user_id: userId, event_type: eventType, metadata });
}
