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

function createUnavailableRuntimeScope(
    overrides: Partial<EnableTabButtonsDebugRuntimeScope> = {}
): EnableTabButtonsDebugRuntimeScope {
    return {
        getAbortController: () => undefined,
        getClearTimeout: () => undefined,
        getComputedStyleFunction: () => undefined,
        getSetTimeout: () => undefined,
        isRendererScope: () => false,
        ...overrides,
    };
}

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
        const runtime = getEnableTabButtonsDebugRuntime(
            createUnavailableRuntimeScope({
                getComputedStyleFunction: () => getComputedStyle,
                isRendererScope: () => true,
            })
        );

        expect(runtime.assertComputedStyleAvailable(element)).toBeUndefined();
        expect(getComputedStyle).toHaveBeenCalledWith(element);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getEnableTabButtonsDebugRuntime(
            createUnavailableRuntimeScope({
                getAbortController: () => AbortController,
            })
        );
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("creates abort controllers through the injected runtime provider", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime(
            createUnavailableRuntimeScope({
                getAbortController: () => AbortController,
            })
        );

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
        const runtime = getEnableTabButtonsDebugRuntime(
            createUnavailableRuntimeScope({
                getClearTimeout: () => clearTimeoutMock,
                getSetTimeout: () => setTimeoutMock,
            })
        );

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
        const runtime = getEnableTabButtonsDebugRuntime(
            createUnavailableRuntimeScope({
                getAbortController: () => TestAbortController,
                getClearTimeout: () => clearTimeoutMock,
                getComputedStyleFunction: () => getComputedStyle,
                getSetTimeout: () => setTimeoutMock,
                isRendererScope: () => true,
            })
        );

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
            getEnableTabButtonsDebugRuntime(createUnavailableRuntimeScope())
                .createAbortController
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

        const runtime = getEnableTabButtonsDebugRuntime(
            createUnavailableRuntimeScope()
        );

        expect(() =>
            runtime.clearTimeout(
                Symbol("timer") as unknown as BrowserTimerHandle
            )
        ).toThrow("enableTabButtonsDebug requires a clearTimeout runtime");
    });

    it("throws when timer scheduling is unavailable", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime(
            createUnavailableRuntimeScope()
        );

        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "enableTabButtonsDebug requires a setTimeout runtime"
        );
    });

    it("throws when no renderer scope is available", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime(
            createUnavailableRuntimeScope({
                getComputedStyleFunction: () => () =>
                    ({ display: "block" }) as CSSStyleDeclaration,
            })
        );

        expect(() =>
            runtime.assertComputedStyleAvailable(
                document.createElement("button")
            )
        ).toThrow("getComputedStyle not available");
    });

    it("throws when no computed-style function is available", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime(
            createUnavailableRuntimeScope({
                isRendererScope: () => true,
            })
        );

        expect(() =>
            runtime.assertComputedStyleAvailable(
                document.createElement("button")
            )
        ).toThrow("getComputedStyle not available");
    });

    it("throws when the injected abort-controller runtime is invalid", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime(
            createUnavailableRuntimeScope({
                getAbortController: () =>
                    "AbortController" as unknown as BrowserAbortControllerConstructor,
            })
        );

        expect(() => runtime.createAbortController()).toThrow(
            "enableTabButtonsDebug requires an AbortController runtime"
        );
    });

    it("throws clearly when required runtime providers are missing", () => {
        expect.assertions(5);

        expect(() =>
            getEnableTabButtonsDebugRuntime({
                getClearTimeout: () => vi.fn<BrowserClearTimeout>(),
                getComputedStyleFunction: () => undefined,
                getSetTimeout: () => vi.fn<BrowserSetTimeout>(),
                isRendererScope: () => false,
            } as unknown as EnableTabButtonsDebugRuntimeScope).createAbortController()
        ).toThrow("enableTabButtonsDebug requires an AbortController provider");
        expect(() =>
            getEnableTabButtonsDebugRuntime({
                getAbortController: () => AbortController,
                getComputedStyleFunction: () => undefined,
                getSetTimeout: () => vi.fn<BrowserSetTimeout>(),
                isRendererScope: () => false,
            } as unknown as EnableTabButtonsDebugRuntimeScope).clearTimeout(
                Symbol("timer") as unknown as BrowserTimerHandle
            )
        ).toThrow("enableTabButtonsDebug requires a clearTimeout provider");
        expect(() =>
            getEnableTabButtonsDebugRuntime({
                getAbortController: () => AbortController,
                getClearTimeout: () => vi.fn<BrowserClearTimeout>(),
                getSetTimeout: () => vi.fn<BrowserSetTimeout>(),
                isRendererScope: () => true,
            } as unknown as EnableTabButtonsDebugRuntimeScope).assertComputedStyleAvailable(
                document.createElement("button")
            )
        ).toThrow("enableTabButtonsDebug requires a getComputedStyle provider");
        expect(() =>
            getEnableTabButtonsDebugRuntime({
                getAbortController: () => AbortController,
                getClearTimeout: () => vi.fn<BrowserClearTimeout>(),
                getComputedStyleFunction: () => undefined,
                isRendererScope: () => false,
            } as unknown as EnableTabButtonsDebugRuntimeScope).setTimeout(
                vi.fn(),
                1
            )
        ).toThrow("enableTabButtonsDebug requires a setTimeout provider");
        expect(() =>
            getEnableTabButtonsDebugRuntime({
                getAbortController: () => AbortController,
                getClearTimeout: () => vi.fn<BrowserClearTimeout>(),
                getComputedStyleFunction: () => undefined,
                getSetTimeout: () => vi.fn<BrowserSetTimeout>(),
            } as unknown as EnableTabButtonsDebugRuntimeScope).assertComputedStyleAvailable(
                document.createElement("button")
            )
        ).toThrow("enableTabButtonsDebug requires an isRendererScope provider");
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
            "enableTabButtonsDebug requires an AbortController provider"
        );
        expect(() =>
            runtime.clearTimeout(
                Symbol("timer") as unknown as BrowserTimerHandle
            )
        ).toThrow("enableTabButtonsDebug requires a clearTimeout provider");
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "enableTabButtonsDebug requires a setTimeout provider"
        );
        expect(() => runtime.assertComputedStyleAvailable(element)).toThrow(
            "enableTabButtonsDebug requires a getComputedStyle provider"
        );
        expect(getComputedStyle).not.toHaveBeenCalled();
        expect(setTimeoutMock).not.toHaveBeenCalled();
        expect(clearTimeoutMock).not.toHaveBeenCalled();
        expect(runtime.assertComputedStyleAvailable).toBeTypeOf("function");
    });

    it("throws when abort-controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime(
            createUnavailableRuntimeScope()
        );

        expect(() => runtime.createAbortController()).toThrow(
            "enableTabButtonsDebug requires an AbortController runtime"
        );
    });
});
