import { describe, expect, it } from "vitest";

import {
    getUpdateActiveTabRuntime,
    type UpdateActiveTabRuntimeScope,
} from "../../../../../electron-app/utils/ui/tabs/updateActiveTabRuntime.js";

function createDocument(): Document {
    return document.implementation.createHTMLDocument("active tab runtime");
}

describe("updateActiveTabRuntime", () => {
    it("prefers an explicit test document over runtime provider documents", () => {
        expect.assertions(1);

        const testDocument = createDocument();
        const providerDocument = createDocument();
        const runtime = getUpdateActiveTabRuntime({
            getDocument: () => providerDocument,
        });

        expect(runtime.getDocument(testDocument)).toBe(testDocument);
    });

    it("uses the runtime document provider when no test document is present", () => {
        expect.assertions(1);

        const providerDocument = createDocument();
        const runtime = getUpdateActiveTabRuntime({
            getDocument: () => providerDocument,
        });

        expect(runtime.getDocument()).toBe(providerDocument);
    });

    it("ignores invalid document candidates", () => {
        expect.assertions(1);

        const runtime = getUpdateActiveTabRuntime({
            getDocument: () => ({ getElementById: "not a function" }),
        });

        expect(runtime.getDocument()).toBeUndefined();
    });

    it("ignores legacy direct runtime scope documents", () => {
        expect.assertions(1);

        const legacyScope = {
            document: createDocument(),
        } as unknown as UpdateActiveTabRuntimeScope;

        expect(
            getUpdateActiveTabRuntime(legacyScope).getDocument()
        ).toBeUndefined();
    });

    it("does not borrow ambient documents for explicit empty scopes", () => {
        expect.assertions(1);

        expect(getUpdateActiveTabRuntime({}).getDocument()).toBeUndefined();
    });
});
