import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the converters to simulate a conversion error
vi.mock(
    "../../../electron-app/utils/formatting/converters/convertMpsToKmh.js",
    () => ({
        convertMpsToKmh: vi.fn(() => {
            throw new Error("kmh-convert-fail");
        }),
    })
);

vi.mock(
    "../../../electron-app/utils/formatting/converters/convertMpsToMph.js",
    () => ({
        convertMpsToMph: vi.fn(() => 0),
    })
);

describe("formatSpeedTooltip.js - conversion error branch", () => {
    let consoleErrorSpy: any;

    beforeEach(async () => {
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        vi.resetModules();
        vi.clearAllMocks();
    });

    it("returns safe default string when converter throws", async () => {
        const { formatSpeedTooltip } =
            await import("../../../electron-app/utils/formatting/display/formatSpeedTooltip.js");
        const out = formatSpeedTooltip(5);
        expect(out).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
        expect(consoleErrorSpy).toHaveBeenCalled();
    });
});
