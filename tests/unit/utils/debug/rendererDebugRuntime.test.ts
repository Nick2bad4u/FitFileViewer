import { describe, expect, it } from "vitest";

import { getRendererDebugRuntime } from "../../../../electron-app/utils/debug/rendererDebugRuntime.js";

describe("rendererDebugRuntime", () => {
    it("allows renderer debug logging only when renderer scope and debug state are present", () => {
        expect.assertions(3);

        expect(
            getRendererDebugRuntime({
                isRendererScope: true,
            }).isRendererDebugLoggingAvailable(true)
        ).toBe(true);
        expect(
            getRendererDebugRuntime({
                isRendererScope: true,
            }).isRendererDebugLoggingAvailable(false)
        ).toBe(false);
        expect(
            getRendererDebugRuntime({}).isRendererDebugLoggingAvailable(true)
        ).toBe(false);
    });

    it("checks renderer availability through provider functions", () => {
        expect.assertions(3);

        let providerCount = 0;
        const utils = getRendererDebugRuntime({
            getIsRendererScope: () => {
                providerCount += 1;
                return true;
            },
        });

        expect(utils.isRendererDebugLoggingAvailable(true)).toBe(true);
        expect(utils.isRendererDebugLoggingAvailable(false)).toBe(false);
        expect(providerCount).toBe(2);
    });
});
