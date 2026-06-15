import { afterEach, describe, expect, it, vi } from "vitest";

import {
    cleanupStateDevTools,
    debugUtilities,
    initializeStateDevTools,
    performanceMonitor,
} from "../../../../electron-app/utils/debug/stateDevTools.js";

const STATE_DEBUG_GLOBAL = "__stateDebug";

describe("state development tools", () => {
    afterEach(() => {
        cleanupStateDevTools();
        performanceMonitor.resetMetrics();
        vi.restoreAllMocks();
    });

    it("initializes typed debug utilities without publishing a state debug global", () => {
        expect.assertions(4);

        const consoleLog = vi.spyOn(console, "log").mockReturnValue(undefined);

        initializeStateDevTools(true);

        expect(debugUtilities.isDebugMode).toBe(true);
        expect(Object.hasOwn(globalThis, STATE_DEBUG_GLOBAL)).toBe(false);
        expect(consoleLog).toHaveBeenCalledWith(
            "- debugUtilities.logCurrentState() - Log current state"
        );
        expect(consoleLog).toHaveBeenCalledWith(
            "- performanceMonitor.getReport() - Get performance report"
        );
    });
});
