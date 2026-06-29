import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserClearTimeout,
    BrowserSetTimeout,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getShowNotificationRuntime,
    type ShowNotificationRuntimeScope,
    type ShowNotificationTimerHandle,
} from "../../../../../electron-app/utils/ui/notifications/showNotificationRuntime.js";

function createShowNotificationRuntimeScope(
    overrides: Partial<ShowNotificationRuntimeScope> = {}
): ShowNotificationRuntimeScope {
    return {
        getCancelAnimationFrame: () => undefined,
        getClearTimeout: () => undefined,
        getDateNow: () => undefined,
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
        getKeyboardEvent: () => undefined,
        getRequestAnimationFrame: () => undefined,
        getSetTimeout: () => undefined,
        ...overrides,
    };
}

describe("getShowNotificationRuntime", () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("delegates timing APIs through scoped runtime providers", () => {
        expect.assertions(14);

        const frameCallback = vi.fn<FrameRequestCallback>();
        const timerCallback = vi.fn<() => void>();
        const delay = Number("250");
        const timestamp = Number("1234");
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 17);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const dateNow = vi.fn<() => number>(() => timestamp);
        const setTimeout = vi.fn<
            (
                callback: () => void,
                duration: number
            ) => ShowNotificationTimerHandle
        >(() => 29);
        const clearTimeout =
            vi.fn<(handle: ShowNotificationTimerHandle) => void>();
        const scope = createShowNotificationRuntimeScope({
            getCancelAnimationFrame: () => cancelAnimationFrame,
            getClearTimeout: () => clearTimeout,
            getDateNow: () => dateNow,
            getRequestAnimationFrame: () => requestAnimationFrame,
            getSetTimeout: () => setTimeout,
        });
        const runtime = getShowNotificationRuntime(scope);

        expect(runtime.requestAnimationFrame(frameCallback)).toBe(17);
        runtime.cancelAnimationFrame(17);
        expect(runtime.dateNow()).toBe(timestamp);
        expect(runtime.setTimeout(timerCallback, delay)).toBe(29);
        runtime.clearTimeout(29);

        expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
        expect(requestAnimationFrame.mock.contexts[0]).toBe(scope);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(17);
        expect(cancelAnimationFrame.mock.contexts[0]).toBe(scope);
        expect(dateNow).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(timerCallback, delay);
        expect(setTimeout.mock.contexts[0]).toBe(scope);
        expect(clearTimeout).toHaveBeenCalledWith(29);
        expect(clearTimeout.mock.contexts[0]).toBe(scope);
        expect(frameCallback).not.toHaveBeenCalled();
        expect(timerCallback).not.toHaveBeenCalled();
    });

    it("uses browser runtime providers for production timing, DOM, and constructor defaults", () => {
        expect.assertions(16);

        const frameCallback = vi.fn<FrameRequestCallback>();
        const timerCallback = vi.fn<() => void>();
        const delay = Number("250");
        const timestamp = Number("1234");
        const frame = Number("17");
        const timer = 29 as ShowNotificationTimerHandle;
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => frame);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const dateNow = vi.spyOn(Date, "now").mockReturnValue(timestamp);

        vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);
        vi.stubGlobal("clearTimeout", clearTimeout);
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
        vi.stubGlobal("setTimeout", setTimeout);

        const host = document.createElement("div");
        host.id = "notification";
        document.body.append(host);

        const runtime = getShowNotificationRuntime();
        const button = runtime.createElement("button");
        const keyboardEvent = new KeyboardEvent("keydown");

        expect(runtime.requestAnimationFrame(frameCallback)).toBe(frame);
        runtime.cancelAnimationFrame(frame);
        expect(runtime.dateNow()).toBe(timestamp);
        expect(runtime.setTimeout(timerCallback, delay)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(runtime.queryElement("#notification")).toBe(host);
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button.ownerDocument).toBe(document);
        expect(runtime.isHTMLElement(button)).toBe(true);
        expect(runtime.isHTMLElement({ closest: () => null })).toBe(false);
        expect(runtime.isKeyboardEvent(keyboardEvent)).toBe(true);
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
        expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(frame);
        expect(setTimeout).toHaveBeenCalledWith(timerCallback, delay);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(dateNow).toHaveBeenCalled();
        expect(timerCallback).not.toHaveBeenCalled();
    });

    it("queries and creates elements through the document provider", () => {
        expect.assertions(4);

        const documentRef =
            document.implementation.createHTMLDocument("notification");
        const host = documentRef.createElement("div");
        host.id = "notification";
        documentRef.body.append(host);
        const runtime = getShowNotificationRuntime(
            createShowNotificationRuntimeScope({
                getDocument: () => documentRef,
            })
        );

        const queried = runtime.queryElement("#notification");
        const button = runtime.createElement("button");

        expect(queried).toBe(host);
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button.ownerDocument).toBe(documentRef);
        expect(button.tagName).toBe("BUTTON");
    });

    it("checks event and element constructors through scoped runtime providers", () => {
        expect.assertions(4);

        const runtime = getShowNotificationRuntime(
            createShowNotificationRuntimeScope({
                getHTMLElement: () => HTMLElement,
                getKeyboardEvent: () => KeyboardEvent,
            })
        );

        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(true);
        expect(runtime.isHTMLElement({ closest: () => null })).toBe(false);
        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            true
        );
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
    });

    it("falls back clearly when optional frame APIs are unavailable", () => {
        expect.assertions(5);

        const frameCallback = vi.fn<FrameRequestCallback>();
        const legacyRequestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 31);
        const legacyCancelAnimationFrame = vi.fn<(handle: number) => void>();
        const legacyDirectScope = {
            cancelAnimationFrame: legacyCancelAnimationFrame,
            requestAnimationFrame: legacyRequestAnimationFrame,
        };

        expect(() =>
            getShowNotificationRuntime(
                legacyDirectScope as unknown as ShowNotificationRuntimeScope
            )
        ).toThrow(
            "show notification runtime requires cancelAnimationFrame provider"
        );

        const runtime = getShowNotificationRuntime({
            ...legacyDirectScope,
            ...createShowNotificationRuntimeScope(),
        } as unknown as ShowNotificationRuntimeScope);

        expect(runtime.requestAnimationFrame(frameCallback)).toBeNull();
        runtime.cancelAnimationFrame(31);

        expect(frameCallback).toHaveBeenCalledWith(0);
        expect(legacyRequestAnimationFrame).not.toHaveBeenCalled();
        expect(legacyCancelAnimationFrame).not.toHaveBeenCalled();
    });

    it("fails fast when required providers are unavailable", () => {
        expect.assertions(7);

        const runtime = getShowNotificationRuntime(
            createShowNotificationRuntimeScope()
        );

        expect(() => runtime.setTimeout(() => undefined, 0)).toThrow(
            "show notification runtime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(1)).toThrow(
            "show notification runtime requires clearTimeout"
        );
        expect(() => runtime.dateNow()).toThrow(
            "show notification runtime requires dateNow"
        );
        expect(() => runtime.queryElement("#notification")).toThrow(
            "show notification runtime requires document"
        );
        expect(() => runtime.createElement("button")).toThrow(
            "show notification runtime requires document"
        );
        expect(() =>
            runtime.isHTMLElement(document.createElement("div"))
        ).toThrow("show notification runtime requires HTMLElement");
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "show notification runtime requires KeyboardEvent"
        );
    });

    it("ignores legacy direct timer, document, and constructor scope properties", () => {
        expect.assertions(13);

        const querySelector = vi.fn<Document["querySelector"]>();
        const createElement = vi.fn<Document["createElement"]>();
        const dateNow = vi.fn<() => number>(() => 1234);
        const setTimeout = vi.fn();
        const clearTimeout = vi.fn();
        const legacyDirectScope = {
            clearTimeout,
            dateNow,
            document: { createElement, querySelector },
            HTMLElement,
            KeyboardEvent,
            setTimeout,
        };

        expect(() =>
            getShowNotificationRuntime(
                legacyDirectScope as unknown as ShowNotificationRuntimeScope
            )
        ).toThrow(
            "show notification runtime requires cancelAnimationFrame provider"
        );

        const runtime = getShowNotificationRuntime({
            ...legacyDirectScope,
            ...createShowNotificationRuntimeScope(),
        } as unknown as ShowNotificationRuntimeScope);

        expect(() => runtime.setTimeout(() => undefined, 0)).toThrow(
            "show notification runtime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(1)).toThrow(
            "show notification runtime requires clearTimeout"
        );
        expect(() => runtime.dateNow()).toThrow(
            "show notification runtime requires dateNow"
        );
        expect(() => runtime.queryElement("#notification")).toThrow(
            "show notification runtime requires document"
        );
        expect(() => runtime.createElement("button")).toThrow(
            "show notification runtime requires document"
        );
        expect(() =>
            runtime.isHTMLElement(document.createElement("div"))
        ).toThrow("show notification runtime requires HTMLElement");
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "show notification runtime requires KeyboardEvent"
        );
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(dateNow).not.toHaveBeenCalled();
        expect(querySelector).not.toHaveBeenCalled();
        expect(createElement).not.toHaveBeenCalled();
    });
});
