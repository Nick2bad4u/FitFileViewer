import { describe, expect, it, vi } from "vitest";

import {
    clearResourceManagerTimer,
    registerResourceManagerUnloadCleanup,
} from "../../../../../electron-app/utils/app/lifecycle/resourceManagerRuntime.js";

describe("resourceManagerRuntime", () => {
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
        expect.assertions(7);

        const cleanup = vi.fn();
        const timer = 19 as ReturnType<typeof globalThis.setTimeout>;
        const clearTimeout = vi.fn();
        const addEventListener = vi.fn();
        const removeEventListener = vi.fn();
        const getClearTimeout = vi.fn(() => clearTimeout);
        const getEventTarget = vi.fn(() => ({
            addEventListener,
            removeEventListener,
        }));

        clearResourceManagerTimer(timer, { getClearTimeout });
        const unregister = registerResourceManagerUnloadCleanup(cleanup, {
            getEventTarget,
        });
        expect(typeof unregister).toBe("function");
        unregister?.();

        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(clearTimeout).toHaveBeenCalledWith(timer);
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
        expect.assertions(3);

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
            eventTarget: { addEventListener, removeEventListener },
        } as unknown as Parameters<typeof clearResourceManagerTimer>[1];

        expect(() => clearResourceManagerTimer(timer, legacyScope)).toThrow(
            "resourceManager requires clearTimeout"
        );
        expect(
            registerResourceManagerUnloadCleanup(cleanup, legacyScope)
        ).toBeNull();
        expect(addEventListener).not.toHaveBeenCalled();
    });
});
