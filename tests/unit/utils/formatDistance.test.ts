import { describe, expect, it } from "vitest";
import { formatDistance } from "../../../electron-app/utils/formatting/formatters/formatDistance.js";

describe(formatDistance, () => {
    it("formats positive meters as kilometers and miles", () => {
        expect.assertions(4);

        expect(formatDistance(1000)).toBe("1.00 km / 0.62 mi");
        expect(formatDistance(5000)).toBe("5.00 km / 3.11 mi");
        expect(formatDistance(1609.344)).toBe("1.61 km / 1.00 mi");
        expect(formatDistance(0.1)).toBe("0.00 km / 0.00 mi");
    });

    it("handles invalid-input distances by returning an empty string", () => {
        expect.assertions(10);

        for (const value of [
            null,
            undefined,
            "1000",
            true,
            {},
            [],
            Number.NaN,
            Infinity,
            0,
            -1,
        ]) {
            expect(formatDistance(value)).toBe("");
        }
    });
});
