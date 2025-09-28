export default utils;
export type AttachmentResult = {
    name: string;
    reason: string;
    type: string;
};
export type CollisionResult = {
    name: string;
    previousType: string;
    newType: string;
    serious: boolean;
    resolved: boolean;
};
export type AttachmentResults = {
    successful: string[];
    failed: AttachmentResult[];
    collisions: CollisionResult[];
    total: number;
};
export type ConstantsType = {
    NAMESPACE: string;
    ERRORS: {
        FUNCTION_NOT_AVAILABLE: string;
        INVALID_FUNCTION: string;
        NAMESPACE_COLLISION: string;
    };
    LOG_PREFIX: string;
    VERSION: string;
};
export type ValidationResults = {
    valid: string[];
    invalid: string[];
};
declare namespace utils {
    export { applyTheme };
    export { copyTableAsCSV };
    export { createTables };
    export { formatArray };
    export { formatDistance };
    export { formatDuration };
    export { listenForThemeChange };
    export { loadTheme };
    export { patchSummaryFields };
    export { renderMap };
    export { renderSummary };
    export { renderTable };
    export { setLoading };
    export { setTabButtonsEnabled };
    export { showFitData };
    export { showNotification };
    export { updateActiveTab };
    export { updateMapTheme };
    export { updateTabVisibility };
}
export namespace FitFileViewerUtils {
    export function cleanup(): void;
    export function getAvailableUtils(): string[];
    export function getUtil(name: string): Function | null;
    export function isUtilAvailable(name: string): boolean;
    import namespace = NAMESPACE;
    export { namespace };
    export function safeExecute(utilName: string, ...args: any[]): any;
    export { utils };
    export function validateAllUtils(): ValidationResults;
    export const version: string;
}
declare namespace CONSTANTS {
    let NAMESPACE: string;
    let ERRORS: {
        FUNCTION_NOT_AVAILABLE: string;
        INVALID_FUNCTION: string;
        NAMESPACE_COLLISION: string;
    };
    let LOG_PREFIX: string;
    let VERSION: string;
}
import { applyTheme } from "./utils/index.js";
import { copyTableAsCSV } from "./utils/index.js";
import { createTables } from "./utils/index.js";
import { formatArray } from "./utils/index.js";
import { formatDistance } from "./utils/index.js";
import { formatDuration } from "./utils/index.js";
import { listenForThemeChange } from "./utils/index.js";
import { loadTheme } from "./utils/index.js";
import { patchSummaryFields } from "./utils/index.js";
import { renderMap } from "./utils/index.js";
import { renderSummary } from "./utils/index.js";
import { renderTable } from "./utils/index.js";
import { setLoading } from "./utils/index.js";
import { setTabButtonsEnabled } from "./utils/index.js";
import { showFitData } from "./utils/index.js";
import { showNotification } from "./utils/index.js";
import { updateActiveTab } from "./utils/index.js";
import { updateMapTheme } from "./utils/index.js";
import { updateTabVisibility } from "./utils/index.js";
export { CONSTANTS as UTILS_CONSTANTS };
//# sourceMappingURL=utils.d.ts.map