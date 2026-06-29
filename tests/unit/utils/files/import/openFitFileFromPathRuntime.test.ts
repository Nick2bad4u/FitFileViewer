import { describe, expect, it } from "vitest";

import {
    getOpenFitFileFromPathRuntime,
    type OpenFitFileFromPathRuntimeScope,
} from "../../../../../electron-app/utils/files/import/openFitFileFromPathRuntime.js";

describe("openFitFileFromPathRuntime", () => {
    const unavailableOpenFitFileFromPathRuntimeScope = {
        getHTMLElement: () => undefined,
    } satisfies OpenFitFileFromPathRuntimeScope;

    it("checks HTMLElement values through the provided scope", () => {
        expect.assertions(3);

        const runtime = getOpenFitFileFromPathRuntime({
            getHTMLElement: () => HTMLElement,
        });

        expect(runtime.isHTMLElement(document.createElement("button"))).toBe(
            true
        );
        expect(
            runtime.isHTMLElement(document.createElementNS("svg", "svg"))
        ).toBe(false);
        expect(runtime.isHTMLElement({ disabled: false })).toBe(false);
    });

    it("uses the default production scope", () => {
        expect.assertions(2);

        const runtime = getOpenFitFileFromPathRuntime();

        expect(runtime.isHTMLElement(document.createElement("button"))).toBe(
            true
        );
        expect(runtime.isHTMLElement(document.createTextNode("text"))).toBe(
            false
        );
    });

    it("does not borrow ambient constructors for explicit empty scopes", () => {
        expect.assertions(1);

        const runtime = getOpenFitFileFromPathRuntime(
            unavailableOpenFitFileFromPathRuntimeScope
        );

        expect(() =>
            runtime.isHTMLElement(document.createElement("button"))
        ).toThrow("openFitFileFromPath requires an HTMLElement runtime");
    });

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(1);

        const runtime = getOpenFitFileFromPathRuntime(
            {} as unknown as OpenFitFileFromPathRuntimeScope
        );

        expect(() =>
            runtime.isHTMLElement(document.createElement("button"))
        ).toThrow("openFitFileFromPath requires an HTMLElement provider");
    });

    it("fails clearly when the HTMLElement provider slot is omitted", () => {
        expect.assertions(1);

        const runtime = getOpenFitFileFromPathRuntime({
            getHTMLElement: undefined,
        });

        expect(() =>
            runtime.isHTMLElement(document.createElement("button"))
        ).toThrow("openFitFileFromPath requires an HTMLElement provider");
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(2);

        const runtime = getOpenFitFileFromPathRuntime({
            ...unavailableOpenFitFileFromPathRuntimeScope,
            HTMLElement,
        } as unknown as OpenFitFileFromPathRuntimeScope);

        expect(() =>
            runtime.isHTMLElement(document.createElement("button"))
        ).toThrow("openFitFileFromPath requires an HTMLElement runtime");
        expect(
            (runtime as unknown as { HTMLElement?: unknown }).HTMLElement
        ).toBeUndefined();
    });
});
