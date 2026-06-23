import { describe, expect, it, vi } from "vitest";

import {
    getShowNotificationRuntime,
    type ShowNotificationRuntimeScope,
    type ShowNotificationTimerHandle,
} from "../../../../../electron-app/utils/ui/notifications/showNotificationRuntime.js";

describe("getShowNotificationRuntime", () => {
    it("delegates timing APIs through scoped runtime providers", () => {
        expect.assertions(12);

        const frameCallback = vi.fn<FrameRequestCallback>();
        const timerCallback = vi.fn<() => void>();
        const delay = Number("250");
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 17);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const setTimeout = vi.fn<
            (
                callback: () => void,
                duration: number
            ) => ShowNotificationTimerHandle
        >(() => 29);
        const clearTimeout =
            vi.fn<(handle: ShowNotificationTimerHandle) => void>();
        const scope: ShowNotificationRuntimeScope = {
            getCancelAnimationFrame: () => cancelAnimationFrame,
            getClearTimeout: () => clearTimeout,
            getRequestAnimationFrame: () => requestAnimationFrame,
            getSetTimeout: () => setTimeout,
        };
        const runtime = getShowNotificationRuntime(scope);

        expect(runtime.requestAnimationFrame(frameCallback)).toBe(17);
        runtime.cancelAnimationFrame(17);
        expect(runtime.setTimeout(timerCallback, delay)).toBe(29);
        runtime.clearTimeout(29);

        expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
        expect(requestAnimationFrame.mock.contexts[0]).toBe(scope);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(17);
        expect(cancelAnimationFrame.mock.contexts[0]).toBe(scope);
        expect(setTimeout).toHaveBeenCalledWith(timerCallback, delay);
        expect(setTimeout.mock.contexts[0]).toBe(scope);
        expect(clearTimeout).toHaveBeenCalledWith(29);
        expect(clearTimeout.mock.contexts[0]).toBe(scope);
        expect(frameCallback).not.toHaveBeenCalled();
        expect(timerCallback).not.toHaveBeenCalled();
    });

    it("queries and creates elements through the document provider", () => {
        expect.assertions(4);

        const documentRef =
            document.implementation.createHTMLDocument("notification");
        const host = documentRef.createElement("div");
        host.id = "notification";
        documentRef.body.append(host);
        const runtime = getShowNotificationRuntime({
            getDocument: () => documentRef,
        });

        const queried = runtime.queryElement("#notification");
        const button = runtime.createElement("button");

        expect(queried).toBe(host);
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button.ownerDocument).toBe(documentRef);
        expect(button.tagName).toBe("BUTTON");
    });

    it("falls back clearly when optional frame APIs are unavailable", () => {
        expect.assertions(4);

        const frameCallback = vi.fn<FrameRequestCallback>();
        const legacyRequestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 31);
        const legacyCancelAnimationFrame = vi.fn<(handle: number) => void>();
        const runtime = getShowNotificationRuntime({
            cancelAnimationFrame: legacyCancelAnimationFrame,
            requestAnimationFrame: legacyRequestAnimationFrame,
        } as unknown as ShowNotificationRuntimeScope);

        expect(runtime.requestAnimationFrame(frameCallback)).toBeNull();
        runtime.cancelAnimationFrame(31);

        expect(frameCallback).toHaveBeenCalledWith(0);
        expect(legacyRequestAnimationFrame).not.toHaveBeenCalled();
        expect(legacyCancelAnimationFrame).not.toHaveBeenCalled();
    });

    it("fails fast when required providers are unavailable", () => {
        expect.assertions(4);

        const runtime = getShowNotificationRuntime({});

        expect(() => runtime.setTimeout(() => undefined, 0)).toThrow(
            "show notification runtime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(1)).toThrow(
            "show notification runtime requires clearTimeout"
        );
        expect(() => runtime.queryElement("#notification")).toThrow(
            "show notification runtime requires document"
        );
        expect(() => runtime.createElement("button")).toThrow(
            "show notification runtime requires document"
        );
    });

    it("ignores legacy direct timer and document scope properties", () => {
        expect.assertions(8);

        const querySelector = vi.fn<Document["querySelector"]>();
        const createElement = vi.fn<Document["createElement"]>();
        const setTimeout = vi.fn();
        const clearTimeout = vi.fn();
        const runtime = getShowNotificationRuntime({
            clearTimeout,
            document: { createElement, querySelector },
            setTimeout,
        } as unknown as ShowNotificationRuntimeScope);

        expect(() => runtime.setTimeout(() => undefined, 0)).toThrow(
            "show notification runtime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(1)).toThrow(
            "show notification runtime requires clearTimeout"
        );
        expect(() => runtime.queryElement("#notification")).toThrow(
            "show notification runtime requires document"
        );
        expect(() => runtime.createElement("button")).toThrow(
            "show notification runtime requires document"
        );
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(querySelector).not.toHaveBeenCalled();
        expect(createElement).not.toHaveBeenCalled();
    });
});
