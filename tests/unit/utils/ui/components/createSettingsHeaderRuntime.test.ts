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
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("ignores missing timers when clearing optional slider state", () => {
        expect.assertions(2);

        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getCreateSettingsHeaderRuntime({
            getClearTimeout: () => clearTimeout,
        });

        expect(() => runtime.clearTimeout(undefined)).not.toThrow();

        expect(clearTimeout).not.toHaveBeenCalled();
    });

    it("routes document operations through the injected document provider", () => {
        expect.assertions(8);

        const documentRef =
            document.implementation.createHTMLDocument("settings header");
        const createElement = vi.spyOn(documentRef, "createElement");
        const bodyAppend = vi.spyOn(documentRef.body, "append");
        const headAppend = vi.spyOn(documentRef.head, "append");
        const runtime = getCreateSettingsHeaderRuntime({
            getDocument: () => documentRef,
        });

        const div = runtime.createElement("div");
        const style = runtime.createElement("style");
        runtime.appendToBody(div);
        runtime.appendToHead(style);

        expect(div.tagName).toBe("DIV");
        expect(style.tagName).toBe("STYLE");
        expect(createElement).toHaveBeenCalledWith("div");
        expect(createElement).toHaveBeenCalledWith("style");
        expect(bodyAppend).toHaveBeenCalledWith(div);
        expect(headAppend).toHaveBeenCalledWith(style);
        expect(documentRef.body.contains(div)).toBe(true);
        expect(documentRef.head.contains(style)).toBe(true);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(6);

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
        expect(() => runtime.createElement("div")).toThrow(
            "createSettingsHeader requires a document runtime"
        );
        expect(() =>
            runtime.appendToBody(document.createElement("div"))
        ).toThrow("createSettingsHeader requires a document runtime");
        expect(() =>
            runtime.appendToHead(document.createElement("style"))
        ).toThrow("createSettingsHeader requires a document runtime");
    });

    it("creates abort controllers through the injected runtime provider", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getCreateSettingsHeaderRuntime({
            getAbortController: () =>
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

    it("registers document keydown listeners through the injected event target provider", () => {
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
            getDocumentEventTarget: () => documentEventTarget,
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
        expect.assertions(14);

        const callback = vi.fn<() => void>();
        let keydownCount = 0;
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const documentRef =
            document.implementation.createHTMLDocument("settings header");
        const createElement = vi.spyOn(documentRef, "createElement");
        const bodyAppend = vi.spyOn(documentRef.body, "append");
        const headAppend = vi.spyOn(documentRef.head, "append");
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
        const getDocument = vi.fn(() => documentRef);
        const getDocumentEventTarget = vi.fn(() => documentEventTarget);
        const getSetTimeout = vi.fn(() => scheduleTimeout);
        const runtime = getCreateSettingsHeaderRuntime({
            getAbortController,
            getClearTimeout,
            getDocument,
            getDocumentEventTarget,
            getSetTimeout,
        });

        const div = runtime.createElement("div");
        const style = runtime.createElement("style");
        runtime.appendToBody(div);
        runtime.appendToHead(style);
        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);
        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });
        documentEventTarget.dispatchEvent(new KeyboardEvent("keydown"));
        expect(runtime.createAbortController()).toBe(controller);

        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(getDocument).toHaveBeenCalledTimes(4);
        expect(getDocumentEventTarget).toHaveBeenCalledOnce();
        expect(getAbortController).toHaveBeenCalledOnce();
        expect(createElement).toHaveBeenCalledWith("div");
        expect(createElement).toHaveBeenCalledWith("style");
        expect(bodyAppend).toHaveBeenCalledWith(div);
        expect(headAppend).toHaveBeenCalledWith(style);
        expect(scheduleTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearScheduledTimeout).toHaveBeenCalledWith(timer);
        expect(keydownCount).toBe(1);
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(15);

        const callback = vi.fn<() => void>();
        const timer = 71 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const documentRef =
            document.implementation.createHTMLDocument("settings header");
        const listener = vi.fn<(event: KeyboardEvent) => void>();
        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getCreateSettingsHeaderRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            clearTimeout,
            document: documentRef,
            documentEventTarget,
            setTimeout,
        } as unknown as Parameters<typeof getCreateSettingsHeaderRuntime>[0]);

        expect(() => runtime.setTimeout(callback, 1)).toThrow(
            "createSettingsHeader requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(timer)).toThrow(
            "createSettingsHeader requires a clearTimeout runtime"
        );
        expect(() => runtime.addDocumentKeydownListener(listener, {})).toThrow(
            "createSettingsHeader requires a document event-target runtime"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createSettingsHeader requires an AbortController runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "createSettingsHeader requires a document runtime"
        );
        expect(() =>
            runtime.appendToBody(document.createElement("div"))
        ).toThrow("createSettingsHeader requires a document runtime");
        expect(() =>
            runtime.appendToHead(document.createElement("style"))
        ).toThrow("createSettingsHeader requires a document runtime");

        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(listener).not.toHaveBeenCalled();
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
        expect(documentEventTarget.body.childElementCount).toBe(0);
        expect(documentRef.body.childElementCount).toBe(0);
        expect(documentRef.head.querySelector("style")).toBeNull();
    });
});
