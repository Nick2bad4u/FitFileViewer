import { describe, expect, it } from "vitest";

import { escapeHtml } from "../../../utils/dom/escapeHtml.js";
import { sanitizeCssColorToken } from "../../../utils/dom/sanitizeCssColorToken.js";

describe("html escaping", () => {
    it("escapes text for HTML content and quoted attributes", () => {
        expect.assertions(1);

        expect(escapeHtml(`A&B <tag attr="value">'`)).toBe(
            "A&amp;B &lt;tag attr=&quot;value&quot;&gt;&#39;"
        );
    });

    it("does not leave raw markup delimiters in escaped output", () => {
        expect.assertions(1);

        expect(escapeHtml("<script>")).not.toContain("<");
    });
});

describe("css color token sanitization", () => {
    it("allows strict color token forms", () => {
        expect.assertions(4);

        expect(sanitizeCssColorToken("#0f0")).toBe("#0f0");
        expect(sanitizeCssColorToken("rgba(10, 20, 30, 0.5)")).toBe(
            "rgba(10, 20, 30, 0.5)"
        );
        expect(sanitizeCssColorToken("var(--accent-color)")).toBe(
            "var(--accent-color)"
        );
        expect(sanitizeCssColorToken("currentColor")).toBe("currentColor");
    });

    it("rejects injection-capable color strings", () => {
        expect.assertions(3);

        expect(sanitizeCssColorToken("url(https://example.test/x)")).toBe(
            "#000000"
        );
        expect(sanitizeCssColorToken("red; background: blue")).toBe("#000000");
        expect(sanitizeCssColorToken("javascript:alert(1)")).toBe("#000000");
    });

    it("uses a safe fallback for invalid fallback values", () => {
        expect.assertions(1);

        expect(sanitizeCssColorToken("not-a-color", "")).toBe("#000000");
    });
});
