import { describe, expect, it, vi } from "vitest";

import {
    getRenderChartStartupRuntime as getChartStartupRuntime,
    type RenderChartStartupRuntimeScope,
} from "../../../../../electron-app/utils/charts/core/renderChartStartupRuntime.js";

describe("getRenderChartStartupRuntime", () => {
    it("registers DOMContentLoaded listeners through the injected event target", () => {
        expect.assertions(3);

        const abortController = new AbortController();
        const addEventListener =
            vi.fn<
                (
                    type: string,
                    listener: EventListenerOrEventListenerObject,
                    options?: AddEventListenerOptions | boolean
                ) => void
            >();
        const startupRuntime = getChartStartupRuntime({
            getAddEventListener: () => addEventListener,
            isRendererScope: () => true,
        });

        try {
            startupRuntime.addDOMContentLoadedListener(() => undefined, {
                once: true,
                signal: abortController.signal,
            });

            expect(startupRuntime.canRegisterDOMContentLoadedListener()).toBe(
                true
            );
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
            getChartStartupRuntime({
                getAddEventListener: () => () => undefined,
            }).canRegisterDOMContentLoadedListener()
        ).toBe(false);
        expect(
            getChartStartupRuntime({
                isRendererScope: () => true,
            }).canRegisterDOMContentLoadedListener()
        ).toBe(false);
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(3);

        const abortController = new AbortController();
        const addEventListener =
            vi.fn<
                (
                    type: string,
                    listener: EventListenerOrEventListenerObject,
                    options?: AddEventListenerOptions | boolean
                ) => void
            >();
        const startupRuntime = getChartStartupRuntime({
            getAddEventListener: () => addEventListener,
            isRendererScope: () => true,
        });

        try {
            expect(startupRuntime.canRegisterDOMContentLoadedListener()).toBe(
                true
            );
            startupRuntime.addDOMContentLoadedListener(() => undefined, {
                signal: abortController.signal,
            });

            expect(addEventListener).toHaveBeenCalledWith(
                "DOMContentLoaded",
                expect.any(Function),
                { signal: abortController.signal }
            );
            expect(
                getChartStartupRuntime({}).canRegisterDOMContentLoadedListener()
            ).toBe(false);
        } finally {
            abortController.abort();
        }
    });

    it("fails clearly when listener registration is unavailable", () => {
        expect.assertions(1);

        const abortController = new AbortController();

        expect(() =>
            getChartStartupRuntime({
                isRendererScope: () => true,
            }).addDOMContentLoadedListener(() => undefined, {
                signal: abortController.signal,
            })
        ).toThrow("renderChartStartup requires addEventListener");
    });

    it("ignores legacy direct addEventListener runtime properties", () => {
        expect.assertions(2);

        const addEventListener =
            vi.fn<
                (
                    type: string,
                    listener: EventListenerOrEventListenerObject,
                    options?: AddEventListenerOptions | boolean
                ) => void
            >();
        const startupRuntime = getChartStartupRuntime({
            addEventListener,
            isRendererScope: () => true,
        } as unknown as RenderChartStartupRuntimeScope);

        expect(startupRuntime.canRegisterDOMContentLoadedListener()).toBe(
            false
        );
        expect(addEventListener).not.toHaveBeenCalled();
    });
});
