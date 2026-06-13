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
        const windowDocument = createDocument();
        const runtime = getUpdateActiveTabRuntime({
            document: scopeDocument,
            window: { document: windowDocument },
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

    it("falls back to the runtime window document", () => {
        expect.assertions(1);

        const windowDocument = createDocument();
        const runtime = getUpdateActiveTabRuntime({
            document: undefined,
            window: { document: windowDocument },
        });

        expect(runtime.getDocument()).toBe(windowDocument);
    });

    it("ignores invalid document candidates", () => {
        expect.assertions(1);

        const runtime = getUpdateActiveTabRuntime({
            document: { getElementById: "not a function" },
            window: { document: null },
        });

        expect(runtime.getDocument()).toBeUndefined();
    });
});
