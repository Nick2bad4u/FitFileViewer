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

    it("ignores invalid document candidates", () => {
        expect.assertions(1);

        const runtime = getTabDocumentRuntime({
            getDocument: () => ({ querySelectorAll: "not a function" }),
        });

        expect(runtime.getDocument()).toBeUndefined();
    });

    it("ignores legacy direct document runtime properties", () => {
        expect.assertions(1);

        const scopeDocument = createDocument();
        const runtime = getTabDocumentRuntime({
            document: scopeDocument,
        } as unknown as TabDocumentRuntimeScope);

        expect(runtime.getDocument()).toBeUndefined();
    });
});
