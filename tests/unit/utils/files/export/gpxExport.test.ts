import { describe, expect, it } from "vitest";

import {
    buildGpxFromRecords,
    resolveTrackNameFromFileIdentity,
    resolveTrackNameFromLoadedFiles,
} from "../../../../../electron-app/utils/files/export/gpxExport.js";

describe(buildGpxFromRecords, () => {
    it("builds escaped GPX with track points and metric extensions", () => {
        expect.assertions(8);

        const gpx = buildGpxFromRecords(
            [
                {
                    cadence: 90.6,
                    enhancedAltitude: 123.456,
                    heartRate: 143.2,
                    positionLat: 536_870_912,
                    positionLong: -1_073_741_824,
                    power: 251.4,
                    temperature: 21.2,
                    timestamp: "2026-05-20T12:34:56.000Z",
                },
            ],
            {
                creator: "Fit & Viewer",
                description: "Morning <test>",
                trackName: "A & B <Ride>",
            }
        );

        const output = gpx ?? "";

        expect(output).toMatch(/^<\?xml/u);
        expect(output).toContain('creator="Fit &amp; Viewer"');
        expect(output).toContain("<name>A &amp; B &lt;Ride&gt;</name>");
        expect(output).toContain("<desc>Morning &lt;test&gt;</desc>");
        expect(output).toContain('<trkpt lat="45.0000000" lon="-90.0000000">');
        expect(output).toContain("<ele>123.46</ele>");
        expect(output).toContain("<gpxtpx:hr>143</gpxtpx:hr>");
        expect(output).toContain("<gpxtpx:power>251</gpxtpx:power>");
    });

    it("accepts raw FIT snake-case coordinate records", () => {
        expect.assertions(1);

        const gpx = buildGpxFromRecords([
            {
                position_lat: 536_870_912,
                position_long: -1_073_741_824,
            },
        ]);

        expect(gpx).toContain('<trkpt lat="45.0000000" lon="-90.0000000">');
    });

    it("returns null when no valid coordinates exist", () => {
        expect.assertions(1);

        expect(
            buildGpxFromRecords([
                {
                    heartRate: 120,
                    positionLat: 999_999_999_999,
                    positionLong: 10,
                },
            ])
        ).toBeNull();
    });
});

describe(resolveTrackNameFromLoadedFiles, () => {
    it("prefers display names and falls back to path-derived names", () => {
        expect.assertions(3);

        expect(
            resolveTrackNameFromLoadedFiles([{ displayName: "Race Day" }])
        ).toBe("Race Day");
        expect(
            resolveTrackNameFromLoadedFiles([
                { filePath: "C:\\Activities\\evening-ride.fit" },
            ])
        ).toBe("evening-ride");
        expect(resolveTrackNameFromLoadedFiles([], "Fallback")).toBe(
            "Fallback"
        );
    });

    it("handles missing loaded-file context", () => {
        expect.assertions(2);

        expect(resolveTrackNameFromLoadedFiles(null, "Fallback")).toBe(
            "Fallback"
        );
        expect(resolveTrackNameFromLoadedFiles(undefined)).not.toBe("");
    });
});

describe(resolveTrackNameFromFileIdentity, () => {
    it("resolves user-friendly names from active file identities", () => {
        expect.assertions(4);

        expect(
            resolveTrackNameFromFileIdentity("C:\\Activities\\evening.fit")
        ).toBe("evening");
        expect(resolveTrackNameFromFileIdentity("/tmp/morning.run.fit")).toBe(
            "morning.run"
        );
        expect(resolveTrackNameFromFileIdentity("", "Fallback")).toBe(
            "Fallback"
        );
        expect(resolveTrackNameFromFileIdentity(null)).toBe("Exported Track");
    });
});
