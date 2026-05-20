import { describe, expect, it, vi } from "vitest";

type ChartStateManagerMock = {
    clearChartState: ReturnType<typeof vi.fn<() => void>>;
    debouncedRender?: ReturnType<typeof vi.fn<(reason?: string) => void>>;
    forceRender: ReturnType<typeof vi.fn<(reason?: string) => void>>;
    getChartInfo: ReturnType<typeof vi.fn<() => object>>;
    handleThemeChange?: ReturnType<typeof vi.fn<(theme?: string) => void>>;
    isInitialized: boolean;
};

type ChartUpdaterTestGlobal = typeof globalThis & {
    _chartjsInstances?: Array<{ destroy?: () => void }>;
    renderChartJS?: unknown;
};

const clearChartStateMock = vi.hoisted(() => vi.fn<() => void>());
const debouncedRenderMock = vi.hoisted(() =>
    vi.fn<(reason?: string) => void>()
);
const forceRenderMock = vi.hoisted(() =>
    vi.fn<(reason?: string) => void>()
);
const getChartInfoMock = vi.hoisted(() => vi.fn<() => object>());
const handleThemeChangeMock = vi.hoisted(() =>
    vi.fn<(theme?: string) => void>()
);

const chartStateManagerMock = vi.hoisted<ChartStateManagerMock>(() => ({
    clearChartState: clearChartStateMock,
    debouncedRender: debouncedRenderMock,
    forceRender: forceRenderMock,
    getChartInfo: getChartInfoMock,
    handleThemeChange: handleThemeChangeMock,
    isInitialized: true,
}));

const renderChartJSMock = vi.hoisted(() =>
    vi.fn<(container?: HTMLElement | null) => Promise<boolean>>()
);

vi.mock(import("../../../../../utils/charts/core/chartStateManager.js"), () => ({
    chartStateManager: chartStateManagerMock,
    default: chartStateManagerMock,
}));

vi.mock(import("../../../../../utils/charts/core/renderChartJS.js"), () => ({
    renderChartJS: renderChartJSMock,
}));

import {
    getChartUpdateSystemStatus,
    isModernChartSystemAvailable,
    updateCharts,
    updateChartsForDataChange,
    updateChartsForSettingChange,
    updateChartsForThemeChange,
} from "../../../../../utils/charts/core/chartUpdater.js";

const testGlobal = globalThis as ChartUpdaterTestGlobal;

function resetMocks(): void {
    chartStateManagerMock.debouncedRender = debouncedRenderMock;
    chartStateManagerMock.handleThemeChange = handleThemeChangeMock;
    chartStateManagerMock.isInitialized = true;
    clearChartStateMock.mockClear();
    debouncedRenderMock.mockClear();
    forceRenderMock.mockClear();
    getChartInfoMock.mockClear();
    handleThemeChangeMock.mockClear();
    renderChartJSMock.mockReset();
    delete testGlobal._chartjsInstances;
    delete testGlobal.renderChartJS;
}

describe("chartUpdater", () => {
    it("reports modern chart system availability from the initialized manager", () => {
        expect.assertions(3);

        resetMocks();
        testGlobal.renderChartJS = () => true;

        const status = getChartUpdateSystemStatus();

        expect({
            available: isModernChartSystemAvailable(),
        }).toStrictEqual({ available: true });
        expect(status).toMatchObject({
            chartStateManager: true,
            globalRenderChartJS: true,
            modernSystemAvailable: true,
            renderChartJSAvailable: true,
        });
        expect(status.timestamp).toBeTypeOf("string");

        delete testGlobal.renderChartJS;
    });

    it("uses the chart state manager for regular chart updates", async () => {
        expect.assertions(3);

        resetMocks();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const result = await updateCharts("manual");

        expect({ result }).toStrictEqual({ result: true });
        expect(chartStateManagerMock.debouncedRender).toHaveBeenCalledWith(
            "manual"
        );
        expect(renderChartJSMock).not.toHaveBeenCalled();

        logSpy.mockRestore();
    });

    it("builds data and setting change reasons", async () => {
        expect.assertions(4);

        resetMocks();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        const container = document.createElement("div");

        const dataChangeResult = await updateChartsForDataChange({
                recordMesgs: [],
            }),
            settingChangeResult = await updateChartsForSettingChange(
                "animation",
                "fast",
                container
            );

        expect({ result: dataChangeResult }).toStrictEqual({ result: true });
        expect({ result: settingChangeResult }).toStrictEqual({
            result: true,
        });
        expect(chartStateManagerMock.debouncedRender).toHaveBeenCalledWith(
            "Data change: new data loaded"
        );
        expect(chartStateManagerMock.debouncedRender).toHaveBeenCalledWith(
            "Setting change: animation = fast"
        );

        logSpy.mockRestore();
    });

    it("uses the chart state manager for theme changes", async () => {
        expect.assertions(2);

        resetMocks();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const result = await updateChartsForThemeChange("dark");

        expect({ result }).toStrictEqual({ result: true });
        expect(chartStateManagerMock.handleThemeChange).toHaveBeenCalledWith(
            "dark"
        );

        logSpy.mockRestore();
    });

    it("falls back to direct rendering when the manager cannot render", async () => {
        expect.assertions(3);

        resetMocks();
        chartStateManagerMock.debouncedRender = undefined;
        renderChartJSMock.mockResolvedValue(true);
        const container = document.createElement("div"),
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {}),
            warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const result = await updateCharts("fallback", container);

        expect({ result }).toStrictEqual({ result: true });
        expect(renderChartJSMock).toHaveBeenCalledWith(container);
        expect(chartStateManagerMock.debouncedRender).toBeUndefined();

        logSpy.mockRestore();
        warnSpy.mockRestore();
    });

    it("destroys existing chart instances before theme fallback rendering", async () => {
        expect.assertions(4);

        resetMocks();
        chartStateManagerMock.handleThemeChange = undefined;
        const destroy = vi.fn<() => void>();
        testGlobal._chartjsInstances = [{ destroy }];
        renderChartJSMock.mockResolvedValue(true);
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {}),
            warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const result = await updateChartsForThemeChange("contrast");

        expect({ result }).toStrictEqual({ result: true });
        expect(destroy).toHaveBeenCalledOnce();
        expect(testGlobal._chartjsInstances).toStrictEqual([]);
        expect(renderChartJSMock).toHaveBeenCalledWith();

        logSpy.mockRestore();
        warnSpy.mockRestore();
    });
});
