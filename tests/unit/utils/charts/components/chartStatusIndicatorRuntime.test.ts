// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import { getChartStatusIndicatorRuntime } from "../../../../../electron-app/utils/charts/components/chartStatusIndicatorRuntime.js";

describe("getChartStatusIndicatorRuntime", () => {
    it("registers field toggle listeners through an injected runtime scope", () => {
        expect.assertions(2);

        const target = new EventTarget();
        const controller = new AbortController();
        let fieldToggleEvents = 0;
        const listener = (): void => {
            fieldToggleEvents += 1;
        };
        const runtime = getChartStatusIndicatorRuntime({
            addEventListener: target.addEventListener.bind(target),
        });

        runtime.addFieldToggleChangedListener(listener, {
            signal: controller.signal,
        });
        target.dispatchEvent(new Event("fieldToggleChanged"));

        expect(fieldToggleEvents).toBe(1);

        controller.abort();
        target.dispatchEvent(new Event("fieldToggleChanged"));

        expect(fieldToggleEvents).toBe(1);
    });

    it("registers charts-rendered listeners through an injected document", () => {
        expect.assertions(2);

        const target = new EventTarget();
        const controller = new AbortController();
        let chartsRenderedEvents = 0;
        const listener = (): void => {
            chartsRenderedEvents += 1;
        };
        const runtime = getChartStatusIndicatorRuntime({
            document: {
                addEventListener: target.addEventListener.bind(target),
                querySelector: () => null,
            } as unknown as Document,
        });

        runtime.addChartsRenderedListener(listener, {
            signal: controller.signal,
        });
        target.dispatchEvent(new Event("chartsRendered"));

        expect(chartsRenderedEvents).toBe(1);

        controller.abort();
        target.dispatchEvent(new Event("chartsRendered"));

        expect(chartsRenderedEvents).toBe(1);
    });

    it("creates abort controllers through the injected constructor", () => {
        expect.assertions(1);

        const runtime = getChartStatusIndicatorRuntime({
            AbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("creates abort controllers through the injected document window", () => {
        expect.assertions(1);

        const runtime = getChartStatusIndicatorRuntime({ document });

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("queries html elements through the injected document and constructor", () => {
        expect.assertions(4);

        const body = document.createElement("body");
        const element = document.createElement("div");
        const runtime = getChartStatusIndicatorRuntime({
            document: {
                body,
                querySelector: (selector: string) =>
                    selector === ".status" ? element : document,
            } as unknown as Document,
            HTMLElement,
        });

        expect(runtime.getBody()).toBe(body);
        expect(runtime.querySelector(".status")).toBe(element);
        expect(runtime.querySelector(".missing")).toBeNull();
        expect(runtime.isHTMLElement(element)).toBe(true);
    });

    it("schedules and clears timers through injected timer functions", () => {
        expect.assertions(3);

        const timer = Symbol("chart-status-timer") as unknown as ReturnType<
            typeof setTimeout
        >;
        const handler = (): void => undefined;
        const clearTimeoutMock = vi.fn<typeof clearTimeout>();
        const setTimeoutMock = vi.fn<typeof setTimeout>(() => timer);
        const timeoutMs = Number("75");
        const runtime = getChartStatusIndicatorRuntime({
            clearTimeout: clearTimeoutMock,
            setTimeout: setTimeoutMock,
        });

        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
    });

    it("throws when timer cleanup is unavailable", () => {
        expect.assertions(1);

        const runtime = getChartStatusIndicatorRuntime({});

        expect(() =>
            runtime.clearTimeout(
                Symbol("chart-status-timer") as unknown as ReturnType<
                    typeof setTimeout
                >
            )
        ).toThrow("chartStatusIndicator requires a clearTimeout runtime");
    });

    it("throws when timer scheduling is unavailable", () => {
        expect.assertions(1);

        const runtime = getChartStatusIndicatorRuntime({});

        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "chartStatusIndicator requires a setTimeout runtime"
        );
    });

    it("reads viewport dimensions from an injected runtime scope", () => {
        expect.assertions(1);

        expect(
            getChartStatusIndicatorRuntime({
                innerHeight: 720,
                innerWidth: 1280,
            }).getViewport()
        ).toStrictEqual({
            height: 720,
            width: 1280,
        });
    });

    it("uses zero viewport dimensions when the scope does not provide them", () => {
        expect.assertions(1);

        expect(getChartStatusIndicatorRuntime({}).getViewport()).toStrictEqual({
            height: 0,
            width: 0,
        });
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(3);

        const runtime = getChartStatusIndicatorRuntime({});
        const runtimeWithInvalidAbortController =
            getChartStatusIndicatorRuntime({
                AbortController:
                    "AbortController" as unknown as typeof AbortController,
            });
        const listenerController = new AbortController();

        expect(() =>
            runtime.addChartsRenderedListener(() => undefined, {
                signal: listenerController.signal,
            })
        ).toThrow("chartStatusIndicator requires a document");
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow("chartStatusIndicator requires an AbortController");
        expect(() => runtime.createAbortController()).toThrow(
            "chartStatusIndicator requires an AbortController"
        );
    });
});
