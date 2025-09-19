/**
 * Color palette for file overlays with good visual separation
 * @type {string[]}
 */

/**
 * Returns a shuffled and filtered color palette with good visual separation.
 * @param {string[]} array - Array of color hex strings.
 * @returns {string[]} Filtered and shuffled palette.
 */
export function getChartOverlayColorPalette(array) {
    // Remove duplicates
    const unique = [...new Set(array)];

    // Helper to compute color distance in RGB space
    /**
     * Compute Euclidean distance between two hex colors in RGB space.
     * @param {string} c1 - First color (e.g. "#ff00aa" or "#f0a").
     * @param {string} c2 - Second color.
     * @returns {number}
     */
    function colorDistance(c1, c2) {
        /**
         * Convert a hex color string to an RGB tuple.
         * Returns black [0,0,0] if parsing fails.
         * @param {string} hex
         * @returns {[number, number, number]}
         */
        function hexToRgb(hex) {
            let cleaned = hex.trim().replace(/^#/, "").toLowerCase();
            // Expand short form (#abc => #aabbcc)
            if (cleaned.length === 3 && /^[\da-f]{3}$/.test(cleaned)) {
                cleaned = cleaned
                    .split("")
                    .map((/** @type {string} */ ch) => ch + ch)
                    .join("");
            }
            if (!/^[\da-f]{6}$/.test(cleaned)) {
                return [0, 0, 0];
            }
            const num = Number.parseInt(cleaned, 16),
                /** @type {[number, number, number]} */
                rgb = [num >> 16, (num >> 8) & 255, num & 255];
            return rgb;
        }
        const [r1, g1, b1] = hexToRgb(c1),
            [r2, g2, b2] = hexToRgb(c2);
        return Math.hypot((r1 - r2), (g1 - g2), (b1 - b2));
    }

    // Filter out colors that are too similar (distance < 80)
    /** @type {string[]} */
    const filtered = [];
    for (const color of unique) {
        if (filtered.every((/** @type {string} */ existing) => colorDistance(color, existing) >= 80)) {
            filtered.push(color);
        }
    }

    // Deterministic shuffle using a seeded algorithm for reproducibility
    /**
     * Deterministically shuffle an array of colors.
     * @param {string[]} array
     * @param {number} [seed=42]
     * @returns {string[]}
     */
    function seededShuffle(array, seed = 42) {
        // Simple LCG (Linear Congruential Generator)
        const a = 1_664_525,
            c = 1_013_904_223,
            m = 2 ** 32;
        let state = seed;
        /** @type {string[]} */
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            state = (a * state + c) % m;
            const j = state % (i + 1);
            // Swap only if both indices are valid (they should be, but add defensive check for TS)
            if (typeof arr[i] === "string" && typeof arr[j] === "string") {
                const tmp = /** @type {string} */ (arr[i]);
                arr[i] = /** @type {string} */ (arr[j]);
                arr[j] = tmp;
            }
        }
        return arr;
    }
    return seededShuffle(filtered);
}

/**
 * Base color list for chart overlays, chosen for visual separation.
 * @type {string[]}
 */
export const baseChartOverlayColors = [
    "#00adad",
    "#bf3b00",
    "#0028bf",
    "#960f51",
    "#00bf7e",
    "#83b200",
    "#e70000",
    "#0054bf",
    "#9b0025",
    "#1100be",
    "#ac9201",
    "#0091bf",
    "#ff1989",
    "#004cff",
    "#ff473b",
    "#0029ff",
    "#ff4051",
    "#00e8bb",
    "#ff1a00",
    "#0015ff",
    "#8900fc",
    "#007f54",
    "#4c7700",
    "#006efb",
    "#e21649",
    "#00c2ff",
];

/**
 * Chart overlay color palette with visually distinct colors for overlaying multiple data series.
 * Intended for use in chart visualizations to ensure overlays are easily distinguishable.
 * @type {string[]}
 */
export const chartOverlayColorPalette = getChartOverlayColorPalette(baseChartOverlayColors);
