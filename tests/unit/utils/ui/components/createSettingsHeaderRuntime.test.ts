import { describe, expect, it, vi } from "vitest";

import { getCreateSettingsHeaderRuntime } from "../../../../../electron-app/utils/ui/components/createSettingsHeaderRuntime.js";

describe("getCreateSettingsHeaderRuntime", () => {
    it("schedules and clears timers through injected timer functions", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const timer = 53 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getCreateSettingsHeaderRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("ignores missing timers when clearing optional slider state", () => {
        expect.assertions(2);

        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getCreateSettingsHeaderRuntime({ clearTimeout });

        expect(() => runtime.clearTimeout(undefined)).not.toThrow();

        expect(clearTimeout).not.toHaveBeenCalled();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(3);

        const runtime = getCreateSettingsHeaderRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "createSettingsHeader requires a setTimeout runtime"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("createSettingsHeader requires a clearTimeout runtime");
        expect(() =>
            runtime.addDocumentKeydownListener(() => undefined, {})
        ).toThrow(
            "createSettingsHeader requires a document event-target runtime"
        );
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getCreateSettingsHeaderRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getCreateSettingsHeaderRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "createSettingsHeader requires an AbortController runtime"
        );
    });

    it("registers document keydown listeners through the injected event target", () => {
        expect.assertions(3);

        let keydownCount = 0;
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        const listener = () => {
            keydownCount += 1;
        };
        const controller = new AbortController();
        const runtime = getCreateSettingsHeaderRuntime({
            documentEventTarget,
        });

        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });

        documentEventTarget.dispatchEvent(new KeyboardEvent("keydown"));

        expect(addEventListener).toHaveBeenCalledWith("keydown", listener, {
            signal: controller.signal,
        });
        expect(keydownCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });

    it("routes all defaults through provider functions", () => {
        expect.assertions(9);

        const callback = vi.fn<() => void>();
        let keydownCount = 0;
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const listener = () => {
            keydownCount += 1;
        };
        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const delayMs = Number("2");
        const timer = 61 as ReturnType<typeof globalThis.setTimeout>;
        const scheduleTimeout = vi.fn<typeof globalThis.setTimeout>(
            () => timer
        );
        const clearScheduledTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const getAbortController = vi.fn(
            () =>
                AbortControllerConstructor as unknown as typeof AbortController
        );
        const getClearTimeout = vi.fn(() => clearScheduledTimeout);
        const getDocumentEventTarget = vi.fn(() => documentEventTarget);
        const getSetTimeout = vi.fn(() => scheduleTimeout);
        const runtime = getCreateSettingsHeaderRuntime({
            getAbortController,
            getClearTimeout,
            getDocumentEventTarget,
            getSetTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);
        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });
        documentEventTarget.dispatchEvent(new KeyboardEvent("keydown"));
        expect(runtime.createAbortController()).toBe(controller);

        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(getDocumentEventTarget).toHaveBeenCalledOnce();
        expect(getAbortController).toHaveBeenCalledOnce();
        expect(scheduleTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearScheduledTimeout).toHaveBeenCalledWith(timer);
        expect(keydownCount).toBe(1);
    });
});
