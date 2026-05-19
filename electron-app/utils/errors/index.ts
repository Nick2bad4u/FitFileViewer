/* eslint-disable no-barrel-files/no-barrel-files -- Preserve the existing public error utility entrypoint. */

/**
 * Surfaces error classes and helpers with a namespace default export.
 */

import * as errorHandling from "./errorHandling.js";

export * from "./errorHandling.js";

/**
 * Namespace default mirrors prior usage where callers accessed
 * `errors.withErrorHandling` style helpers without changing call sites.
 */
export default errorHandling;

/* eslint-enable no-barrel-files/no-barrel-files */
