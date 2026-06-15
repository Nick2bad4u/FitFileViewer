import { describe, expect, it } from "vitest";

import { getRendererDebugRuntime } from "../../../../electron-app/utils/debug/rendererDebugRuntime.js";

describe("rendererDebugRuntime", () => {
    it("allows renderer debug logging only when a window scope and debug state are present", () => {
        expect.assertions(3);

        expect(
            getRendererDebugRuntime({
                window: {},
            }).isRendererDebugLoggingAvailable(true)
        ).toBe(true);
        expect(
            getRendererDebugRuntime({
                window: {},
            }).isRendererDebugLoggingAvailable(false)
        ).toBe(false);
        expect(
            getRendererDebugRuntime({}).isRendererDebugLoggingAvailable(true)
        ).toBe(false);
    });
});
