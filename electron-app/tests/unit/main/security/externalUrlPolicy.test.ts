import { describe, expect, it } from "vitest";

import { validateExternalUrl } from "../../../../main/security/externalUrlPolicy.js";

describe("externalUrlPolicy.validateExternalUrl", () => {
    it("allows http/https URLs", () => {
        expect(validateExternalUrl("https://example.com")).toBe("https://example.com");
        expect(validateExternalUrl("http://localhost:3000/gyazo/callback")).toBe(
            "http://localhost:3000/gyazo/callback"
        );
    });

    it("rejects non-http(s) schemes", () => {
        expect(() => validateExternalUrl("file:///C:/Windows/System32/calc.exe")).toThrow();
        expect(() => validateExternalUrl("javascript:alert(1)")).toThrow();
        expect(() => validateExternalUrl("mailto:test@example.com")).toThrow();
    });

    it("rejects credentials in URLs", () => {
        expect(() => validateExternalUrl("https://user:pass@example.com")).toThrow();
    });

    it("rejects whitespace and control characters", () => {
        expect(() => validateExternalUrl("https://example.com/has space")).toThrow();
        expect(() => validateExternalUrl("https://example.com/\nfoo")).toThrow();
    });

    it("rejects extremely long URLs", () => {
        const long = `https://example.com/${"a".repeat(5000)}`;
        expect(() => validateExternalUrl(long)).toThrow();
    });
});
