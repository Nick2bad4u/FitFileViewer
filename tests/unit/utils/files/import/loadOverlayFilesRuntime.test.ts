import { describe, expect, it } from "vitest";

import { getLoadOverlayFilesRuntime } from "../../../../../electron-app/utils/files/import/loadOverlayFilesRuntime.js";

describe("getLoadOverlayFilesRuntime", () => {
    it("reads hardware concurrency from the injected navigator", () => {
        expect.assertions(1);

        const view = getLoadOverlayFilesRuntime({
            navigator: { hardwareConcurrency: 8 },
        });

        expect(view.getHardwareConcurrency()).toBe(8);
    });

    it("returns undefined when navigator metadata is unavailable", () => {
        expect.assertions(1);

        const view = getLoadOverlayFilesRuntime({});

        expect(view.getHardwareConcurrency()).toBeUndefined();
    });

    it("isolates throwing navigator accessors", () => {
        expect.assertions(1);

        const scope = {};
        Object.defineProperty(scope, "navigator", {
            get() {
                throw new Error("navigator unavailable");
            },
        });
        const view = getLoadOverlayFilesRuntime(scope);

        expect(view.getHardwareConcurrency()).toBeUndefined();
    });
});
