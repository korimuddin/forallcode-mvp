export const CATEGORY_STYLES = {
  general: { bg: "#f4efe6", color: "#6b5f58", label: "General" },
  ideas: { bg: "#ddd5f0", color: "#534AB7", label: "Ideas" },
  "q-and-a": { bg: "#cce0f0", color: "#0C447C", label: "Q&A" },
  announcements: { bg: "#f5e4c4", color: "#633806", label: "Announcements" },
  "show-and-tell": { bg: "#c8d8c4", color: "#27500A", label: "Show and tell" }
};

export function getDiscussionCommentCount(discussion) {
  const countRow = Array.isArray(discussion.discussion_comments) ? discussion.discussion_comments[0] : null;
  return Number(countRow?.count || discussion.comment_count || 0);
}

export function discussionCategoryLabel(category) {
  return CATEGORY_STYLES[category]?.label || CATEGORY_STYLES.general.label;
}
