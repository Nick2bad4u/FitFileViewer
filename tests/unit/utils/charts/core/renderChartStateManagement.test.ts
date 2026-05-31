import { afterEach, describe, expect, it, vi } from "vitest";

import {
    initializeChartStateManagement,
    refreshChartsIfNeeded,
} from "../../../../../electron-app/utils/charts/core/renderChartStateManagement.js";
import type { MiddlewareDefinition } from "../../../../../electron-app/utils/state/core/stateMiddleware.js";

type ChartSummaryState = {
    hasValidData: boolean;
    isRendered: boolean;
    renderableFields: string[];
};

describe("renderChartStateManagement", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("initializes charts state, computed values, and render middleware", async () => {
        expect.hasAssertions();

        const consoleLog = vi
            .spyOn(console, "log")
            .mockImplementation(() => {});
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const computedValues = new Map<string, () => unknown>();
        const register =
            vi.fn<(key: string, middleware: MiddlewareDefinition) => void>();
        const notify = vi.fn<(message: string, type: string) => void>();
        const updateState =
            vi.fn<(path: string, value: unknown, options: unknown) => void>();
        const getChartSummaryState = vi.fn<() => ChartSummaryState>(() => ({
            hasValidData: true,
            isRendered: false,
            renderableFields: ["heart_rate", "power"],
        }));
        const getState = vi.fn<(path: string) => unknown>((path) => {
            if (path === "globalData") {
                return {
                    recordMesgs: [{ heart_rate: 120 }],
                };
            }
            if (path === "charts.renderedCount") return 3;
            if (path === "charts.lastRenderTime") return 1234;
        });

        initializeChartStateManagement({
            getChartSummaryState,
            getComputedStateManager: () => ({
                define: (key, compute) => {
                    computedValues.set(key, compute);
                },
            }),
            getState,
            middlewareManager: {
                has: () => false,
                register,
            },
            notify,
            updateState,
        });

        expect(updateState).toHaveBeenCalledWith(
            "charts",
            expect.objectContaining({
                controlsVisible: true,
                isRendered: false,
                selectedChart: "elevation",
            }),
            {
                merge: true,
                source: "initializeChartStateManagement",
            }
        );
        expect(computedValues.get("charts.hasData")?.()).toBe(true);
        expect(computedValues.get("charts.renderableFieldCount")?.()).toBe(2);
        expect(computedValues.get("charts.summary")?.()).toEqual({
            chartCount: 3,
            fieldCount: 2,
            hasData: true,
            isRendered: false,
            lastRender: 1234,
        });
        expect(register).toHaveBeenCalledWith(
            "chart-render",
            expect.objectContaining({
                afterSet: expect.any(Function),
                beforeSet: expect.any(Function),
                onError: expect.any(Function),
            })
        );

        const middleware = register.mock.calls[0]?.[1] as MiddlewareDefinition;
        const context = { path: "charts", value: {} };
        expect(middleware.beforeSet(context)).toBe(context);
        expect(middleware.afterSet(context)).toBe(context);
        middleware.onError(new Error("render failed"), context);
        await Promise.resolve();

        expect(notify).toHaveBeenCalledWith("Chart rendering failed", "error");
        expect(consoleLog).toHaveBeenCalledWith(
            "[ChartJS] Chart state management initialized successfully"
        );
        expect(consoleError).toHaveBeenCalledWith(
            "[ChartJS] Chart render action failed:",
            expect.any(Error),
            context
        );
    });

    it("does not register duplicate chart render middleware", () => {
        expect.hasAssertions();

        const computedValues = new Map<string, () => unknown>();
        const register =
            vi.fn<(key: string, middleware: MiddlewareDefinition) => void>();

        initializeChartStateManagement({
            getChartSummaryState: () => ({
                hasValidData: false,
                isRendered: false,
                renderableFields: [],
            }),
            getComputedStateManager: () => ({
                define: (key, compute) => {
                    computedValues.set(key, compute);
                },
            }),
            getState: () => undefined,
            middlewareManager: {
                has: () => true,
                register,
            },
            notify: vi.fn<(message: string, type: string) => void>(),
            updateState:
                vi.fn<
                    (path: string, value: unknown, options: unknown) => void
                >(),
        });

        expect(register).not.toHaveBeenCalled();
        expect(computedValues.has("charts.hasData")).toBe(true);
        expect(computedValues.has("charts.renderableFieldCount")).toBe(true);
    });

    it("requests refresh only when chart data is valid and rendering is idle", () => {
        expect.hasAssertions();

        const requestRerender = vi.fn<(reason: string) => void>();

        expect(
            refreshChartsIfNeeded({
                hasValidData: () => true,
                isRendering: () => false,
                requestRerender,
            })
        ).toBe(true);
        expect(requestRerender).toHaveBeenCalledWith(
            "Manual refresh requested"
        );

        requestRerender.mockClear();

        expect(
            refreshChartsIfNeeded({
                hasValidData: () => false,
                isRendering: () => false,
                requestRerender,
            })
        ).toBe(false);
        expect(
            refreshChartsIfNeeded({
                hasValidData: () => true,
                isRendering: () => true,
                requestRerender,
            })
        ).toBe(false);
        expect(requestRerender).not.toHaveBeenCalled();
    });
});
