import { describe, expect, it } from "vitest";

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
});
