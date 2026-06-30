import { afterEach, describe, expect, it, vi } from "vitest";

import {
    initializeChartStateManagement,
    refreshChartsIfNeeded,
} from "../../../../../electron-app/utils/charts/core/renderChartStateManagement.js";
import type { MiddlewareDefinition } from "../../../../../electron-app/utils/state/core/stateMiddleware.js";

const hasActiveFitChartDataMock = vi.hoisted(() => vi.fn<() => boolean>());

vi.mock(
    import("../../../../../electron-app/utils/state/domain/fitChartDataState.js"),
    () => ({
        hasActiveFitChartData: hasActiveFitChartDataMock,
    })
);

type ChartSummaryState = {
    hasValidData: boolean;
    isRendered: boolean;
    renderableFields: string[];
};

describe("renderChartStateManagement", () => {
    afterEach(() => {
        hasActiveFitChartDataMock.mockReset();
        vi.restoreAllMocks();
    });

    it("initializes charts state, computed values, and render middleware", async () => {
        expect.assertions(11);

        const consoleLog = vi
            .spyOn(console, "log")
            .mockImplementation(() => {});
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const computedValues = new Map<string, () => unknown>();
        const register =
            vi.fn<(key: string, middleware: MiddlewareDefinition) => void>();
        const notify = vi.fn<(message: string, type: string) => void>();
        const initializeChartRenderState =
            vi.fn<(options: unknown) => void>();
        const getChartSummaryState = vi.fn<() => ChartSummaryState>(() => ({
            hasValidData: true,
            isRendered: false,
            renderableFields: ["heart_rate", "power"],
        }));
        hasActiveFitChartDataMock.mockReturnValue(true);
        const getLastRenderTime = vi.fn(() => 1234);
        const getRenderedCount = vi.fn(() => 3);

        initializeChartStateManagement({
            getChartSummaryState,
            getComputedStateManager: () => ({
                addComputed: (key, compute) => {
                    computedValues.set(key, compute);
                },
            }),
            getLastRenderTime,
            getRenderedCount,
            initializeChartRenderState,
            middlewareManager: {
                has: () => false,
                register,
            },
            notify,
        });

        expect(initializeChartRenderState).toHaveBeenCalledWith(
            {
                merge: true,
                source: "initializeChartStateManagement",
            }
        );
        expect({
            hasData: computedValues.get("charts.hasData")?.(),
            renderableFieldCount: computedValues.get(
                "charts.renderableFieldCount"
            )?.(),
            summary: computedValues.get("charts.summary")?.(),
        }).toStrictEqual({
            hasData: true,
            renderableFieldCount: 2,
            summary: {
                chartCount: 3,
                fieldCount: 2,
                hasData: true,
                isRendered: false,
                lastRender: 1234,
            },
        });
        expect(register).toHaveBeenCalledWith(
            "chart-render",
            expect.objectContaining({
                afterSet: expect.any(Function),
                beforeSet: expect.any(Function),
                onError: expect.any(Function),
            })
        );
        expect(getRenderedCount).toHaveBeenCalledWith();
        expect(getLastRenderTime).toHaveBeenCalledWith();

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
        expect(console.warn).not.toHaveBeenCalledWith(
            "[ChartJS] Chart render failure notification failed:",
            expect.anything()
        );
    });

    it("logs async notification failures from chart render middleware", async () => {
        expect.assertions(2);

        const consoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});
        const register =
            vi.fn<(key: string, middleware: MiddlewareDefinition) => void>();
        const notifyError = new Error("notification unavailable");

        initializeChartStateManagement({
            getChartSummaryState: () => ({
                hasValidData: true,
                isRendered: false,
                renderableFields: [],
            }),
            getComputedStateManager: () => ({
                addComputed: vi.fn<
                    (key: string, compute: () => unknown) => void
                >(),
            }),
            getLastRenderTime: () => undefined,
            getRenderedCount: () => 0,
            initializeChartRenderState: vi.fn<(options: unknown) => void>(),
            middlewareManager: {
                has: () => false,
                register,
            },
            notify: async () => {
                throw notifyError;
            },
        });

        const middleware = register.mock.calls[0]?.[1] as MiddlewareDefinition;
        middleware.onError(new Error("render failed"), {
            path: "charts",
            value: {},
        });
        await Promise.resolve();

        expect(register).toHaveBeenCalledWith(
            "chart-render",
            expect.objectContaining({ onError: expect.any(Function) })
        );
        expect(consoleWarn).toHaveBeenCalledWith(
            "[ChartJS] Chart render failure notification failed:",
            notifyError
        );
    });

    it("does not register duplicate chart render middleware", () => {
        expect.assertions(2);

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
                addComputed: (key, compute) => {
                    computedValues.set(key, compute);
                },
            }),
            getLastRenderTime: () => undefined,
            getRenderedCount: () => 0,
            initializeChartRenderState: vi.fn<(options: unknown) => void>(),
            middlewareManager: {
                has: () => true,
                register,
            },
            notify: vi.fn<(message: string, type: string) => void>(),
        });

        expect(register).not.toHaveBeenCalled();
        expect([...computedValues.keys()]).toStrictEqual([
            "charts.hasData",
            "charts.renderableFieldCount",
            "charts.summary",
        ]);
    });

    it("requests refresh only when chart data is valid and rendering is idle", () => {
        expect.assertions(2);

        const requestRerender = vi.fn<(reason: string) => void>();

        const validIdleResult = refreshChartsIfNeeded({
            hasValidData: () => true,
            isRendering: () => false,
            requestRerender,
        });

        expect({
            requestReason: requestRerender.mock.calls[0]?.[0],
            result: validIdleResult,
        }).toStrictEqual({
            requestReason: "Manual refresh requested",
            result: true,
        });

        requestRerender.mockClear();

        expect({
            invalidDataResult: refreshChartsIfNeeded({
                hasValidData: () => false,
                isRendering: () => false,
                requestRerender,
            }),
            renderingResult: refreshChartsIfNeeded({
                hasValidData: () => true,
                isRendering: () => true,
                requestRerender,
            }),
            requestCount: requestRerender.mock.calls.length,
        }).toStrictEqual({
            invalidDataResult: false,
            renderingResult: false,
            requestCount: 0,
        });
    });
});
