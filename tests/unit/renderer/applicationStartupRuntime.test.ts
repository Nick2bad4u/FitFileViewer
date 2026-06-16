import { describe, expect, it, vi } from "vitest";

import { getRendererApplicationStartupRuntime } from "../../../electron-app/renderer/applicationStartupRuntime.js";

describe("getRendererApplicationStartupRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("startup-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const utils = getRendererApplicationStartupRuntime({
            getAbortController: () => TestAbortController,
        });

        expect(utils.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("schedules timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const updateCheckDelayMs = Number("5000");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 25);
        const utils = getRendererApplicationStartupRuntime({
            getSetTimeout: () => setTimeout,
        });

        expect(utils.setTimeout(callback, updateCheckDelayMs)).toBe(25);
        expect(setTimeout).toHaveBeenCalledWith(callback, updateCheckDelayMs);
        expect(setTimeout.mock.contexts[0]).toBeUndefined();
    });

    it("clears timers through the injected runtime scope", () => {
        expect.assertions(2);

        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const utils = getRendererApplicationStartupRuntime({
            getClearTimeout: () => clearTimeout,
        });

        utils.clearTimeout(25);

        expect(clearTimeout).toHaveBeenCalledWith(25);
        expect(clearTimeout.mock.contexts[0]).toBeUndefined();
    });

    it("does not borrow ambient browser primitives for explicit scopes", () => {
        expect.assertions(3);

        const utils = getRendererApplicationStartupRuntime({});

        expect(() => utils.createAbortController()).toThrow(
            "renderer application startup requires an AbortController"
        );
        expect(() => utils.setTimeout(() => {}, 1)).toThrow(
            "renderer application startup requires setTimeout"
        );
        expect(() => utils.clearTimeout(1)).toThrow(
            "renderer application startup requires clearTimeout"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(3);

        class LegacyAbortController implements AbortController {
            public readonly signal = Symbol(
                "legacy-application-startup-signal"
            ) as unknown as AbortSignal;

            public abort(): void {
                /* Test double */
            }
        }
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 25);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const utils = getRendererApplicationStartupRuntime({
            AbortController: LegacyAbortController,
            clearTimeout,
            setTimeout,
        } as unknown as Parameters<
            typeof getRendererApplicationStartupRuntime
        >[0]);

        expect(() => utils.createAbortController()).toThrow(
            "renderer application startup requires an AbortController"
        );
        expect(() => utils.setTimeout(() => {}, 1)).toThrow(
            "renderer application startup requires setTimeout"
        );
        expect(() => utils.clearTimeout(1)).toThrow(
            "renderer application startup requires clearTimeout"
        );
    });
});
