import { describe, expect, it, vi } from "vitest";

const createGlobalChartStatusIndicatorMock = vi.hoisted(() =>
    vi.fn<() => HTMLElement | null>()
);

vi.mock(
    import("../../../../../electron-app/utils/charts/components/createGlobalChartStatusIndicator.js"),
    () => ({
        createGlobalChartStatusIndicator: createGlobalChartStatusIndicatorMock,
    })
);

import { updateGlobalChartStatusIndicator } from "../../../../../electron-app/utils/charts/core/updateGlobalChartStatusIndicator.js";

function createIndicator(): HTMLElement {
    const indicator = document.createElement("div");
    indicator.id = "global-chart-status";
    return indicator;
}

function resetTestState(): void {
    vi.restoreAllMocks();
    createGlobalChartStatusIndicatorMock.mockReset();
    document.body.replaceChildren();
}

describe(updateGlobalChartStatusIndicator, () => {
    it("returns false when the indicator factory cannot create an element", () => {
        expect.assertions(2);

        resetTestState();
        createGlobalChartStatusIndicatorMock.mockReturnValue(null);
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect([updateGlobalChartStatusIndicator()]).toStrictEqual([false]);
        expect(warnSpy).toHaveBeenCalledWith(
            "[ChartStatusUpdater] Failed to create global chart status indicator"
        );

        resetTestState();
    });

    it("replaces an existing status indicator", () => {
        expect.assertions(4);

        resetTestState();
        const container = document.createElement("section"),
            existingIndicator = createIndicator(),
            newIndicator = createIndicator(),
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        container.append(existingIndicator);
        document.body.append(container);
        createGlobalChartStatusIndicatorMock.mockReturnValue(newIndicator);

        expect([updateGlobalChartStatusIndicator()]).toStrictEqual([true]);
        expect([container.contains(existingIndicator)]).toStrictEqual([false]);
        expect(container.firstElementChild).toBe(newIndicator);
        expect(logSpy).toHaveBeenCalledWith(
            "[ChartStatusUpdater] Replaced existing status indicator"
        );

        resetTestState();
    });

    it("appends a new status indicator to the preferred status container", () => {
        expect.assertions(3);

        resetTestState();
        const container = document.createElement("section"),
            newIndicator = createIndicator(),
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        container.id = "global-chart-status-container";
        document.body.append(container);
        createGlobalChartStatusIndicatorMock.mockReturnValue(newIndicator);

        expect([updateGlobalChartStatusIndicator()]).toStrictEqual([true]);
        expect(container.firstElementChild).toBe(newIndicator);
        expect(logSpy).toHaveBeenCalledWith(
            "[ChartStatusUpdater] Appended new status indicator to container"
        );

        resetTestState();
    });

    it("falls back to document body when the preferred container is missing", () => {
        expect.assertions(2);

        resetTestState();
        const newIndicator = createIndicator();
        createGlobalChartStatusIndicatorMock.mockReturnValue(newIndicator);
        vi.spyOn(console, "log").mockImplementation(() => {});

        expect([updateGlobalChartStatusIndicator()]).toStrictEqual([true]);
        expect(document.body.firstElementChild).toBe(newIndicator);

        resetTestState();
    });

    it("appends to a fallback container when replacing a detached existing indicator fails", () => {
        expect.assertions(4);

        resetTestState();
        const container = document.createElement("section"),
            detachedExistingIndicator = createIndicator(),
            newIndicator = document.createElement("div"),
            warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {}),
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        container.id = "global-chart-status-container";
        newIndicator.className = "status-replacement";
        document.body.append(container);
        createGlobalChartStatusIndicatorMock.mockReturnValue(newIndicator);
        const querySelector = document.querySelector.bind(document);
        vi.spyOn(document, "querySelector").mockImplementation(
            (selector: string) =>
                selector === "#global-chart-status"
                    ? detachedExistingIndicator
                    : querySelector(selector)
        );

        expect([updateGlobalChartStatusIndicator()]).toStrictEqual([true]);
        expect(container.firstElementChild).toBe(newIndicator);
        expect(warnSpy).toHaveBeenCalledWith(
            "[ChartStatusUpdater] Existing indicator has no parent node"
        );
        expect(logSpy).toHaveBeenCalledWith(
            "[ChartStatusUpdater] Appended new status indicator to container"
        );

        resetTestState();
    });

    it("returns false when the factory throws", () => {
        expect.assertions(2);

        resetTestState();
        const error = new Error("factory failed"),
            errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        createGlobalChartStatusIndicatorMock.mockImplementation(() => {
            throw error;
        });

        expect([updateGlobalChartStatusIndicator()]).toStrictEqual([false]);
        expect(errorSpy).toHaveBeenCalledWith(
            "[ChartStatusUpdater] Error updating global chart status indicator:",
            error
        );

        resetTestState();
    });
});
