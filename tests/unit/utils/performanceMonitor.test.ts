import { describe, expect, it, vi } from "vitest";

import {
    PerformanceMonitor,
    performanceMonitor,
} from "../../../electron-app/utils/performance/performanceMonitor.js";

function getRequiredTimer(
    timer: ReturnType<PerformanceMonitor["getTimer"]>,
    operation: string
): NonNullable<ReturnType<PerformanceMonitor["getTimer"]>> {
    if (!timer) {
        throw new Error(`Expected timer for operation: ${operation}`);
    }

    return timer;
}

describe(PerformanceMonitor, () => {
    it("does not record timers while monitoring is disabled", () => {
        expect.assertions(1);

        const monitor = new PerformanceMonitor();

        monitor.setEnabled(false);
        monitor.startTimer("disabled-operation");

        expect({
            endResult: monitor.endTimer("disabled-operation"),
            enabled: monitor.isEnabled(),
            timer: monitor.getTimer("disabled-operation"),
        }).toStrictEqual({
            endResult: null,
            enabled: false,
            timer: null,
        });
    });

    it("records and ends timers while monitoring is enabled", () => {
        expect.assertions(5);

        const now = vi.fn<() => number>()
            .mockReturnValueOnce(100)
            .mockReturnValueOnce(142.5);
        const monitor = new PerformanceMonitor({
            nowPerformance: now,
        });
        const consoleLog = vi
            .spyOn(console, "log")
            .mockImplementation(() => {});

        try {
            monitor.setEnabled(true);
            monitor.startTimer("parse-fit");

            const duration = monitor.endTimer("parse-fit");

            expect(duration).toBe(42.5);
            expect(monitor.getTimer("parse-fit")).toStrictEqual({
                duration: 42.5,
                end: 142.5,
                start: 100,
            });
            expect(
                getRequiredTimer(
                    monitor.getAllTimers().get("parse-fit") ?? null,
                    "parse-fit"
                ).duration
            ).toBe(42.5);
            expect(consoleLog).toHaveBeenCalledWith(
                "[Performance] parse-fit: 42.50ms"
            );
            expect(now).toHaveBeenCalledTimes(2);
        } finally {
            vi.restoreAllMocks();
        }
    });

    it("warns and returns null for missing timers", () => {
        expect.assertions(2);

        const monitor = new PerformanceMonitor();
        const consoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});

        try {
            monitor.setEnabled(true);

            expect(monitor.endTimer("missing-operation")).toBeNull();
            expect(consoleWarn).toHaveBeenCalledWith(
                "No timer found for operation: missing-operation"
            );
        } finally {
            vi.restoreAllMocks();
        }
    });

    it("exports a singleton monitor", () => {
        expect.assertions(2);

        try {
            performanceMonitor.setEnabled(true);
            performanceMonitor.startTimer("singleton-operation");

            expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
            const singletonTimer = performanceMonitor.getTimer(
                "singleton-operation"
            );
            expect({
                duration: singletonTimer?.duration,
                end: singletonTimer?.end,
            }).toStrictEqual({
                duration: null,
                end: null,
            });
        } finally {
            performanceMonitor.clearTimers();
            performanceMonitor.setEnabled(
                process.env["NODE_ENV"] === "development" ||
                    process.env["PERFORMANCE_MONITORING"] === "true"
            );
        }
    });
});
