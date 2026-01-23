/**
 * @fileoverview Barrel export for DOM helper utilities
 * @description Exposes individual helpers and a namespace default export for DOM operations
 */

export * from "./domHelpers.js";
export { default as domHelpers } from "./domHelpers.js";
// Preserve legacy default import style: `import dom from "../dom/index.js";`
export { default } from "./domHelpers.js";
export * from "./escapeHtml.js";
export * from "./sanitizeCssColorToken.js";
export * from "./sanitizeHtmlAllowlist.js";
