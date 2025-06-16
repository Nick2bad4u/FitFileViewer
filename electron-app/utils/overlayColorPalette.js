/**
 * Color palette for file overlays with good visual separation
 * @type {string[]}
 */

export const overlayColorPalette = (function shuffleAndFilter(array) {
    // Remove duplicates
    let unique = Array.from(new Set(array));

    // Helper to compute color distance in RGB space
    function colorDistance(c1, c2) {
        function hexToRgb(hex) {
            hex = hex.replace("#", "");
            if (hex.length === 3) {
                hex = hex
                    .split("")
                    .map((char) => char + char)
                    .join("");
            }
            const num = parseInt(hex, 16);
            return [num >> 16, (num >> 8) & 255, num & 255];
        }
        const [r1, g1, b1] = hexToRgb(c1);
        const [r2, g2, b2] = hexToRgb(c2);
        return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
    }

    // Filter out colors that are too similar (distance < 80)
    const filtered = [];
    unique.forEach((color) => {
        if (filtered.every((existing) => colorDistance(color, existing) >= 80)) {
            filtered.push(color);
        }
    });

    // Shuffle for randomness
    for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    return filtered;
})([
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
]);
