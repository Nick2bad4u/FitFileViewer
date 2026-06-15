import { describe, expect, it } from "vitest";
import { validateFitFilePathInput } from "../../electron-app/shared/fitFilePathPolicy.js";

describe("FIT file path policy", () => {
    it("accepts absolute filesystem paths", () => {
        expect.assertions(3);

        expect(validateFitFilePathInput("C:/rides/activity.fit")).toBe(
            "C:/rides/activity.fit"
        );
        expect(validateFitFilePathInput("\\\\server\\share\\ride.fit")).toBe(
            "\\\\server\\share\\ride.fit"
        );
        expect(validateFitFilePathInput("/home/nick/rides/activity.fit")).toBe(
            "/home/nick/rides/activity.fit"
        );
    });

    it("rejects malformed or non-absolute file paths", () => {
        expect.assertions(7);

        expect(() => validateFitFilePathInput("")).toThrow(
            "Invalid file path provided"
        );
        expect(() => validateFitFilePathInput("activity.fit")).toThrow(
            "Only absolute file paths are allowed"
        );
        expect(() =>
            validateFitFilePathInput("file:///tmp/activity.fit")
        ).toThrow("Invalid file path provided");
        expect(() =>
            validateFitFilePathInput("https://example.com/a.fit")
        ).toThrow("Invalid file path provided");
        expect(() =>
            validateFitFilePathInput("C:/rides/\u0000bad.fit")
        ).toThrow("Invalid file path provided");
        expect(() =>
            validateFitFilePathInput("\\\\?\\C:\\rides\\a.fit")
        ).toThrow("Invalid file path provided");
        expect(() => validateFitFilePathInput(null)).toThrow(
            "Invalid file path provided"
        );
    });
});
