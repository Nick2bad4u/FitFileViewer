import { describe, expect, it, vi } from "vitest";

import { getNetworkUtilsRuntime } from "../../../electron-app/utils/net/networkUtilsRuntime.js";

describe("getNetworkUtilsRuntime", () => {
    it("creates AbortController instances through the injected runtime scope", () => {
        expect.assertions(2);

        const utils = getNetworkUtilsRuntime({
            getAbortController: () => AbortController,
        });
        const controller = utils.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller?.signal.aborted).toBe(false);
    });

    it("returns undefined when AbortController is unavailable", () => {
        expect.assertions(1);

        expect(
            getNetworkUtilsRuntime({
                getAbortController: () => undefined,
            }).createAbortController()
        ).toBeUndefined();
    });

    it("delegates fetch through the injected runtime scope", async () => {
        expect.assertions(3);

        const response = new Response("ok", { status: 200 });
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValue(response);
        const utils = getNetworkUtilsRuntime({ getFetch: () => fetch });
        const init: RequestInit = { method: "POST" };

        await expect(utils.fetch("https://example.test", init)).resolves.toBe(
            response
        );
        expect(fetch).toHaveBeenCalledWith("https://example.test", init);
        expect(fetch.mock.contexts[0]).toBeUndefined();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("250");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 37);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const utils = getNetworkUtilsRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(utils.setTimeout(callback, timeoutMs)).toBe(37);
        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);

        utils.clearTimeout(37);

        expect(clearTimeout).toHaveBeenCalledWith(37);
        expect(clearTimeout.mock.contexts[0]).toBeUndefined();
    });

    it("does not borrow ambient fetch or timer primitives for explicit scopes", async () => {
        expect.assertions(3);

        const utils = getNetworkUtilsRuntime({});

        await expect(utils.fetch("https://example.test")).rejects.toThrow(
            "networkUtils requires fetch"
        );
        expect(() => utils.setTimeout(() => {}, 1)).toThrow(
            "networkUtils requires setTimeout"
        );
        expect(() => utils.clearTimeout(1)).toThrow(
            "networkUtils requires clearTimeout"
        );
    });

    it("ignores legacy direct runtime scope properties", async () => {
        expect.assertions(4);

        const fetch = vi.fn<typeof globalThis.fetch>();
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 37);
        const utils = getNetworkUtilsRuntime({
            AbortController,
            clearTimeout,
            fetch,
            setTimeout,
        } as unknown as Parameters<typeof getNetworkUtilsRuntime>[0]);

        expect(utils.createAbortController()).toBeUndefined();
        await expect(utils.fetch("https://example.test")).rejects.toThrow(
            "networkUtils requires fetch"
        );
        expect(() => utils.setTimeout(() => {}, 1)).toThrow(
            "networkUtils requires setTimeout"
        );
        expect(() => utils.clearTimeout(1)).toThrow(
            "networkUtils requires clearTimeout"
        );
    });
});
