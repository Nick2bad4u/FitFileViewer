import { describe, expect, it } from "vitest";

import {
    getEnvironment,
    isDevelopmentMode,
} from "../../../../../electron-app/utils/app/initialization/rendererEnvironment.js";

function createEnvironmentInput(
    overrides: Record<string, unknown> = {}
): object {
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

        const environmentInput = createEnvironmentInput();

        expect({
            development: isDevelopmentMode(environmentInput),
        }).toStrictEqual({ development: false });

        expect(getEnvironment(environmentInput)).toBe("production");
    });

    it.each([
        ["localhost"],
        ["127.0.0.1"],
        ["preview-dev.example.com"],
    ])("treats %s as a development host", (hostname) => {
        expect.assertions(2);

        const environmentInput = createEnvironmentInput({
            location: {
                hostname,
                href: `https://${hostname}/`,
                protocol: "https:",
                search: "",
            },
        });

        expect({
            development: isDevelopmentMode(environmentInput),
        }).toStrictEqual({ development: true });

        expect(getEnvironment(environmentInput)).toBe("development");
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
                createEnvironmentInput({
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

    it("requires the focused development flag to be exactly true", () => {
        expect.assertions(2);

        expect({
            development: isDevelopmentMode(
                createEnvironmentInput({ __DEVELOPMENT__: true })
            ),
        }).toStrictEqual({
            development: true,
        });

        expect({
            development: isDevelopmentMode(
                createEnvironmentInput({ __DEVELOPMENT__: false })
            ),
        }).toStrictEqual({
            development: false,
        });
    });

    it("preserves the document dataset devMode ownership check", () => {
        expect.assertions(1);

        const environmentInput = createEnvironmentInput({
            document: {
                documentElement: {
                    dataset: {
                        devMode: undefined,
                    },
                },
            },
        });

        expect({
            development: isDevelopmentMode(environmentInput),
        }).toStrictEqual({ development: true });
    });

    it("ignores stale electron dev-mode markers", () => {
        expect.assertions(2);

        expect({
            development: isDevelopmentMode(
                createEnvironmentInput({
                    electronApiCandidate: { __devMode: false },
                })
            ),
        }).toStrictEqual({
            development: false,
        });

        expect({
            development: isDevelopmentMode(
                createEnvironmentInput({
                    electronApiCandidate: { __devMode: null },
                })
            ),
        }).toStrictEqual({
            development: false,
        });
    });

    it("ignores inherited stale electron dev-mode markers", () => {
        expect.assertions(1);

        const inheritedElectronApi = Object.create({ __devMode: true });

        expect({
            development: isDevelopmentMode(
                createEnvironmentInput({
                    electronApiCandidate: inheritedElectronApi,
                })
            ),
        }).toStrictEqual({ development: false });
    });

    it("ignores malformed nested environment values", () => {
        expect.assertions(2);

        const environmentInput = createEnvironmentInput({
            document: {
                documentElement: {
                    dataset: "not a dataset",
                },
            },
            electronApiCandidate: "not an api",
            location: {
                hostname: null,
                href: undefined,
                protocol: 42,
                search: false,
            },
        });

        expect({
            development: isDevelopmentMode(environmentInput),
        }).toStrictEqual({ development: false });

        expect(getEnvironment(environmentInput)).toBe("production");
    });

    it("defaults to production when environment input inspection throws", () => {
        expect.assertions(2);

        const environmentInput = {
            get location() {
                throw new Error("location unavailable");
            },
        };

        expect({
            development: isDevelopmentMode(environmentInput),
        }).toStrictEqual({ development: false });

        expect(getEnvironment(environmentInput)).toBe("production");
    });
});
