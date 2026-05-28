import { describe, expect, it } from "vitest";

import {
    getEnvironment,
    isDevelopmentMode,
} from "../../../../../electron-app/utils/app/initialization/rendererEnvironment.js";

function createScope(overrides: Record<string, unknown> = {}): object {
    return {
        location: {
            hostname: "app.example.com",
            href: "https://app.example.com/",
            protocol: "https:",
            search: "",
        },
        ...overrides,
    };
}

describe("rendererEnvironment", () => {
    it("classifies a remote app URL without flags as production", () => {
        expect.assertions(2);

        const scope = createScope();

        expect({ development: isDevelopmentMode(scope) }).toStrictEqual({
            development: false,
        });

        expect(getEnvironment(scope)).toBe("production");
    });

    it.each([
        ["localhost"],
        ["127.0.0.1"],
        ["preview-dev.example.com"],
    ])("treats %s as a development host", (hostname) => {
        expect.assertions(2);

        const scope = createScope({
            location: {
                hostname,
                href: `https://${hostname}/`,
                protocol: "https:",
                search: "",
            },
        });

        expect({ development: isDevelopmentMode(scope) }).toStrictEqual({
            development: true,
        });

        expect(getEnvironment(scope)).toBe("development");
    });

    it.each([
        ["debug query", { search: "?debug=true" }],
        ["file protocol", { protocol: "file:" }],
        ["electron href", { href: "app://electron/index.html" }],
    ])("treats a %s location marker as development", (_name, locationPatch) => {
        expect.assertions(1);

        const baseLocation = {
            hostname: "app.example.com",
            href: "https://app.example.com/",
            protocol: "https:",
            search: "",
        };

        expect({
            development: isDevelopmentMode(
                createScope({
                    location: {
                        ...baseLocation,
                        ...locationPatch,
                    },
                })
            ),
        }).toStrictEqual({
            development: true,
        });
    });

    it("requires the global development flag to be exactly true", () => {
        expect.assertions(2);

        expect({
            development: isDevelopmentMode(
                createScope({ __DEVELOPMENT__: true })
            ),
        }).toStrictEqual({
            development: true,
        });

        expect({
            development: isDevelopmentMode(
                createScope({ __DEVELOPMENT__: false })
            ),
        }).toStrictEqual({
            development: false,
        });
    });

    it("preserves the document dataset devMode ownership check", () => {
        expect.assertions(1);

        const scope = createScope({
            document: {
                documentElement: {
                    dataset: {
                        devMode: undefined,
                    },
                },
            },
        });

        expect({ development: isDevelopmentMode(scope) }).toStrictEqual({
            development: true,
        });
    });

    it("treats any defined electron __devMode value as development", () => {
        expect.assertions(3);

        expect({
            development: isDevelopmentMode(
                createScope({ electronAPI: { __devMode: false } })
            ),
        }).toStrictEqual({
            development: true,
        });

        expect({
            development: isDevelopmentMode(
                createScope({ electronAPI: { __devMode: null } })
            ),
        }).toStrictEqual({
            development: true,
        });

        expect({
            development: isDevelopmentMode(
                createScope({ electronAPI: { __devMode: undefined } })
            ),
        }).toStrictEqual({
            development: false,
        });
    });

    it("defaults to production when global inspection throws", () => {
        expect.assertions(2);

        const scope = {
            get location() {
                throw new Error("location unavailable");
            },
        };

        expect({ development: isDevelopmentMode(scope) }).toStrictEqual({
            development: false,
        });

        expect(getEnvironment(scope)).toBe("production");
    });
});
