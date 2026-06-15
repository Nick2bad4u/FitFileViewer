import { describe, expect, it } from "vitest";

import { getTabDocumentRuntime } from "../../../../../electron-app/utils/ui/tabs/tabDocumentRuntime.js";

function createDocument(): Document {
    return document.implementation.createHTMLDocument("tab document runtime");
}

describe("tabDocumentRuntime", () => {
    it("prefers an explicit test document over the runtime scope document", () => {
        expect.assertions(1);

        const testDocument = createDocument();
        const scopeDocument = createDocument();
        const runtime = getTabDocumentRuntime({
            document: scopeDocument,
        });

        expect(runtime.getDocument(testDocument)).toBe(testDocument);
    });

    it("uses the runtime scope document when no test document is present", () => {
        expect.assertions(1);

        const scopeDocument = createDocument();
        const runtime = getTabDocumentRuntime({
            document: scopeDocument,
        });

        expect(runtime.getDocument()).toBe(scopeDocument);
    });

    it("ignores invalid document candidates", () => {
        expect.assertions(1);

        const runtime = getTabDocumentRuntime({
            document: { querySelectorAll: "not a function" },
        });

        expect(runtime.getDocument()).toBeUndefined();
    });
});
