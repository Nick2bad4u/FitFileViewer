import { describe, expect, it } from "vitest";
import * as preloadEnvironment from "../../electron-app/preload/environment.js";

describe("preload environment helpers", () => {
    it("detects development mode only from NODE_ENV=development", () => {
        expect.assertions(3);

        expect({
            development: preloadEnvironment.isPreloadDevelopmentMode({
                env: { NODE_ENV: "development" },
            }),
        }).toStrictEqual({ development: true });

        expect({
            development: preloadEnvironment.isPreloadDevelopmentMode({
                env: { NODE_ENV: "development" },
            }),
        }).not.toStrictEqual({ development: false });

        expect({
            development: preloadEnvironment.isPreloadDevelopmentMode({
                env: { NODE_ENV: "production" },
            }),
        }).toStrictEqual({ development: false });
    });

    it("detects Electron runtime from process.versions.electron", () => {
        expect.assertions(2);

        expect({
            electron: preloadEnvironment.isPreloadElectronRuntime({
                versions: { electron: "31.0.0" },
            }),
        }).toStrictEqual({ electron: true });

        expect({
            electron: preloadEnvironment.isPreloadElectronRuntime({
                versions: { node: "26.2.0" },
            }),
        }).toStrictEqual({ electron: false });
    });

    it("ignores malformed preload process environment shapes", () => {
        expect.assertions(4);

        expect(
            preloadEnvironment.isPreloadDevelopmentMode({
                env: null,
            })
        ).toBe(false);
        expect(
            preloadEnvironment.isPreloadDevelopmentMode({
                env: "development",
            })
        ).toBe(false);
        expect(
            preloadEnvironment.isPreloadElectronRuntime({
                versions: null,
            })
        ).toBe(false);
        expect(
            preloadEnvironment.isPreloadElectronRuntime({
                versions: "31.0.0",
            })
        ).toBe(false);
    });

    it("fails closed when preload process accessors throw", () => {
        expect.assertions(2);

        const throwingEnvironmentProcess = {
            get env() {
                throw new Error("env unavailable");
            },
        };
        const throwingVersionsProcess = {
            get versions() {
                throw new Error("versions unavailable");
            },
        };

        expect(
            preloadEnvironment.isPreloadDevelopmentMode(
                throwingEnvironmentProcess
            )
        ).toBe(false);
        expect(
            preloadEnvironment.isPreloadElectronRuntime(throwingVersionsProcess)
        ).toBe(false);
    });

    it("enforces generic IPC allowlist in Electron regardless of environment bypasses", () => {
        expect.assertions(3);

        expect({
            enforce: preloadEnvironment.shouldEnforceGenericIpcAllowlist({
                env: {},
                versions: { electron: "31.0.0" },
            }),
        }).toStrictEqual({ enforce: true });

        expect({
            enforce: preloadEnvironment.shouldEnforceGenericIpcAllowlist({
                env: { FFV_ALLOW_GENERIC_IPC: "true" },
                versions: { electron: "31.0.0" },
            }),
        }).toStrictEqual({ enforce: true });

        expect({
            enforce: preloadEnvironment.shouldEnforceGenericIpcAllowlist({
                env: {},
                versions: { node: "26.2.0" },
            }),
        }).toStrictEqual({ enforce: false });
    });
});
