import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getUpdateControlsStateRuntime,
    type UpdateControlsStateRuntimeScope,
} from "../../../../../electron-app/utils/rendering/helpers/updateControlsStateRuntime.js";

const unavailableUpdateControlsStateRuntimeScope = {
    getComputedStyle: () => undefined,
    getDocument: () => undefined,
} satisfies UpdateControlsStateRuntimeScope;

describe("getUpdateControlsStateRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("reads computed display from an injected runtime scope", () => {
        expect.assertions(2);

        const element = document.createElement("div");
        const getComputedStyle = vi.fn<
            (element: Element) => CSSStyleDeclaration
        >(
            () =>
                ({
                    display: "grid",
                }) as CSSStyleDeclaration
        );
        const runtime = getUpdateControlsStateRuntime({
            ...unavailableUpdateControlsStateRuntimeScope,
            getComputedStyle,
        });

        expect(runtime.getComputedDisplay(element)).toBe("grid");
        expect(getComputedStyle).toHaveBeenCalledWith(element);
    });

    it("reads the injected document runtime", () => {
        expect.assertions(1);

        const documentRef =
            document.implementation.createHTMLDocument("controls state");
        const runtime = getUpdateControlsStateRuntime({
            ...unavailableUpdateControlsStateRuntimeScope,
            getDocument: () => documentRef,
        });

        expect(runtime.getDocument()).toBe(documentRef);
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getUpdateControlsStateRuntime(
                unavailableUpdateControlsStateRuntimeScope
            ).getDocument()
        ).toThrow("updateControlsState requires a document runtime");
    });

    it("uses an empty display value when computed style is unavailable", () => {
        expect.assertions(1);

        const runtime = getUpdateControlsStateRuntime(
            unavailableUpdateControlsStateRuntimeScope
        );

        expect(runtime.getComputedDisplay(document.createElement("div"))).toBe(
            ""
        );
    });

    it("fails clearly when runtime providers are omitted", () => {
        expect.assertions(2);

        const runtime = getUpdateControlsStateRuntime(
            {} as unknown as UpdateControlsStateRuntimeScope
        );

        expect(() =>
            runtime.getComputedDisplay(document.createElement("div"))
        ).toThrow("updateControlsState requires a computed style provider");
        expect(() => runtime.getDocument()).toThrow(
            "updateControlsState requires a document provider"
        );
    });

    it("resolves default providers when runtime operations run", () => {
        expect.assertions(3);

        const element = document.createElement("div");
        const runtime = getUpdateControlsStateRuntime();
        const getComputedStyle = vi.fn<
            (element: Element) => CSSStyleDeclaration
        >(
            () =>
                ({
                    display: "flex",
                }) as CSSStyleDeclaration
        );

        vi.stubGlobal("getComputedStyle", getComputedStyle);

        expect(runtime.getComputedDisplay(element)).toBe("flex");
        expect(runtime.getDocument()).toBe(document);
        expect(getComputedStyle).toHaveBeenCalledWith(element);
    });
});
