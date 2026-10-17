import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
export function mdToHtml(md: string): string {
  const raw = marked.parse(md || "") as string;
  return sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "pre", "code"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "title", "rel", "target"],
      img: ["src", "alt", "title", "width", "height"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: { a: (tag, attribs) => ({ tagName: "a", attribs: { ...attribs, rel: "nofollow noopener", target: "_blank" } }) }
  });
}
