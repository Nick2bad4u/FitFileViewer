/**
 * CSS color token sanitizer used to safely embed theme/user-provided color
 * values into style attributes and SVG attributes without allowing attribute
 * breaking or CSS injection primitives.
 */
const DEFAULT_COLOR_FALLBACK = "#000000";
const MAX_COLOR_TOKEN_LENGTH = 128;
/**
 * Returns a safe CSS color token.
 *
 * Allowed forms (intentionally strict):
 *
 * - Hex: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
 * - Rgb()/rgba() with numeric components
 * - Hsl()/hsla() with numeric/percent components
 * - CSS variable: var(--token-name)
 * - Keywords: transparent, currentColor
 *
 * Everything else returns the provided fallback.
 */
export function sanitizeCssColorToken(
    value,
    fallback = DEFAULT_COLOR_FALLBACK
) {
    let resolvedFallback = fallback;
    if (
        typeof resolvedFallback !== "string" ||
        resolvedFallback.trim().length === 0
    ) {
        // Ensure we always return *some* valid value.
        resolvedFallback = DEFAULT_COLOR_FALLBACK;
    }
    if (typeof value !== "string") {
        return resolvedFallback;
    }
    const v = value.trim();
    if (v.length === 0 || v.length > MAX_COLOR_TOKEN_LENGTH) {
        return resolvedFallback;
    }
    // Hard reject anything that could break attributes or introduce additional declarations.
    if (/['"<>;\n\r\0]/u.test(v)) {
        return resolvedFallback;
    }
    const lower = v.toLowerCase();
    // Block obvious CSS injection primitives.
    // We intentionally avoid the literal "javascript:" substring to satisfy eslint no-script-url.
    const isScriptScheme =
        lower.startsWith("javascript") &&
        lower.charAt("javascript".length) === ":";
    if (
        lower.includes("url(") ||
        lower.includes("expression(") ||
        lower.includes("@import") ||
        isScriptScheme
    ) {
        return resolvedFallback;
    }
    // Hex
    if (/^#[0-9a-f]{3,4}$/iu.test(v)) {
        return v;
    }
    if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/iu.test(v)) {
        return v;
    }
    // rgb()/rgba() - keep strict to digits, dots, spaces, commas and percent.
    if (/^rgba?\([0-9., %]+\)$/iu.test(v)) {
        return v;
    }
    // hsl()/hsla()
    if (/^hsla?\([0-9., %]+\)$/iu.test(v)) {
        return v;
    }
    // CSS variable token
    if (/^var\(--[a-z0-9_-]{1,64}\)$/iu.test(v)) {
        return v;
    }
    // Keywords
    if (lower === "transparent" || lower === "currentcolor") {
        return v;
    }
    return resolvedFallback;
}
