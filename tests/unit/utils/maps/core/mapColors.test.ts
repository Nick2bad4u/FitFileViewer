import { describe, expect, it } from "vitest";

import { getLapColor } from "../../../../../electron-app/utils/maps/core/mapColors.js";

describe(getLapColor, () => {
    it.each([
        ["all", "blue"],
        [0, "#ff5722"],
        [1, "#2196f3"],
        [30, "#ff5722"],
        ["2", "#4caf50"],
    ] as const)("returns %s color for lap index %s", (lapIdx, expected) => {
        expect.assertions(1);

        expect(getLapColor(lapIdx)).toBe(expected);
    });

    it.each([
        ["not-a-number", "Invalid lapIdx: not-a-number"],
        [-1, "Invalid lapIdx: -1"],
        [1.5, "Invalid lapIdx: 1.5"],
        [Number.POSITIVE_INFINITY, "Invalid lapIdx: Infinity"],
    ] as const)(
        "rejects invalid lap index %s",
        (invalidLapIdx, expectedMessage) => {
            expect.assertions(2);

            expect(() => getLapColor(invalidLapIdx)).toThrow(TypeError);
            expect(() => getLapColor(invalidLapIdx)).toThrow(expectedMessage);
        }
    );
});
