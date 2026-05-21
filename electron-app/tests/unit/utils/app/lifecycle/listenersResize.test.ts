import { describe, expect, it, vi } from "vitest";
import { registerChartResizeListener } from "../../../../../utils/app/lifecycle/listenersResize.js";

type ResizeListenerTestGlobal = typeof globalThis & {
    Chart?: { getChart?: (canvas: HTMLCanvasElement) => unknown };
    ChartUpdater?: { updateCharts?: (reason: string) => void };
    renderChart?: () => void;
    renderChartJS?: () => Promise<boolean> | void;
};

function cleanupFixture(cleanupCallbacks: Array<() => void> = []): void {
    for (const cleanup of cleanupCallbacks.splice(0)) {
        cleanup();
    }

    const chartGlobal = globalThis as ResizeListenerTestGlobal;
    delete chartGlobal.Chart;
    delete chartGlobal.ChartUpdater;
    delete chartGlobal.renderChart;
    delete chartGlobal.renderChartJS;
    Reflect.deleteProperty(document, "fullscreenElement");
    document.body.replaceChildren();
    vi.restoreAllMocks();
}

function createTab(id: string, active: boolean): HTMLElement {
    const tab = document.createElement("section");
    tab.id = id;
    if (active) {
        tab.classList.add("active");
    }
    document.body.append(tab);

    return tab;
}

function setFullscreenElement(element: Element | null): void {
    Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: element,
    });
}

describe(registerChartResizeListener, () => {
    it("debounces chart updates while a chart tab is active", () => {
        expect.assertions(4);

        const cleanupCallbacks: Array<() => void> = [];

        try {
            vi.useFakeTimers();
            createTab("tab_chart", true);
            const updateCharts = vi.fn<(reason: string) => void>();
            (globalThis as ResizeListenerTestGlobal).ChartUpdater = {
                updateCharts,
            };

            registerChartResizeListener({ cleanupCallbacks });
            window.dispatchEvent(new Event("resize"));
            window.dispatchEvent(new Event("resize"));

            expect(cleanupCallbacks).toHaveLength(1);
            expect(vi.getTimerCount()).toBe(1);

            vi.advanceTimersByTime(199);

            expect(updateCharts).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);

            expect(updateCharts).toHaveBeenCalledExactlyOnceWith(
                "window-resize"
            );
        } finally {
            cleanupFixture(cleanupCallbacks);
            vi.useRealTimers();
        }
    });

    it("resizes existing charts during fullscreen without re-rendering", () => {
        expect.assertions(4);

        const cleanupCallbacks: Array<() => void> = [];

        try {
            vi.useFakeTimers();
            const chartTab = createTab("tab_chartjs", true);
            setFullscreenElement(chartTab);
            const canvas = document.createElement("canvas");
            canvas.className = "chart-canvas";
            document.body.append(canvas);
            let resizeCount = 0;
            const updateCharts = vi.fn<(reason: string) => void>();
            (globalThis as ResizeListenerTestGlobal).Chart = {
                getChart: () => ({
                    resize: () => {
                        resizeCount += 1;
                    },
                }),
            };
            (globalThis as ResizeListenerTestGlobal).ChartUpdater = {
                updateCharts,
            };

            registerChartResizeListener({ cleanupCallbacks });
            window.dispatchEvent(new Event("resize"));

            vi.advanceTimersByTime(16);

            expect({ resizeCount }).toStrictEqual({ resizeCount: 1 });

            vi.advanceTimersByTime(104);

            expect({ resizeCount }).toStrictEqual({ resizeCount: 2 });

            expect(updateCharts).not.toHaveBeenCalled();

            expect(cleanupCallbacks).toHaveLength(1);
        } finally {
            cleanupFixture(cleanupCallbacks);
            vi.useRealTimers();
        }
    });

    it("cancels pending fullscreen resize work on cleanup", () => {
        expect.assertions(2);

        const cleanupCallbacks: Array<() => void> = [];

        try {
            vi.useFakeTimers();
            const chartTab = createTab("tab_chart", true);
            setFullscreenElement(chartTab);
            const canvas = document.createElement("canvas");
            canvas.className = "chart-canvas";
            document.body.append(canvas);
            let resizeCount = 0;
            (globalThis as ResizeListenerTestGlobal).Chart = {
                getChart: () => ({
                    resize: () => {
                        resizeCount += 1;
                    },
                }),
            };

            registerChartResizeListener({ cleanupCallbacks });
            window.dispatchEvent(new Event("resize"));

            cleanupFixture(cleanupCallbacks);
            vi.advanceTimersByTime(120);

            expect({ resizeCount }).toStrictEqual({ resizeCount: 0 });

            expect(cleanupCallbacks).toHaveLength(0);
        } finally {
            cleanupFixture(cleanupCallbacks);
            vi.useRealTimers();
        }
    });
});
