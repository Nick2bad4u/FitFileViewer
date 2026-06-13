import { describe, expect, it, vi } from "vitest";

import { getLifecycleListenersRuntime } from "../../../../../electron-app/utils/app/lifecycle/listenersRuntime.js";

describe("getLifecycleListenersRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getLifecycleListenersRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getLifecycleListenersRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "lifecycle listeners require an AbortController runtime"
        );
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = () => undefined;
        const delayMs = Number("100");
        const timer = 23 as ReturnType<typeof globalThis.setTimeout>;
        let scheduledCallback: unknown;
        let scheduledDelay: unknown;
        let clearedTimer: unknown;
        const setTimeout = ((handler: TimerHandler, timeout?: number) => {
            scheduledCallback = handler;
            scheduledDelay = timeout;
            return timer;
        }) as typeof globalThis.setTimeout;
        const clearTimeout: typeof globalThis.clearTimeout = (handle) => {
            clearedTimer = handle;
        };
        const runtime = getLifecycleListenersRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect({ scheduledCallback, scheduledDelay }).toStrictEqual({
            scheduledCallback: callback,
            scheduledDelay: delayMs,
        });
        expect(clearedTimer).toBe(timer);
    });
});
