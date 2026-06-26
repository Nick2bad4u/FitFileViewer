import { describe, expect, it } from "vitest";

import { createElectronApi } from "../../electron-app/preload/electronApiFactory.js";
import { createPreloadRuntime } from "../../electron-app/preload/preloadRuntime.js";

describe("preload runtime", () => {
    it("composes the preload runtime from native typed modules", () => {
        expect.assertions(5);

        const runtime = createPreloadRuntime();

        expect(runtime.createElectronApi).toBe(createElectronApi);
        expect(runtime.assemblePreloadApi).toBeTypeOf("function");
        expect(runtime.constants.CHANNELS.APP_VERSION).toBe("getAppVersion");
        expect(runtime.modules.createAppInfoApi).toBeTypeOf("function");
        expect(runtime.modules.createPreloadFileApiDomain).toBeTypeOf(
            "function"
        );
    });
});
