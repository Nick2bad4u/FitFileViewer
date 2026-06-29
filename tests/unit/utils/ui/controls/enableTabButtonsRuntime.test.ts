import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserClearTimeout,
    BrowserSetTimeout,
    BrowserTimerHandle,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getEnableTabButtonsRuntime,
    type EnableTabButtonsRuntimeScope,
    type MutationObserverConstructorLike,
} from "../../../../../electron-app/utils/ui/controls/enableTabButtonsRuntime.js";

function createUnavailableRuntimeScope(
    overrides: Partial<EnableTabButtonsRuntimeScope> = {}
): EnableTabButtonsRuntimeScope {
    return {
        getClearTimeout: () => undefined,
        getMutationObserver: () => undefined,
        getSetTimeout: () => undefined,
        isRendererScope: () => false,
        ...overrides,
    };
}

describe("getEnableTabButtonsRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("reports renderer availability through the injected scope", () => {
        expect.assertions(2);

        expect(
            getEnableTabButtonsRuntime(
                createUnavailableRuntimeScope()
            ).isWindowAvailable()
        ).toBe(false);
        expect(
            getEnableTabButtonsRuntime(
                createUnavailableRuntimeScope({
                    isRendererScope: () => true,
                })
            ).isWindowAvailable()
        ).toBe(true);
    });

    it("creates mutation observers from the injected constructor", () => {
        expect.assertions(3);

        const observe = vi.fn();
        const constructor = vi.fn(function MutationObserverMock(
            callback: MutationCallback
        ) {
            return { callback, observe };
        }) as unknown as MutationObserverConstructorLike;
        const callback = vi.fn<MutationCallback>();
        const runtime = getEnableTabButtonsRuntime(
            createUnavailableRuntimeScope({
                getMutationObserver: () => constructor,
            })
        );

        const observer = runtime.createMutationObserver(callback);

        expect(observer?.observe).toBe(observe);
        expect(constructor).toHaveBeenCalledWith(callback);
        expect(constructor).toHaveBeenCalledOnce();
    });

    it("returns undefined when mutation observer construction is unavailable", () => {
        expect.assertions(1);

        expect(
            getEnableTabButtonsRuntime(
                createUnavailableRuntimeScope()
            ).createMutationObserver(vi.fn<MutationCallback>())
        ).toBeUndefined();
    });

    it("resolves runtime dependencies through injected provider functions", () => {
        expect.assertions(6);

        const timer = Symbol("timer") as unknown as BrowserTimerHandle;
        const timeoutMs = Number("50");
        const handler = vi.fn<() => void>();
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const observe = vi.fn();
        const primaryConstructor = vi.fn(function MutationObserverMock(
            callback: MutationCallback
        ) {
            return { callback, observe };
        }) as unknown as MutationObserverConstructorLike;
        const callback = vi.fn<MutationCallback>();
        const runtime = getEnableTabButtonsRuntime(
            createUnavailableRuntimeScope({
                getClearTimeout: () => clearTimeoutMock,
                getMutationObserver: () => primaryConstructor,
                getSetTimeout: () => setTimeoutMock,
                isRendererScope: () => true,
            })
        );

        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);
        const observer = runtime.createMutationObserver(callback);

        expect(runtime.isWindowAvailable()).toBe(true);
        expect(observer?.observe).toBe(observe);
        expect(primaryConstructor).toHaveBeenCalledWith(callback);
        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
    });

    it("uses browser runtime providers for production timer, observer, and renderer defaults", () => {
        expect.assertions(7);

        const timer = Symbol("timer") as unknown as BrowserTimerHandle;
        const timeoutMs = Number("50");
        const handler = vi.fn<() => void>();
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const observe = vi.fn();
        const ObserverConstructor = vi.fn(function MutationObserverMock(
            callback: MutationCallback
        ) {
            return { callback, observe };
        }) as unknown as MutationObserverConstructorLike;
        const callback = vi.fn<MutationCallback>();
        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("MutationObserver", ObserverConstructor);
        vi.stubGlobal("setTimeout", setTimeoutMock);
        const runtime = getEnableTabButtonsRuntime();

        expect(runtime.isWindowAvailable()).toBe(true);
        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);
        const observer = runtime.createMutationObserver(callback);

        expect(observer?.observe).toBe(observe);
        expect(ObserverConstructor).toHaveBeenCalledWith(callback);
        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
        expect(handler).not.toHaveBeenCalled();
    });

    it("throws when timer cleanup is unavailable", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsRuntime(
            createUnavailableRuntimeScope()
        );

        expect(() =>
            runtime.clearTimeout(
                Symbol("timer") as unknown as BrowserTimerHandle
            )
        ).toThrow("enableTabButtons requires a clearTimeout runtime");
    });

    it("throws when timer scheduling is unavailable", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsRuntime(
            createUnavailableRuntimeScope()
        );

        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "enableTabButtons requires a setTimeout runtime"
        );
    });

    it("throws clearly when required runtime providers are missing", () => {
        expect.assertions(4);

        expect(() =>
            getEnableTabButtonsRuntime({
                getMutationObserver: () => undefined,
                getSetTimeout: () => vi.fn<BrowserSetTimeout>(),
                isRendererScope: () => false,
            } as unknown as EnableTabButtonsRuntimeScope).clearTimeout(
                Symbol("timer") as unknown as BrowserTimerHandle
            )
        ).toThrow("enableTabButtons requires a clearTimeout provider");
        expect(() =>
            getEnableTabButtonsRuntime({
                getClearTimeout: () => vi.fn<BrowserClearTimeout>(),
                getSetTimeout: () => vi.fn<BrowserSetTimeout>(),
                isRendererScope: () => false,
            } as unknown as EnableTabButtonsRuntimeScope).createMutationObserver(
                vi.fn<MutationCallback>()
            )
        ).toThrow("enableTabButtons requires a MutationObserver provider");
        expect(() =>
            getEnableTabButtonsRuntime({
                getClearTimeout: () => vi.fn<BrowserClearTimeout>(),
                getMutationObserver: () => undefined,
                isRendererScope: () => false,
            } as unknown as EnableTabButtonsRuntimeScope).setTimeout(vi.fn(), 1)
        ).toThrow("enableTabButtons requires a setTimeout provider");
        expect(() =>
            getEnableTabButtonsRuntime({
                getClearTimeout: () => vi.fn<BrowserClearTimeout>(),
                getMutationObserver: () => undefined,
                getSetTimeout: () => vi.fn<BrowserSetTimeout>(),
            } as unknown as EnableTabButtonsRuntimeScope).isWindowAvailable()
        ).toThrow("enableTabButtons requires an isRendererScope provider");
    });

    it("ignores retired compatibility and legacy direct runtime properties", () => {
        expect.assertions(9);

        const timer = Symbol("timer") as unknown as BrowserTimerHandle;
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const observe = vi.fn();
        const primaryConstructor = vi.fn(function MutationObserverMock(
            callback: MutationCallback
        ) {
            return { callback, observe };
        }) as unknown as MutationObserverConstructorLike;
        const compatibilityConstructor = vi.fn(
            function WindowMutationObserverMock(callback: MutationCallback) {
                return { callback, observe: vi.fn() };
            }
        ) as unknown as MutationObserverConstructorLike;
        const callback = vi.fn<MutationCallback>();
        const runtime = getEnableTabButtonsRuntime({
            MutationObserver: primaryConstructor,
            clearTimeout: clearTimeoutMock,
            compatibilityMutationObserver: compatibilityConstructor,
            getCompatibilityMutationObserver: () => compatibilityConstructor,
            setTimeout: setTimeoutMock,
        } as unknown as EnableTabButtonsRuntimeScope);

        expect(() => runtime.createMutationObserver(callback)).toThrow(
            "enableTabButtons requires a MutationObserver provider"
        );
        expect(() => runtime.clearTimeout(timer)).toThrow(
            "enableTabButtons requires a clearTimeout provider"
        );
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "enableTabButtons requires a setTimeout provider"
        );
        expect(primaryConstructor).not.toHaveBeenCalled();
        expect(compatibilityConstructor).not.toHaveBeenCalled();
        expect(setTimeoutMock).not.toHaveBeenCalled();
        expect(clearTimeoutMock).not.toHaveBeenCalled();
        expect("createCompatibilityMutationObserver" in runtime).toStrictEqual(
            false
        );
        expect(
            "getCompatibilityMutationObserver" in
                ({} as EnableTabButtonsRuntimeScope)
        ).toStrictEqual(false);
    });
});
