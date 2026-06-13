import { describe, expect, it, vi } from "vitest";

import { getCancellationTokenRuntime } from "../../../../../electron-app/utils/app/async/cancellationTokenRuntime.js";

describe("getCancellationTokenRuntime", () => {
    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("125");
        const scheduledCalls: { callback: () => void; timeout: number }[] = [];
        const clearedHandles: unknown[] = [];
        const runtime = getCancellationTokenRuntime({
            clearTimeout: (handle) => {
                clearedHandles.push(handle);
            },
            setTimeout: (scheduledCallback, timeout) => {
                scheduledCalls.push({
                    callback: scheduledCallback,
                    timeout,
                });
                return 31;
            },
        });

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(31);
        expect(scheduledCalls).toStrictEqual([
            { callback, timeout: timeoutMs },
        ]);

        runtime.clearTimeout(31);

        expect(clearedHandles).toStrictEqual([31]);
    });
});
