import { afterEach, describe, expect, it, vi } from "vitest";

import {
    clearLeafletRuntimeForTests,
    getLeafletRuntimeEnvironment,
    resolveLeafletRuntime,
    setLeafletRuntime,
    waitForLeafletRuntime,
} from "../../../../../electron-app/utils/maps/core/leafletRuntime.js";

type TestLeafletRuntime = {
    divIcon: () => unknown;
};

function isTestLeafletRuntime(value: unknown): value is TestLeafletRuntime {
    return (
        typeof value === "object" &&
        value !== null &&
        "divIcon" in value &&
        typeof value.divIcon === "function"
    );
}

afterEach(() => {
    clearLeafletRuntimeForTests();
});

describe("leafletRuntime", () => {
    it("resolves an explicitly registered runtime", () => {
        expect.assertions(1);

        const registeredRuntime = { divIcon: () => "registered" };

        setLeafletRuntime(registeredRuntime);

        expect(resolveLeafletRuntime(isTestLeafletRuntime)).toBe(
            registeredRuntime
        );
    });

    it("clears the module-local runtime adapter", () => {
        expect.assertions(1);

        const runtime = { divIcon: () => "registered" };
        setLeafletRuntime(runtime);

        clearLeafletRuntimeForTests();

        expect(resolveLeafletRuntime(isTestLeafletRuntime)).toBeNull();
    });

    it("waits for a runtime through injected clock and polling providers", async () => {
        expect.assertions(4);

        const runtime = { divIcon: () => "registered" };
        let now = 0;
        const dateNow = vi.fn<() => number>(() => now);
        const waitForNextPoll = vi.fn<() => Promise<void>>(async () => {
            now += 20;
            setLeafletRuntime(runtime);
        });

        const result = await waitForLeafletRuntime(isTestLeafletRuntime, 100, {
            dateNow,
            waitForNextPoll,
        });

        expect(result).toBe(runtime);
        expect(dateNow).toHaveBeenCalledTimes(2);
        expect(waitForNextPoll).toHaveBeenCalledOnce();
        expect(resolveLeafletRuntime(isTestLeafletRuntime)).toBe(runtime);
    });

    it("stops waiting when the injected clock reaches the timeout", async () => {
        expect.assertions(3);

        let now = 0;
        const dateNow = vi.fn<() => number>(() => now);
        const waitForNextPoll = vi.fn<() => Promise<void>>(async () => {
            now += 20;
        });

        const result = await waitForLeafletRuntime(isTestLeafletRuntime, 50, {
            dateNow,
            waitForNextPoll,
        });

        expect(result).toBeNull();
        expect(dateNow).toHaveBeenCalledTimes(5);
        expect(waitForNextPoll).toHaveBeenCalledTimes(3);
    });

    it("creates poll waits through injected timer providers", async () => {
        expect.assertions(5);

        const timeoutHandle = Symbol(
            "leaflet-runtime-timeout"
        ) as unknown as ReturnType<typeof setTimeout>;
        let scheduledCallback: (() => void) | null = null;
        const setTimeoutProvider = vi.fn<
            (callback: () => void, delay: number) => ReturnType<typeof setTimeout>
        >((callback) => {
            scheduledCallback = callback;
            return timeoutHandle;
        });
        const clearTimeoutProvider = vi.fn<
            (handle: ReturnType<typeof setTimeout>) => void
        >();
        const dateNow = vi.fn<() => number>(() => 1234);
        const runtime = getLeafletRuntimeEnvironment({
            getClearTimeout: () => clearTimeoutProvider,
            getDateNow: () => dateNow,
            getSetTimeout: () => setTimeoutProvider,
        });

        expect(runtime.dateNow()).toBe(1234);
        const pollPromise = runtime.waitForNextPoll();

        expect(setTimeoutProvider).toHaveBeenCalledWith(
            expect.any(Function),
            20
        );

        scheduledCallback?.();
        await pollPromise;

        expect(dateNow).toHaveBeenCalledOnce();
        expect(clearTimeoutProvider).toHaveBeenCalledWith(timeoutHandle);
        expect(setTimeoutProvider).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production clock and timer defaults", async () => {
        expect.assertions(3);

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-06-25T21:10:00.000Z"));
        try {
            const runtime = getLeafletRuntimeEnvironment();
            const pollPromise = runtime.waitForNextPoll();

            expect(runtime.dateNow()).toBe(
                new Date("2026-06-25T21:10:00.000Z").getTime()
            );
            vi.advanceTimersByTime(19);
            await Promise.resolve();
            expect(await Promise.race([pollPromise, "pending"])).toBe(
                "pending"
            );
            vi.advanceTimersByTime(1);
            await expect(pollPromise).resolves.toBeUndefined();
        } finally {
            vi.useRealTimers();
        }
    });

    it("fails clearly when poll providers are unavailable", () => {
        expect.assertions(3);

        const missingProviders = getLeafletRuntimeEnvironment({});
        const missingSetTimeout = getLeafletRuntimeEnvironment({
            getClearTimeout: () => () => undefined,
        });

        expect(() => missingProviders.dateNow()).toThrow(
            "leafletRuntime requires a date clock"
        );
        expect(() => missingProviders.waitForNextPoll()).toThrow(
            "leafletRuntime requires clearTimeout"
        );
        expect(() => missingSetTimeout.waitForNextPoll()).toThrow(
            "leafletRuntime requires setTimeout"
        );
    });
});
