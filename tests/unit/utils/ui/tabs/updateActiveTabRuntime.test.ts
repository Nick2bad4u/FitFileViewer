import { describe, expect, it } from "vitest";

import { getUpdateActiveTabRuntime } from "../../../../../electron-app/utils/ui/tabs/updateActiveTabRuntime.js";

function createDocument(): Document {
    return document.implementation.createHTMLDocument("active tab runtime");
}

describe("updateActiveTabRuntime", () => {
    it("prefers an explicit test document over runtime scope documents", () => {
        expect.assertions(1);

        const testDocument = createDocument();
        const scopeDocument = createDocument();
        const providerDocument = createDocument();
        const runtime = getUpdateActiveTabRuntime({
            document: scopeDocument,
            getDocument: () => providerDocument,
        });

        expect(runtime.getDocument(testDocument)).toBe(testDocument);
    });

    it("uses the runtime scope document when no test document is present", () => {
        expect.assertions(1);

        const scopeDocument = createDocument();
        const runtime = getUpdateActiveTabRuntime({
            document: scopeDocument,
        });

        expect(runtime.getDocument()).toBe(scopeDocument);
    });

    it("uses the runtime document provider", () => {
        expect.assertions(1);

        const providerDocument = createDocument();
        const runtime = getUpdateActiveTabRuntime({
            document: undefined,
            getDocument: () => providerDocument,
        });

        expect(runtime.getDocument()).toBe(providerDocument);
    });

    it("ignores invalid document candidates", () => {
        expect.assertions(1);

        const runtime = getUpdateActiveTabRuntime({
            document: { getElementById: "not a function" },
            getDocument: () => null,
        });

        expect(runtime.getDocument()).toBeUndefined();
    });

    it("does not borrow ambient documents for explicit empty scopes", () => {
        expect.assertions(1);

        expect(getUpdateActiveTabRuntime({}).getDocument()).toBeUndefined();
    });
});
