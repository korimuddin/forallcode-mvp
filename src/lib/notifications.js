export const NOTIFICATION_TYPES = {
  star: { icon: "★", label: "starred your repo" },
  follow: { icon: "→", label: "followed you" },

  issue_opened: { icon: "●", label: "opened an issue" },
  issue_closed: { icon: "◉", label: "closed an issue" },
  issue_comment: { icon: "◌", label: "commented on an issue" },
  issue_assigned: { icon: "◎", label: "assigned you to an issue" },
  issue_mentioned: { icon: "@", label: "mentioned you in an issue" },

  pr_opened: { icon: "⇌", label: "opened a pull request" },
  pr_closed: { icon: "⊗", label: "closed a pull request" },
  pr_merged: { icon: "⊕", label: "merged a pull request" },
  pr_review: { icon: "✓", label: "reviewed your pull request" },
  pr_comment: { icon: "◌", label: "commented on a pull request" },
  pr_approved: { icon: "✓", label: "approved your pull request" },
  pr_changes_requested: { icon: "!", label: "requested changes on your PR" },

  collaborator_invite: { icon: "+", label: "invited you to collaborate" },
  collaborator_accepted: { icon: "✓", label: "accepted your collaboration invite" },

  system: { icon: "⚙", label: "System notification" }
};

export const NOTIFICATION_COLORS = {
  star: "#c8a055",
  follow: "#9b8fd4",
  issue_opened: "#7aaa72",
  issue_closed: "#9c918c",
  issue_comment: "#6aa8d4",
  issue_assigned: "#9b8fd4",
  issue_mentioned: "#9b8fd4",
  pr_opened: "#9b8fd4",
  pr_closed: "#9c918c",
  pr_merged: "#7a6dc4",
  pr_review: "#7aaa72",
  pr_comment: "#6aa8d4",
  pr_approved: "#7aaa72",
  pr_changes_requested: "#d4848c",
  collaborator_invite: "#c8a055",
  collaborator_accepted: "#7aaa72",
  system: "#9c918c"
};

export function getNotificationType(type) {
  return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system;
}

export function getNotificationColor(type) {
  return NOTIFICATION_COLORS[type] || "#9b8fd4";
}

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
