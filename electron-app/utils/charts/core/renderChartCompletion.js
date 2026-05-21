import { getGlobalChartActions } from "./renderChartRuntimeHelpers.js";
/** Completes chart rendering through the legacy global action bridge if present. */
export function safeCompleteRendering(success) {
    try {
        getGlobalChartActions()?.completeRendering?.(success);
    }
    catch {
        // Compatibility bridge failures should not mask render cleanup paths.
    }
}
