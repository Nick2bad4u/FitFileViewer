/**
 * RGB tuple derived from a CSS hex color token.
 */
type RgbColor = readonly [
    number,
    number,
    number,
];

export type ChartOverlayColorPalette = readonly string[];

const DEFAULT_SHUFFLE_SEED = 42;
const MINIMUM_COLOR_DISTANCE = 80;
const LINEAR_CONGRUENTIAL_A = 1_664_525;
const LINEAR_CONGRUENTIAL_C = 1_013_904_223;
const LINEAR_CONGRUENTIAL_M = 2 ** 32;

function hexToRgb(hex: string): RgbColor {
    let cleaned = hex.trim().replace(/^#/, "").toLowerCase();

    if (cleaned.length === 3 && /^[\da-f]{3}$/.test(cleaned)) {
        cleaned = cleaned
            .split("")
            .map((character) => character + character)
            .join("");
    }

    if (!/^[\da-f]{6}$/.test(cleaned)) {
        return [
            0,
            0,
            0,
        ];
    }

    const numericColor = Number.parseInt(cleaned, 16);

    return [
        numericColor >> 16,
        (numericColor >> 8) & 255,
        numericColor & 255,
    ];
}

function colorDistance(firstColor: string, secondColor: string): number {
    const [
        firstRed,
        firstGreen,
        firstBlue,
    ] = hexToRgb(firstColor);
    const [
        secondRed,
        secondGreen,
        secondBlue,
    ] = hexToRgb(secondColor);

    return Math.hypot(
        firstRed - secondRed,
        firstGreen - secondGreen,
        firstBlue - secondBlue
    );
}

function seededShuffle(
    inputColors: readonly string[],
    seed = DEFAULT_SHUFFLE_SEED
): string[] {
    const shuffledColors = [...inputColors];
    let state = seed;

    for (let index = shuffledColors.length - 1; index > 0; index -= 1) {
        state =
            (LINEAR_CONGRUENTIAL_A * state + LINEAR_CONGRUENTIAL_C) %
            LINEAR_CONGRUENTIAL_M;

        const swapIndex = state % (index + 1);
        const currentColor = shuffledColors[index];
        const swapColor = shuffledColors[swapIndex];

        if (currentColor === undefined || swapColor === undefined) {
            continue;
        }

        shuffledColors[index] = swapColor;
        shuffledColors[swapIndex] = currentColor;
    }

    return shuffledColors;
}

/**
 * Returns a deterministically shuffled overlay palette after removing duplicate
 * and visually similar colors.
 */
export function getChartOverlayColorPalette(
    inputColors: readonly string[]
): ChartOverlayColorPalette {
    const uniqueColors = [...new Set(inputColors)];
    const filteredColors: string[] = [];

    for (const color of uniqueColors) {
        if (
            filteredColors.every(
                (existingColor) =>
                    colorDistance(color, existingColor) >=
                    MINIMUM_COLOR_DISTANCE
            )
        ) {
            filteredColors.push(color);
        }
    }

    return seededShuffle(filteredColors);
}

/**
 * Base color list for chart overlays, chosen for visual separation.
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
] as const;

/**
 * Chart overlay color palette with visually distinct colors for overlaying
 * multiple data series.
 */
export const chartOverlayColorPalette = getChartOverlayColorPalette(
    baseChartOverlayColors
);
