import { describe, expect, it } from "vitest";
import {
    validateFitBrowserRelativePath,
    validateFitBrowserRootFolderPath,
} from "../../electron-app/shared/fitBrowserPathPolicy.js";

describe("FIT browser path policy", () => {
    it("accepts safe relative browser paths", () => {
        expect.assertions(4);

        expect(validateFitBrowserRelativePath("")).toBe("");
        expect(validateFitBrowserRelativePath("2026/June")).toBe("2026/June");
        expect(validateFitBrowserRelativePath(" 2026\\June ")).toBe(
            "2026\\June"
        );
        expect(validateFitBrowserRelativePath("Folder With Spaces")).toBe(
            "Folder With Spaces"
        );
    });

    it("rejects browser relative paths that escape or are malformed", () => {
        expect.assertions(6);

        expect(() => validateFitBrowserRelativePath(null)).toThrow(
            "Invalid Browser relative path provided"
        );
        expect(() => validateFitBrowserRelativePath("../hidden")).toThrow(
            "Browser relative path traversal is not allowed"
        );
        expect(() => validateFitBrowserRelativePath("rides/../hidden")).toThrow(
            "Browser relative path traversal is not allowed"
        );
        expect(() => validateFitBrowserRelativePath("/absolute")).toThrow(
            "Browser relative path must stay within root"
        );
        expect(() => validateFitBrowserRelativePath("C:/rides")).toThrow(
            "Browser relative path must stay within root"
        );
        expect(() => validateFitBrowserRelativePath("rides/\u0000bad")).toThrow(
            "Invalid Browser relative path provided"
        );
    });

    it("accepts absolute browser root folders", () => {
        expect.assertions(3);

        expect(validateFitBrowserRootFolderPath("C:/rides")).toBe("C:/rides");
        expect(validateFitBrowserRootFolderPath("\\\\server\\share")).toBe(
            "\\\\server\\share"
        );
        expect(validateFitBrowserRootFolderPath("/home/nick/rides")).toBe(
            "/home/nick/rides"
        );
    });

    it("rejects malformed or relative browser root folders", () => {
        expect.assertions(5);

        expect(() => validateFitBrowserRootFolderPath("")).toThrow(
            "Invalid Browser root folder provided"
        );
        expect(() => validateFitBrowserRootFolderPath("rides")).toThrow(
            "Browser root folder must be an absolute path"
        );
        expect(() =>
            validateFitBrowserRootFolderPath("https://example.com")
        ).toThrow("Browser root folder must be an absolute path");
        expect(() =>
            validateFitBrowserRootFolderPath("C:/rides/\u0000bad")
        ).toThrow("Invalid Browser root folder provided");
        expect(() => validateFitBrowserRootFolderPath(null)).toThrow(
            "Invalid Browser root folder provided"
        );
    });
});
