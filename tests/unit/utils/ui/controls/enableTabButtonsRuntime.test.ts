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

    it("creates mutation observers from the injected constructor", () => {
        expect.assertions(3);

        const observe = vi.fn();
        const constructor = vi.fn(function MutationObserverMock(
            callback: MutationCallback
        ) {
            return { callback, observe };
        }) as unknown as MutationObserverConstructorLike;
        const callback = vi.fn<MutationCallback>();
        const runtime = getEnableTabButtonsRuntime({
            getMutationObserver: () => constructor,
        });

        const observer = runtime.createMutationObserver(callback);

        expect(observer?.observe).toBe(observe);
        expect(constructor).toHaveBeenCalledWith(callback);
        expect(constructor).toHaveBeenCalledOnce();
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
        expect.assertions(6);

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
        const callback = vi.fn<MutationCallback>();
        const runtime = getEnableTabButtonsRuntime({
            getClearTimeout: () => clearTimeoutMock,
            getMutationObserver: () => primaryConstructor,
            getSetTimeout: () => setTimeoutMock,
            isRendererScope: () => true,
        });

        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);
        const observer = runtime.createMutationObserver(callback);

        expect(runtime.isWindowAvailable()).toBe(true);
        expect(observer?.observe).toBe(observe);
        expect(primaryConstructor).toHaveBeenCalledWith(callback);
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

    it("ignores retired compatibility and legacy direct runtime properties", () => {
        expect.assertions(9);

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
            getCompatibilityMutationObserver: () => compatibilityConstructor,
            setTimeout: setTimeoutMock,
        } as unknown as EnableTabButtonsRuntimeScope);

        expect(runtime.createMutationObserver(callback)).toBeUndefined();
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
        expect("createCompatibilityMutationObserver" in runtime).toStrictEqual(
            false
        );
        expect(
            "getCompatibilityMutationObserver" in
                ({} as EnableTabButtonsRuntimeScope)
        ).toStrictEqual(false);
    });
});
