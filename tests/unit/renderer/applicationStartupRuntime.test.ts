import { describe, expect, it, vi } from "vitest";

import {
    getRendererApplicationStartupRuntime,
    type RendererApplicationStartupRuntimeScope,
} from "../../../electron-app/renderer/applicationStartupRuntime.js";
import type {
    BrowserClearTimeout,
    BrowserSetTimeout,
} from "../../../electron-app/utils/runtime/browserRuntime.js";

describe("getRendererApplicationStartupRuntime", () => {
    function createRuntimeScope(
        overrides: Partial<RendererApplicationStartupRuntimeScope> = {}
    ): RendererApplicationStartupRuntimeScope {
        return {
            getAbortController: () => AbortController,
            getClearTimeout: () => vi.fn<BrowserClearTimeout>(),
            getSetTimeout: () => vi.fn<BrowserSetTimeout>(() => 25),
            ...overrides,
        };
    }

    it("uses renderer browser runtime providers for production defaults", () => {
        expect.assertions(2);

        const utils = getRendererApplicationStartupRuntime();
        const callback = vi.fn<() => void>();
        const startupDelayMs = Number("1");
        const timer = utils.setTimeout(callback, startupDelayMs);

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
        expect(timer).toBeDefined();
        utils.clearTimeout(timer);
    });

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
            ...createRuntimeScope(),
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
        const setTimeout = vi.fn<BrowserSetTimeout>(() => 25);
        const utils = getRendererApplicationStartupRuntime({
            ...createRuntimeScope(),
            getSetTimeout: () => setTimeout,
        });

        expect(utils.setTimeout(callback, updateCheckDelayMs)).toBe(25);
        expect(setTimeout).toHaveBeenCalledWith(callback, updateCheckDelayMs);
        expect(setTimeout.mock.contexts[0]).toBeUndefined();
    });

    it("clears timers through the injected runtime scope", () => {
        expect.assertions(2);

        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const utils = getRendererApplicationStartupRuntime({
            ...createRuntimeScope(),
            getClearTimeout: () => clearTimeout,
        });

        utils.clearTimeout(25);

        expect(clearTimeout).toHaveBeenCalledWith(25);
        expect(clearTimeout.mock.contexts[0]).toBeUndefined();
    });

    it("fails clearly when explicit scopes omit runtime providers", () => {
        expect.assertions(3);

        expect(() =>
            getRendererApplicationStartupRuntime({
                getClearTimeout: () => vi.fn<BrowserClearTimeout>(),
                getSetTimeout: () => vi.fn<BrowserSetTimeout>(() => 25),
            } as unknown as RendererApplicationStartupRuntimeScope)
        ).toThrow(
            "renderer application startup requires an AbortController provider"
        );
        expect(() =>
            getRendererApplicationStartupRuntime({
                getAbortController: () => AbortController,
                getSetTimeout: () => vi.fn<BrowserSetTimeout>(() => 25),
            } as unknown as RendererApplicationStartupRuntimeScope)
        ).toThrow(
            "renderer application startup requires a clearTimeout provider"
        );
        expect(() =>
            getRendererApplicationStartupRuntime({
                getAbortController: () => AbortController,
                getClearTimeout: () => vi.fn<BrowserClearTimeout>(),
            } as unknown as RendererApplicationStartupRuntimeScope)
        ).toThrow(
            "renderer application startup requires a setTimeout provider"
        );
    });

    it("fails clearly when runtime providers return unavailable primitives", () => {
        expect.assertions(3);

        const utils = getRendererApplicationStartupRuntime({
            getAbortController: () => undefined,
            getClearTimeout: () => undefined,
            getSetTimeout: () => undefined,
        });

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
        const setTimeout = vi.fn<BrowserSetTimeout>(() => 25);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const utilsFactory = () =>
            getRendererApplicationStartupRuntime({
                AbortController: LegacyAbortController,
                clearTimeout,
                setTimeout,
            } as unknown as RendererApplicationStartupRuntimeScope);

        expect(utilsFactory).toThrow(
            "renderer application startup requires an AbortController provider"
        );
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
    });
});
