import { afterEach, describe, expect, it, vi } from "vitest";

import { getCreateSettingsHeaderRuntime } from "../../../../../electron-app/utils/ui/components/createSettingsHeaderRuntime.js";
import type {
    BrowserClearTimeout,
    BrowserSetTimeout,
    BrowserTimerHandle,
    BrowserURLConstructor,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";

describe("getCreateSettingsHeaderRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("schedules and clears timers through injected timer functions", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const timer = 53 as BrowserTimerHandle;
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
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

        const clearTimeout = vi.fn<BrowserClearTimeout>();
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

    it("creates change events through the injected Event runtime", () => {
        expect.assertions(3);

        class TestEvent extends Event {
            public constructor(type: string) {
                super(`test:${type}`);
            }
        }
        const runtime = getCreateSettingsHeaderRuntime({
            getEvent: () => TestEvent,
        });
        const event = runtime.createChangeEvent();

        expect(event).toBeInstanceOf(TestEvent);
        expect(event.type).toBe("test:change");
        expect(event.bubbles).toBe(false);
    });

    it("creates object URLs through the injected URL runtime", () => {
        expect.assertions(3);

        const blob = new Blob(["settings"]);
        const createObjectURL = vi.fn<(blob: Blob) => string>(
            () => "blob:settings"
        );
        const runtime = getCreateSettingsHeaderRuntime({
            getURL: () =>
                ({ createObjectURL }) as Pick<
                    BrowserURLConstructor,
                    "createObjectURL"
                >,
        });

        expect(runtime.createObjectURL(blob)).toBe("blob:settings");
        expect(createObjectURL).toHaveBeenCalledWith(blob);
        expect(createObjectURL).toHaveBeenCalledOnce();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(8);

        const runtime = getCreateSettingsHeaderRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "createSettingsHeader requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(1 as BrowserTimerHandle)).toThrow(
            "createSettingsHeader requires a clearTimeout runtime"
        );
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
        expect(() => runtime.createChangeEvent()).toThrow(
            "createSettingsHeader requires an Event runtime"
        );
        expect(() => runtime.createObjectURL(new Blob(["settings"]))).toThrow(
            "createSettingsHeader requires a URL runtime"
        );
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

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getCreateSettingsHeaderRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production timer defaults", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const timer = 59 as BrowserTimerHandle;
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getCreateSettingsHeaderRuntime();
        const timerHandle = runtime.setTimeout(callback, delayMs);
        runtime.clearTimeout(timerHandle);

        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
    });

    it("uses browser runtime providers for production document and Event defaults", () => {
        expect.assertions(7);

        const createElement = vi.spyOn(document, "createElement");
        const bodyAppend = vi.spyOn(document.body, "append");
        const headAppend = vi.spyOn(document.head, "append");
        const runtime = getCreateSettingsHeaderRuntime();

        const div = runtime.createElement("div");
        const style = runtime.createElement("style");
        const changeEvent = runtime.createChangeEvent();
        runtime.appendToBody(div);
        runtime.appendToHead(style);

        expect(changeEvent).toBeInstanceOf(Event);
        expect(changeEvent.type).toBe("change");
        expect(createElement).toHaveBeenCalledWith("div");
        expect(createElement).toHaveBeenCalledWith("style");
        expect(bodyAppend).toHaveBeenCalledWith(div);
        expect(headAppend).toHaveBeenCalledWith(style);
        expect(document.body.contains(div)).toBe(true);
    });

    it("uses browser runtime providers for production URL defaults", () => {
        expect.assertions(2);

        const blob = new Blob(["settings"]);
        const createObjectURL = vi.fn<(blob: Blob) => string>(
            () => "blob:settings"
        );
        vi.stubGlobal("URL", { createObjectURL });

        const runtime = getCreateSettingsHeaderRuntime();

        expect(runtime.createObjectURL(blob)).toBe("blob:settings");
        expect(createObjectURL).toHaveBeenCalledWith(blob);
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

    it("derives document keydown listeners from the scoped document provider", () => {
        expect.assertions(4);

        let keydownCount = 0;
        const documentRef =
            document.implementation.createHTMLDocument("settings header");
        const addEventListener = vi.spyOn(documentRef, "addEventListener");
        const listener = () => {
            keydownCount += 1;
        };
        const controller = new AbortController();
        const runtime = getCreateSettingsHeaderRuntime({
            getDocument: () => documentRef,
        });

        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });

        documentRef.dispatchEvent(new KeyboardEvent("keydown"));

        expect(addEventListener).toHaveBeenCalledWith("keydown", listener, {
            signal: controller.signal,
        });
        expect(addEventListener.mock.contexts[0]).toBe(documentRef);
        expect(keydownCount).toBe(1);
        expect(document.body).not.toBe(documentRef.body);
    });

    it("routes all defaults through provider functions", () => {
        expect.assertions(20);

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
        const timer = 61 as BrowserTimerHandle;
        const scheduleTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const clearScheduledTimeout = vi.fn<BrowserClearTimeout>();
        const getAbortController = vi.fn(
            () =>
                AbortControllerConstructor as unknown as typeof AbortController
        );
        const getClearTimeout = vi.fn(() => clearScheduledTimeout);
        const getDocument = vi.fn(() => documentRef);
        const getDocumentEventTarget = vi.fn(() => documentEventTarget);
        class TestEvent extends Event {
            public constructor(type: string) {
                super(`test:${type}`);
            }
        }
        const getEvent = vi.fn(() => TestEvent);
        const getSetTimeout = vi.fn(() => scheduleTimeout);
        const blob = new Blob(["settings"]);
        const createObjectURL = vi.fn<(blob: Blob) => string>(
            () => "blob:settings"
        );
        const getURL = vi.fn(
            () =>
                ({ createObjectURL }) as Pick<
                    BrowserURLConstructor,
                    "createObjectURL"
                >
        );
        const runtime = getCreateSettingsHeaderRuntime({
            getAbortController,
            getClearTimeout,
            getDocument,
            getDocumentEventTarget,
            getEvent,
            getSetTimeout,
            getURL,
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
        const changeEvent = runtime.createChangeEvent();
        expect(runtime.createObjectURL(blob)).toBe("blob:settings");
        expect(runtime.createAbortController()).toBe(controller);

        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(getDocument).toHaveBeenCalledTimes(4);
        expect(getDocumentEventTarget).toHaveBeenCalledOnce();
        expect(getEvent).toHaveBeenCalledOnce();
        expect(getAbortController).toHaveBeenCalledOnce();
        expect(getURL).toHaveBeenCalledOnce();
        expect(changeEvent).toBeInstanceOf(TestEvent);
        expect(changeEvent.type).toBe("test:change");
        expect(createElement).toHaveBeenCalledWith("div");
        expect(createElement).toHaveBeenCalledWith("style");
        expect(bodyAppend).toHaveBeenCalledWith(div);
        expect(headAppend).toHaveBeenCalledWith(style);
        expect(scheduleTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearScheduledTimeout).toHaveBeenCalledWith(timer);
        expect(createObjectURL).toHaveBeenCalledWith(blob);
        expect(keydownCount).toBe(1);
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(19);

        const callback = vi.fn<() => void>();
        const timer = 71 as BrowserTimerHandle;
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
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
        const EventConstructor = vi.fn(function FakeEvent() {
            return new Event("legacy");
        });
        const createObjectURL = vi.fn<(blob: Blob) => string>(
            () => "blob:legacy"
        );
        const runtime = getCreateSettingsHeaderRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            Event: EventConstructor as unknown as typeof Event,
            URL: { createObjectURL },
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
        expect(() => runtime.createChangeEvent()).toThrow(
            "createSettingsHeader requires an Event runtime"
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
        expect(() => runtime.createObjectURL(new Blob(["settings"]))).toThrow(
            "createSettingsHeader requires a URL runtime"
        );

        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(listener).not.toHaveBeenCalled();
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(EventConstructor).not.toHaveBeenCalled();
        expect(createObjectURL).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
        expect(documentEventTarget.body.childElementCount).toBe(0);
        expect(documentRef.body.childElementCount).toBe(0);
        expect(documentRef.head.querySelector("style")).toBeNull();
    });
});
