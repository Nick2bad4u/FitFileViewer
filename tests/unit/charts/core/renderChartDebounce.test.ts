import { describe, expect, it, vi } from "vitest";

import { debounce } from "../../../../electron-app/utils/charts/core/renderChartDebounce.js";
import type {
    RenderChartTimerRuntime,
    RenderChartTimeout,
} from "../../../../electron-app/utils/charts/core/renderChartTimerRuntime.js";

function createRuntime(): RenderChartTimerRuntime & {
    callbacks: Map<RenderChartTimeout, () => void>;
} {
    let nextId = 1;
    const callbacks = new Map<RenderChartTimeout, () => void>();

    return {
        callbacks,
        clearTimeout: vi.fn((timeout: RenderChartTimeout) => {
            callbacks.delete(timeout);
        }),
        setTimeout: vi.fn((callback: () => void) => {
            const timeout = nextId as RenderChartTimeout;
            nextId += 1;
            callbacks.set(timeout, callback);
            return timeout;
        }),
        wait: vi.fn<() => Promise<void>>(() => Promise.resolve()),
        waitForNextTask: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    };
}

describe("debounce", () => {
    it("clears pending callbacks before scheduling the latest call", () => {
        expect.assertions(4);

        const runtime = createRuntime();
        const callback = vi.fn<(value: string) => void>();
        const debounced = debounce(callback, 200, runtime);

        debounced("first");
        debounced("second");

        expect(runtime.clearTimeout).toHaveBeenCalledWith(1);
        expect(runtime.setTimeout).toHaveBeenCalledTimes(2);

        runtime.callbacks.get(2 as RenderChartTimeout)?.();

        expect(callback).toHaveBeenCalledExactlyOnceWith("second");
        expect(runtime.callbacks.has(1 as RenderChartTimeout)).toBe(false);
    });

    it("cancels a pending callback through the timer runtime", () => {
        expect.assertions(3);

        const runtime = createRuntime();
        const callback = vi.fn<() => void>();
        const debounced = debounce(callback, 200, runtime);

        debounced();
        debounced.cancel();

        expect(runtime.clearTimeout).toHaveBeenCalledWith(1);
        expect(runtime.callbacks.size).toBe(0);
        expect(callback).not.toHaveBeenCalled();
    });
});
