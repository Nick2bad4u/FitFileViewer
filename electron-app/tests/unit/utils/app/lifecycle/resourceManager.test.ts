import { describe, expect, it, vi } from "vitest";
import {
    cleanupAll,
    getStats,
    register,
    resourceManager,
} from "../../../../../utils/app/lifecycle/resourceManager.js";

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
    it("tracks resource stats and filters cleanup by owner", () => {
        expect.assertions(8);

        setupFixture();

        try {
            const chartCleanup = vi.fn<() => void>();
            const timerCleanup = vi.fn<() => void>();

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

            expect(resourceManager.getStats()).toMatchObject({
                byOwner: { charts: 1, timers: 1 },
                byType: { chart: 1, timer: 1 },
                total: 2,
            });

            expect(resourceManager.list()).toContainEqual(
                expect.objectContaining({
                    id: "chart-1",
                    owner: "charts",
                    type: "chart",
                })
            );

            expect(resourceManager.cleanup({ owner: "charts" })).toBe(1);
            expect(chartCleanup).toHaveBeenCalledOnce();
            expect(timerCleanup).not.toHaveBeenCalled();
            expect(resourceManager.getStats()).toMatchObject({ total: 1 });

            expect(resourceManager.cleanup({ type: "timer" })).toBe(1);
        } finally {
            cleanupFixture();
        }
    });

    it("cleans all resources in reverse registration order through bound exports", () => {
        expect.assertions(3);

        setupFixture();

        try {
            const calls: string[] = [];

            register("other", () => {
                calls.push("first");
            });
            register("other", () => {
                calls.push("second");
            });

            expect(cleanupAll()).toBe(2);
            expect(calls).toStrictEqual(["second", "first"]);
            expect(getStats()).toMatchObject({ total: 0 });
        } finally {
            cleanupFixture();
        }
    });

    it("cleans up specialized resource wrappers", () => {
        expect.assertions(5);

        setupFixture();

        try {
            const destroy = vi.fn<() => void>();
            const disconnect = vi.fn<() => void>();
            const remove = vi.fn<() => void>();
            const terminate = vi.fn<() => void>();

            const chartId = resourceManager.registerChart({ destroy });
            const observerId = resourceManager.registerObserver({
                disconnect,
            });
            const mapId = resourceManager.registerMap({ remove });
            const workerId = resourceManager.registerWorker({ terminate });

            expect([
                chartId,
                observerId,
                mapId,
                workerId,
            ]).toStrictEqual([
                expect.stringMatching(/^resource-chart-\d+$/u),
                expect.stringMatching(/^resource-observer-\d+$/u),
                expect.stringMatching(/^resource-map-\d+$/u),
                expect.stringMatching(/^resource-worker-\d+$/u),
            ]);

            resourceManager.cleanupAll();

            expect(destroy).toHaveBeenCalledOnce();
            expect(disconnect).toHaveBeenCalledOnce();
            expect(remove).toHaveBeenCalledOnce();
            expect(terminate).toHaveBeenCalledOnce();
        } finally {
            cleanupFixture();
        }
    });

    it("rejects invalid specialized resources", () => {
        expect.assertions(4);

        setupFixture();

        try {
            expect(resourceManager.registerChart({})).toBe("");
            expect(resourceManager.registerMap({})).toBe("");
            expect(resourceManager.registerObserver({})).toBe("");
            expect(resourceManager.registerWorker({})).toBe("");
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
            expect(resourceManager.getStats()).toMatchObject({ total: 0 });
        } finally {
            cleanupFixture();
        }
    });
});
