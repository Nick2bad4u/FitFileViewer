import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getShowNotificationRuntime,
    type ShowNotificationRuntimeScope,
} from "../../../electron-app/utils/ui/notifications/showNotificationRuntime.js";

describe("showNotificationRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("resolves default browser animation frame wrappers when notification operations run", () => {
        expect.assertions(6);

        const callback = vi.fn();
        const requestAnimationFrame = vi.fn(() => 13);
        const cancelAnimationFrame = vi.fn();
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
        vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

        const runtime = getShowNotificationRuntime();
        const frame = runtime.requestAnimationFrame(callback);
        runtime.cancelAnimationFrame(frame ?? 0);

        expect(frame).toBe(13);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toBe(globalThis);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(13);
        expect(cancelAnimationFrame.mock.contexts[0]).toBe(globalThis);
        expect(callback).not.toHaveBeenCalled();
    });

    it("schedules animation frames through the scoped scheduler provider", () => {
        expect.assertions(2);

        const callback = vi.fn();
        const requestAnimationFrame = vi.fn(() => 23);
        const scopeRuntime = {
            getRequestAnimationFrame: () => requestAnimationFrame,
        };

        const frame =
            getShowNotificationRuntime(scopeRuntime).requestAnimationFrame(
                callback
            );

        expect(frame).toBe(23);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
    });

    it("runs animation frame callbacks immediately when no scheduler exists", () => {
        expect.assertions(2);

        const callback = vi.fn();

        const frame = getShowNotificationRuntime({}).requestAnimationFrame(
            callback
        );

        expect(frame).toBeNull();
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("cancels animation frames through the scoped frame canceler provider", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn();
        const scopeRuntime = {
            getCancelAnimationFrame: () => cancelAnimationFrame,
        };

        getShowNotificationRuntime(scopeRuntime).cancelAnimationFrame(29);

        expect(() =>
            getShowNotificationRuntime({}).cancelAnimationFrame(31)
        ).not.toThrow();
        expect(cancelAnimationFrame).toHaveBeenCalledWith(29);
    });

    it("delegates notification timers through the scoped runtime providers", () => {
        expect.assertions(4);

        const callback = vi.fn();
        const timer = Number("31");
        const duration = Number("300");
        const clearTimeout = vi.fn();
        const setTimeout = vi.fn(() => timer);
        const scopeRuntime = {
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        };
        const runtime = getShowNotificationRuntime(scopeRuntime);

        const scheduledTimer = runtime.setTimeout(callback, duration);
        runtime.clearTimeout(scheduledTimer);

        expect(scheduledTimer).toBe(timer);
        expect(setTimeout).toHaveBeenCalledWith(callback, duration);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });

    it("queries and creates notification elements through the scoped document provider", () => {
        expect.assertions(4);

        const documentRef =
            document.implementation.createHTMLDocument("notification");
        const host = documentRef.createElement("div");
        host.id = "notification";
        documentRef.body.append(host);
        const utils = getShowNotificationRuntime({
            getDocument: () => documentRef,
        });

        const queried = utils.queryElement("#notification");
        const button = utils.createElement("button");

        expect(queried).toBe(host);
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button.ownerDocument).toBe(documentRef);
        expect(button.tagName).toBe("BUTTON");
    });

    it("fails clearly when notification document access is unavailable", () => {
        expect.assertions(2);

        const utils = getShowNotificationRuntime({});

        expect(() => utils.queryElement("#notification")).toThrow(
            "show notification runtime requires document"
        );
        expect(() => utils.createElement("button")).toThrow(
            "show notification runtime requires document"
        );
    });

    it("ignores legacy direct timing runtime properties", () => {
        expect.assertions(9);

        const callback = vi.fn();
        const frameCallback = vi.fn();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 41);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const requestAnimationFrame = vi.fn(() => 43);
        const cancelAnimationFrame = vi.fn();
        const runtime = getShowNotificationRuntime({
            cancelAnimationFrame,
            clearTimeout,
            requestAnimationFrame,
            setTimeout,
        } as unknown as Parameters<typeof getShowNotificationRuntime>[0]);

        expect(() => runtime.setTimeout(callback, 0)).toThrow(
            "show notification runtime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(41)).toThrow(
            "show notification runtime requires clearTimeout"
        );
        expect(runtime.requestAnimationFrame(frameCallback)).toBeNull();
        runtime.cancelAnimationFrame(43);

        expect(frameCallback).toHaveBeenCalledWith(0);
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
    });

    it("ignores legacy direct document runtime properties", () => {
        expect.assertions(4);

        const querySelector = vi.fn<Document["querySelector"]>();
        const createElement = vi.fn<Document["createElement"]>();
        const utils = getShowNotificationRuntime({
            document: { createElement, querySelector },
        } as unknown as ShowNotificationRuntimeScope);

        expect(() => utils.queryElement("#notification")).toThrow(
            "show notification runtime requires document"
        );
        expect(() => utils.createElement("button")).toThrow(
            "show notification runtime requires document"
        );
        expect(querySelector).not.toHaveBeenCalled();
        expect(createElement).not.toHaveBeenCalled();
    });

    it("resolves default browser timers when notification operations run", () => {
        expect.assertions(4);

        const callback = vi.fn();
        const duration = Number("500");
        const timer = Number("37");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getShowNotificationRuntime();

        vi.stubGlobal("setTimeout", setTimeout);
        vi.stubGlobal("clearTimeout", clearTimeout);

        const scheduledTimer = runtime.setTimeout(callback, duration);
        runtime.clearTimeout(scheduledTimer);

        expect(scheduledTimer).toBe(timer);
        expect(setTimeout).toHaveBeenCalledWith(callback, duration);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });
});
