import { afterEach, describe, expect, it, vi } from "vitest";

import { getRendererVendorMapRuntime } from "../../../electron-app/renderer/rendererVendorMapRuntime.js";

describe("rendererVendorMapRuntime", () => {
    afterEach(() => {
        document.documentElement.style.removeProperty("--ffv-runtime-test");
        vi.unstubAllGlobals();
    });

    it("uses renderer browser runtime providers for production defaults", () => {
        expect.assertions(4);

        vi.stubGlobal("L", {});
        vi.stubGlobal("Leaflet", {});

        const utils = getRendererVendorMapRuntime();

        expect(utils.hasDocumentElement()).toBe(true);
        utils.setDocumentElementStyleProperty("--ffv-runtime-test", "1");
        utils.deleteTemporaryLeafletGlobal("L");
        utils.deleteTemporaryLeafletGlobal("Leaflet");

        expect(
            document.documentElement.style.getPropertyValue(
                "--ffv-runtime-test"
            )
        ).toBe("1");
        expect(Reflect.has(globalThis, "L")).toBe(false);
        expect(Reflect.has(globalThis, "Leaflet")).toBe(false);
    });

    it("writes document-element style properties through the scoped document", () => {
        expect.assertions(3);

        const setProperty = vi.fn(),
            utils = getRendererVendorMapRuntime({
                getDocument: () => ({
                    documentElement: {
                        style: { setProperty },
                    } as unknown as HTMLElement,
                }),
            });

        expect(utils.hasDocumentElement()).toBe(true);
        utils.setDocumentElementStyleProperty("--ffv-test", "url(test.svg)");

        expect(setProperty).toHaveBeenCalledWith("--ffv-test", "url(test.svg)");
        expect(setProperty).toHaveBeenCalledTimes(1);
    });

    it("deletes temporary Leaflet globals through the focused delete provider", () => {
        expect.assertions(4);

        const globalScope = {
                L: {},
                Leaflet: {},
            },
            deleteGlobalProperty = vi.fn((property: "L" | "Leaflet") =>
                Reflect.deleteProperty(globalScope, property)
            ),
            utils = getRendererVendorMapRuntime({
                deleteGlobalProperty,
            });

        utils.deleteTemporaryLeafletGlobal("L");
        utils.deleteTemporaryLeafletGlobal("Leaflet");

        expect(deleteGlobalProperty).toHaveBeenNthCalledWith(1, "L");
        expect(deleteGlobalProperty).toHaveBeenNthCalledWith(2, "Leaflet");
        expect(Reflect.has(globalScope, "L")).toBe(false);
        expect(Reflect.has(globalScope, "Leaflet")).toBe(false);
    });

    it("does nothing when a document element is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererVendorMapRuntime({});

        expect(utils.hasDocumentElement()).toBe(false);
        utils.setDocumentElementStyleProperty("--ffv-test", "url(test.svg)");
        utils.deleteTemporaryLeafletGlobal("L");
    });

    it("ignores legacy direct document and global scope properties", () => {
        expect.assertions(4);

        const setProperty = vi.fn();
        const globalScope = {
            L: {},
            Leaflet: {},
        };
        const utils = getRendererVendorMapRuntime({
            document: {
                documentElement: {
                    style: { setProperty },
                } as unknown as HTMLElement,
            },
            globalScope,
        } as unknown as Parameters<typeof getRendererVendorMapRuntime>[0]);

        expect(utils.hasDocumentElement()).toBe(false);
        utils.setDocumentElementStyleProperty("--ffv-test", "url(test.svg)");
        utils.deleteTemporaryLeafletGlobal("L");

        expect(setProperty).not.toHaveBeenCalled();
        expect(Reflect.has(globalScope, "L")).toBe(true);
        expect(Reflect.has(globalScope, "Leaflet")).toBe(true);
    });
});
