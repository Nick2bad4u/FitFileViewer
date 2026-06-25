import { afterEach, describe, expect, it, vi } from "vitest";

import {
    clearResourceManagerTimer,
    getResourceManagerDateNow,
    registerResourceManagerUnloadCleanup,
} from "../../../../../electron-app/utils/app/lifecycle/resourceManagerRuntime.js";

describe("resourceManagerRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("clears timers through the injected runtime scope", () => {
        expect.assertions(1);

        const timer = 17 as ReturnType<typeof globalThis.setTimeout>;
        let clearedTimer: unknown;
        const clearTimeout: typeof globalThis.clearTimeout = (handle) => {
            clearedTimer = handle;
        };

        clearResourceManagerTimer(timer, {
            getClearTimeout: () => clearTimeout,
        });

        expect(clearedTimer).toBe(timer);
    });

    it("fails clearly when the timer cleanup runtime is unavailable", () => {
        expect.assertions(1);

        expect(() => {
            clearResourceManagerTimer(
                17 as ReturnType<typeof globalThis.setTimeout>,
                {}
            );
        }).toThrow("resourceManager requires clearTimeout");
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
                AbortControllerFixture as unknown as typeof AbortController,
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
        expect.assertions(9);

        const cleanup = vi.fn();
        const timer = 19 as ReturnType<typeof globalThis.setTimeout>;
        const clearTimeout = vi.fn();
        const addEventListener = vi.fn();
        const removeEventListener = vi.fn();
        const dateNow = vi.fn(() => 654_321);
        const getClearTimeout = vi.fn(() => clearTimeout);
        const getDateNow = vi.fn(() => dateNow);
        const getEventTarget = vi.fn(() => ({
            addEventListener,
            removeEventListener,
        }));

        clearResourceManagerTimer(timer, { getClearTimeout });
        expect(getResourceManagerDateNow({ getDateNow })).toBe(654_321);
        const unregister = registerResourceManagerUnloadCleanup(cleanup, {
            getEventTarget,
        });
        expect(typeof unregister).toBe("function");
        unregister?.();

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
        expect.assertions(5);

        const cleanup = vi.fn();
        const timer = 23 as ReturnType<typeof globalThis.setTimeout>;
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
                AbortControllerFixture as unknown as typeof AbortController,
            clearTimeout,
            dateNow: vi.fn(() => 1),
            eventTarget: { addEventListener, removeEventListener },
        } as unknown as Parameters<typeof clearResourceManagerTimer>[1];

        expect(() => clearResourceManagerTimer(timer, legacyScope)).toThrow(
            "resourceManager requires clearTimeout"
        );
        expect(() => getResourceManagerDateNow(legacyScope)).toThrow(
            "resourceManager requires dateNow"
        );
        expect(
            registerResourceManagerUnloadCleanup(cleanup, legacyScope)
        ).toBeNull();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalled();
    });
});
