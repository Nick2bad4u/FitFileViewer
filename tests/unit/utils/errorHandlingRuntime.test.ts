import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserAbortControllerConstructor,
    BrowserAddEventListener,
} from "../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getErrorHandlingRuntime,
    type ErrorHandlingRuntimeScope,
} from "../../../electron-app/utils/errors/errorHandlingRuntime.js";

const unavailableErrorHandlingRuntimeScope = {
    getAbortController: () => undefined,
    getAddEventListener: () => undefined,
    getDateConstructor: () => undefined,
    getDateNow: () => undefined,
    getErrorListenerTarget: () => undefined,
} satisfies ErrorHandlingRuntimeScope;

describe("getErrorHandlingRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("uses browser runtime providers for production defaults", () => {
        expect.assertions(2);

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-06-25T21:10:00.000Z"));
        const utils = getErrorHandlingRuntime();

        try {
            expect(utils.createAbortController()).toBeInstanceOf(
                AbortController
            );
            expect(utils.dateNow()).toBe(
                new Date("2026-06-25T21:10:00.000Z").getTime()
            );
        } finally {
            vi.useRealTimers();
        }
    });

    it("reads timestamps through the injected runtime", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getErrorHandlingRuntime({
            ...unavailableErrorHandlingRuntimeScope,
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("builds ISO timestamps through the injected date constructor", () => {
        expect.assertions(3);

        const dateValue = {
            toISOString: vi.fn<() => string>(() => "2024-01-02T03:04:05.000Z"),
        };
        let constructedCount = 0;

        class DateConstructor {
            constructor() {
                constructedCount += 1;
            }

            toISOString(): string {
                return dateValue.toISOString();
            }
        }

        const utils = getErrorHandlingRuntime({
            ...unavailableErrorHandlingRuntimeScope,
            getDateConstructor: () => DateConstructor,
        });

        expect(utils.isoNow()).toBe("2024-01-02T03:04:05.000Z");
        expect(constructedCount).toBe(1);
        expect(dateValue.toISOString).toHaveBeenCalledOnce();
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getErrorHandlingRuntime({
            ...unavailableErrorHandlingRuntimeScope,
            getAbortController: () =>
                AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getErrorHandlingRuntime(
            unavailableErrorHandlingRuntimeScope
        );

        expect(() => runtime.createAbortController()).toThrow(
            "errorHandling requires an AbortController runtime"
        );
    });

    it("fails clearly when the date clock runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getErrorHandlingRuntime(
            unavailableErrorHandlingRuntimeScope
        );

        expect(() => utils.dateNow()).toThrow("errorHandling requires dateNow");
    });

    it("fails clearly when the date constructor runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getErrorHandlingRuntime(
            unavailableErrorHandlingRuntimeScope
        );

        expect(() => utils.isoNow()).toThrow(
            "errorHandling requires a date constructor"
        );
    });

    it("resolves the default AbortController when controllers are created", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getErrorHandlingRuntime();

        vi.stubGlobal("AbortController", AbortControllerConstructor);

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("resolves the default error listener target when listeners are registered", () => {
        expect.assertions(3);

        const addEventListener = vi.fn<BrowserAddEventListener>();
        const listener = vi.fn();
        const controller = new AbortController();
        const options = { signal: controller.signal };

        vi.stubGlobal("addEventListener", addEventListener);

        const target = getErrorHandlingRuntime().getErrorListenerTarget();
        target?.addEventListener("error", listener, options);

        expect(target).toBeDefined();
        expect(addEventListener).toHaveBeenCalledWith(
            "error",
            listener,
            options
        );
        expect(addEventListener.mock.contexts[0]).toBe(globalThis);

        controller.abort();
    });

    it("resolves event targets through the injected listener provider", () => {
        expect.assertions(2);

        const addEventListener = vi.fn<BrowserAddEventListener>();
        const listener = vi.fn();
        const controller = new AbortController();
        const options = { passive: true, signal: controller.signal };
        const runtime = getErrorHandlingRuntime({
            ...unavailableErrorHandlingRuntimeScope,
            getAddEventListener: () => addEventListener,
        });

        const target = runtime.getErrorListenerTarget();
        target?.addEventListener("unhandledrejection", listener, options);

        expect(target).toBeDefined();
        expect(addEventListener).toHaveBeenCalledWith(
            "unhandledrejection",
            listener,
            options
        );

        controller.abort();
    });

    it("resolves explicit error listener targets through the injected provider", () => {
        expect.assertions(3);

        const addEventListener = vi.fn();
        const fallbackAddEventListener = vi.fn();
        const controller = new AbortController();
        const listener = vi.fn();
        const options = { signal: controller.signal };
        const runtime = getErrorHandlingRuntime({
            ...unavailableErrorHandlingRuntimeScope,
            getAddEventListener: () => fallbackAddEventListener,
            getErrorListenerTarget: () => ({ addEventListener }),
        });

        const target = runtime.getErrorListenerTarget();
        target?.addEventListener("error", listener, options);

        expect(target).toBeDefined();
        expect(addEventListener).toHaveBeenCalledWith(
            "error",
            listener,
            options
        );
        expect(fallbackAddEventListener).not.toHaveBeenCalled();

        controller.abort();
    });

    it("fails clearly when runtime providers are omitted", () => {
        expect.assertions(6);

        const runtime = getErrorHandlingRuntime(
            {} as unknown as ErrorHandlingRuntimeScope
        );

        expect(() => runtime.createAbortController()).toThrow(
            "errorHandling requires AbortController provider"
        );
        expect(() => runtime.dateNow()).toThrow(
            "errorHandling requires dateNow provider"
        );
        expect(() => runtime.isoNow()).toThrow(
            "errorHandling requires a date constructor provider"
        );
        expect(() => runtime.getErrorListenerTarget()).toThrow(
            "errorHandling requires error listener provider"
        );
        expect(() =>
            getErrorHandlingRuntime({
                ...unavailableErrorHandlingRuntimeScope,
                getAddEventListener: undefined,
            } as unknown as ErrorHandlingRuntimeScope).getErrorListenerTarget()
        ).toThrow("errorHandling requires addEventListener provider");
        expect(() =>
            getErrorHandlingRuntime({
                ...unavailableErrorHandlingRuntimeScope,
                getErrorListenerTarget: () => undefined,
            } as unknown as ErrorHandlingRuntimeScope).getErrorListenerTarget()
        ).not.toThrow();
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(6);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const addEventListener = vi.fn();
        const dateNow = vi.fn<() => number>(() => 1234);
        let constructedCount = 0;

        class DateConstructor {
            constructor() {
                constructedCount += 1;
            }

            toISOString(): string {
                return "2024-01-02T03:04:05.000Z";
            }
        }

        const runtime = getErrorHandlingRuntime({
            ...unavailableErrorHandlingRuntimeScope,
            AbortController:
                AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
            Date: DateConstructor,
            dateNow,
            errorListenerTarget: { addEventListener },
        } as unknown as Parameters<typeof getErrorHandlingRuntime>[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "errorHandling requires an AbortController runtime"
        );
        expect(() => runtime.dateNow()).toThrow(
            "errorHandling requires dateNow"
        );
        expect(() => runtime.isoNow()).toThrow(
            "errorHandling requires a date constructor"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(constructedCount).toBe(0);
        expect(runtime.getErrorListenerTarget()).toBeUndefined();
    });
});
