import { describe, expect, it, vi } from "vitest";

import {
    getEnableTabButtonsRuntime,
    type EnableTabButtonsRuntimeScope,
    type MutationObserverConstructorLike,
} from "../../../../../electron-app/utils/ui/controls/enableTabButtonsRuntime.js";

describe("getEnableTabButtonsRuntime", () => {
    it("reports renderer availability through the injected scope", () => {
        expect.assertions(2);

        expect(getEnableTabButtonsRuntime({}).isWindowAvailable()).toBe(false);
        expect(
            getEnableTabButtonsRuntime({
                isRendererScope: () => true,
            }).isWindowAvailable()
        ).toBe(true);
    });

    it("creates mutation observers from the selected injected constructor", () => {
        expect.assertions(4);

        const observe = vi.fn();
        const globalConstructor = vi.fn(function MutationObserverMock(
            callback: MutationCallback
        ) {
            return { callback, observe };
        }) as unknown as MutationObserverConstructorLike;
        const windowConstructor = vi.fn(function WindowMutationObserverMock(
            callback: MutationCallback
        ) {
            return { callback, observe: vi.fn() };
        }) as unknown as MutationObserverConstructorLike;
        const callback = vi.fn<MutationCallback>();
        const runtime = getEnableTabButtonsRuntime({
            getCompatibilityMutationObserver: () => windowConstructor,
            getMutationObserver: () => globalConstructor,
        });

        const observer = runtime.createMutationObserver(callback);

        expect(observer?.observe).toBe(observe);
        expect(globalConstructor).toHaveBeenCalledWith(callback);
        expect(windowConstructor).not.toHaveBeenCalled();
        expect(
            runtime.createCompatibilityMutationObserver(callback)
        ).toBeDefined();
    });

    it("uses the compatibility mutation observer when no primary constructor is available", () => {
        expect.assertions(2);

        const windowConstructor = vi.fn(function WindowMutationObserverMock(
            callback: MutationCallback
        ) {
            return { callback, observe: vi.fn() };
        }) as unknown as MutationObserverConstructorLike;
        const callback = vi.fn<MutationCallback>();
        const runtime = getEnableTabButtonsRuntime({
            getCompatibilityMutationObserver: () => windowConstructor,
        });

        expect(runtime.createMutationObserver(callback)).toBeDefined();
        expect(windowConstructor).toHaveBeenCalledWith(callback);
    });

    it("does not create compatibility observers when constructors match", () => {
        expect.assertions(1);

        const constructor = vi.fn(function MutationObserverMock(
            callback: MutationCallback
        ) {
            return { callback, observe: vi.fn() };
        }) as unknown as MutationObserverConstructorLike;
        const runtime = getEnableTabButtonsRuntime({
            getCompatibilityMutationObserver: () => constructor,
            getMutationObserver: () => constructor,
        });

        expect(
            runtime.createCompatibilityMutationObserver(
                vi.fn<MutationCallback>()
            )
        ).toBeUndefined();
    });

    it("returns undefined when mutation observer construction is unavailable", () => {
        expect.assertions(1);

        expect(
            getEnableTabButtonsRuntime({}).createMutationObserver(
                vi.fn<MutationCallback>()
            )
        ).toBeUndefined();
    });

    it("resolves runtime dependencies through injected provider functions", () => {
        expect.assertions(8);

        const timer = Symbol("timer") as unknown as ReturnType<
            typeof setTimeout
        >;
        const timeoutMs = Number("50");
        const handler = vi.fn<() => void>();
        const setTimeoutMock = vi.fn<typeof setTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<typeof clearTimeout>();
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
            getClearTimeout: () => clearTimeoutMock,
            getCompatibilityMutationObserver: () => compatibilityConstructor,
            getMutationObserver: () => primaryConstructor,
            getSetTimeout: () => setTimeoutMock,
            isRendererScope: () => true,
        });

        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);
        const observer = runtime.createMutationObserver(callback);
        const compatibilityObserver =
            runtime.createCompatibilityMutationObserver(callback);

        expect(runtime.isWindowAvailable()).toBe(true);
        expect(observer?.observe).toBe(observe);
        expect(compatibilityObserver).toBeDefined();
        expect(primaryConstructor).toHaveBeenCalledWith(callback);
        expect(compatibilityConstructor).toHaveBeenCalledWith(callback);
        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
    });

    it("throws when timer cleanup is unavailable", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsRuntime({});

        expect(() =>
            runtime.clearTimeout(
                Symbol("timer") as unknown as ReturnType<typeof setTimeout>
            )
        ).toThrow("enableTabButtons requires a clearTimeout runtime");
    });

    it("throws when timer scheduling is unavailable", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsRuntime({});

        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "enableTabButtons requires a setTimeout runtime"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(8);

        const timer = Symbol("timer") as unknown as ReturnType<
            typeof setTimeout
        >;
        const setTimeoutMock = vi.fn<typeof setTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<typeof clearTimeout>();
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
            setTimeout: setTimeoutMock,
        } as unknown as EnableTabButtonsRuntimeScope);

        expect(runtime.createMutationObserver(callback)).toBeUndefined();
        expect(
            runtime.createCompatibilityMutationObserver(callback)
        ).toBeUndefined();
        expect(() => runtime.clearTimeout(timer)).toThrow(
            "enableTabButtons requires a clearTimeout runtime"
        );
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "enableTabButtons requires a setTimeout runtime"
        );
        expect(primaryConstructor).not.toHaveBeenCalled();
        expect(compatibilityConstructor).not.toHaveBeenCalled();
        expect(setTimeoutMock).not.toHaveBeenCalled();
        expect(clearTimeoutMock).not.toHaveBeenCalled();
    });
});
