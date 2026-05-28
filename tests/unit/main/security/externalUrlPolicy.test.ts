import { describe, expect, it } from "vitest";

import { validateExternalUrl } from "../../../../electron-app/main/security/externalUrlPolicy.js";

describe("externalUrlPolicy.validateExternalUrl", () => {
    it("allows https and mailto URLs", () => {
        expect.hasAssertions();

        expect(validateExternalUrl("https://example.com")).toBe(
            "https://example.com"
        );
        expect(validateExternalUrl("mailto:test@example.com")).toBe(
            "mailto:test@example.com"
        );
    });

    it("rejects disallowed schemes", () => {
        expect.hasAssertions();

        expect(() =>
            validateExternalUrl("http://localhost:3000/gyazo/callback")
        ).toThrow("Only HTTPS and mailto URLs are allowed");
        expect(() =>
            validateExternalUrl("file:///C:/Windows/System32/calc.exe")
        ).toThrow("Only HTTPS and mailto URLs are allowed");
        expect(() => validateExternalUrl("javascript:alert(1)")).toThrow(
            "Only HTTPS and mailto URLs are allowed"
        );
    });

    it("rejects credentials in URLs", () => {
        expect.hasAssertions();

        expect(() =>
            validateExternalUrl("https://user:pass@example.com")
        ).toThrow("Credentials in URLs are not allowed");
    });

    it("rejects whitespace and control characters", () => {
        expect.hasAssertions();

        expect(() =>
            validateExternalUrl("https://example.com/has space")
        ).toThrow("Invalid URL provided");
        expect(() => validateExternalUrl("https://example.com/\nfoo")).toThrow(
            "Invalid URL provided"
        );
    });

    it("rejects extremely long URLs", () => {
        expect.hasAssertions();

        const long = `https://example.com/${"a".repeat(5000)}`;
        expect(() => validateExternalUrl(long)).toThrow("Invalid URL provided");
    });
});
