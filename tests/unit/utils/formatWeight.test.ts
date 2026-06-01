import { afterEach, describe, expect, it, vi } from "vitest";
import { formatWeight } from "../../../electron-app/utils/formatting/formatters/formatWeight.js";

describe(formatWeight, () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("formats kilograms with rounded pounds", () => {
        expect.assertions(3);

        expect(formatWeight(0)).toBe("0 kg (0 lbs)");
        expect(formatWeight(70)).toBe("70 kg (154 lbs)");
        expect(formatWeight(70.5)).toBe("70.5 kg (155 lbs)");
    });

    it("handles invalid-input weights with warnings", () => {
        expect.assertions(9);

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
        expect.assertions(2);

        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const roundError = new Error("round failed");
        vi.spyOn(Math, "round").mockImplementationOnce(() => {
            throw roundError;
        });

        expect(formatWeight(70)).toBe("70");
        expect(errorSpy).toHaveBeenCalledWith(
            "[formatWeight] Weight formatting failed:",
            roundError
        );
    });
});
