import { afterEach, describe, expect, it, vi } from "vitest";
import { formatSpeedTooltip } from "../../../electron-app/utils/formatting/display/formatSpeedTooltip.js";

const FALLBACK_SPEED_TOOLTIP = "0.00 m/s (0.00 km/h, 0.00 mph)";

describe(formatSpeedTooltip, () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("formats speed in meters per second, kilometers per hour, and miles per hour", () => {
        expect.hasAssertions();

        expect(formatSpeedTooltip(0)).toBe(FALLBACK_SPEED_TOOLTIP);
        expect(formatSpeedTooltip(5.5)).toBe(
            "5.50 m/s (19.80 km/h, 12.30 mph)"
        );
    });

    it("handles invalid-input speeds with a fallback tooltip", () => {
        expect.hasAssertions();

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        for (const value of [
            null,
            undefined,
            "5.5",
            {},
            [],
            Number.NaN,
        ]) {
            expect(formatSpeedTooltip(value)).toBe(FALLBACK_SPEED_TOOLTIP);
        }

        expect(warnSpy).toHaveBeenCalledWith(
            "[formatSpeedTooltip] Invalid speed value for tooltip formatting:",
            null
        );
    });

    it("warns for negative speeds but still formats the numeric value", () => {
        expect.hasAssertions();

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(formatSpeedTooltip(-1)).toBe(
            "-1.00 m/s (-3.60 km/h, -2.24 mph)"
        );
        expect(warnSpy).toHaveBeenCalledWith(
            "[formatSpeedTooltip] Negative speed value: -1"
        );
    });

    it("logs and returns the fallback when number formatting fails", () => {
        expect.hasAssertions();

        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.spyOn(Number.prototype, "toFixed").mockImplementationOnce(() => {
            throw new Error("format failed");
        });

        expect(formatSpeedTooltip(5.5)).toBe(FALLBACK_SPEED_TOOLTIP);
        expect(errorSpy).toHaveBeenCalledWith(
            "[formatSpeedTooltip] Error formatting speed tooltip:",
            expect.any(Error)
        );
    });
});
