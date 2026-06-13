import { describe, expect, it } from "vitest";

import { getMapActionButtonsRuntime } from "../../../../electron-app/utils/maps/controls/mapActionButtonsRuntime.js";

describe("getMapActionButtonsRuntime", () => {
    it("uses the injected timer scheduler", () => {
        expect.assertions(3);

        let callbackRan = false;
        let scheduledDelayMs = 0;
        const runtime = getMapActionButtonsRuntime({
            setTimeout(callback, delayMs): ReturnType<typeof setTimeout> {
                scheduledDelayMs = delayMs;
                callback();
                return 7 as ReturnType<typeof setTimeout>;
            },
        });
        const retryDelayMs = Number.parseInt("150", 10);

        const timer = runtime.setTimeout(() => {
            callbackRan = true;
        }, retryDelayMs);

        expect(timer).toBe(7);
        expect(callbackRan).toBe(true);
        expect(scheduledDelayMs).toBe(retryDelayMs);
    });

    it("uses the injected timer clearer", () => {
        expect.assertions(1);

        let clearedTimer: ReturnType<typeof setTimeout> | undefined;
        const runtime = getMapActionButtonsRuntime({
            clearTimeout(timer): void {
                clearedTimer = timer;
            },
        });
        const timer = 9 as ReturnType<typeof setTimeout>;

        runtime.clearTimeout(timer);

        expect(clearedTimer).toBe(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getMapActionButtonsRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapActionButtonsRuntime requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("mapActionButtonsRuntime requires clearTimeout");
    });
});
