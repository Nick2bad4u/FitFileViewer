import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getBrowserChartOverlayColorPalette,
    getBrowserDevelopmentFlag,
    getBrowserGlobalProperty,
} from "../../../../electron-app/utils/runtime/browserRuntime.js";

describe("browserRuntime global property boundary", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("reads named global properties through the shared boundary", () => {
        expect.assertions(3);

        const palette = ["#ff0000", "#00ff00"];

        vi.stubGlobal("__DEVELOPMENT__", true);
        vi.stubGlobal("chartOverlayColorPalette", palette);

        expect(getBrowserGlobalProperty("__DEVELOPMENT__")).toBe(true);
        expect(getBrowserDevelopmentFlag()).toBe(true);
        expect(getBrowserChartOverlayColorPalette()).toBe(palette);
    });

    it("returns undefined when a global property accessor throws", () => {
        expect.assertions(1);

        vi.stubGlobal("ffvThrowingGlobal", undefined);
        Object.defineProperty(globalThis, "ffvThrowingGlobal", {
            configurable: true,
            get() {
                throw new Error("global is unavailable");
            },
        });

        expect(getBrowserGlobalProperty("ffvThrowingGlobal")).toBeUndefined();
    });
});
