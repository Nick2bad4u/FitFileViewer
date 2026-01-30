import * as dataLookups from "./lookups/index.js";
/**
 * Re-exports all subcategories in the data category
 *
 * @file Main Category Barrel Export for data
 */
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
