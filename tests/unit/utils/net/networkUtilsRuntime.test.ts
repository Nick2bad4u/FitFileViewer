import { describe, expect, it, vi } from "vitest";

import { getNetworkUtilsRuntime } from "../../../../electron-app/utils/net/networkUtilsRuntime.js";

describe("getNetworkUtilsRuntime", () => {
    it("routes fetch through the injected runtime scope", async () => {
        expect.assertions(2);

        const response = new Response("ok");
        const fetch = vi.fn<typeof globalThis.fetch>(async () => response);
        const runtime = getNetworkUtilsRuntime({ fetch });
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
        const runtime = getNetworkUtilsRuntime({
            getAbortController,
            getClearTimeout,
            getFetch,
            getSetTimeout,
        });
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
        const runtime = getNetworkUtilsRuntime({
            clearTimeout,
            setTimeout,
        });

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
        const runtime = getNetworkUtilsRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("does not borrow ambient runtimes for explicit scopes", () => {
        expect.assertions(4);

        const runtime = getNetworkUtilsRuntime({});

        expect(runtime.createAbortController()).toBeUndefined();
        expect(() => runtime.fetch("https://example.test")).toThrow(
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
