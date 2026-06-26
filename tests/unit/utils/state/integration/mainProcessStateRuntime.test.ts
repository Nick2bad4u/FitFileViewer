import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserClearTimeout,
    BrowserSetTimeout,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getMainProcessStateRuntime,
    type MainProcessStateTimer,
} from "../../../../../electron-app/utils/state/integration/mainProcessStateRuntime.js";

describe("mainProcessStateRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("prefers performance timing for monotonic durations", () => {
        expect.assertions(1);

        expect(
            getMainProcessStateRuntime({
                getDateNow: () => () => 123,
                getPerformance: () => ({ now: () => 45.5 }),
            }).monotonicNowMs()
        ).toBe(45.5);
    });

    it("falls back to the provided date clock without performance timing", () => {
        expect.assertions(1);

        expect(
            getMainProcessStateRuntime({
                getDateNow: () => () => 123,
            }).monotonicNowMs()
        ).toBe(123);
    });

    it("reads wall-clock timestamps through the injected date clock", () => {
        expect.assertions(1);

        expect(
            getMainProcessStateRuntime({
                getDateNow: () => () => 123,
            }).dateNow()
        ).toBe(123);
    });

    it("does not borrow ambient clocks for explicit scopes", () => {
        expect.assertions(2);

        expect(() => getMainProcessStateRuntime({}).monotonicNowMs()).toThrow(
            "mainProcessStateRuntime requires a date clock"
        );
        expect(() => getMainProcessStateRuntime({}).dateNow()).toThrow(
            "mainProcessStateRuntime requires a date clock"
        );
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = () => undefined;
        const delayMs = Number("50");
        const timer = 67 as MainProcessStateTimer;
        let scheduledCallback: unknown;
        let scheduledDelay: unknown;
        let clearedTimer: unknown;
        const setTimeout = ((handler: TimerHandler, timeout?: number) => {
            scheduledCallback = handler;
            scheduledDelay = timeout;
            return timer;
        }) as BrowserSetTimeout;
        const clearTimeout: BrowserClearTimeout = (handle) => {
            clearedTimer = handle;
        };
        const runtime = getMainProcessStateRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect({ scheduledCallback, scheduledDelay }).toStrictEqual({
            scheduledCallback: callback,
            scheduledDelay: delayMs,
        });
        expect(clearedTimer).toBe(timer);
    });

    it("ignores legacy direct timer, clock, and performance runtime properties", () => {
        expect.assertions(8);

        const callback = vi.fn<() => void>();
        const timer = 67 as MainProcessStateTimer;
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const dateNow = vi.fn<() => number>(() => 123);
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const performanceNow = vi.fn<() => number>(() => 45.5);
        const runtime = getMainProcessStateRuntime({
            clearTimeout,
            dateNow,
            performance: { now: performanceNow },
            setTimeout,
        } as unknown as Parameters<typeof getMainProcessStateRuntime>[0]);

        expect(() => runtime.monotonicNowMs()).toThrow(
            "mainProcessStateRuntime requires a date clock"
        );
        expect(() => runtime.dateNow()).toThrow(
            "mainProcessStateRuntime requires a date clock"
        );
        expect(() => runtime.setTimeout(callback, 50)).toThrow(
            "mainProcessStateRuntime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(timer)).toThrow(
            "mainProcessStateRuntime requires clearTimeout"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(performanceNow).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getMainProcessStateRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "mainProcessStateRuntime requires setTimeout"
        );
        expect(() => {
            runtime.clearTimeout(67 as MainProcessStateTimer);
        }).toThrow("mainProcessStateRuntime requires clearTimeout");
    });

    it("resolves default timers and performance clock when runtime operations run", () => {
        expect.assertions(5);

        const callback = vi.fn<() => void>();
        const delayMs = Number("50");
        const timer = 67 as MainProcessStateTimer;
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const performance = {
            now: vi.fn<() => number>(() => 101.5),
        };
        const runtime = getMainProcessStateRuntime();

        vi.stubGlobal("clearTimeout", clearTimeout);
        vi.stubGlobal("performance", performance);
        vi.stubGlobal("setTimeout", setTimeout);

        expect(runtime.monotonicNowMs()).toBe(101.5);
        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(performance.now).toHaveBeenCalledOnce();
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });
});
