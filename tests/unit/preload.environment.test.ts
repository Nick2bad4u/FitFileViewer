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
