import { describe, expect, it, vi } from "vitest";

import { getRendererVendorMapRuntime } from "../../../electron-app/renderer/rendererVendorMapRuntime.js";

describe("rendererVendorMapRuntime", () => {
    it("writes document-element style properties through the scoped document", () => {
        expect.assertions(3);

        const setProperty = vi.fn(),
            utils = getRendererVendorMapRuntime({
                document: {
                    documentElement: {
                        style: { setProperty },
                    } as unknown as HTMLElement,
                },
            });

        expect(utils.hasDocumentElement()).toBe(true);
        utils.setDocumentElementStyleProperty("--ffv-test", "url(test.svg)");

        expect(setProperty).toHaveBeenCalledWith("--ffv-test", "url(test.svg)");
        expect(setProperty).toHaveBeenCalledTimes(1);
    });

    it("deletes Leaflet compatibility globals through the scoped global object", () => {
        expect.assertions(2);

        const globalScope = {
                L: {},
                Leaflet: {},
            },
            utils = getRendererVendorMapRuntime({ globalScope });

        utils.deleteCompatibilityGlobal("L");
        utils.deleteCompatibilityGlobal("Leaflet");

        expect(Reflect.has(globalScope, "L")).toBe(false);
        expect(Reflect.has(globalScope, "Leaflet")).toBe(false);
    });

    it("does nothing when a document element is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererVendorMapRuntime({});

        expect(utils.hasDocumentElement()).toBe(false);
        utils.setDocumentElementStyleProperty("--ffv-test", "url(test.svg)");
        utils.deleteCompatibilityGlobal("L");
    });
});
