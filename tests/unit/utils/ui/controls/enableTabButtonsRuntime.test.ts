import { describe, expect, it, vi } from "vitest";

import {
    getEnableTabButtonsRuntime,
    type MutationObserverConstructorLike,
} from "../../../../../electron-app/utils/ui/controls/enableTabButtonsRuntime.js";

describe("getEnableTabButtonsRuntime", () => {
    it("reports browser window availability through the injected scope", () => {
        expect.assertions(2);

        expect(getEnableTabButtonsRuntime({}).isWindowAvailable()).toBe(false);
        expect(
            getEnableTabButtonsRuntime({ window: {} }).isWindowAvailable()
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
            MutationObserver: globalConstructor,
            window: { MutationObserver: windowConstructor },
        });

        const observer = runtime.createMutationObserver(callback);

        expect(observer?.observe).toBe(observe);
        expect(globalConstructor).toHaveBeenCalledWith(callback);
        expect(windowConstructor).not.toHaveBeenCalled();
        expect(
            runtime.createCompatibilityMutationObserver(callback)
        ).toBeDefined();
    });

    it("uses the window mutation observer when no global constructor is available", () => {
        expect.assertions(2);

        const windowConstructor = vi.fn(function WindowMutationObserverMock(
            callback: MutationCallback
        ) {
            return { callback, observe: vi.fn() };
        }) as unknown as MutationObserverConstructorLike;
        const callback = vi.fn<MutationCallback>();
        const runtime = getEnableTabButtonsRuntime({
            window: { MutationObserver: windowConstructor },
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
            MutationObserver: constructor,
            window: { MutationObserver: constructor },
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
            getEnableTabButtonsRuntime({ window: {} }).createMutationObserver(
                vi.fn<MutationCallback>()
            )
        ).toBeUndefined();
    });

    it("schedules and clears timers through injected timer functions", () => {
        expect.assertions(3);

        const timer = Symbol("timer") as unknown as ReturnType<
            typeof setTimeout
        >;
        const timeoutMs = Number("50");
        const handler = vi.fn<() => void>();
        const setTimeoutMock = vi.fn<typeof setTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<typeof clearTimeout>();
        const runtime = getEnableTabButtonsRuntime({
            clearTimeout: clearTimeoutMock,
            setTimeout: setTimeoutMock,
            window: {},
        });

        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

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
});
