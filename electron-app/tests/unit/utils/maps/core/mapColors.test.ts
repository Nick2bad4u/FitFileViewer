import { describe, expect, it } from "vitest";

import { getLapColor } from "../../../../../utils/maps/core/mapColors.js";

describe(getLapColor, () => {
    it("returns the all-laps color", () => {
        expect.assertions(1);

        expect(getLapColor("all")).toBe("blue");
    });

    it("returns stable palette colors for numeric lap indexes", () => {
        expect.assertions(3);

        expect(getLapColor(0)).toBe("#ff5722");
        expect(getLapColor(1)).toBe("#2196f3");
        expect(getLapColor(30)).toBe("#ff5722");
    });

    it("accepts numeric strings", () => {
        expect.assertions(1);

        expect(getLapColor("2")).toBe("#4caf50");
    });

    it("rejects invalid lap indexes", () => {
        expect.assertions(4);

        expect(() => getLapColor("not-a-number")).toThrow(TypeError);
        expect(() => getLapColor(-1)).toThrow(TypeError);
        expect(() => getLapColor(1.5)).toThrow(TypeError);
        expect(() => getLapColor(Number.POSITIVE_INFINITY)).toThrow(TypeError);
    });
});
