import { describe, expect, it } from "vitest";

import {
    baseChartOverlayColors,
    chartOverlayColorPalette,
    getChartOverlayColorPalette,
} from "../../../../../electron-app/utils/charts/theming/chartOverlayColorPalette.js";

describe(getChartOverlayColorPalette, () => {
    it("removes duplicates and visually similar colors before deterministic shuffling", () => {
        expect.assertions(2);

        const palette = getChartOverlayColorPalette([
            "#000000",
            "#010101",
            "#ffffff",
            "#abc",
            "#aabbcc",
            "#ff0000",
            "#000000",
        ]);

        expect(palette).toHaveLength(4);
        expect(palette).toEqual([
            "#000000",
            "#abc",
            "#ff0000",
            "#ffffff",
        ]);
    });

    it("returns a deterministic palette for the same input order", () => {
        expect.assertions(1);

        expect(
            getChartOverlayColorPalette(baseChartOverlayColors)
        ).toStrictEqual(
            getChartOverlayColorPalette([...baseChartOverlayColors])
        );
    });

    it("exports the precomputed overlay palette from the base colors", () => {
        expect.assertions(4);

        const unexpectedColors = chartOverlayColorPalette.filter(
            (color) => !baseChartOverlayColors.includes(color)
        );

        expect(chartOverlayColorPalette).toStrictEqual(
            getChartOverlayColorPalette(baseChartOverlayColors)
        );
        expect(chartOverlayColorPalette).not.toBe(baseChartOverlayColors);
        expect(new Set(chartOverlayColorPalette).size).toBe(
            chartOverlayColorPalette.length
        );
        expect(unexpectedColors).toStrictEqual([]);
    });
});
