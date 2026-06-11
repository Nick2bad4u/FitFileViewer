// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { resetChartListenerStateForTests } from "../../../../../electron-app/utils/charts/core/chartListenerState.js";
import { registerChartRequestListener } from "../../../../../electron-app/utils/charts/core/renderChartRequestListener.js";
import type { RenderChartRequestListenerRuntime } from "../../../../../electron-app/utils/charts/core/renderChartRequestListenerRuntime.js";

function createRuntime(
    container: HTMLElement
): RenderChartRequestListenerRuntime & {
    listener?: EventListenerOrEventListenerObject;
} {
    const runtime: RenderChartRequestListenerRuntime & {
        listener?: EventListenerOrEventListenerObject;
    } = {
        addChartRequestListener: vi.fn(
            (listener: EventListenerOrEventListenerObject) => {
                runtime.listener = listener;
            }
        ),
        getFallbackChartContainer: vi.fn(() => container),
        isCustomEvent: (event: Event): event is CustomEvent<unknown> =>
            event instanceof CustomEvent,
        querySelector: () => null,
    };

    return runtime;
}

function dispatchCapturedListener(
    listener: EventListenerOrEventListenerObject | undefined,
    event: Event
): void {
    if (typeof listener === "function") {
        listener(event);
        return;
    }

    listener?.handleEvent(event);
}

describe("registerChartRequestListener", () => {
    afterEach(() => {
        resetChartListenerStateForTests();
        vi.restoreAllMocks();
    });

    it("delegates request events to the chart state manager when available", () => {
        expect.assertions(5);

        const container = document.createElement("section");
        const debouncedRender = vi.fn<(reason: string) => void>((reason) => {
            container.dataset.debouncedReason = reason;
        });
        const renderChart = vi.fn<(container: HTMLElement) => unknown>();
        const runtime = createRuntime(container);
        vi.spyOn(console, "log").mockImplementation(() => {});

        registerChartRequestListener({
            getChartStateManager: () => ({ debouncedRender }),
            renderChart,
            runtime,
        });
        dispatchCapturedListener(
            runtime.listener,
            new CustomEvent("ffv:request-render-charts", {
                detail: { reason: "settings-change" },
            })
        );

        expect(container.dataset.debouncedReason).toBe("settings-change");
        expect(runtime.addChartRequestListener).toHaveBeenCalledWith(
            expect.any(Function),
            { signal: expect.any(AbortSignal) }
        );
        expect(debouncedRender).toHaveBeenCalledWith("settings-change");
        expect(runtime.getFallbackChartContainer).not.toHaveBeenCalled();
        expect(renderChart).not.toHaveBeenCalled();
    });

    it("renders against the runtime fallback container when no manager is available", async () => {
        expect.assertions(4);

        const container = document.createElement("section");
        const renderChart = vi.fn<(container: HTMLElement) => unknown>(
            (target) => {
                target.dataset.rendered = "true";
            }
        );
        const runtime = createRuntime(container);
        vi.spyOn(console, "log").mockImplementation(() => {});

        registerChartRequestListener({
            getChartStateManager: () => null,
            renderChart,
            runtime,
        });
        dispatchCapturedListener(
            runtime.listener,
            new Event("ffv:request-render-charts")
        );
        await Promise.resolve();

        expect(container.dataset.rendered).toBe("true");
        expect(runtime.getFallbackChartContainer).toHaveBeenCalledOnce();
        expect(renderChart).toHaveBeenCalledOnce();
        expect(renderChart).toHaveBeenCalledWith(container);
    });
});
