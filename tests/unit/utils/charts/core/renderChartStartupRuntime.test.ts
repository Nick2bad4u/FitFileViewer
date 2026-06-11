import { describe, expect, it, vi } from "vitest";

import { getRenderChartStartupRuntime } from "../../../../../electron-app/utils/charts/core/renderChartStartupRuntime.js";

describe("getRenderChartStartupRuntime", () => {
    it("registers DOMContentLoaded listeners through the injected event target", () => {
        expect.assertions(3);

        const abortController = new AbortController();
        const addEventListener = vi.fn<
            (
                type: string,
                listener: EventListenerOrEventListenerObject,
                options?: AddEventListenerOptions | boolean
            ) => void
        >();
        const runtime = getRenderChartStartupRuntime({
            addEventListener,
            window: {},
        });

        try {
            runtime.addDOMContentLoadedListener(() => undefined, {
                once: true,
                signal: abortController.signal,
            });

            expect(runtime.canRegisterDOMContentLoadedListener()).toBe(true);
            expect(addEventListener).toHaveBeenCalledWith(
                "DOMContentLoaded",
                expect.any(Function),
                { once: true, signal: abortController.signal }
            );
            expect(abortController.signal.aborted).toBe(false);
        } finally {
            abortController.abort();
        }
    });

    it("reports unavailable renderer startup surfaces", () => {
        expect.assertions(2);

        expect(
            getRenderChartStartupRuntime({
                addEventListener: () => undefined,
            }).canRegisterDOMContentLoadedListener()
        ).toBe(false);
        expect(
            getRenderChartStartupRuntime({
                window: {},
            }).canRegisterDOMContentLoadedListener()
        ).toBe(false);
    });

    it("fails clearly when listener registration is unavailable", () => {
        expect.assertions(1);

        const abortController = new AbortController();

        expect(() =>
            getRenderChartStartupRuntime({
                window: {},
            }).addDOMContentLoadedListener(() => undefined, {
                signal: abortController.signal,
            })
        ).toThrow("renderChartStartup requires addEventListener");
    });
});
