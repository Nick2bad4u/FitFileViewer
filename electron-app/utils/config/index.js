/**
 * @fileoverview Barrel export for config utilities
 * @description Re-exports configuration constants and helpers with a namespace default export
 */

import * as config from "./constants.js";

export * from "./constants.js";

/**
 * Expose a namespace for consumers that expect object-style access
 * (e.g., `import config from "../config/index.js"; config.CONVERSION_FACTORS`).
 */
export default config;
