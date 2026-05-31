import { afterEach, describe, expect, it, vi } from "vitest";
import { formatHeight } from "../../../electron-app/utils/formatting/formatters/formatHeight.js";

describe(formatHeight, () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("formats meters with feet and inches", () => {
        expect.hasAssertions();

        expect(formatHeight(0)).toBe("0.00 m (0'0\")");
        expect(formatHeight(1)).toBe("1.00 m (3'3\")");
        expect(formatHeight(1.75)).toBe("1.75 m (5'9\")");
        expect(formatHeight(1.8288)).toBe("1.83 m (6'0\")");
    });

    it("handles invalid-input heights with warnings", () => {
        expect.hasAssertions();

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        for (const value of [
            null,
            undefined,
            "1.75",
            true,
            {},
            [],
            Number.NaN,
            Infinity,
        ]) {
            expect(formatHeight(value)).toBe("");
        }

        expect(formatHeight(-1.75)).toBe("");
        expect(warnSpy).toHaveBeenCalledWith(
            "[formatHeight] Negative height value:",
            -1.75
        );
    });

    it("logs and returns the original value when formatting fails", () => {
        expect.hasAssertions();

        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.spyOn(Math, "floor").mockImplementationOnce(() => {
            throw new Error("Math failed");
        });

        expect(formatHeight(1.75)).toBe("1.75");
        expect(errorSpy).toHaveBeenCalledWith(
            "[formatHeight] Height formatting failed:",
            expect.any(Error)
        );
    });
});
