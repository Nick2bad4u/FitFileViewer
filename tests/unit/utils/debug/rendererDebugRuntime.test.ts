import { afterEach, describe, expect, it, vi } from "vitest";

import { getRendererDebugRuntime } from "../../../../electron-app/utils/debug/rendererDebugRuntime.js";

describe("rendererDebugRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("allows renderer debug logging only when renderer scope and debug state are present", () => {
        expect.assertions(3);

        expect(
            getRendererDebugRuntime({
                getIsRendererScope: () => true,
            }).isRendererDebugLoggingAvailable(true)
        ).toBe(true);
        expect(
            getRendererDebugRuntime({
                getIsRendererScope: () => true,
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

    it("uses the browser document provider for production renderer-scope checks", () => {
        expect.assertions(2);

        vi.stubGlobal("document", undefined);
        expect(
            getRendererDebugRuntime().isRendererDebugLoggingAvailable(true)
        ).toBe(false);

        vi.stubGlobal("document", {});
        expect(
            getRendererDebugRuntime().isRendererDebugLoggingAvailable(true)
        ).toBe(true);
    });

    it("ignores legacy direct renderer-scope properties", () => {
        expect.assertions(1);

        const utils = getRendererDebugRuntime({
            isRendererScope: true,
        } as unknown as Parameters<typeof getRendererDebugRuntime>[0]);

        expect(utils.isRendererDebugLoggingAvailable(true)).toBe(false);
    });
});
