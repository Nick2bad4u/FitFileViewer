import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getRendererVendorMapRuntime,
    type RendererVendorMapRuntimeScope,
} from "../../../electron-app/renderer/rendererVendorMapRuntime.js";

function createRendererVendorMapRuntimeScope(
    overrides: Partial<RendererVendorMapRuntimeScope> = {}
): RendererVendorMapRuntimeScope {
    return {
        deleteTemporaryLeafletGlobals: () => undefined,
        getDocument: () => undefined,
        ...overrides,
    };
}

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
        utils.removeTemporaryLeafletGlobals();

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
            utils = getRendererVendorMapRuntime(
                createRendererVendorMapRuntimeScope({
                    getDocument: () => ({
                        documentElement: {
                            style: { setProperty },
                        } as unknown as HTMLElement,
                    }),
                })
            );

        expect(utils.hasDocumentElement()).toBe(true);
        utils.setDocumentElementStyleProperty("--ffv-test", "url(test.svg)");

        expect(setProperty).toHaveBeenCalledWith("--ffv-test", "url(test.svg)");
        expect(setProperty).toHaveBeenCalledTimes(1);
    });

    it("deletes temporary Leaflet globals through the focused delete provider", () => {
        expect.assertions(3);

        const globalScope = {
                L: {},
                Leaflet: {},
            },
            deleteTemporaryLeafletGlobals = vi.fn(() => {
                Reflect.deleteProperty(globalScope, "L");
                Reflect.deleteProperty(globalScope, "Leaflet");
            }),
            utils = getRendererVendorMapRuntime(
                createRendererVendorMapRuntimeScope({
                    deleteTemporaryLeafletGlobals,
                })
            );

        utils.removeTemporaryLeafletGlobals();

        expect(deleteTemporaryLeafletGlobals).toHaveBeenCalledTimes(1);
        expect(Reflect.has(globalScope, "L")).toBe(false);
        expect(Reflect.has(globalScope, "Leaflet")).toBe(false);
    });

    it("does nothing when a document element is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererVendorMapRuntime(
            createRendererVendorMapRuntimeScope()
        );

        expect(utils.hasDocumentElement()).toBe(false);
        utils.setDocumentElementStyleProperty("--ffv-test", "url(test.svg)");
        utils.removeTemporaryLeafletGlobals();
    });

    it("ignores legacy direct document and global scope properties", () => {
        expect.assertions(4);

        const setProperty = vi.fn();
        const globalScope = {
            L: {},
            Leaflet: {},
        };

        const runtime = getRendererVendorMapRuntime({
            ...createRendererVendorMapRuntimeScope(),
            document: {
                documentElement: {
                    style: { setProperty },
                } as unknown as HTMLElement,
            },
            globalScope,
        } as unknown as RendererVendorMapRuntimeScope);

        runtime.setDocumentElementStyleProperty("--ffv-test", "1");
        runtime.removeTemporaryLeafletGlobals();

        expect(runtime.hasDocumentElement()).toBe(false);
        expect(setProperty).not.toHaveBeenCalled();
        expect(Reflect.has(globalScope, "L")).toBe(true);
        expect(Reflect.has(globalScope, "Leaflet")).toBe(true);
    });

    it("fails clearly when the document provider is omitted", () => {
        expect.assertions(1);

        expect(() =>
            getRendererVendorMapRuntime(
                {} as unknown as RendererVendorMapRuntimeScope
            )
        ).toThrow("rendererVendorMapRuntime requires a document provider");
    });

    it("fails clearly when the document provider slot is undefined", () => {
        expect.assertions(1);

        expect(() =>
            getRendererVendorMapRuntime({
                deleteTemporaryLeafletGlobals: () => undefined,
                getDocument: undefined,
            })
        ).toThrow("rendererVendorMapRuntime requires a document provider");
    });

    it("fails clearly when the temporary Leaflet cleanup provider is omitted", () => {
        expect.assertions(1);

        expect(() =>
            getRendererVendorMapRuntime({
                getDocument: () => undefined,
            } as unknown as RendererVendorMapRuntimeScope)
        ).toThrow(
            "rendererVendorMapRuntime requires a temporary Leaflet cleanup provider"
        );
    });
});
