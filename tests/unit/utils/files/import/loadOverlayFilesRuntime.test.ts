import { describe, expect, it } from "vitest";

import {
    getLoadOverlayFilesRuntime,
    type LoadOverlayFilesRuntimeScope,
} from "../../../../../electron-app/utils/files/import/loadOverlayFilesRuntime.js";

describe("getLoadOverlayFilesRuntime", () => {
    it("reads hardware concurrency from the injected navigator", () => {
        expect.assertions(1);

        const view = getLoadOverlayFilesRuntime({
            getNavigator: () => ({ hardwareConcurrency: 8 }),
        });

        expect(view.getHardwareConcurrency()).toBe(8);
    });

    it("returns undefined when navigator metadata is unavailable", () => {
        expect.assertions(1);

        const view = getLoadOverlayFilesRuntime({});

        expect(view.getHardwareConcurrency()).toBeUndefined();
    });

    it("isolates throwing navigator providers", () => {
        expect.assertions(1);

        const view = getLoadOverlayFilesRuntime({
            getNavigator() {
                throw new Error("navigator unavailable");
            },
        });

        expect(view.getHardwareConcurrency()).toBeUndefined();
    });

    it("ignores legacy direct navigator scope properties", () => {
        expect.assertions(1);

        const view = getLoadOverlayFilesRuntime({
            navigator: { hardwareConcurrency: 16 },
        } as unknown as LoadOverlayFilesRuntimeScope);

        expect(view.getHardwareConcurrency()).toBeUndefined();
    });
});
