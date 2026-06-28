import { afterEach, describe, expect, it, vi } from "vitest";

import { exposeChartDevTools } from "../../../../../electron-app/utils/charts/core/renderChartDevTools.js";
import {
    getRegisteredChartDevTools,
    resetChartDevToolsRegistryForTests,
} from "../../../../../electron-app/utils/charts/core/chartDevToolsRegistry.js";

afterEach(() => {
    resetChartDevToolsRegistryForTests();
    vi.restoreAllMocks();
});

function createDependencies(overrides: Record<string, unknown> = {}) {
    return {
        chartActions: {
            clearCharts: vi.fn<() => void>(),
            requestRerender: vi.fn<() => void>(),
        },
        chartPerformanceMonitor: {
            getSummary: vi.fn<() => unknown>(() => ({ renderCount: 0 })),
        },
        chartSettingsManager: {
            getFieldVisibility: vi.fn<(field: string) => unknown>(
                () => "visible"
            ),
            getSettings: vi.fn<() => unknown>(() => ({})),
            setFieldVisibility:
                vi.fn<(field: string, visibility: unknown) => unknown>(),
        },
        chartState: {},
        debounce: vi.fn<(callback: () => void, delay: number) => () => unknown>(
            (callback) => callback
        ),
        exportChartsWithState: vi.fn<() => void>(),
        formatChartFields: ["speed", "heart_rate"],
        getActiveTab: vi.fn<() => unknown>(() => "chart"),
        getChartRenderState: vi.fn<() => unknown>(() => ({
            isRendered: true,
            renderedCount: 2,
        })),
        getChartStatus: vi.fn<() => unknown>(() => ({ ready: true })),
        getComputedStateManager: vi.fn<() => unknown>(() => ({})),
        getPerformanceMetrics: vi.fn<() => unknown>(() => ({
            renderTimes: { chart: 17 },
        })),
        getStateHistory: vi.fn<() => unknown>(() => [{ path: "charts" }]),
        initializeChartStateManagement: vi.fn<() => void>(),
        isWindowAvailable: true,
        refreshChartsIfNeeded: vi.fn<() => void>(),
        resetChartNotificationState: vi.fn<() => void>(),
        ...overrides,
    };
}

describe(exposeChartDevTools, () => {
    it("exposes state history without arbitrary state access helpers", () => {
        expect.assertions(3);

        const getStateHistory = vi.fn<() => unknown>(() => [
            { path: "charts", source: "test" },
        ]);

        exposeChartDevTools(createDependencies({ getStateHistory }));

        const devTools = getRegisteredChartDevTools();
        const readHistory = devTools?.["getStateHistory"];

        expect(readHistory).toBeTypeOf("function");
        expect((readHistory as () => unknown)()).toStrictEqual([
            { path: "charts", source: "test" },
        ]);
        expect(devTools).not.toMatchObject({
            getState: expect.any(Function),
            setState: expect.any(Function),
            subscribe: expect.any(Function),
        });
    });

    it("builds dumpState from typed read-only snapshots", () => {
        expect.assertions(8);

        const getActiveTab = vi.fn<() => unknown>(() => "chart");
        const getChartRenderState = vi.fn<() => unknown>(() => ({
            isRendering: false,
        }));
        const getPerformanceMetrics = vi.fn<() => unknown>(() => ({
            renderTimes: { chart: 23 },
        }));
        const chartSettingsManager = {
            getFieldVisibility: vi.fn<(field: string) => unknown>(
                () => "visible"
            ),
            getSettings: vi.fn<() => unknown>(() => ({ maxPoints: 5000 })),
            setFieldVisibility:
                vi.fn<(field: string, visibility: unknown) => unknown>(),
        };

        exposeChartDevTools(
            createDependencies({
                chartSettingsManager,
                getActiveTab,
                getChartRenderState,
                getPerformanceMetrics,
            })
        );

        const devTools = getRegisteredChartDevTools();
        const dumpState = devTools?.["dumpState"] as (() => {
            activeTab: unknown;
            charts: unknown;
            performance: unknown;
            settings: unknown;
        }) | undefined;

        expect(dumpState).toBeTypeOf("function");
        expect(dumpState?.()).toMatchObject({
            activeTab: "chart",
            charts: { isRendering: false },
            performance: { renderTimes: { chart: 23 } },
            settings: { maxPoints: 5000 },
        });
        expect(getActiveTab).toHaveBeenCalledOnce();
        expect(getChartRenderState).toHaveBeenCalledOnce();
        expect(getPerformanceMetrics).toHaveBeenCalledOnce();
        expect(chartSettingsManager.getSettings).toHaveBeenCalledOnce();
        expect(devTools).not.toHaveProperty("setState");
        expect(devTools).not.toHaveProperty("subscribe");
    });

    it("skips registration when the renderer window is unavailable", () => {
        expect.assertions(1);

        exposeChartDevTools(createDependencies({ isWindowAvailable: false }));

        expect(getRegisteredChartDevTools()).toBeNull();
    });
});
