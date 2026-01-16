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
export function sanitizeCssColorToken(value: unknown, fallback?: string): string;
//# sourceMappingURL=sanitizeCssColorToken.d.ts.map
