export async function createNotification(supabaseClient, { userId, type, actorId, repoId, message }) {
  if (!supabaseClient || !userId || !type || !message) return { error: null };

  return supabaseClient.from("notifications").insert({
    user_id: userId,
    type,
    actor_id: actorId,
    repo_id: repoId,
    message
  });
}
