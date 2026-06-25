// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    ChartStatusIndicatorRuntimeScope,
    ChartStatusIndicatorTimerHandle,
} from "../../../../../electron-app/utils/charts/components/chartStatusIndicatorRuntime.js";
import { getChartStatusIndicatorRuntime } from "../../../../../electron-app/utils/charts/components/chartStatusIndicatorRuntime.js";

describe("getChartStatusIndicatorRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("registers field toggle listeners through an injected runtime scope", () => {
        expect.assertions(2);

        const target = new EventTarget();
        const controller = new AbortController();
        let fieldToggleEvents = 0;
        const listener = (): void => {
            fieldToggleEvents += 1;
        };
        const runtime = getChartStatusIndicatorRuntime({
            getAddEventListener: () => target.addEventListener.bind(target),
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
            getDocument: () =>
                ({
                    addEventListener: target.addEventListener.bind(target),
                    querySelector: () => null,
                }) as unknown as Document,
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
            getAbortController: () => AbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getChartStatusIndicatorRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production timer defaults", () => {
        expect.assertions(3);

        const timer = Symbol(
            "chart-status-production-timer"
        ) as unknown as ChartStatusIndicatorTimerHandle;
        const handler = vi.fn<() => void>();
        const clearTimeoutMock = vi.fn<typeof clearTimeout>();
        const setTimeoutMock = vi.fn<typeof setTimeout>(() => timer);
        const timeoutMs = Number("90");
        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getChartStatusIndicatorRuntime();
        const timerHandle = runtime.setTimeout(handler, timeoutMs);
        runtime.clearTimeout(timerHandle);

        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
    });

    it("creates and queries DOM nodes through the injected document and constructor", () => {
        expect.assertions(7);

        const body = document.createElement("body");
        const element = document.createElement("div");
        const runtimeDocument = {
            body,
            createElement: document.createElement.bind(document),
            createTextNode: document.createTextNode.bind(document),
            querySelector: (selector: string) =>
                selector === ".status" ? element : document,
        } as unknown as Document;
        const runtime = getChartStatusIndicatorRuntime({
            getDocument: () => runtimeDocument,
            getHTMLElement: () => HTMLElement,
        });
        const createdElement = runtime.createElement("span");
        const textNode = runtime.createTextNode("Chart status");

        expect(runtime.getDocument()).toBe(runtimeDocument);
        expect(createdElement).toBeInstanceOf(HTMLSpanElement);
        expect(textNode.textContent).toBe("Chart status");
        expect(runtime.getBody()).toBe(body);
        expect(runtime.querySelector(".status")).toBe(element);
        expect(runtime.querySelector(".missing")).toBeNull();
        expect(runtime.isHTMLElement(element)).toBe(true);
    });

    it("uses browser runtime providers for production DOM defaults", () => {
        expect.assertions(6);

        document.body.replaceChildren();
        const element = document.createElement("div");
        element.className = "status";
        document.body.append(element);

        const runtime = getChartStatusIndicatorRuntime();
        const createdElement = runtime.createElement("span");
        const textNode = runtime.createTextNode("Chart status");

        expect(runtime.getDocument()).toBe(document);
        expect(runtime.getBody()).toBe(document.body);
        expect(createdElement.ownerDocument).toBe(document);
        expect(textNode.ownerDocument).toBe(document);
        expect(runtime.querySelector(".status")).toBe(element);
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
            getClearTimeout: () => clearTimeoutMock,
            getSetTimeout: () => setTimeoutMock,
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
                getViewport: () => ({
                    height: 720,
                    width: 1280,
                }),
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
                getAbortController: () =>
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

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(10);

        const target = new EventTarget();
        const element = document.createElement("div");
        const listenerController = new AbortController();
        const timer = Symbol("chart-status-timer") as unknown as ReturnType<
            typeof setTimeout
        >;
        const legacyScope = {
            AbortController,
            addEventListener: target.addEventListener.bind(target),
            clearTimeout: vi.fn<typeof clearTimeout>(),
            document: {
                body: element,
                querySelector: () => element,
            },
            HTMLElement,
            innerHeight: 720,
            innerWidth: 1280,
            setTimeout: vi.fn<typeof setTimeout>(() => timer),
        } as unknown as ChartStatusIndicatorRuntimeScope;
        const runtime = getChartStatusIndicatorRuntime(legacyScope);

        expect(() => runtime.createAbortController()).toThrow(
            "chartStatusIndicator requires an AbortController"
        );
        expect(() => runtime.getBody()).toThrow(
            "chartStatusIndicator requires a document"
        );
        expect(() => runtime.getDocument()).toThrow(
            "chartStatusIndicator requires a document"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "chartStatusIndicator requires a document"
        );
        expect(() => runtime.createTextNode("Chart status")).toThrow(
            "chartStatusIndicator requires a document"
        );
        expect(runtime.getViewport()).toStrictEqual({ height: 0, width: 0 });
        expect(runtime.isHTMLElement(element)).toBe(false);
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "chartStatusIndicator requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(timer)).toThrow(
            "chartStatusIndicator requires a clearTimeout runtime"
        );
        expect(() =>
            runtime.addChartsRenderedListener(() => undefined, {
                signal: listenerController.signal,
            })
        ).toThrow("chartStatusIndicator requires a document");
        listenerController.abort();
    });
});
