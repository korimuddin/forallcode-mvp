import DOMPurify from "dompurify";
import hljs from "highlight.js";
import { Marked, Renderer } from "marked";

const renderer = new Renderer();

function renderInline(context, tokens = []) {
  return context.parser.parseInline(tokens);
}

function renderBlock(context, tokens = []) {
  return context.parser.parse(tokens);
}

function escapeAttribute(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Renders GitHub-flavoured markdown with GitHub's markdown-body look.
// Visual styling lives in styles.css under `.markdown-body` (Primer tokens).
renderer.heading = function heading({ tokens, depth }) {
  return `<h${depth}>${renderInline(this, tokens)}</h${depth}>`;
};

renderer.paragraph = function paragraph({ tokens }) {
  return `<p>${renderInline(this, tokens)}</p>`;
};

renderer.code = function code({ text, lang }) {
  const language = lang && hljs.getLanguage(lang) ? lang : "";
  const highlighted = language
    ? hljs.highlight(text, { language }).value
    : hljs.highlightAuto(text).value;

  return `<div class="md-code-block"><button class="md-copy-button" type="button" onclick="navigator.clipboard.writeText(this.dataset.code)" data-code="${escapeAttribute(text)}" aria-label="Copy code">Copy</button><pre><code class="hljs${language ? ` language-${escapeAttribute(language)}` : ""}">${highlighted}</code></pre></div>`;
};

renderer.codespan = function codespan({ text }) {
  return `<code>${text}</code>`;
};

renderer.link = function link({ href, title, tokens }) {
  const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
  return `<a href="${escapeAttribute(href)}"${titleAttr}>${renderInline(this, tokens)}</a>`;
};

renderer.blockquote = function blockquote({ tokens }) {
  return `<blockquote>${renderBlock(this, tokens)}</blockquote>`;
};

renderer.hr = function hr() {
  return "<hr />";
};

renderer.image = function image({ href, title, text }) {
  const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
  return `<img src="${escapeAttribute(href)}" alt="${escapeAttribute(text)}"${titleAttr} />`;
};

renderer.list = function list(token) {
  const tag = token.ordered ? "ol" : "ul";
  const body = token.items.map((item) => this.listitem(item)).join("");
  return `<${tag}>${body}</${tag}>`;
};

renderer.listitem = function listitem(item) {
  return `<li>${renderBlock(this, item.tokens)}</li>`;
};

renderer.table = function table(token) {
  const header = token.header.map((cell) => this.tablecell(cell)).join("");
  const rows = token.rows
    .map((row) => this.tablerow({ text: row.map((cell) => this.tablecell(cell)).join("") }))
    .join("");

  return `<div class="md-table-wrap"><table><thead>${this.tablerow({ text: header })}</thead><tbody>${rows}</tbody></table></div>`;
};

renderer.tablerow = function tablerow({ text }) {
  return `<tr>${text}</tr>`;
};

renderer.tablecell = function tablecell(cell) {
  const content = renderInline(this, cell.tokens);
  return cell.header ? `<th>${content}</th>` : `<td>${content}</td>`;
};

const markdownParser = new Marked({
  breaks: true,
  gfm: true,
  renderer
});

export function renderMarkdown(markdown) {
  if (!markdown) return "";
  const rawHtml = markdownParser.parse(markdown);
  return DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ["onclick", "data-code"]
  });
}
