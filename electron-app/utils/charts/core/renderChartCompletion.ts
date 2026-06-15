import { getChartLifecycleActions } from "./renderChartRuntimeHelpers.js";

/** Completes chart rendering through registered chart lifecycle actions. */
export function safeCompleteRendering(success: boolean): void {
    try {
        getChartLifecycleActions()?.completeRendering?.(success);
    } catch {
        // Completion hook failures should not mask render cleanup paths.
    }
}
