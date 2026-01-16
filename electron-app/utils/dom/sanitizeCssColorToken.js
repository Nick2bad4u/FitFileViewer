/**
 * @fileoverview CSS color token sanitizer
 *
 * This utility is used to safely embed theme/user-provided color values into
 * style attributes and SVG attributes without allowing attribute breaking or
 * CSS injection primitives.
 */

/**
 * Returns a safe CSS color token.
 *
 * Allowed forms (intentionally strict):
 * - Hex: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
 * - rgb()/rgba() with numeric components
 * - hsl()/hsla() with numeric/percent components
 * - CSS variable: var(--token-name)
 * - Keywords: transparent, currentColor
 *
 * Everything else returns the provided fallback.
 *
 * @param {unknown} value
 * @param {string} fallback
 * @returns {string}
 */
export function sanitizeCssColorToken(value, fallback = "#000000") {
    if (typeof fallback !== "string" || fallback.trim().length === 0) {
        // Ensure we always return *some* valid value.
        fallback = "#000000";
    }

    if (typeof value !== "string") {
        return fallback;
    }

    const v = value.trim();
    if (v.length === 0 || v.length > 128) {
        return fallback;
    }

    // Hard reject anything that could break attributes or introduce additional declarations.
    if (/['"<>;\n\r\0]/u.test(v)) {
        return fallback;
    }

    const lower = v.toLowerCase();
    // Block obvious CSS injection primitives.
    // We intentionally avoid the literal "javascript:" substring to satisfy eslint no-script-url.
    const isScriptScheme = lower.startsWith("javascript") && lower.charAt("javascript".length) === ":";
    if (lower.includes("url(") || lower.includes("expression(") || lower.includes("@import") || isScriptScheme) {
        return fallback;
    }

    // Hex
    if (/^#[0-9a-f]{3,4}$/iu.test(v)) return v;
    if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/iu.test(v)) return v;

    // rgb()/rgba() – keep strict to digits, dots, spaces, commas and percent.
    if (/^rgba?\([0-9., %]+\)$/iu.test(v)) return v;

    // hsl()/hsla()
    if (/^hsla?\([0-9., %]+\)$/iu.test(v)) return v;

    // CSS variable token
    if (/^var\(--[a-z0-9_-]{1,64}\)$/iu.test(v)) return v;

    // Keywords
    if (lower === "transparent" || lower === "currentcolor") return v;

    return fallback;
}
