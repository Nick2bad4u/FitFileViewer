import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { conversionError } = vi.hoisted(() => ({
    conversionError: new Error("kmh-convert-fail"),
}));

// Mock the converters to simulate a conversion error
vi.mock(
    import("../../../electron-app/utils/formatting/converters/convertMpsToKmh.js"),
    () => ({
        convertMpsToKmh: vi.fn<(mps: unknown) => number>(() => {
            throw conversionError;
        }),
    })
);

vi.mock(
    import("../../../electron-app/utils/formatting/converters/convertMpsToMph.js"),
    () => ({
        convertMpsToMph: vi.fn<(mps: unknown) => number>(() => 0),
    })
);

describe("formatSpeedTooltip.js - conversion error branch", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
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
        expect.assertions(2);

        const { formatSpeedTooltip } =
            await import("../../../electron-app/utils/formatting/display/formatSpeedTooltip.js");
        const out = formatSpeedTooltip(5);
        expect(out).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "[formatSpeedTooltip] Error formatting speed tooltip:",
            conversionError
        );
    });
});
