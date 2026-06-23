import { describe, expect, it } from "vitest";

import {
    getTabDocumentRuntime,
    type TabDocumentRuntimeScope,
} from "../../../../../electron-app/utils/ui/tabs/tabDocumentRuntime.js";

function createDocument(): Document {
    return document.implementation.createHTMLDocument("tab document runtime");
}

describe("tabDocumentRuntime", () => {
    it("prefers an explicit test document over the runtime scope document", () => {
        expect.assertions(1);

        const testDocument = createDocument();
        const scopeDocument = createDocument();
        const runtime = getTabDocumentRuntime({
            getDocument: () => scopeDocument,
        });

        expect(runtime.getDocument(testDocument)).toBe(testDocument);
    });

    it("uses the runtime scope document when no test document is present", () => {
        expect.assertions(1);

        const scopeDocument = createDocument();
        const runtime = getTabDocumentRuntime({
            getDocument: () => scopeDocument,
        });

        expect(runtime.getDocument()).toBe(scopeDocument);
    });

    it("uses provider functions for runtime document access", () => {
        expect.assertions(2);

        const scopeDocument = createDocument();
        let providerCount = 0;
        const runtime = getTabDocumentRuntime({
            getDocument: () => {
                providerCount += 1;
                return scopeDocument;
            },
        });

        expect(runtime.getDocument()).toBe(scopeDocument);
        expect(providerCount).toBe(1);
    });

    it("checks element types through runtime providers", () => {
        expect.assertions(5);

        const scopeDocument = createDocument();
        const div = scopeDocument.createElement("div");
        const text = scopeDocument.createTextNode("tab");
        const runtime = getTabDocumentRuntime({
            getElement: () => Element,
            getHTMLElement: () => HTMLElement,
        });

        expect(runtime.isElement(div)).toBe(true);
        expect(runtime.isElement(text)).toBe(false);
        expect(runtime.isHTMLElement(div)).toBe(true);
        expect(runtime.isHTMLElement(text)).toBe(false);
        expect(runtime.isHTMLElement({ id: "tab-summary" })).toBe(false);
    });

    it("ignores invalid document candidates", () => {
        expect.assertions(1);

        const runtime = getTabDocumentRuntime({
            getDocument: () => ({ querySelectorAll: "not a function" }),
        });

        expect(runtime.getDocument()).toBeUndefined();
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(5);

        const scopeDocument = createDocument();
        const runtime = getTabDocumentRuntime({
            document: scopeDocument,
            Element,
            HTMLElement,
        } as unknown as TabDocumentRuntimeScope);
        const element = scopeDocument.createElement("button");

        expect(runtime.getDocument()).toBeUndefined();
        expect(() => runtime.isElement(element)).toThrow(
            "tabDocumentRuntime requires an Element runtime"
        );
        expect(() => runtime.isHTMLElement(element)).toThrow(
            "tabDocumentRuntime requires an HTMLElement runtime"
        );
        expect(
            (runtime as unknown as { Element?: unknown }).Element
        ).toBeUndefined();
        expect(
            (runtime as unknown as { HTMLElement?: unknown }).HTMLElement
        ).toBeUndefined();
    });

    it("does not borrow ambient element constructors for explicit empty scopes", () => {
        expect.assertions(2);

        const element = createDocument().createElement("button");
        const runtime = getTabDocumentRuntime({});

        expect(() => runtime.isElement(element)).toThrow(
            "tabDocumentRuntime requires an Element runtime"
        );
        expect(() => runtime.isHTMLElement(element)).toThrow(
            "tabDocumentRuntime requires an HTMLElement runtime"
        );
    });
});
