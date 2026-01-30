/**
 * Re-exports all subcategories in the files category
 *
 * @file Main Category Barrel Export for files
 */
import * as fileExport from "./export/index.js";
import * as fileImport from "./import/index.js";
import * as fileRecent from "./recent/index.js";

export * from "./export/index.js";
export * from "./import/index.js";
export * from "./recent/index.js";

export default {
    export: fileExport,
    import: fileImport,
    recent: fileRecent,
};
