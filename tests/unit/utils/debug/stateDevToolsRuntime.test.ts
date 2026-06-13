import { describe, expect, it, vi } from "vitest";

import { getStateDevToolsRuntime } from "../../../../electron-app/utils/debug/stateDevToolsRuntime.js";

describe("stateDevToolsRuntime", () => {
    it("treats localhost renderer scopes as development", () => {
        expect.assertions(2);

        expect(
            getStateDevToolsRuntime({
                location: { hostname: "localhost", protocol: "http:" },
                window: {},
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getStateDevToolsRuntime({
                location: { hostname: "127.0.0.1", protocol: "http:" },
                window: {},
            }).isDevelopmentScope()
        ).toBe(true);
    });

    it("treats file protocol renderer scopes as development", () => {
        expect.assertions(1);

        expect(
            getStateDevToolsRuntime({
                location: { hostname: "app", protocol: "file:" },
                window: {},
            }).isDevelopmentScope()
        ).toBe(true);
    });

    it("rejects production and non-renderer scopes", () => {
        expect.assertions(2);

        expect(
            getStateDevToolsRuntime({
                location: { hostname: "example.com", protocol: "https:" },
                window: {},
            }).isDevelopmentScope()
        ).toBe(false);
        expect(
            getStateDevToolsRuntime({
                location: { hostname: "localhost", protocol: "http:" },
                window: undefined,
            }).isDevelopmentScope()
        ).toBe(false);
    });

    it("delegates interval scheduling and clearing through the provided scope", () => {
        expect.assertions(4);

        const intervalHandle = 123 as ReturnType<typeof globalThis.setInterval>;
        const callback = vi.fn();
        const clearIntervalMock = vi.fn<typeof globalThis.clearInterval>();
        const setIntervalMock = vi.fn<typeof globalThis.setInterval>(
            () => intervalHandle
        );
        const runtime = getStateDevToolsRuntime({
            clearInterval: clearIntervalMock,
            setInterval: setIntervalMock,
        });
        const handle = runtime.setInterval(callback, 1000);

        expect(handle).toBe(intervalHandle);
        expect(setIntervalMock).toHaveBeenCalledWith(callback, 1000);

        runtime.clearInterval(handle);

        expect(clearIntervalMock).toHaveBeenCalledWith(intervalHandle);
        expect(callback).not.toHaveBeenCalled();
    });

    it("does not borrow ambient intervals for explicit scopes", () => {
        expect.assertions(2);

        const utils = getStateDevToolsRuntime({});

        expect(() => utils.setInterval(() => {}, 0)).toThrow(
            "stateDevToolsRuntime requires setInterval"
        );
        expect(() => {
            utils.clearInterval(
                123 as ReturnType<typeof globalThis.setInterval>
            );
        }).toThrow("stateDevToolsRuntime requires clearInterval");
    });
});
