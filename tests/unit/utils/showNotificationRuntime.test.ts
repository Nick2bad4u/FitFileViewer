import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getShowNotificationRuntime,
    type ShowNotificationRuntimeScope,
} from "../../../electron-app/utils/ui/notifications/showNotificationRuntime.js";

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

describe("showNotificationRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
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
        const scopeRuntime = createShowNotificationRuntimeScope({
            getRequestAnimationFrame: () => requestAnimationFrame,
        });

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

        const frame = getShowNotificationRuntime(
            createShowNotificationRuntimeScope()
        ).requestAnimationFrame(callback);

        expect(frame).toBeNull();
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("cancels animation frames through the scoped frame canceler provider", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn();
        const scopeRuntime = createShowNotificationRuntimeScope({
            getCancelAnimationFrame: () => cancelAnimationFrame,
        });

        getShowNotificationRuntime(scopeRuntime).cancelAnimationFrame(29);

        expect(() =>
            getShowNotificationRuntime(
                createShowNotificationRuntimeScope()
            ).cancelAnimationFrame(31)
        ).not.toThrow();
        expect(cancelAnimationFrame).toHaveBeenCalledWith(29);
    });

    it("delegates notification timers through the scoped runtime providers", () => {
        expect.assertions(6);

        const callback = vi.fn();
        const timestamp = Number("1700");
        const timer = Number("31");
        const duration = Number("300");
        const clearTimeout = vi.fn();
        const dateNow = vi.fn<() => number>(() => timestamp);
        const setTimeout = vi.fn(() => timer);
        const scopeRuntime = createShowNotificationRuntimeScope({
            getClearTimeout: () => clearTimeout,
            getDateNow: () => dateNow,
            getSetTimeout: () => setTimeout,
        });
        const runtime = getShowNotificationRuntime(scopeRuntime);

        const currentTimestamp = runtime.dateNow();
        const scheduledTimer = runtime.setTimeout(callback, duration);
        runtime.clearTimeout(scheduledTimer);

        expect(currentTimestamp).toBe(timestamp);
        expect(dateNow).toHaveBeenCalledTimes(1);
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
        const utils = getShowNotificationRuntime(
            createShowNotificationRuntimeScope({
                getDocument: () => documentRef,
            })
        );

        const queried = utils.queryElement("#notification");
        const button = utils.createElement("button");

        expect(queried).toBe(host);
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button.ownerDocument).toBe(documentRef);
        expect(button.tagName).toBe("BUTTON");
    });

    it("fails clearly when notification document access is unavailable", () => {
        expect.assertions(2);

        const utils = getShowNotificationRuntime(
            createShowNotificationRuntimeScope()
        );

        expect(() => utils.queryElement("#notification")).toThrow(
            "show notification runtime requires document"
        );
        expect(() => utils.createElement("button")).toThrow(
            "show notification runtime requires document"
        );
    });

    it("ignores legacy direct timing runtime properties", () => {
        expect.assertions(12);

        const callback = vi.fn();
        const frameCallback = vi.fn();
        const dateNow = vi.fn<() => number>(() => 1234);
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 41);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const requestAnimationFrame = vi.fn(() => 43);
        const cancelAnimationFrame = vi.fn();
        const legacyDirectScope = {
            cancelAnimationFrame,
            clearTimeout,
            dateNow,
            requestAnimationFrame,
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
        } as unknown as Parameters<typeof getShowNotificationRuntime>[0]);

        expect(() => runtime.setTimeout(callback, 0)).toThrow(
            "show notification runtime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(41)).toThrow(
            "show notification runtime requires clearTimeout"
        );
        expect(() => runtime.dateNow()).toThrow(
            "show notification runtime requires dateNow"
        );
        expect(runtime.requestAnimationFrame(frameCallback)).toBeNull();
        runtime.cancelAnimationFrame(43);

        expect(frameCallback).toHaveBeenCalledWith(0);
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(dateNow).not.toHaveBeenCalled();
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
    });

    it("ignores legacy direct document runtime properties", () => {
        expect.assertions(5);

        const querySelector = vi.fn<Document["querySelector"]>();
        const createElement = vi.fn<Document["createElement"]>();
        const legacyDirectScope = {
            document: { createElement, querySelector },
        };

        expect(() =>
            getShowNotificationRuntime(
                legacyDirectScope as unknown as ShowNotificationRuntimeScope
            )
        ).toThrow(
            "show notification runtime requires cancelAnimationFrame provider"
        );

        const utils = getShowNotificationRuntime({
            ...legacyDirectScope,
            ...createShowNotificationRuntimeScope(),
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
        expect.assertions(6);

        const callback = vi.fn();
        const duration = Number("500");
        const timer = Number("37");
        const timestamp = Number("2000");
        const dateNow = vi.fn<() => number>(() => timestamp);
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getShowNotificationRuntime();

        vi.spyOn(Date, "now").mockImplementation(dateNow);
        vi.stubGlobal("setTimeout", setTimeout);
        vi.stubGlobal("clearTimeout", clearTimeout);

        const currentTimestamp = runtime.dateNow();
        const scheduledTimer = runtime.setTimeout(callback, duration);
        runtime.clearTimeout(scheduledTimer);

        expect(currentTimestamp).toBe(timestamp);
        expect(dateNow).toHaveBeenCalledTimes(1);
        expect(scheduledTimer).toBe(timer);
        expect(setTimeout).toHaveBeenCalledWith(callback, duration);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });
});
