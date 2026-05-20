import { patchSummaryFields } from "../data/processing/patchSummaryFields.js";
import { copyTableAsCSV } from "../files/export/copyTableAsCSV.js";

/** Legacy data utilities exposed through the global utility bridge. */
export const dataUtilityExports = Object.freeze({
    copyTableAsCSV,
    patchSummaryFields,
});
