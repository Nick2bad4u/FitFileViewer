import { describe, expect, it } from "vitest";

import { getMainProcessStateRuntime } from "../../../../../electron-app/utils/state/integration/mainProcessStateRuntime.js";

describe("mainProcessStateRuntime", () => {
    it("prefers performance timing for monotonic durations", () => {
        expect.assertions(1);

        expect(
            getMainProcessStateRuntime({
                dateNow: () => 123,
                performance: { now: () => 45.5 },
            }).monotonicNowMs()
        ).toBe(45.5);
    });

    it("falls back to the provided date clock without performance timing", () => {
        expect.assertions(1);

        expect(
            getMainProcessStateRuntime({
                dateNow: () => 123,
            }).monotonicNowMs()
        ).toBe(123);
    });

    it("does not borrow ambient clocks for explicit scopes", () => {
        expect.assertions(1);

        expect(() => getMainProcessStateRuntime({}).monotonicNowMs()).toThrow(
            "mainProcessStateRuntime requires a clock"
        );
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = () => undefined;
        const delayMs = Number("50");
        const timer = 67 as ReturnType<typeof globalThis.setTimeout>;
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
        const runtime = getMainProcessStateRuntime({
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

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getMainProcessStateRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "mainProcessStateRuntime requires setTimeout"
        );
        expect(() => {
            runtime.clearTimeout(
                67 as ReturnType<typeof globalThis.setTimeout>
            );
        }).toThrow("mainProcessStateRuntime requires clearTimeout");
    });
});
