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
import { setLoading } from "../utils/app/initialization/rendererUtils.js";
import { patchSummaryFields } from "../utils/data/processing/patchSummaryFields.js";
import { copyTableAsCSV } from "../utils/files/export/copyTableAsCSV.js";
import { formatArray } from "../utils/formatting/formatters/formatUtils.js";
import { formatDistance } from "../utils/formatting/formatters/formatDistance.js";
import { formatDuration } from "../utils/formatting/formatters/formatDuration.js";
import { renderMap } from "../utils/maps/core/renderMap.js";
import { createTables } from "../utils/rendering/components/createTables.js";
import { renderSummary } from "../utils/rendering/core/renderSummary.js";
import { renderTable } from "../utils/rendering/core/renderTable.js";
import { showFitData } from "../utils/rendering/core/showFitData.js";
import {
    applyTheme,
    listenForThemeChange,
    loadTheme,
} from "../utils/theming/core/theme.js";
import { updateMapTheme } from "../utils/theming/specific/updateMapTheme.js";
import { setTabButtonsEnabled } from "../utils/ui/controls/enableTabButtons.js";
import { showNotification } from "../utils/ui/notifications/showNotification.js";
import { updateActiveTab } from "../utils/ui/tabs/updateActiveTab.js";
import { updateTabVisibility } from "../utils/ui/tabs/updateTabVisibility.js";
export { CONSTANTS as UTILS_CONSTANTS };
