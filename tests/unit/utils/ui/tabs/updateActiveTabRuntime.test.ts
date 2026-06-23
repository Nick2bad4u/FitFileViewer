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

    it("checks keyboard events through the runtime provider", () => {
        expect.assertions(3);

        const runtime = getUpdateActiveTabRuntime({
            getKeyboardEvent: () => KeyboardEvent,
        });

        expect(
            runtime.isKeyboardEvent(
                new KeyboardEvent("keydown", { key: "ArrowRight" })
            )
        ).toBe(true);
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
        expect(runtime.isKeyboardEvent({ key: "ArrowRight" })).toBe(false);
    });

    it("ignores invalid document candidates", () => {
        expect.assertions(1);

        const runtime = getUpdateActiveTabRuntime({
            getDocument: () => ({ getElementById: "not a function" }),
        });

        expect(runtime.getDocument()).toBeUndefined();
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(3);

        const legacyScope = {
            document: createDocument(),
            KeyboardEvent,
        } as unknown as UpdateActiveTabRuntimeScope;
        const runtime = getUpdateActiveTabRuntime(legacyScope);

        expect(runtime.getDocument()).toBeUndefined();
        expect(() =>
            runtime.isKeyboardEvent(new KeyboardEvent("keydown"))
        ).toThrow("updateActiveTab requires a KeyboardEvent runtime");
        expect(
            (runtime as unknown as { KeyboardEvent?: unknown }).KeyboardEvent
        ).toBeUndefined();
    });

    it("does not borrow ambient documents for explicit empty scopes", () => {
        expect.assertions(2);
        const runtime = getUpdateActiveTabRuntime({});

        expect(runtime.getDocument()).toBeUndefined();
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "updateActiveTab requires a KeyboardEvent runtime"
        );
    });
});
