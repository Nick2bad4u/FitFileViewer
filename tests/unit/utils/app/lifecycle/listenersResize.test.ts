import { describe, expect, it, vi } from "vitest";

const updateChartsMock = vi.hoisted(() =>
    vi.fn<(reason: string) => Promise<boolean>>(() => Promise.resolve(true))
);

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartUpdater.js"),
    () => ({
        updateCharts: updateChartsMock,
    })
);

import { registerChartResizeListener } from "../../../../../electron-app/utils/app/lifecycle/listenersResize.js";
import {
    clearChartInstanceRegistryForTests,
    registerChartInstance,
} from "../../../../../electron-app/utils/charts/core/chartInstanceRegistry.js";

function cleanupFixture(cleanupCallbacks: Array<() => void> = []): void {
    for (const cleanup of cleanupCallbacks.splice(0)) {
        cleanup();
    }

    clearChartInstanceRegistryForTests();
    updateChartsMock.mockClear();
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

            registerChartResizeListener({ cleanupCallbacks });
            window.dispatchEvent(new Event("resize"));
            window.dispatchEvent(new Event("resize"));

            expect(cleanupCallbacks).toHaveLength(1);
            expect(vi.getTimerCount()).toBe(1);

            vi.advanceTimersByTime(199);

            expect(updateChartsMock).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);

            expect(updateChartsMock).toHaveBeenCalledExactlyOnceWith(
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
            registerChartInstance({
                canvas,
                resize: () => {
                    resizeCount += 1;
                },
            });

            registerChartResizeListener({ cleanupCallbacks });
            window.dispatchEvent(new Event("resize"));

            vi.advanceTimersByTime(16);

            expect({ resizeCount }).toStrictEqual({ resizeCount: 1 });

            vi.advanceTimersByTime(104);

            expect({ resizeCount }).toStrictEqual({ resizeCount: 2 });

            expect(updateChartsMock).not.toHaveBeenCalled();

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
            registerChartInstance({
                canvas,
                resize: () => {
                    resizeCount += 1;
                },
            });

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

    it("resizes registered charts without Chart.js globals", () => {
        expect.assertions(4);

        const cleanupCallbacks: Array<() => void> = [];

        try {
            vi.useFakeTimers();
            const chartTab = createTab("tab_chartjs", true);
            setFullscreenElement(chartTab);
            const canvas = document.createElement("canvas");
            canvas.className = "chart-canvas";
            document.body.append(canvas);
            const resize = vi.fn<() => void>();
            registerChartInstance({ canvas, resize });

            registerChartResizeListener({ cleanupCallbacks });
            window.dispatchEvent(new Event("resize"));

            vi.advanceTimersByTime(120);

            expect(resize).toHaveBeenCalledTimes(2);
            expect(Reflect.has(globalThis, "Chart")).toBe(false);
            expect(updateChartsMock).not.toHaveBeenCalled();
            expect(cleanupCallbacks).toHaveLength(1);
        } finally {
            cleanupFixture(cleanupCallbacks);
            vi.useRealTimers();
        }
    });
});
