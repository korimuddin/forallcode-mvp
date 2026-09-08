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

renderer.heading = function heading({ tokens, depth }) {
  const level = Math.min(depth, 4);
  const sizes = { 1: "28px", 2: "20px", 3: "16px", 4: "14px" };
  const margins = { 1: "0 0 12px", 2: "28px 0 12px", 3: "20px 0 8px", 4: "16px 0 6px" };
  const borders = {
    1: "border-bottom: 1px solid #e8e0d4; padding-bottom: 12px;",
    2: "border-bottom: 1px solid #e8e0d4; padding-bottom: 8px;",
    3: "",
    4: ""
  };

  return `<h${depth} style="font-family: Lora, serif; font-size: ${sizes[level]}; margin: ${margins[level]}; color: #3d3530; ${borders[level]}">${renderInline(this, tokens)}</h${depth}>`;
};

renderer.paragraph = function paragraph({ tokens }) {
  return `<p style="font-family: DM Sans, sans-serif; font-size: 14px; color: #6b5f58; line-height: 1.8; margin-bottom: 14px;">${renderInline(this, tokens)}</p>`;
};

renderer.code = function code({ text, lang }) {
  const language = lang && hljs.getLanguage(lang) ? lang : "";
  const highlighted = language
    ? hljs.highlight(text, { language }).value
    : hljs.highlightAuto(text).value;

  return `
    <div style="position: relative; margin: 16px 0;">
      <div style="display: flex; align-items: center; justify-content: space-between;
                  padding: 8px 14px; background: #3d3530; border-radius: 0;">
        <span style="font-family: DM Mono, monospace; font-size: 11px; color: #9c918c;">
          ${language || "code"}
        </span>
        <button data-markdown-copy="true" type="button"
                data-code="${escapeAttribute(text)}"
                style="font-size: 11px; color: #9c918c; background: none; border: none;
                       cursor: pointer; font-family: DM Sans, sans-serif;">
          Copy
        </button>
      </div>
      <pre style="margin: 0; padding: 16px; background: #2c2824;
                  border-radius: 0; overflow-x: auto;">
        <code class="hljs" style="font-family: DM Mono, monospace; font-size: 12px;
                                   line-height: 1.7;">${highlighted}</code>
      </pre>
    </div>`;
};

renderer.codespan = function codespan({ text }) {
  return `<code style="font-family: DM Mono, monospace; font-size: 12px; background: #f4efe6;
                padding: 2px 6px; border-radius: 0; color: #9b8fd4;">${text}</code>`;
};

renderer.link = function link({ href, title, tokens }) {
  const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
  return `<a href="${escapeAttribute(href)}"${titleAttr} style="color: #9b8fd4; text-decoration: none;
                             border-bottom: 1px solid #ddd5f0;"
     >${renderInline(this, tokens)}</a>`;
};

renderer.blockquote = function blockquote({ tokens }) {
  return `<blockquote style="border-left: 3px solid #9b8fd4; margin: 16px 0;
                       padding: 8px 16px; background: #f4efe6; border-radius: 0;">
    <div style="margin: 0; color: #6b5f58; font-style: italic;">${renderBlock(this, tokens)}</div>
  </blockquote>`;
};

renderer.hr = function hr() {
  return `<hr style="border: none; border-top: 1px solid #e8e0d4; margin: 24px 0;"/>`;
};

renderer.image = function image({ href, title, text }) {
  const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
  return `<img src="${escapeAttribute(href)}" alt="${escapeAttribute(text)}"${titleAttr}
        style="max-width: 100%; border-radius: 0; margin: 12px 0;
               border: 1px solid #e8e0d4;"/>`;
};

renderer.list = function list(token) {
  const tag = token.ordered ? "ol" : "ul";
  const body = token.items.map((item) => this.listitem(item)).join("");
  return `<${tag} style="padding-left: 20px; color: #6b5f58; margin-bottom: 14px;
                          font-family: DM Sans, sans-serif; font-size: 14px;">${body}</${tag}>`;
};

renderer.listitem = function listitem(item) {
  return `<li style="margin-bottom: 4px; line-height: 1.6;">${renderBlock(this, item.tokens)}</li>`;
};

renderer.table = function table(token) {
  const header = token.header.map((cell) => this.tablecell(cell)).join("");
  const rows = token.rows
    .map((row) => this.tablerow({ text: row.map((cell) => this.tablecell(cell)).join("") }))
    .join("");

  return `<div style="overflow-x: auto; margin: 16px 0;">
    <table style="width: 100%; border-collapse: collapse; font-family: DM Sans, sans-serif; font-size: 13px;">
      <thead style="background: #f4efe6;">${this.tablerow({ text: header })}</thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
};

renderer.tablerow = function tablerow({ text }) {
  return `<tr style="border-bottom: 1px solid #e8e0d4;">${text}</tr>`;
};

renderer.tablecell = function tablecell(cell) {
  const content = renderInline(this, cell.tokens);
  return cell.header
    ? `<th style="padding: 10px 14px; text-align: left; color: #3d3530;
                  font-weight: 500; border-bottom: 2px solid #e8e0d4;">${content}</th>`
    : `<td style="padding: 10px 14px; color: #6b5f58;">${content}</td>`;
};

const markdownParser = new Marked({
  breaks: true,
  gfm: true,
  renderer
});

export function renderMarkdown(markdown) {
  if (!markdown) return "";
  const rawHtml = markdownParser.parse(markdown);
  // SECURITY: all markdown output MUST pass through DOMPurify. Do not bypass.
  return DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ["data-code", "data-markdown-copy"]
  });
}
