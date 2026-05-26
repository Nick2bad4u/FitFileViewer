import { afterEach, describe, expect, it, vi } from "vitest";
import { formatWeight } from "../../../utils/formatting/formatters/formatWeight.js";

describe("formatWeight", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("formats kilograms with rounded pounds", () => {
        expect(formatWeight(0)).toBe("0 kg (0 lbs)");
        expect(formatWeight(70)).toBe("70 kg (154 lbs)");
        expect(formatWeight(70.5)).toBe("70.5 kg (155 lbs)");
    });

    it("handles invalid-input weights with warnings", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        for (const value of [
            null,
            undefined,
            "70",
            {},
            [],
            Number.NaN,
            Infinity,
        ]) {
            expect(formatWeight(value)).toBe("");
        }

        expect(formatWeight(-1)).toBe("");
        expect(warnSpy).toHaveBeenCalledWith(
            "[formatWeight] Negative weight value:",
            -1
        );
    });

    it("logs and returns the original value when formatting fails", () => {
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.spyOn(Math, "round").mockImplementationOnce(() => {
            throw new Error("round failed");
        });

        expect(formatWeight(70)).toBe("70");
        expect(errorSpy).toHaveBeenCalledWith(
            "[formatWeight] Weight formatting failed:",
            expect.any(Error)
        );
    });
});
