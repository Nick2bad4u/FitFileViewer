import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getNetworkUtilsRuntime,
    type NetworkUtilsRuntimeScope,
} from "../../../../electron-app/utils/net/networkUtilsRuntime.js";

function createNetworkUtilsRuntimeScope(
    overrides: Partial<NetworkUtilsRuntimeScope> = {}
): NetworkUtilsRuntimeScope {
    return {
        getAbortController: () => undefined,
        getClearTimeout: () => undefined,
        getFetch: () => undefined,
        getSetTimeout: () => undefined,
        ...overrides,
    };
}

describe("getNetworkUtilsRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("uses browser runtime providers for production network defaults", async () => {
        expect.assertions(7);

        const response = new Response("ok");
        const fetch = vi.fn<typeof globalThis.fetch>(async () => response);
        const timer = 37 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();

        vi.stubGlobal("fetch", fetch);
        vi.stubGlobal("setTimeout", setTimeout);
        vi.stubGlobal("clearTimeout", clearTimeout);

        const utils = getNetworkUtilsRuntime();
        const callback = vi.fn<() => void>();
        const timeoutMs = Number("100");

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
        await expect(utils.fetch("https://example.test")).resolves.toBe(
            response
        );
        expect(utils.setTimeout(callback, timeoutMs)).toBe(timer);
        utils.clearTimeout(timer);

        expect(fetch).toHaveBeenCalledWith("https://example.test", undefined);
        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });

    it("routes fetch through the injected runtime scope", async () => {
        expect.assertions(2);

        const response = new Response("ok");
        const fetch = vi.fn<typeof globalThis.fetch>(async () => response);
        const runtime = getNetworkUtilsRuntime(
            createNetworkUtilsRuntimeScope({ getFetch: () => fetch })
        );
        const init = { method: "POST" };

        await expect(runtime.fetch("https://example.test", init)).resolves.toBe(
            response
        );
        expect(fetch).toHaveBeenCalledWith("https://example.test", init);
    });

    it("routes browser APIs through provider functions", async () => {
        expect.assertions(12);

        const response = new Response("ok");
        const fetch = vi.fn<typeof globalThis.fetch>(async () => response);
        const getFetch = vi.fn(() => fetch);
        const timer = 37 as ReturnType<typeof globalThis.setTimeout>;
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const getClearTimeout = vi.fn(() => clearTimeout);
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const getSetTimeout = vi.fn(() => setTimeout);
        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const getAbortController = vi.fn(
            () =>
                AbortControllerConstructor as unknown as typeof AbortController
        );
        const runtime = getNetworkUtilsRuntime(
            createNetworkUtilsRuntimeScope({
                getAbortController,
                getClearTimeout,
                getFetch,
                getSetTimeout,
            })
        );
        const callback = vi.fn<() => void>();
        const delay = 100;

        await expect(runtime.fetch("https://example.test")).resolves.toBe(
            response
        );
        expect(runtime.setTimeout(callback, delay)).toBe(timer);
        runtime.clearTimeout(timer);
        expect(runtime.createAbortController()).toBe(controller);

        expect(getFetch).toHaveBeenCalledOnce();
        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(getAbortController).toHaveBeenCalledOnce();
        expect(fetch).toHaveBeenCalledWith("https://example.test", undefined);
        expect(setTimeout).toHaveBeenCalledWith(callback, delay);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(callback).not.toHaveBeenCalled();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const delay = 250;
        const timer = 23 as ReturnType<typeof globalThis.setTimeout>;
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const runtime = getNetworkUtilsRuntime(
            createNetworkUtilsRuntimeScope({
                getClearTimeout: () => clearTimeout,
                getSetTimeout: () => setTimeout,
            })
        );

        expect(runtime.setTimeout(callback, delay)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delay);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });

    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getNetworkUtilsRuntime(
            createNetworkUtilsRuntimeScope({
                getAbortController: () =>
                    AbortControllerConstructor as unknown as typeof AbortController,
            })
        );

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("does not borrow ambient runtimes for explicit scopes", async () => {
        expect.assertions(4);

        const runtime = getNetworkUtilsRuntime(
            createNetworkUtilsRuntimeScope()
        );

        expect(runtime.createAbortController()).toBeUndefined();
        await expect(runtime.fetch("https://example.test")).rejects.toThrow(
            "networkUtils requires fetch"
        );
        expect(() => runtime.setTimeout(() => undefined, 1)).toThrow(
            "networkUtils requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(23 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("networkUtils requires clearTimeout");
    });

    it("ignores legacy direct runtime scope properties", async () => {
        expect.assertions(4);

        const response = new Response("ok");
        const fetch = vi.fn<typeof globalThis.fetch>(async () => response);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(
            () => 23 as ReturnType<typeof globalThis.setTimeout>
        );
        const runtime = getNetworkUtilsRuntime({
            AbortController,
            clearTimeout,
            fetch,
            setTimeout,
        } as unknown as Parameters<typeof getNetworkUtilsRuntime>[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "networkUtils requires an AbortController provider"
        );
        await expect(runtime.fetch("https://example.test")).rejects.toThrow(
            "networkUtils requires fetch"
        );
        expect(() => runtime.setTimeout(() => undefined, 1)).toThrow(
            "networkUtils requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(23 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("networkUtils requires clearTimeout");
    });
});
