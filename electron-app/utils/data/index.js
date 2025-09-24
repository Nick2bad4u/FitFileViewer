import * as dataLookups from "./lookups/index.js";
/**
 * @fileoverview Main Category Barrel Export for data
 * @description Re-exports all subcategories in the data category
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
