export const EXTENSION_LANGUAGE_MAP = {
  css: "CSS",
  go: "Go",
  html: "HTML",
  js: "JavaScript",
  json: "JSON",
  md: "Markdown",
  py: "Python",
  rs: "Rust",
  sh: "Shell",
  sql: "SQL",
  ts: "TypeScript"
};

export function detectGistLanguage(filename) {
  const ext = String(filename || "").split(".").pop()?.toLowerCase();
  return EXTENSION_LANGUAGE_MAP[ext] || "Plain text";
}

export function createEmptyGistFile(index = 0) {
  return {
    content: "",
    filename: index === 0 ? "hello.js" : `file-${index + 1}.txt`,
    language: index === 0 ? "JavaScript" : "Plain text"
  };
}
