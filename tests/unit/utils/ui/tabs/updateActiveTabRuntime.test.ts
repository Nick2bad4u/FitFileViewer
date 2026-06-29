import { describe, expect, it } from "vitest";

import {
    getUpdateActiveTabRuntime,
    type UpdateActiveTabRuntimeScope,
} from "../../../../../electron-app/utils/ui/tabs/updateActiveTabRuntime.js";

function createDocument(): Document {
    return document.implementation.createHTMLDocument("active tab runtime");
}

function createRuntimeScope(
    overrides: Partial<UpdateActiveTabRuntimeScope> = {}
): UpdateActiveTabRuntimeScope {
    return {
        getDocument: () => undefined,
        getKeyboardEvent: () => undefined,
        ...overrides,
    };
}

describe("updateActiveTabRuntime", () => {
    it("prefers an explicit test document over runtime provider documents", () => {
        expect.assertions(1);

        const testDocument = createDocument();
        const providerDocument = createDocument();
        const runtime = getUpdateActiveTabRuntime(
            createRuntimeScope({
                getDocument: () => providerDocument,
            })
        );

        expect(runtime.getDocument(testDocument)).toBe(testDocument);
    });

    it("uses the runtime document provider when no test document is present", () => {
        expect.assertions(1);

        const providerDocument = createDocument();
        const runtime = getUpdateActiveTabRuntime(
            createRuntimeScope({
                getDocument: () => providerDocument,
            })
        );

        expect(runtime.getDocument()).toBe(providerDocument);
    });

    it("uses browser runtime providers for production document and keyboard-event defaults", () => {
        expect.assertions(3);

        const runtime = getUpdateActiveTabRuntime();
        const keyboardEvent = new KeyboardEvent("keydown", {
            key: "ArrowRight",
        });

        expect(runtime.getDocument()).toBe(document);
        expect(runtime.isKeyboardEvent(keyboardEvent)).toBe(true);
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
    });

    it("checks keyboard events through the runtime provider", () => {
        expect.assertions(3);

        const runtime = getUpdateActiveTabRuntime(
            createRuntimeScope({
                getKeyboardEvent: () => KeyboardEvent,
            })
        );

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

        const runtime = getUpdateActiveTabRuntime(
            createRuntimeScope({
                getDocument: () => ({ getElementById: "not a function" }),
            })
        );

        expect(runtime.getDocument()).toBeUndefined();
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(3);

        const legacyScope = {
            document: createDocument(),
            KeyboardEvent,
        } as unknown as UpdateActiveTabRuntimeScope;
        const runtime = getUpdateActiveTabRuntime(legacyScope);

        expect(() => runtime.getDocument()).toThrow(
            "updateActiveTab requires a document provider"
        );
        expect(() =>
            runtime.isKeyboardEvent(new KeyboardEvent("keydown"))
        ).toThrow("updateActiveTab requires a KeyboardEvent provider");
        expect(
            (runtime as unknown as { KeyboardEvent?: unknown }).KeyboardEvent
        ).toBeUndefined();
    });

    it("uses an explicit test document before consulting document providers", () => {
        expect.assertions(1);

        const testDocument = createDocument();
        const runtime = getUpdateActiveTabRuntime({
            ...createRuntimeScope(),
            getDocument: undefined,
        } as unknown as UpdateActiveTabRuntimeScope);

        expect(runtime.getDocument(testDocument)).toBe(testDocument);
    });

    it("fails clearly when providers are omitted", () => {
        expect.assertions(2);
        const runtime = getUpdateActiveTabRuntime(
            {} as UpdateActiveTabRuntimeScope
        );

        expect(() => runtime.getDocument()).toThrow(
            "updateActiveTab requires a document provider"
        );
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "updateActiveTab requires a KeyboardEvent provider"
        );
    });

    it("does not borrow ambient documents for unavailable provider values", () => {
        expect.assertions(2);
        const runtime = getUpdateActiveTabRuntime(createRuntimeScope());

        expect(runtime.getDocument()).toBeUndefined();
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "updateActiveTab requires a KeyboardEvent runtime"
        );
    });
});
