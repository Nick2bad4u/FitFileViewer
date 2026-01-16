import { describe, expect, it } from "vitest";

import { sanitizeCssColorToken } from "../../../../utils/dom/index.js";

describe("sanitizeCssColorToken", () => {
    it("returns fallback for non-string inputs", () => {
        expect(sanitizeCssColorToken(undefined, "#123456")).toBe("#123456");
        expect(sanitizeCssColorToken(123, "#123456")).toBe("#123456");
    });

    it("accepts valid hex colors", () => {
        expect(sanitizeCssColorToken("#fff", "#000")).toBe("#fff");
        expect(sanitizeCssColorToken("#ffff", "#000")).toBe("#ffff");
        expect(sanitizeCssColorToken("#112233", "#000")).toBe("#112233");
        expect(sanitizeCssColorToken("#11223344", "#000")).toBe("#11223344");
    });

    it("accepts rgb/rgba and hsl/hsla in strict numeric forms", () => {
        expect(sanitizeCssColorToken("rgb(1, 2, 3)", "#000")).toBe("rgb(1, 2, 3)");
        expect(sanitizeCssColorToken("rgba(59,130,246,0.35)", "#000")).toBe("rgba(59,130,246,0.35)");
        expect(sanitizeCssColorToken("hsl(210, 50%, 40%)", "#000")).toBe("hsl(210, 50%, 40%)");
        expect(sanitizeCssColorToken("hsla(210, 50%, 40%, 0.5)", "#000")).toBe("hsla(210, 50%, 40%, 0.5)");
    });

    it("accepts CSS variable tokens", () => {
        expect(sanitizeCssColorToken("var(--color-primary)", "#000")).toBe("var(--color-primary)");
    });

    it("accepts safe keywords", () => {
        expect(sanitizeCssColorToken("transparent", "#000")).toBe("transparent");
        expect(sanitizeCssColorToken("currentColor", "#000")).toBe("currentColor");
    });

    it("rejects CSS/attribute injection characters", () => {
        expect(sanitizeCssColorToken("#fff; background:url(https://evil)", "#000")).toBe("#000");
        expect(sanitizeCssColorToken('" onload="alert(1)', "#000")).toBe("#000");
        expect(sanitizeCssColorToken("<svg>", "#000")).toBe("#000");
    });

    it("rejects url()/expression()/@import primitives", () => {
        expect(sanitizeCssColorToken("url(https://evil)", "#000")).toBe("#000");
        expect(sanitizeCssColorToken("expression(alert(1))", "#000")).toBe("#000");
        expect(sanitizeCssColorToken("@import url(https://evil)", "#000")).toBe("#000");
    });
});
