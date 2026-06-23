import { describe, expect, it } from "vitest";

import {
    getElementIdUtilsRuntime,
    type ElementIdUtilsRuntimeScope,
} from "../../../../../electron-app/utils/ui/dom/elementIdUtilsRuntime.js";

describe("elementIdUtilsRuntime", () => {
    it("checks HTMLElement values through the provided scope", () => {
        expect.assertions(3);

        const runtime = getElementIdUtilsRuntime({
            getHTMLElement: () => HTMLElement,
        });

        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(true);
        expect(
            runtime.isHTMLElement(document.createElementNS("svg", "svg"))
        ).toBe(false);
        expect(runtime.isHTMLElement({ classList: {}, style: {} })).toBe(false);
    });

    it("uses the default production scope", () => {
        expect.assertions(2);

        const runtime = getElementIdUtilsRuntime();

        expect(runtime.isHTMLElement(document.createElement("span"))).toBe(
            true
        );
        expect(runtime.isHTMLElement(document.createTextNode("text"))).toBe(
            false
        );
    });

    it("does not borrow ambient constructors for explicit empty scopes", () => {
        expect.assertions(1);

        const runtime = getElementIdUtilsRuntime({});

        expect(() =>
            runtime.isHTMLElement(document.createElement("div"))
        ).toThrow("elementIdUtils requires an HTMLElement runtime");
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(2);

        const runtime = getElementIdUtilsRuntime({
            HTMLElement,
        } as unknown as ElementIdUtilsRuntimeScope);

        expect(() =>
            runtime.isHTMLElement(document.createElement("div"))
        ).toThrow("elementIdUtils requires an HTMLElement runtime");
        expect(
            (runtime as unknown as { HTMLElement?: unknown }).HTMLElement
        ).toBeUndefined();
    });
});
