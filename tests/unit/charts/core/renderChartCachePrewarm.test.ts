import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RenderChartTimerRuntime } from "../../../../electron-app/utils/charts/core/renderChartTimerRuntime.js";

const mocks = vi.hoisted(() => ({
    activeTab: "summary" as unknown,
    chartsState: { isRendered: false, isRendering: false } as unknown,
    convertValueToUserUnits: vi.fn((value: number) => value),
    formatChartFields: ["speed", "heart_rate"],
}));

vi.mock(
    "../../../../electron-app/utils/charts/core/renderChartDependencyAccessors.js",
    () => ({
        getConvertersSafe: () => mocks.convertValueToUserUnits,
        getFormatChartFieldsSafe: () => mocks.formatChartFields,
    })
);

vi.mock(
    "../../../../electron-app/utils/state/domain/rendererActiveTabState.js",
    async (importOriginal) => {
        const actual =
            await importOriginal<
                typeof import("../../../../electron-app/utils/state/domain/rendererActiveTabState.js")
            >();

        return {
            ...actual,
            getRendererActiveTab: vi.fn(() => mocks.activeTab),
        };
    }
);

vi.mock(
    "../../../../electron-app/utils/charts/core/renderChartStateAccess.js",
    () => ({
        getStateManagerSafe: () => ({
            getState: (path: string) => {
                if (path === "charts") {
                    return mocks.chartsState;
                }
                return undefined;
            },
        }),
    })
);

const { prewarmChartRenderCaches } =
    await import("../../../../electron-app/utils/charts/core/renderChartCachePrewarm.js");

describe("prewarmChartRenderCaches", () => {
    beforeEach(() => {
        mocks.activeTab = "summary";
        mocks.chartsState = { isRendered: false, isRendering: false };
        mocks.convertValueToUserUnits.mockClear();
        mocks.formatChartFields = ["speed", "heart_rate"];
    });

    it("yields between prewarm chunks through an injected timer runtime", async () => {
        expect.assertions(4);

        const waitForNextTask = vi.fn(async () => undefined),
            timerRuntime: RenderChartTimerRuntime = {
                clearTimeout: vi.fn(),
                setTimeout: vi.fn(),
                wait: vi.fn(async () => undefined),
                waitForNextTask,
            };
        const { processedFields, skipped } = await prewarmChartRenderCaches(
            {
                recordMesgs: [
                    { heart_rate: 120, speed: 5, timestamp: 0 },
                    { heart_rate: 125, speed: 6, timestamp: 1 },
                ],
                startTime: 0,
                yieldEvery: 1,
            },
            {
                getFieldVisibility: () => "visible",
                getSettings: () => ({ maxpoints: "all" }),
                invalidateChartRenderCache: vi.fn(),
            },
            timerRuntime
        );

        expect({ processedFields, skipped }).toStrictEqual({
            processedFields: 2,
            skipped: false,
        });
        expect(waitForNextTask).toHaveBeenCalledExactlyOnceWith();
        expect(mocks.convertValueToUserUnits).toHaveBeenCalledWith(5, "speed");
        expect(mocks.convertValueToUserUnits).toHaveBeenCalledWith(
            120,
            "heart_rate"
        );
    });

    it("skips prewarming while the chart tab is active", async () => {
        expect.assertions(2);

        mocks.activeTab = "chartjs";

        await expect(
            prewarmChartRenderCaches(
                {
                    recordMesgs: [{ heart_rate: 120, speed: 5, timestamp: 0 }],
                    startTime: 0,
                },
                {
                    getFieldVisibility: () => "visible",
                    getSettings: () => ({ maxpoints: "all" }),
                    invalidateChartRenderCache: vi.fn(),
                }
            )
        ).resolves.toStrictEqual({ processedFields: 0, skipped: true });
        expect(mocks.convertValueToUserUnits).not.toHaveBeenCalled();
    });
});
