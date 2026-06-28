import { describe, expect, it, vi } from "vitest";
import { resourceManager } from "../../../../../electron-app/utils/app/lifecycle/resourceManager.js";
import type {
    BrowserIntervalHandle,
    BrowserTimerHandle,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";

function cleanupFixture(): void {
    resourceManager.cleanupAll();
    vi.restoreAllMocks();
}

function setupFixture(): void {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    resourceManager.cleanupAll();
}

describe("resourceManager", () => {
    it("does not publish the singleton on the global object", () => {
        expect.assertions(1);

        expect(globalThis).not.toHaveProperty("resourceManager");
    });

    it("tracks resource stats and filters cleanup by owner", () => {
        expect.assertions(8);

        setupFixture();

        try {
            const chartCleanup = vi.fn<() => void>();
            const timerCleanup = vi.fn<() => void>();
            vi.spyOn(Date, "now")
                .mockReturnValueOnce(1000)
                .mockReturnValueOnce(2000);

            const chartId = resourceManager.register("chart", chartCleanup, {
                id: "chart-1",
                owner: "charts",
            });
            const timerId = resourceManager.register("timer", timerCleanup, {
                owner: "timers",
            });

            expect({ chartId, timerId }).toStrictEqual({
                chartId: "chart-1",
                timerId: expect.stringMatching(/^resource-timer-\d+$/u),
            });

            expect(resourceManager.getStats()).toStrictEqual({
                byOwner: { charts: 1, timers: 1 },
                byType: {
                    chart: 1,
                    eventListener: 0,
                    interval: 0,
                    map: 0,
                    observer: 0,
                    other: 0,
                    timer: 1,
                    worker: 0,
                },
                total: 2,
            });

            expect(resourceManager.list()).toStrictEqual([
                {
                    id: "chart-1",
                    owner: "charts",
                    timestamp: 1000,
                    type: "chart",
                },
                {
                    id: timerId,
                    owner: "timers",
                    timestamp: 2000,
                    type: "timer",
                },
            ]);

            expect(resourceManager.cleanup({ owner: "charts" })).toBe(1);
            expect(chartCleanup).toHaveBeenCalledOnce();
            expect(timerCleanup).not.toHaveBeenCalled();
            expect(resourceManager.getStats()).toStrictEqual({
                byOwner: { timers: 1 },
                byType: {
                    chart: 0,
                    eventListener: 0,
                    interval: 0,
                    map: 0,
                    observer: 0,
                    other: 0,
                    timer: 1,
                    worker: 0,
                },
                total: 1,
            });

            expect(resourceManager.cleanup({ type: "timer" })).toBe(1);
        } finally {
            cleanupFixture();
        }
    });

    it("cleans all resources in reverse registration order through the singleton", () => {
        expect.assertions(3);

        setupFixture();

        try {
            const calls: string[] = [];

            resourceManager.register("other", () => {
                calls.push("first");
            });
            resourceManager.register("other", () => {
                calls.push("second");
            });

            expect(resourceManager.cleanupAll()).toBe(2);
            expect(calls).toStrictEqual(["second", "first"]);
            expect(resourceManager.getStats()).toStrictEqual({
                byOwner: {},
                byType: {
                    chart: 0,
                    eventListener: 0,
                    interval: 0,
                    map: 0,
                    observer: 0,
                    other: 0,
                    timer: 0,
                    worker: 0,
                },
                total: 0,
            });
        } finally {
            cleanupFixture();
        }
    });

    it("cleans up specialized resource wrappers", () => {
        expect.assertions(7);

        setupFixture();

        try {
            const clearIntervalSpy = vi
                .spyOn(globalThis, "clearInterval")
                .mockImplementation(() => {});
            const clearTimeoutSpy = vi
                .spyOn(globalThis, "clearTimeout")
                .mockImplementation(() => {});
            const destroy = vi.fn<() => void>();
            const disconnect = vi.fn<() => void>();
            const interval = 42 as BrowserIntervalHandle;
            const remove = vi.fn<() => void>();
            const timer = 43 as BrowserTimerHandle;
            const terminate = vi.fn<() => void>();

            const chartId = resourceManager.registerChart({ destroy });
            const intervalId = resourceManager.registerInterval(interval);
            const observerId = resourceManager.registerObserver({
                disconnect,
            });
            const mapId = resourceManager.registerMap({ remove });
            const timerId = resourceManager.registerTimer(timer);
            const workerId = resourceManager.registerWorker({ terminate });

            expect([
                chartId,
                intervalId,
                observerId,
                mapId,
                timerId,
                workerId,
            ]).toStrictEqual([
                expect.stringMatching(/^resource-chart-\d+$/u),
                expect.stringMatching(/^resource-interval-\d+$/u),
                expect.stringMatching(/^resource-observer-\d+$/u),
                expect.stringMatching(/^resource-map-\d+$/u),
                expect.stringMatching(/^resource-timer-\d+$/u),
                expect.stringMatching(/^resource-worker-\d+$/u),
            ]);

            resourceManager.cleanupAll();

            expect(destroy).toHaveBeenCalledOnce();
            expect(clearIntervalSpy).toHaveBeenCalledWith(interval);
            expect(disconnect).toHaveBeenCalledOnce();
            expect(remove).toHaveBeenCalledOnce();
            expect(clearTimeoutSpy).toHaveBeenCalledWith(timer);
            expect(terminate).toHaveBeenCalledOnce();
        } finally {
            cleanupFixture();
        }
    });

    it("rejects invalid specialized resources", () => {
        expect.assertions(8);

        setupFixture();

        try {
            expect(resourceManager.registerChart({})).toBe("");
            expect(resourceManager.registerMap({})).toBe("");
            expect(resourceManager.registerObserver({})).toBe("");
            expect(resourceManager.registerWorker({})).toBe("");
            expect(resourceManager.registerChart({ destroy: "nope" })).toBe("");
            expect(resourceManager.registerMap({ remove: "nope" })).toBe("");
            expect(
                resourceManager.registerObserver({ disconnect: "nope" })
            ).toBe("");
            expect(resourceManager.registerWorker({ terminate: "nope" })).toBe(
                ""
            );
        } finally {
            cleanupFixture();
        }
    });

    it("unregisters a resource even when its cleanup throws", () => {
        expect.assertions(4);

        setupFixture();

        try {
            const cleanup = vi.fn<() => void>(() => {
                throw new Error("cleanup failed");
            });
            const id = resourceManager.register("other", cleanup);

            expect({
                unregistered: resourceManager.unregister(id),
            }).toStrictEqual({
                unregistered: true,
            });
            expect(cleanup).toHaveBeenCalledOnce();
            expect({
                unregisteredAgain: resourceManager.unregister(id),
            }).toStrictEqual({
                unregisteredAgain: false,
            });
            expect(resourceManager.getStats()).toStrictEqual({
                byOwner: {},
                byType: {
                    chart: 0,
                    eventListener: 0,
                    interval: 0,
                    map: 0,
                    observer: 0,
                    other: 0,
                    timer: 0,
                    worker: 0,
                },
                total: 0,
            });
        } finally {
            cleanupFixture();
        }
    });
});
