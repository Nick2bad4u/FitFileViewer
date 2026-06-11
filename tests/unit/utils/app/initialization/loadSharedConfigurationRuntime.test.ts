import { describe, expect, it } from "vitest";

import { getLoadSharedConfigurationRuntime } from "../../../../../electron-app/utils/app/initialization/loadSharedConfigurationRuntime.js";

describe("getLoadSharedConfigurationRuntime", () => {
    it("reads the current location search from an injected runtime scope", () => {
        expect.assertions(1);

        const runtime = getLoadSharedConfigurationRuntime({
            location: {
                search: "?chartConfig=abc",
            },
        });

        expect(runtime.locationSearch).toBe("?chartConfig=abc");
    });

    it("uses an empty search string when no location is available", () => {
        expect.assertions(1);

        expect(getLoadSharedConfigurationRuntime({}).locationSearch).toBe("");
    });
});
