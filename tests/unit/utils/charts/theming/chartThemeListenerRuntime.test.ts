// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getChartThemeListenerRuntime,
    type ChartThemeListenerRuntimeScope,
    type ChartThemeListenerTimerHandle,
} from "../../../../../electron-app/utils/charts/theming/chartThemeListenerRuntime.js";
import type {
    BrowserAbortControllerConstructor,
    BrowserClearTimeout,
    BrowserCustomEventConstructor,
    BrowserSetTimeout,
    BrowserTimerHandle,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";

const unavailableChartThemeListenerScope = {
    getAbortController: () => undefined,
    getClearTimeout: () => undefined,
    getCustomEvent: () => undefined,
    getDocument: () => undefined,
    getSetTimeout: () => undefined,
} satisfies ChartThemeListenerRuntimeScope;

describe("getChartThemeListenerRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getChartThemeListenerRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production timer defaults", () => {
        expect.assertions(3);

        const timer = Symbol(
            "theme-listener-production-timer"
        ) as unknown as BrowserTimerHandle;
        const handler = vi.fn<() => void>();
        const timeoutMs = Number("125");
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getChartThemeListenerRuntime();
        const timerHandle = runtime.setTimeout(handler, timeoutMs);
        runtime.clearTimeout(timerHandle);

        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
    });

    it("uses browser runtime providers for production document and CustomEvent defaults", () => {
        expect.assertions(4);

        const runtime = getChartThemeListenerRuntime();
        const listenerController = runtime.createAbortController();
        let observedThemeEvents = 0;

        runtime.addThemeChangeListener(
            () => {
                observedThemeEvents += 1;
            },
            { signal: listenerController.signal }
        );
        document.body.dispatchEvent(new CustomEvent("themechange"));
        listenerController.abort();
        document.body.dispatchEvent(new CustomEvent("themechange"));

        expect(observedThemeEvents).toBe(1);
        expect(listenerController.signal.aborted).toBe(true);
        expect(runtime.isCustomEvent(new CustomEvent("themechange"))).toBe(
            true
        );
        expect(runtime.isCustomEvent(new Event("themechange"))).toBe(false);
    });

    it("adds abortable themechange listeners through the injected body", () => {
        expect.assertions(2);

        const runtime = getChartThemeListenerRuntime({
            ...unavailableChartThemeListenerScope,
            getAbortController: () => AbortController,
            getDocument: () => document,
        });
        const listenerController = runtime.createAbortController();
        let observedThemeEvents = 0;

        runtime.addThemeChangeListener(
            () => {
                observedThemeEvents += 1;
            },
            { signal: listenerController.signal }
        );
        document.body.dispatchEvent(new Event("themechange"));
        listenerController.abort();
        document.body.dispatchEvent(new Event("themechange"));

        expect(observedThemeEvents).toBe(1);
        expect(listenerController.signal.aborted).toBe(true);
    });

    it("checks custom events through the injected constructor", () => {
        expect.assertions(3);

        const runtime = getChartThemeListenerRuntime({
            ...unavailableChartThemeListenerScope,
            getCustomEvent: () => CustomEvent,
            getDocument: () => document,
        });

        expect(runtime.isCustomEvent(new CustomEvent("themechange"))).toBe(
            true
        );
        expect(runtime.isCustomEvent(new Event("themechange"))).toBe(false);
        expect(
            getChartThemeListenerRuntime({
                ...unavailableChartThemeListenerScope,
                getCustomEvent: () =>
                    "CustomEvent" as unknown as BrowserCustomEventConstructor,
                getDocument: () => document,
            }).isCustomEvent(new CustomEvent("themechange"))
        ).toBe(false);
    });

    it("schedules and clears timers through injected timer functions", () => {
        expect.assertions(3);

        const timer = Symbol(
            "theme-listener-timer"
        ) as unknown as BrowserTimerHandle;
        const handler = vi.fn<() => void>();
        const timeoutMs = Number("150");
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const runtime = getChartThemeListenerRuntime({
            ...unavailableChartThemeListenerScope,
            getClearTimeout: () => clearTimeoutMock,
            getDocument: () => document,
            getSetTimeout: () => setTimeoutMock,
        });

        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getChartThemeListenerRuntime({
            ...unavailableChartThemeListenerScope,
            getDocument: () => document,
        });

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "chartThemeListener requires a setTimeout runtime"
        );
        expect(() => {
            runtime.clearTimeout(
                Symbol(
                    "theme-listener-timer"
                ) as unknown as ChartThemeListenerTimerHandle
            );
        }).toThrow("chartThemeListener requires a clearTimeout runtime");
    });

    it("does not borrow ambient constructors for explicit scopes", () => {
        expect.assertions(2);

        const body = {
            addEventListener: vi.fn(),
            ownerDocument: {},
        } as unknown as HTMLElement;
        const runtime = getChartThemeListenerRuntime({
            ...unavailableChartThemeListenerScope,
            getDocument: () => ({ body }),
        });

        expect(() => runtime.createAbortController()).toThrow(
            "chartThemeListener requires an AbortController"
        );
        expect(runtime.isCustomEvent(new CustomEvent("themechange"))).toBe(
            false
        );
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(3);

        const runtime = getChartThemeListenerRuntime(
            unavailableChartThemeListenerScope
        );
        const runtimeWithInvalidAbortController = getChartThemeListenerRuntime({
            ...unavailableChartThemeListenerScope,
            getAbortController: () =>
                "AbortController" as unknown as BrowserAbortControllerConstructor,
            getDocument: () => document,
        });
        const listenerController = new AbortController();

        expect(() =>
            runtime.addThemeChangeListener(() => undefined, {
                signal: listenerController.signal,
            })
        ).toThrow("chartThemeListener requires a document body");
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow("chartThemeListener requires an AbortController");
        expect(runtime.isCustomEvent(new Event("themechange"))).toBe(false);
    });

    it("fails clearly when runtime providers are omitted", () => {
        expect.assertions(5);

        const omittedProviderScope =
            {} as unknown as ChartThemeListenerRuntimeScope;
        const runtime = getChartThemeListenerRuntime(omittedProviderScope);
        const timer = Symbol(
            "theme-listener-timer"
        ) as unknown as ChartThemeListenerTimerHandle;

        expect(() =>
            runtime.addThemeChangeListener(() => undefined, {
                signal: new AbortController().signal,
            })
        ).toThrow("chartThemeListener requires a document provider");
        expect(() => runtime.createAbortController()).toThrow(
            "chartThemeListener requires an AbortController provider"
        );
        expect(() => runtime.isCustomEvent(new Event("themechange"))).toThrow(
            "chartThemeListener requires a CustomEvent provider"
        );
        expect(() => runtime.setTimeout(() => undefined, 1)).toThrow(
            "chartThemeListener requires a setTimeout provider"
        );
        expect(() => runtime.clearTimeout(timer)).toThrow(
            "chartThemeListener requires a clearTimeout provider"
        );
    });

    it("ignores legacy direct runtime primitive properties", () => {
        expect.assertions(10);

        let controllerCount = 0;
        class TestAbortController extends AbortController {
            public constructor() {
                super();
                controllerCount += 1;
            }
        }
        const timer = Symbol(
            "theme-listener-timer"
        ) as unknown as ChartThemeListenerTimerHandle;
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const body = {
            addEventListener: vi.fn(),
            ownerDocument: {
                defaultView: {
                    AbortController: TestAbortController,
                    CustomEvent,
                },
            },
        } as unknown as HTMLElement;
        const runtime = getChartThemeListenerRuntime({
            ...unavailableChartThemeListenerScope,
            AbortController: TestAbortController,
            clearTimeout: clearTimeoutMock,
            CustomEvent,
            document: { body },
            setTimeout: setTimeoutMock,
        } as unknown as Parameters<typeof getChartThemeListenerRuntime>[0]);
        const listenerController = new AbortController();

        expect(() =>
            runtime.addThemeChangeListener(vi.fn(), {
                signal: listenerController.signal,
            })
        ).toThrow("chartThemeListener requires a document body");
        expect(() => runtime.createAbortController()).toThrow(
            "chartThemeListener requires an AbortController"
        );
        expect(runtime.isCustomEvent(new CustomEvent("themechange"))).toBe(
            false
        );
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "chartThemeListener requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(timer)).toThrow(
            "chartThemeListener requires a clearTimeout runtime"
        );
        expect(body.addEventListener).not.toHaveBeenCalled();
        expect(controllerCount).toBe(0);
        expect(clearTimeoutMock).not.toHaveBeenCalled();
        expect(setTimeoutMock).not.toHaveBeenCalled();
        expect(listenerController.signal.aborted).toBe(false);
    });
});
