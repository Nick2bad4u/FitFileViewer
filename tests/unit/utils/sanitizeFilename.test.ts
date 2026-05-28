import { describe, expect, it } from "vitest";

import {
    buildDownloadFilename,
    sanitizeFileExtension,
    sanitizeFilenameComponent,
} from "../../../electron-app/utils/files/sanitizeFilename.js";

describe("filename component sanitization", () => {
    it("replaces reserved characters and control codes with underscores", () => {
        expect.assertions(1);

        expect(
            sanitizeFilenameComponent("My:\u0000Bad?Name*", "fallback")
        ).toBe("My_Bad_Name");
    });

    it("removes leading or trailing periods and collapses whitespace", () => {
        expect.assertions(1);

        expect(sanitizeFilenameComponent(" .hidden name. ")).toBe(
            "hidden_name"
        );
    });

    it("rejects Windows reserved device names as bare filenames", () => {
        expect.assertions(1);

        expect(sanitizeFilenameComponent("CON", "file")).toBe("CON_file");
    });

    it("falls back to a sanitised default when input is unusable", () => {
        expect.assertions(1);

        expect(
            sanitizeFilenameComponent("\u0000\u0001", "*fallback name*")
        ).toBe("fallback_name");
    });

    it("limits output length while preserving code-point boundaries", () => {
        expect.assertions(2);

        const longInput = "x".repeat(200);
        const result = sanitizeFilenameComponent(longInput);

        expect(result).toHaveLength(120);
        expect(result).toMatch(/^x+$/u);
    });
});

describe("file extension sanitization", () => {
    it("normalises extension candidates", () => {
        expect.assertions(1);

        expect(sanitizeFileExtension("..G P X!!")).toBe("gpx");
    });

    it("rejects unsafe extension text and uses a clean fallback", () => {
        expect.assertions(1);

        expect(sanitizeFileExtension("???", "CSV")).toBe("csv");
    });
});

describe("download filename building", () => {
    it("retains safe base name and detected extension", () => {
        expect.assertions(1);

        expect(buildDownloadFilename("C:/activities/Morning Ride.fit")).toBe(
            "Morning_Ride.fit"
        );
    });

    it("applies default extension and fallback", () => {
        expect.assertions(1);

        expect(
            buildDownloadFilename("", {
                defaultExtension: "csv",
                fallbackBase: "analysis",
            })
        ).toBe("analysis.csv");
    });

    it("rejects unsafe characters in generated names", () => {
        expect.assertions(1);

        expect(
            buildDownloadFilename("..\\\\?bad/path\\*", {
                defaultExtension: "gpx",
                fallbackBase: "my track",
            })
        ).toBe("my_track.gpx");
    });
});
