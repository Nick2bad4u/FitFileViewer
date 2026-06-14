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

        clearResourceManagerTimer(timer, { clearTimeout });

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

    it("registers beforeunload cleanup through the scoped window target", () => {
        expect.assertions(5);

        const cleanup = vi.fn();
        const abort = vi.fn();
        const constructorSpy = vi.fn();
        const signal = { aborted: false };
        const addEventListener = vi.fn();
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
            AbortController:
                AbortControllerFixture as unknown as typeof AbortController,
            window: { addEventListener },
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

        unregister?.();

        expect(options).toStrictEqual({ signal });
    });

    it("skips registration outside window event-target scopes", () => {
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
            window: { addEventListener },
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
});
