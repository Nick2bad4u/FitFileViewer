/**
 * @vitest-environment node
 */

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { sanitizeCssColorToken } from "../../../../utils/dom/index.js";

describe("sanitizeCssColorToken (property)", () => {
    it("never returns an unsafe token", () => {
        fc.assert(
            fc.property(fc.string(), (input) => {
                const out = sanitizeCssColorToken(input, "#123456");

                expect(typeof out).toBe("string");
                expect(out.length).toBeGreaterThan(0);
                expect(out.length).toBeLessThanOrEqual(128);

                // Must not be able to break out of attribute contexts or inject extra declarations
                expect(/['"<>;\n\r\0]/u.test(out)).toBe(false);

                const lower = out.toLowerCase();
                const isScriptScheme = lower.startsWith("javascript") && lower.charAt("javascript".length) === ":";
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
