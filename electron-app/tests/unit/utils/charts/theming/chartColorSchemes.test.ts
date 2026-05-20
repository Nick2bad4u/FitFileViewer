import { describe, expect, it } from "vitest";

import { chartColorSchemes } from "../../../../../utils/charts/theming/chartColorSchemes.js";

const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i;

describe("chartColorSchemes", () => {
    it("exposes named heart-rate and power palettes", () => {
        expect.assertions(5);

        const schemeEntries = Object.entries(chartColorSchemes);
        const allColors = schemeEntries.flatMap(([, scheme]) => [
            ...scheme.hr,
            ...scheme.power,
        ]);
        const invalidColors = allColors.filter(
            (color) => !HEX_COLOR_PATTERN.test(color)
        );

        expect(schemeEntries).toHaveLength(18);
        expect(schemeEntries).not.toHaveLength(0);
        expect(chartColorSchemes.classic.hr).toHaveLength(5);
        expect(chartColorSchemes.classic.power).toHaveLength(7);
        expect(invalidColors).toStrictEqual([]);
    });

    it("keeps activity-specific power schemes aligned with their zone counts", () => {
        expect.assertions(3);

        expect(chartColorSchemes.cycling.power).toHaveLength(7);
        expect(chartColorSchemes.exercise.power).toHaveLength(5);
        expect(chartColorSchemes.runner.power).toHaveLength(5);
    });
});
