import { afterEach, describe, expect, it, vi } from "vitest";

import {
    criticalAnimLog,
    perfAnimLog,
    throttledAnimLog,
} from "../../../../electron-app/utils/debug/lastAnimLog.js";
import { setRendererDebugLoggingEnabled } from "../../../../electron-app/utils/debug/rendererDebugLoggingState.js";

describe("animation debug logging", () => {
    afterEach(() => {
        setRendererDebugLoggingEnabled(false);
        vi.restoreAllMocks();
    });

    it("uses typed renderer debug logging state", () => {
        expect.assertions(6);

        const consoleLog = vi.spyOn(console, "log").mockReturnValue(undefined);

        const disabledCriticalResult = criticalAnimLog("ignored");

        expect(disabledCriticalResult).toBeUndefined();
        expect(consoleLog).not.toHaveBeenCalled();

        setRendererDebugLoggingEnabled(true);
        const enabledCriticalResult = criticalAnimLog("enabled");
        const enabledThrottledResult = throttledAnimLog("progress");

        expect(enabledCriticalResult).toBeUndefined();
        expect(enabledThrottledResult).toBeUndefined();
        expect(consoleLog).toHaveBeenCalledWith("[AnimCritical] enabled");
        expect(consoleLog).toHaveBeenCalledWith("[AnimDebug] progress");
    });

    it("logs performance animation messages through typed debug state", () => {
        expect.assertions(2);

        const consoleLog = vi.spyOn(console, "log").mockReturnValue(undefined);
        vi.spyOn(performance, "now").mockReturnValue(1500);

        setRendererDebugLoggingEnabled(true);
        const result = perfAnimLog("frame", 1);

        expect(result).toBeUndefined();
        expect(consoleLog).toHaveBeenCalledWith(
            "[AnimPerf@1500.00ms] frame (1499.00ms)"
        );
    });
});
