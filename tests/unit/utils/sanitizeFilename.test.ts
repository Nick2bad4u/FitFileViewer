import { describe, expect, it } from "vitest";

import {
    buildDownloadFilename,
    sanitizeFileExtension,
    sanitizeFilenameComponent,
} from "../../../electron-app/utils/files/sanitizeFilename.js";

type SanitizerCase = {
    readonly expected: string;
    readonly fallback?: string;
    readonly input: string;
};

describe("filename component sanitization", () => {
    it("normalizes unsafe or unusable filename components", () => {
        expect.hasAssertions();

        const cases: SanitizerCase[] = [
            {
                expected: "My_Bad_Name",
                fallback: "fallback",
                input: "My:\u0000Bad?Name*",
            },
            {
                expected: "hidden_name",
                input: " .hidden name. ",
            },
            {
                expected: "CON_file",
                fallback: "file",
                input: "CON",
            },
            {
                expected: "fallback_name",
                fallback: "*fallback name*",
                input: "\u0000\u0001",
            },
        ];

        for (const { expected, fallback, input } of cases) {
            expect(sanitizeFilenameComponent(input, fallback)).toBe(expected);
        }
        expect(
            cases.map(({ input }) => sanitizeFilenameComponent(input))
        ).not.toContain("CON");
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
    it("normalizes extension candidates and falls back when needed", () => {
        expect.hasAssertions();

        const cases: SanitizerCase[] = [
            {
                expected: "gpx",
                input: "..G P X!!",
            },
            {
                expected: "averylongextensi",
                input: "AVeryLongExtensionName",
            },
            {
                expected: "csv",
                fallback: "CSV",
                input: "???",
            },
            {
                expected: "",
                input: "",
            },
        ];

        for (const { expected, fallback, input } of cases) {
            expect(sanitizeFileExtension(input, fallback)).toBe(expected);
        }
        expect(
            cases.map(({ input }) => sanitizeFileExtension(input))
        ).not.toContain("???");
    });
});

describe("download filename building", () => {
    it("builds safe download names from paths and fallback options", () => {
        expect.hasAssertions();

        const cases: Array<{
            readonly expected: string;
            readonly input: string;
            readonly options?: Parameters<typeof buildDownloadFilename>[1];
        }> = [
            {
                expected: "Morning_Ride.fit",
                input: "C:/activities/Morning Ride.fit",
            },
            {
                expected: "CON_file.fit",
                input: "C:/activities/CON.fit",
            },
            {
                expected: "env.txt",
                input: "../.env",
                options: { defaultExtension: "txt" },
            },
            {
                expected: "report.final.gpx",
                input: "folder/report.final.GPX",
            },
            {
                expected: "analysis.csv",
                input: "",
                options: {
                    defaultExtension: "csv",
                    fallbackBase: "analysis",
                },
            },
            {
                expected: "my_track.gpx",
                input: "..\\\\?bad/path\\*",
                options: {
                    defaultExtension: "gpx",
                    fallbackBase: "my track",
                },
            },
        ];

        for (const { expected, input, options } of cases) {
            expect(buildDownloadFilename(input, options)).toBe(expected);
        }
        expect(
            cases.map(({ input, options }) =>
                buildDownloadFilename(input, options)
            )
        ).not.toContain("CON.fit");
    });
});
