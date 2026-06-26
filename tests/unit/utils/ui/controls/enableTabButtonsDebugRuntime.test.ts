import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserAbortControllerConstructor,
    BrowserClearTimeout,
    BrowserSetTimeout,
    BrowserTimerHandle,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getEnableTabButtonsDebugRuntime,
    type EnableTabButtonsDebugRuntimeScope,
} from "../../../../../electron-app/utils/ui/controls/enableTabButtonsDebugRuntime.js";

describe("getEnableTabButtonsDebugRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("calls the injected computed-style function when runtime APIs are available", () => {
        expect.assertions(2);

        const element = document.createElement("button");
        const getComputedStyle = vi.fn<
            (element: Element) => CSSStyleDeclaration
        >(() => ({ display: "block" }) as CSSStyleDeclaration);
        const runtime = getEnableTabButtonsDebugRuntime({
            getComputedStyleFunction: () => getComputedStyle,
            isRendererScope: () => true,
        });

        expect(runtime.assertComputedStyleAvailable(element)).toBeUndefined();
        expect(getComputedStyle).toHaveBeenCalledWith(element);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getEnableTabButtonsDebugRuntime({
            getAbortController: () => AbortController,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("creates abort controllers through the injected runtime provider", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime({
            getAbortController: () => AbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("schedules and clears timers through injected timer functions", () => {
        expect.assertions(3);

        const timer = Symbol("timer") as unknown as BrowserTimerHandle;
        const timeoutMs = Number("30000");
        const handler = vi.fn<() => void>();
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const runtime = getEnableTabButtonsDebugRuntime({
            getClearTimeout: () => clearTimeoutMock,
            getSetTimeout: () => setTimeoutMock,
        });

        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
    });

    it("routes debug runtime dependencies through provider functions", () => {
        expect.assertions(8);

        const element = document.createElement("button");
        const style = { display: "grid" } as CSSStyleDeclaration;
        const timer = Symbol("timer") as unknown as BrowserTimerHandle;
        const timeoutMs = Number("45");
        const handler = vi.fn<() => void>();
        const getComputedStyle = vi.fn<
            (element: Element) => CSSStyleDeclaration
        >(() => style);
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        let controllerCount = 0;
        class TestAbortController extends AbortController {
            public constructor() {
                super();
                controllerCount += 1;
            }
        }
        const runtime = getEnableTabButtonsDebugRuntime({
            getAbortController: () => TestAbortController,
            getClearTimeout: () => clearTimeoutMock,
            getComputedStyleFunction: () => getComputedStyle,
            getSetTimeout: () => setTimeoutMock,
            isRendererScope: () => true,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
        expect(runtime.assertComputedStyleAvailable(element)).toBeUndefined();
        expect(getComputedStyle).toHaveBeenCalledWith(element);
        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);

        runtime.clearTimeout(timer);

        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
        expect(
            getEnableTabButtonsDebugRuntime({}).createAbortController
        ).toThrow("enableTabButtonsDebug requires an AbortController runtime");
    });

    it("uses browser runtime providers for production timer and computed-style defaults", () => {
        expect.assertions(6);

        const element = document.createElement("button");
        const timer = Symbol("timer") as unknown as BrowserTimerHandle;
        const timeoutMs = Number("45");
        const handler = vi.fn<() => void>();
        const style = { display: "contents" } as CSSStyleDeclaration;
        const getComputedStyle = vi.fn<typeof globalThis.getComputedStyle>(
            () => style
        );
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("getComputedStyle", getComputedStyle);
        vi.stubGlobal("setTimeout", setTimeoutMock);
        const runtime = getEnableTabButtonsDebugRuntime();

        expect(runtime.assertComputedStyleAvailable(element)).toBeUndefined();
        expect(getComputedStyle).toHaveBeenCalledWith(element);
        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
        expect(handler).not.toHaveBeenCalled();
    });

    it("throws when timer cleanup is unavailable", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime({});

        expect(() =>
            runtime.clearTimeout(
                Symbol("timer") as unknown as BrowserTimerHandle
            )
        ).toThrow("enableTabButtonsDebug requires a clearTimeout runtime");
    });

    it("throws when timer scheduling is unavailable", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime({});

        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "enableTabButtonsDebug requires a setTimeout runtime"
        );
    });

    it("throws when no renderer scope is available", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime({
            getComputedStyleFunction: () => () =>
                ({ display: "block" }) as CSSStyleDeclaration,
        });

        expect(() =>
            runtime.assertComputedStyleAvailable(
                document.createElement("button")
            )
        ).toThrow("getComputedStyle not available");
    });

    it("throws when no computed-style function is available", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime({
            isRendererScope: () => true,
        });

        expect(() =>
            runtime.assertComputedStyleAvailable(
                document.createElement("button")
            )
        ).toThrow("getComputedStyle not available");
    });

    it("throws when the injected abort-controller runtime is invalid", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime({
            getAbortController: () =>
                "AbortController" as unknown as BrowserAbortControllerConstructor,
        });

        expect(() => runtime.createAbortController()).toThrow(
            "enableTabButtonsDebug requires an AbortController runtime"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(8);

        const element = document.createElement("button");
        const getComputedStyle = vi.fn<
            (element: Element) => CSSStyleDeclaration
        >(() => ({ display: "flex" }) as CSSStyleDeclaration);
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(
            () => Symbol("timer") as unknown as BrowserTimerHandle
        );
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const runtime = getEnableTabButtonsDebugRuntime({
            AbortController,
            clearTimeout: clearTimeoutMock,
            getComputedStyle,
            isRendererScope: () => true,
            setTimeout: setTimeoutMock,
        } as unknown as EnableTabButtonsDebugRuntimeScope);

        expect(runtime.createAbortController).toThrow(
            "enableTabButtonsDebug requires an AbortController runtime"
        );
        expect(() =>
            runtime.clearTimeout(
                Symbol("timer") as unknown as BrowserTimerHandle
            )
        ).toThrow("enableTabButtonsDebug requires a clearTimeout runtime");
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "enableTabButtonsDebug requires a setTimeout runtime"
        );
        expect(() => runtime.assertComputedStyleAvailable(element)).toThrow(
            "getComputedStyle not available"
        );
        expect(getComputedStyle).not.toHaveBeenCalled();
        expect(setTimeoutMock).not.toHaveBeenCalled();
        expect(clearTimeoutMock).not.toHaveBeenCalled();
        expect(runtime.assertComputedStyleAvailable).toBeTypeOf("function");
    });

    it("throws when abort-controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "enableTabButtonsDebug requires an AbortController runtime"
        );
    });
});
