/**
 * @fileoverview Barrel export for error handling utilities
 * @description Surfaces error classes and helpers with a namespace default export
 */

import * as errorHandling from "./errorHandling.js";

export * from "./errorHandling.js";

/**
 * Namespace default mirrors prior usage where callers accessed
 * `errors.withErrorHandling` style helpers without changing call sites.
 */
export default errorHandling;
