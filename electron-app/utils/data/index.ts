/* eslint-disable no-barrel-files/no-barrel-files -- Stable data category entry point for existing runtime imports. */
/**
 * Re-exports all subcategories in the data category.
 */
import * as dataLookups from "./lookups/index.js";
import * as dataProcessing from "./processing/index.js";
import * as dataZones from "./zones/index.js";

export * from "./lookups/index.js";
export * from "./processing/index.js";
export * from "./zones/index.js";

export default {
    lookups: dataLookups,
    processing: dataProcessing,
    zones: dataZones,
};
/* eslint-enable no-barrel-files/no-barrel-files */
