import { describe, expect, it } from "vitest";

import {
    buildDownloadFilename,
    sanitizeFileExtension,
    sanitizeFilenameComponent,
} from "./sanitizeFilename.js";

describe("sanitizeFilenameComponent", () => {
    it("replaces reserved characters and control codes with underscores", () => {
        const result = sanitizeFilenameComponent("My:\u0000Bad?Name*", "fallback");
        expect(result).toBe("My_Bad_Name");
    });

    it("removes leading/trailing periods and collapses whitespace", () => {
        const result = sanitizeFilenameComponent(" .hidden. name. ");
        expect(result).toBe("hidden_name");
    });

    it("avoids Windows reserved device names", () => {
        const result = sanitizeFilenameComponent("CON", "file");
        expect(result).toBe("CON_file");
    });

    it("falls back to a sanitised default when input is unusable", () => {
        const result = sanitizeFilenameComponent("\u0000\u0001", "*fallback name*");
        expect(result).toBe("fallback_name");
    });

    it("limits output length while preserving code-point boundaries", () => {
        const longInput = "🚴".repeat(200);
        const result = sanitizeFilenameComponent(longInput);
        expect([...result].length).toBeLessThanOrEqual(120);
        expect(result).toMatch(/^🚴/u);
    });
});

describe("sanitizeFileExtension", () => {
    it("normalises extension candidate", () => {
        expect(sanitizeFileExtension("..G P X!!")).toBe("gpx");
    });

    it("uses fallback when sanitisation empties the extension", () => {
        expect(sanitizeFileExtension("???", "CSV")).toBe("csv");
    });
});

describe("buildDownloadFilename", () => {
    it("retains safe base name and detected extension", () => {
        const result = buildDownloadFilename("C:/activities/Morning Ride.fit");
        expect(result).toBe("Morning_Ride.fit");
    });

    it("applies default extension and fallback", () => {
        const result = buildDownloadFilename("", { defaultExtension: "csv", fallbackBase: "analysis" });
        expect(result).toBe("analysis.csv");
    });

    it("sanitises unsafe characters in generated names", () => {
        const result = buildDownloadFilename("..\\\\?bad/path\\name", {
            defaultExtension: "gpx",
            fallbackBase: "my track",
        });
        expect(result).toBe("my_track.gpx");
    });
});
