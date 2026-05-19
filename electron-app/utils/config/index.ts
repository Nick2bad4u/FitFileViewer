/* eslint-disable no-barrel-files/no-barrel-files -- This file is the stable public config entry point used by existing runtime imports. */

import * as config from "./constants.js";

export * from "./constants.js";

/**
 * Namespace export for consumers that expect object-style config access.
 */
export default config;

/* eslint-enable no-barrel-files/no-barrel-files */
