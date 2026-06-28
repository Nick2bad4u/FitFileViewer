import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserAbortControllerConstructor,
    BrowserClearInterval,
    BrowserClearTimeout,
    BrowserIntervalHandle,
    BrowserTimerHandle,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    clearResourceManagerInterval,
    clearResourceManagerTimer,
    getResourceManagerDateNow,
    registerResourceManagerUnloadCleanup,
    type ResourceManagerInterval,
    type ResourceManagerTimer,
} from "../../../../../electron-app/utils/app/lifecycle/resourceManagerRuntime.js";

describe("resourceManagerRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("clears timers through the injected runtime scope", () => {
        expect.assertions(1);

        const timer = 17 as ResourceManagerTimer;
        let clearedTimer: unknown;
        const clearTimeout: BrowserClearTimeout = (handle) => {
            clearedTimer = handle;
        };

        clearResourceManagerTimer(timer, {
            getClearTimeout: () => clearTimeout,
        });

        expect(clearedTimer).toBe(timer);
    });

    it("clears intervals through the injected runtime scope", () => {
        expect.assertions(1);

        const interval = 18 as ResourceManagerInterval;
        let clearedInterval: unknown;
        const clearInterval: BrowserClearInterval = (handle) => {
            clearedInterval = handle;
        };

        clearResourceManagerInterval(interval, {
            getClearInterval: () => clearInterval,
        });

        expect(clearedInterval).toBe(interval);
    });

    it("fails clearly when the timer cleanup runtime is unavailable", () => {
        expect.assertions(1);

        expect(() => {
            clearResourceManagerTimer(17 as BrowserTimerHandle, {});
        }).toThrow("resourceManager requires clearTimeout");
    });

    it("fails clearly when the interval cleanup runtime is unavailable", () => {
        expect.assertions(1);

        expect(() => {
            clearResourceManagerInterval(18 as BrowserIntervalHandle, {});
        }).toThrow("resourceManager requires clearInterval");
    });

    it("reads registration timestamps through the injected runtime scope", () => {
        expect.assertions(2);

        const dateNow = vi.fn(() => 123_456);
        const getDateNow = vi.fn(() => dateNow);

        expect(getResourceManagerDateNow({ getDateNow })).toBe(123_456);
        expect(getDateNow).toHaveBeenCalledOnce();
    });

    it("fails clearly when the clock runtime is unavailable", () => {
        expect.assertions(1);

        expect(() => getResourceManagerDateNow({})).toThrow(
            "resourceManager requires dateNow"
        );
    });

    it("registers beforeunload cleanup through the scoped event target", () => {
        expect.assertions(6);

        const cleanup = vi.fn();
        const abort = vi.fn();
        const constructorSpy = vi.fn();
        const signal = { aborted: false };
        const addEventListener = vi.fn();
        const removeEventListener = vi.fn();
        class AbortControllerFixture {
            public readonly signal = signal;

            public constructor() {
                constructorSpy();
            }

            public abort(): void {
                abort();
            }
        }

        const unregister = registerResourceManagerUnloadCleanup(cleanup, {
            getAbortController: () =>
                AbortControllerFixture as unknown as BrowserAbortControllerConstructor,
            getEventTarget: () => ({ addEventListener, removeEventListener }),
        });
        const [
            ,
            listener,
            options,
        ] = addEventListener.mock.calls[0] ?? [];

        expect(constructorSpy).toHaveBeenCalledOnce();
        expect(addEventListener).toHaveBeenCalledWith(
            "beforeunload",
            expect.any(Function),
            { signal }
        );

        (listener as () => void)();

        expect(cleanup).toHaveBeenCalledOnce();
        expect(abort).toHaveBeenCalledOnce();
        expect(removeEventListener).toHaveBeenCalledWith(
            "beforeunload",
            listener
        );

        unregister?.();

        expect(options).toStrictEqual({ signal });
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(4);

        const cleanup = vi.fn();
        const addEventListener = vi.fn();
        const removeEventListener = vi.fn();

        vi.stubGlobal("addEventListener", addEventListener);
        vi.stubGlobal("removeEventListener", removeEventListener);

        const unregister = registerResourceManagerUnloadCleanup(cleanup);
        const [
            ,
            listener,
            options,
        ] = addEventListener.mock.calls[0] ?? [];

        expect(addEventListener).toHaveBeenCalledWith(
            "beforeunload",
            expect.any(Function),
            { signal: expect.any(AbortSignal) }
        );
        expect(options).toEqual({ signal: expect.any(AbortSignal) });

        unregister?.();

        expect(removeEventListener).toHaveBeenCalledWith(
            "beforeunload",
            listener
        );
        expect(cleanup).not.toHaveBeenCalled();
    });

    it("uses browser runtime providers for production timer and clock defaults", () => {
        expect.assertions(6);

        const interval = 32 as BrowserIntervalHandle;
        const timer = 31 as BrowserTimerHandle;
        const clearIntervalMock = vi.fn<BrowserClearInterval>();
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const dateNowMock = vi.spyOn(Date, "now").mockReturnValue(987_654);

        vi.stubGlobal("clearInterval", clearIntervalMock);
        vi.stubGlobal("clearTimeout", clearTimeoutMock);

        clearResourceManagerInterval(interval);
        clearResourceManagerTimer(timer);

        expect(getResourceManagerDateNow()).toBe(987_654);
        expect(clearIntervalMock).toHaveBeenCalledWith(interval);
        expect(clearIntervalMock).toHaveBeenCalledOnce();
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
        expect(clearTimeoutMock).toHaveBeenCalledOnce();
        expect(dateNowMock).toHaveBeenCalledOnce();
    });

    it("skips registration outside event-target scopes", () => {
        expect.assertions(2);

        const cleanup = vi.fn();

        expect(registerResourceManagerUnloadCleanup(cleanup, {})).toBeNull();
        expect(cleanup).not.toHaveBeenCalled();
    });

    it("registers cleanup without abort support when AbortController is unavailable", () => {
        expect.assertions(3);

        const cleanup = vi.fn();
        const addEventListener = vi.fn();

        const unregister = registerResourceManagerUnloadCleanup(cleanup, {
            getEventTarget: () => ({
                addEventListener,
                removeEventListener: vi.fn(),
            }),
        });
        const [
            ,
            listener,
            options,
        ] = addEventListener.mock.calls[0] ?? [];

        (listener as () => void)();

        expect(addEventListener).toHaveBeenCalledWith(
            "beforeunload",
            expect.any(Function),
            undefined
        );
        expect(cleanup).toHaveBeenCalledOnce();
        expect({ options, unregister }).toStrictEqual({
            options: undefined,
            unregister: expect.any(Function),
        });
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(11);

        const cleanup = vi.fn();
        const interval = 20 as BrowserIntervalHandle;
        const timer = 19 as BrowserTimerHandle;
        const clearInterval = vi.fn();
        const clearTimeout = vi.fn();
        const addEventListener = vi.fn();
        const removeEventListener = vi.fn();
        const dateNow = vi.fn(() => 654_321);
        const getClearInterval = vi.fn(() => clearInterval);
        const getClearTimeout = vi.fn(() => clearTimeout);
        const getDateNow = vi.fn(() => dateNow);
        const getEventTarget = vi.fn(() => ({
            addEventListener,
            removeEventListener,
        }));

        clearResourceManagerInterval(interval, { getClearInterval });
        clearResourceManagerTimer(timer, { getClearTimeout });
        expect(getResourceManagerDateNow({ getDateNow })).toBe(654_321);
        const unregister = registerResourceManagerUnloadCleanup(cleanup, {
            getEventTarget,
        });
        expect(typeof unregister).toBe("function");
        unregister?.();

        expect(getClearInterval).toHaveBeenCalledOnce();
        expect(clearInterval).toHaveBeenCalledWith(interval);
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(getDateNow).toHaveBeenCalledOnce();
        expect(getEventTarget).toHaveBeenCalledOnce();
        expect(addEventListener).toHaveBeenCalledWith(
            "beforeunload",
            expect.any(Function),
            undefined
        );
        expect(removeEventListener).toHaveBeenCalledWith(
            "beforeunload",
            expect.any(Function)
        );
        expect(cleanup).not.toHaveBeenCalled();
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(7);

        const cleanup = vi.fn();
        const interval = 24 as BrowserIntervalHandle;
        const timer = 23 as BrowserTimerHandle;
        const clearInterval = vi.fn();
        const clearTimeout = vi.fn();
        const addEventListener = vi.fn();
        const removeEventListener = vi.fn();
        class AbortControllerFixture {
            public readonly signal = Symbol("legacy-signal") as AbortSignal;

            public abort(): void {
                // Test fixture intentionally empty.
            }
        }

        const legacyScope = {
            AbortController:
                AbortControllerFixture as unknown as BrowserAbortControllerConstructor,
            clearInterval,
            clearTimeout,
            dateNow: vi.fn(() => 1),
            eventTarget: { addEventListener, removeEventListener },
        } as unknown as Parameters<typeof clearResourceManagerTimer>[1];

        expect(() =>
            clearResourceManagerInterval(interval, legacyScope)
        ).toThrow("resourceManager requires clearInterval");
        expect(() => clearResourceManagerTimer(timer, legacyScope)).toThrow(
            "resourceManager requires clearTimeout"
        );
        expect(() => getResourceManagerDateNow(legacyScope)).toThrow(
            "resourceManager requires dateNow"
        );
        expect(
            registerResourceManagerUnloadCleanup(cleanup, legacyScope)
        ).toBeNull();
        expect(clearInterval).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalled();
    });
});
