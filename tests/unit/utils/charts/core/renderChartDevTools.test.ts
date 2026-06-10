import { afterEach, describe, expect, it, vi } from "vitest";

import { exposeChartDevTools } from "../../../../../electron-app/utils/charts/core/renderChartDevTools.js";
import {
    getRegisteredChartDevTools,
    resetChartDevToolsRegistryForTests,
} from "../../../../../electron-app/utils/charts/core/chartDevToolsRegistry.js";
import type {
    StateListener,
    StateUpdateOptions,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

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
        getChartStatus: vi.fn<() => unknown>(() => ({ ready: true })),
        getComputedStateManager: vi.fn<() => unknown>(() => ({})),
        getState: vi.fn<(path: string) => unknown>(() => undefined),
        getStateHistory: vi.fn<() => unknown>(() => [{ path: "charts" }]),
        initializeChartStateManagement: vi.fn<() => void>(),
        isWindowAvailable: true,
        refreshChartsIfNeeded: vi.fn<() => void>(),
        resetChartNotificationState: vi.fn<() => void>(),
        setState:
            vi.fn<
                (
                    path: string,
                    value: unknown,
                    options?: StateUpdateOptions
                ) => void
            >(),
        subscribe: vi.fn<(path: string, callback: StateListener) => () => void>(
            () => () => undefined
        ),
        ...overrides,
    };
}

describe(exposeChartDevTools, () => {
    it("exposes state history through the typed state-history dependency", () => {
        expect.assertions(3);

        const getState = vi.fn<(path: string) => unknown>(() => undefined);
        const getStateHistory = vi.fn<() => unknown>(() => [
            { path: "charts", source: "test" },
        ]);

        exposeChartDevTools(createDependencies({ getState, getStateHistory }));

        const devTools = getRegisteredChartDevTools();
        const readHistory = devTools?.["getStateHistory"];

        expect(readHistory).toBeTypeOf("function");
        expect((readHistory as () => unknown)()).toStrictEqual([
            { path: "charts", source: "test" },
        ]);
        expect(getState).not.toHaveBeenCalledWith("__stateHistory");
    });

    it("skips registration when the renderer window is unavailable", () => {
        expect.assertions(1);

        exposeChartDevTools(createDependencies({ isWindowAvailable: false }));

        expect(getRegisteredChartDevTools()).toBeNull();
    });
});
