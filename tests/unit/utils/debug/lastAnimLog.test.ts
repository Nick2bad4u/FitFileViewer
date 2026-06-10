import { afterEach, describe, expect, it, vi } from "vitest";

import {
    criticalAnimLog,
    throttledAnimLog,
} from "../../../../electron-app/utils/debug/lastAnimLog.js";
import { setRendererDebugLoggingEnabled } from "../../../../electron-app/utils/debug/rendererDebugLoggingState.js";

describe("animation debug logging", () => {
    afterEach(() => {
        setRendererDebugLoggingEnabled(false);
        Reflect.deleteProperty(globalThis, "__renderer_dev");
        vi.restoreAllMocks();
    });

    it("uses typed renderer debug logging state instead of the renderer dev global", () => {
        expect.assertions(6);

        const consoleLog = vi.spyOn(console, "log").mockReturnValue(undefined);
        Reflect.set(globalThis, "__renderer_dev", {});

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
});
