import { supabase } from "./supabase";

export async function createFeedEvent(supabaseClient = supabase, {
  actorId,
  eventType,
  repoId = null,
  issueId = null,
  prId = null,
  discussionId = null,
  metadata = {}
} = {}) {
  if (!supabaseClient || !actorId || !eventType) return { error: null };

  return supabaseClient.from("feed_events").insert({
    actor_id: actorId,
    event_type: eventType,
    repo_id: repoId,
    issue_id: issueId,
    pr_id: prId,
    discussion_id: discussionId,
    metadata
  });
}
