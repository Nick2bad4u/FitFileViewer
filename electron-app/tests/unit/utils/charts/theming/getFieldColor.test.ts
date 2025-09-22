import { describe, it, expect, vi } from "vitest";

import { getAllFieldColors, getFieldColor, hasFieldColor } from "../../../../../utils/charts/theming/getFieldColor.js";

describe("getFieldColor", () => {
    it("returns known color for mapped fields", () => {
        expect(getFieldColor("heartRate")).toBe("#EF4444");
        expect(getFieldColor("power")).toBe("#F59E0B");
    });

    it("returns default color and warns for invalid inputs", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const color1 = getFieldColor(123 as unknown as string);
        const color2 = getFieldColor("");
        expect(color1).toBe("#6B7280");
        expect(color2).toBe("#6B7280");
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it("logs debug when using default for unmapped field", () => {
        const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
        const color = getFieldColor("unknown_field_name");
        expect(color).toBe("#6B7280");
        expect(debug).toHaveBeenCalled();
        debug.mockRestore();
    });
});

describe("getAllFieldColors & hasFieldColor", () => {
    it("returns a copy of internal map and hasFieldColor reflects mapping", () => {
        const map = getAllFieldColors() as any;
        expect(map).toBeDefined();
        expect(map.heartRate).toBe("#EF4444");
        // mutation safety (shallow) — modifying returned object shouldn't affect source
        map.heartRate = "#FFFFFF";
        expect(getFieldColor("heartRate")).toBe("#EF4444");

        expect(hasFieldColor("heartRate")).toBe(true);
        expect(hasFieldColor("not-a-field")).toBe(false);
    });
});
