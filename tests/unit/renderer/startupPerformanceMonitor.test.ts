import { describe, expect, it, vi } from "vitest";

import { createRendererPerformanceMonitor } from "../../../electron-app/renderer/startupPerformanceMonitor.js";

describe("renderer startup performance monitor", () => {
    it("records completed operation metrics", () => {
        expect.assertions(3);

        const nowPerformance = vi.fn<() => number>()
            .mockReturnValueOnce(10)
            .mockReturnValueOnce(34);
        const logRenderer =
            vi.fn<(level: "log" | "warn", ...args: unknown[]) => void>();
        const utils = createRendererPerformanceMonitor({
            isDevelopmentMode: () => false,
            logRenderer,
            runtime: { nowPerformance },
        });

        utils.start("startup");
        expect(utils.end("startup")).toBe(24);

        expect(utils.getMetrics()).toStrictEqual({ startup: 24 });
        expect(logRenderer).not.toHaveBeenCalled();
    });

    it("logs timing details in development mode", () => {
        expect.assertions(2);

        const nowPerformance = vi.fn<() => number>()
            .mockReturnValueOnce(100)
            .mockReturnValueOnce(125.5);
        const logRenderer =
            vi.fn<(level: "log" | "warn", ...args: unknown[]) => void>();
        const utils = createRendererPerformanceMonitor({
            isDevelopmentMode: () => true,
            logRenderer,
            runtime: { nowPerformance },
        });

        utils.start("theme_setup");
        expect(utils.end("theme_setup")).toBe(25.5);

        expect(logRenderer).toHaveBeenCalledWith(
            "log",
            "[Performance] theme_setup: 25.50ms"
        );
    });

    it("warns and returns zero when an operation was not started", () => {
        expect.assertions(2);

        const logRenderer =
            vi.fn<(level: "log" | "warn", ...args: unknown[]) => void>();
        const utils = createRendererPerformanceMonitor({
            isDevelopmentMode: () => true,
            logRenderer,
        });

        expect(utils.end("missing")).toBe(0);
        expect(logRenderer).toHaveBeenCalledWith(
            "warn",
            "[Performance] No start time found for operation: missing"
        );
    });
});
