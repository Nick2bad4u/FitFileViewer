import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createAnimationDebugLogger,
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

    it("creates animation loggers with injected runtime providers", () => {
        expect.assertions(5);

        const consoleLog = vi.fn<(...args: unknown[]) => void>();
        const logger = createAnimationDebugLogger({
            getConsole: () => ({ log: consoleLog }),
            getLastAnimLogRuntime: () => ({
                dateNow: () => 600,
                isDevelopmentEnvironment: () => false,
                performanceNow: () => 1500,
            }),
            getRendererDebugRuntime: () => ({
                isRendererDebugLoggingAvailable: (enabled) => enabled,
            }),
            isDevelopmentEnvironment: () => false,
            isRendererDebugLoggingEnabled: () => true,
        });

        const results = [
            logger.criticalAnimLog("critical"),
            logger.throttledAnimLog("progress"),
            logger.perfAnimLog("frame", 1),
        ];

        expect(results).toStrictEqual([
            undefined,
            undefined,
            undefined,
        ]);
        expect(consoleLog).toHaveBeenCalledTimes(3);
        expect(consoleLog).toHaveBeenNthCalledWith(
            1,
            "[AnimCritical] critical"
        );
        expect(consoleLog).toHaveBeenNthCalledWith(2, "[AnimDebug] progress");
        expect(consoleLog).toHaveBeenNthCalledWith(
            3,
            "[AnimPerf@1500.00ms] frame (1499.00ms)"
        );
    });

    it("accepts partial logger runtime overrides", () => {
        expect.assertions(2);

        const consoleLog = vi.fn<(...args: unknown[]) => void>();
        const logger = createAnimationDebugLogger({
            getConsole: () => ({ log: consoleLog }),
            getLastAnimLogRuntime: () => ({
                dateNow: () => 0,
                isDevelopmentEnvironment: () => true,
                performanceNow: () => 0,
            }),
        });

        const result = logger.criticalAnimLog("partial override");

        expect(result).toBeUndefined();
        expect(consoleLog).toHaveBeenCalledExactlyOnceWith(
            "[AnimCritical] partial override"
        );
    });
});
