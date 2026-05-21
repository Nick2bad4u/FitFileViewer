import { describe, expect, it, vi } from "vitest";

import {
    DEFAULT_FIELD_COLOR,
    getAllFieldColors,
    getFieldColor,
    hasFieldColor,
} from "../../../../../utils/charts/theming/getFieldColor.js";

describe(getFieldColor, () => {
    it("returns configured colors for known chart fields", () => {
        expect.assertions(3);

        expect(getFieldColor("heartRate")).toBe("#EF4444");
        expect(getFieldColor("power")).toBe("#F59E0B");
        expect(getFieldColor("speed")).toBe("#3b82f665");
    });

    it("returns the default color for unknown fields", () => {
        expect.assertions(2);

        const debugSpy = vi.spyOn(console, "debug").mockReturnValue(undefined);

        expect(getFieldColor("unknownField")).toBe(DEFAULT_FIELD_COLOR);
        expect(debugSpy).toHaveBeenCalledWith(
            "[getFieldColor] Using default color for unmapped field: unknownField"
        );

        debugSpy.mockRestore();
    });

    it("returns the default color for invalid field values", () => {
        expect.assertions(4);

        const warnSpy = vi.spyOn(console, "warn").mockReturnValue(undefined);

        expect(getFieldColor("")).toBe(DEFAULT_FIELD_COLOR);
        expect(getFieldColor(null)).toBe(DEFAULT_FIELD_COLOR);
        expect(warnSpy).toHaveBeenCalledWith(
            "[getFieldColor] Empty field name provided"
        );
        expect(warnSpy).toHaveBeenCalledWith(
            "[getFieldColor] Field must be a string, received object"
        );

        warnSpy.mockRestore();
    });
});

describe(hasFieldColor, () => {
    it("narrows known field color keys", () => {
        expect.assertions(2);

        expect([
            hasFieldColor("heartRate"),
            hasFieldColor("missing"),
        ]).toStrictEqual([true, false]);
        expect(hasFieldColor("missing")).not.toStrictEqual(
            hasFieldColor("heartRate")
        );
    });
});

describe(getAllFieldColors, () => {
    it("returns a defensive copy of all field colors", () => {
        expect.assertions(3);

        const firstCopy = getAllFieldColors(),
            secondCopy = getAllFieldColors();

        expect(firstCopy).not.toBe(secondCopy);
        expect(firstCopy.heartRate).toBe("#EF4444");
        expect(secondCopy.heartRate).toBe("#EF4444");
    });
});
