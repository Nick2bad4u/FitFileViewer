import { describe, expect, it } from "vitest";
import { XMLParser } from "fast-xml-parser";

import { buildGpxFromRecords, resolveTrackNameFromLoadedFiles } from "../../../../utils/files/export/gpxExport.js";

describe("gpxExport", () => {
    it("returns null when the input list is empty or lacks coordinates", () => {
        expect(buildGpxFromRecords(null as unknown as any[])).toBeNull();
        expect(buildGpxFromRecords([])).toBeNull();
        expect(
            buildGpxFromRecords([{ positionLat: undefined, positionLong: undefined }, { positionLat: 10 }])
        ).toBeNull();
    });

    it("generates a GPX 1.1 document with metadata and extensions", () => {
        const timestamp = new Date("2024-05-01T15:30:00Z");
        const records = [
            {
                positionLat: 0,
                positionLong: 0,
                altitude: 125.4321,
                heartRate: 148,
                cadence: 82,
                power: 255,
                timestamp,
            },
            {
                positionLat: 1_073_741_824,
                positionLong: -1_073_741_824,
                enhancedAltitude: 200.1234,
                timestamp: new Date("2024-05-01T15:30:05Z"),
            },
        ];

        const gpx = buildGpxFromRecords(records, { trackName: "Sample Ride" });
        expect(gpx).toBeTruthy();
        if (!gpx) {
            throw new Error("Expected GPX string to be generated");
        }
        expect(gpx).toContain('version="1.1"');
        expect(gpx).toContain('xmlns="http://www.topografix.com/GPX/1/1"');
        expect(gpx).toContain('xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"');

        const parser = new XMLParser({ ignoreAttributes: false });
        const parsed = parser.parse(gpx);

        expect(parsed.gpx["@_creator"]).toBe("FitFileViewer");
        expect(parsed.gpx.trk.name).toBe("Sample Ride");
        expect(parsed.gpx.metadata.name).toBe("Sample Ride");
        expect(parsed.gpx.metadata.time).toBe(timestamp.toISOString());

        const trackpoints = Array.isArray(parsed.gpx.trk.trkseg.trkpt)
            ? parsed.gpx.trk.trkseg.trkpt
            : [parsed.gpx.trk.trkseg.trkpt];
        expect(trackpoints).toHaveLength(2);

        const firstPt = trackpoints[0];
        expect(firstPt["@_lat"]).toBe("0.0000000");
        expect(firstPt["@_lon"]).toBe("0.0000000");
        expect(Number(firstPt.ele)).toBeCloseTo(125.43, 2);
        expect(firstPt.time).toBe(timestamp.toISOString());
        expect(Number(firstPt.extensions["gpxtpx:TrackPointExtension"]["gpxtpx:hr"])).toBeCloseTo(148);
        expect(Number(firstPt.extensions["gpxtpx:TrackPointExtension"]["gpxtpx:cad"])).toBeCloseTo(82);
        expect(Number(firstPt.extensions["gpxtpx:TrackPointExtension"]["gpxtpx:power"])).toBeCloseTo(255);

        const secondPt = trackpoints[1];
        expect(secondPt["@_lat"]).toBe("90.0000000");
        expect(secondPt["@_lon"]).toBe("-90.0000000");
        expect(Number(secondPt.ele)).toBeCloseTo(200.12, 2);
    });

    it("resolves track names from loaded fit file metadata", () => {
        const loaded = [
            { displayName: "Morning Loop", filePath: "C:/rides/morning.fit" },
            { filePath: "C:/rides/extra.fit" },
        ];
        expect(resolveTrackNameFromLoadedFiles(loaded)).toBe("Morning Loop");
        expect(resolveTrackNameFromLoadedFiles([{ filePath: "/tmp/ride.fit" }])).toBe("ride");
        expect(resolveTrackNameFromLoadedFiles([], "Fallback")).toBe("Fallback");
    });
});
