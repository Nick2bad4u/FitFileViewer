/**
 * @vitest-environment node
 */

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { sanitizeCssColorToken } from "../../../../utils/dom/index.js";

const FALLBACK_COLOR = "#123456";
const SAFE_COLOR_TOKEN_PATTERN =
    /^(?:#[\da-f]{3,4}|#[\da-f]{6}(?:[\da-f]{2})?|rgba?\([\d., %]+\)|hsla?\([\d., %]+\)|var\(--[a-z\d_-]{1,64}\)|transparent|currentcolor)$/iu;

describe("sanitizeCssColorToken (property)", () => {
    it("never returns an unsafe token", () => {
        expect(
            sanitizeCssColorToken(
                'url("javascript:alert(1)")',
                FALLBACK_COLOR
            )
        ).toBe(FALLBACK_COLOR);
        expect(
            sanitizeCssColorToken(
                'url("javascript:alert(1)")',
                FALLBACK_COLOR
            )
        ).not.toBe('url("javascript:alert(1)")');

        fc.assert(
            fc.property(fc.string(), (input) => {
                const out = sanitizeCssColorToken(input, FALLBACK_COLOR);

                expect([FALLBACK_COLOR, input.trim()]).toContain(out);
                expect(out).toMatch(SAFE_COLOR_TOKEN_PATTERN);

                // Must not be able to break out of attribute contexts or inject extra declarations
                expect(/['"<>;\n\r\0]/u.test(out)).toBe(false);

                const lower = out.toLowerCase();
                const isScriptScheme =
                    lower.startsWith("javascript") &&
                    lower.charAt("javascript".length) === ":";
                expect(lower.includes("url(")).toBe(false);
                expect(lower.includes("expression(")).toBe(false);
                expect(lower.includes("@import")).toBe(false);
                expect(isScriptScheme).toBe(false);
            }),
            {
                // Keep this fast in CI while still exploring lots of edge cases.
                numRuns: 500,
            }
        );
    });
});
