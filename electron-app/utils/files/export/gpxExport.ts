/**
 * GPX export utilities used across the renderer for generating
 * standards-compliant GPX documents from FIT record messages. Centralizing the
 * GPX serialization ensures every export surface produces identical output and
 * avoids subtle incompatibilities reported by third-party viewers.
 *
 * GPX specification reference: https://www.topografix.com/gpx.asp
 */

import {
    getFitRouteCoordinates,
    semicirclesToDegrees,
    type FitRouteRecord,
} from "../../state/domain/fitRouteDataState.js";

type GpxBuildOptions = {
    creator?: string;
    description?: string;
    includeExtensions?: boolean;
    trackName?: string;
};

/** Minimal record shape required for GPX track point serialization. */
export type GpxRecord = FitRouteRecord & {
    altitude?: number;
    cadence?: number;
    enhancedAltitude?: number;
    heartRate?: number;
    positionLat?: number;
    positionLong?: number;
    position_lat?: number;
    position_long?: number;
    power?: number;
    timestamp?: Date | number | string;
};

/** Loaded FIT file metadata used to derive a human-readable GPX track name. */
export type LoadedFitFileDescriptor = {
    displayName?: string;
    filePath?: string;
    name?: string;
};

// eslint-disable-next-line sdl/no-insecure-url -- The GPX 1.1 XML namespace URI is fixed by the spec.
const GPX_NAMESPACE = "http://www.topografix.com/GPX/1/1";
// eslint-disable-next-line sdl/no-insecure-url -- The XML Schema Instance namespace URI is fixed by the spec.
const GPX_XSI_NAMESPACE = "http://www.w3.org/2001/XMLSchema-instance";
const GPX_SCHEMA_LOCATION = `${GPX_NAMESPACE} ${GPX_NAMESPACE}/gpx.xsd`;
const GPX_TRACKPOINT_EXTENSION_NAMESPACE =
    "http://www.garmin.com/xmlschemas/TrackPointExtension/v1"; // eslint-disable-line sdl/no-insecure-url -- Garmin TrackPointExtension uses this namespace URI.
const FIT_EPOCH_OFFSET_SECONDS = 631_065_600; // 1989-12-31T00:00:00Z

/**
 * Character entities that must be escaped inside XML text nodes and attributes.
 * Kept minimal to avoid double-encoding.
 */
const XML_ESCAPE_MAP: Readonly<Record<string, string>> = Object.freeze({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
});

/**
 * Builds a GPX 1.1 document string from FIT record messages. The generated
 * markup includes metadata, track segments, and optional extensions for heart
 * rate, cadence, temperature, and power when available. When no valid
 * coordinates exist the function returns null, allowing callers to surface
 * user-friendly notifications.
 */
export function buildGpxFromRecords(
    records: readonly FitRouteRecord[] | null | undefined,
    options: GpxBuildOptions = {}
): string | null {
    if (!Array.isArray(records) || records.length === 0) {
        return null;
    }

    const trackName = normalizeLabel(options.trackName, "Exported Track");
    const creator = normalizeLabel(options.creator, "FitFileViewer");
    const includeExtensions = options.includeExtensions !== false;

    const trackPoints: string[] = [];
    let firstTimestamp: string | null = null;
    let extensionsPresent = false;

    for (const {
        latitude: lat,
        longitude: lon,
        record,
    } of getFitRouteCoordinates(records)) {
        if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
            continue;
        }

        const elevation =
            getFiniteRecordNumber(record, "enhancedAltitude") ??
            getFiniteRecordNumber(record, "altitude");
        const timestampIso = toIsoTimestamp(record["timestamp"]);
        if (!firstTimestamp && timestampIso) {
            firstTimestamp = timestampIso;
        }

        const elevationLines =
            typeof elevation === "number" && Number.isFinite(elevation)
                ? [`  <ele>${formatElevation(elevation)}</ele>`]
                : [];
        const timeLines = timestampIso
            ? [`  <time>${timestampIso}</time>`]
            : [];

        let extensionLines: string[] = [];
        if (includeExtensions) {
            const hr = normalizeMetric(record["heartRate"]);
            const cadence = normalizeMetric(
                getFirstRecordValue(record, [
                    "cadence",
                    "cadenceRunning",
                    "cadenceCycling",
                ])
            );
            const temperature = normalizeMetric(
                getFirstRecordValue(record, [
                    "temperature",
                    "bodyTemperature",
                    "ambientTemperature",
                ])
            );
            const power = normalizeMetric(
                getFirstRecordValue(record, [
                    "power",
                    "instantPower",
                    "avgPower",
                ])
            );

            const extensionValues = [
                ...(hr ? [`    <gpxtpx:hr>${hr}</gpxtpx:hr>`] : []),
                ...(cadence ? [`    <gpxtpx:cad>${cadence}</gpxtpx:cad>`] : []),
                ...(temperature
                    ? [`    <gpxtpx:atemp>${temperature}</gpxtpx:atemp>`]
                    : []),
                ...(power ? [`    <gpxtpx:power>${power}</gpxtpx:power>`] : []),
            ];

            if (extensionValues.length > 0) {
                extensionsPresent = true;
                extensionLines = [
                    "  <extensions>",
                    "    <gpxtpx:TrackPointExtension>",
                    ...extensionValues,
                    "    </gpxtpx:TrackPointExtension>",
                    "  </extensions>",
                ];
            }
        }

        const pointLines = [
            `<trkpt lat="${formatCoordinate(lat)}" lon="${formatCoordinate(lon)}">`,
            ...elevationLines,
            ...timeLines,
            ...extensionLines,
            "</trkpt>",
        ];

        trackPoints.push(pointLines.join("\n"));
    }

    if (trackPoints.length === 0) {
        return null;
    }

    const rootAttributes = [
        'version="1.1"',
        `creator="${creator}"`,
        `xmlns="${GPX_NAMESPACE}"`,
        `xmlns:xsi="${GPX_XSI_NAMESPACE}"`,
        `xsi:schemaLocation="${GPX_SCHEMA_LOCATION}"`,
    ];
    if (extensionsPresent && includeExtensions) {
        rootAttributes.push(
            `xmlns:gpxtpx="${GPX_TRACKPOINT_EXTENSION_NAMESPACE}"`
        );
    }

    const description =
        typeof options.description === "string" &&
        options.description.trim().length > 0
            ? options.description.trim()
            : "";

    const metadataLines = [
        "  <metadata>",
        `    <name>${trackName}</name>`,
        ...(firstTimestamp ? [`    <time>${firstTimestamp}</time>`] : []),
        "  </metadata>",
    ];

    const trackLines = [
        "  <trk>",
        `    <name>${trackName}</name>`,
        ...(description ? [`    <desc>${escapeXml(description)}</desc>`] : []),
        "    <trkseg>",
        ...trackPoints.map((line) => `      ${line}`),
        "    </trkseg>",
        "  </trk>",
    ];

    const gpxLines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<gpx ${rootAttributes.join(" ")}>`,
        ...metadataLines,
        ...trackLines,
        "</gpx>",
    ];

    return gpxLines.join("\n");
}

/**
 * Resolves a user-friendly track name based on loaded FIT file context.
 */
export function resolveTrackNameFromLoadedFiles(
    loadedFitFiles: LoadedFitFileDescriptor[] | null | undefined,
    fallback = "Exported Track"
): string {
    if (!Array.isArray(loadedFitFiles) || loadedFitFiles.length === 0) {
        return fallback;
    }

    const [primary] = loadedFitFiles;
    const baseCandidates = [primary?.displayName, primary?.name];
    const fileName = resolveTrackNameFromFileIdentity(primary?.filePath, "");

    const resolved = [...baseCandidates, fileName].find(
        (candidate) =>
            typeof candidate === "string" && candidate.trim().length > 0
    );

    return resolved ? resolved.trim() : fallback;
}

/**
 * Resolves a user-friendly track name from a file path or active file identity.
 */
export function resolveTrackNameFromFileIdentity(
    fileIdentity: null | string | undefined,
    fallback = "Exported Track"
): string {
    if (typeof fileIdentity !== "string" || fileIdentity.trim().length === 0) {
        return fallback;
    }

    const fileName =
        fileIdentity
            .trim()
            .split(/[/\\]/u)
            .pop()
            ?.replace(/\.[^.]+$/u, "")
            .trim() ?? "";

    return fileName || fallback;
}

/**
 * Escapes XML special characters within a string.
 */
function escapeXml(value: string): string {
    return value.replaceAll(/["&'<>]/g, (char) => XML_ESCAPE_MAP[char] ?? char);
}

/**
 * Formats a number as a coordinate string with 7 decimal places (≈1cm
 * precision).
 */
function formatCoordinate(value: number): string {
    return value.toFixed(7);
}

/**
 * Formats an elevation measurement in metres using two decimal places.
 */
function formatElevation(value: number): string {
    return value.toFixed(2);
}

function getFiniteRecordNumber(
    record: FitRouteRecord,
    key: string
): number | null {
    const value = record[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getFirstRecordValue(
    record: FitRouteRecord,
    keys: readonly string[]
): unknown {
    for (const key of keys) {
        const value = record[key];

        if (value !== null && value !== undefined) {
            return value;
        }
    }

    return undefined;
}

/**
 * Normalizes a potential track name or creator string into safe XML content.
 */
function normalizeLabel(
    value: null | string | undefined,
    fallback: string
): string {
    if (typeof value !== "string" || value.trim().length === 0) {
        return fallback;
    }
    return escapeXml(value.trim());
}

/**
 * Normalizes a numeric metric (e.g., HR, cadence) into an integer string.
 */
function normalizeMetric(value: unknown): string | null {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return null;
    }
    return String(Math.round(value));
}

/**
 * Attempts to coerce a timestamp-like value into an ISO 8601 string for GPX
 * output. Supports Date instances, ISO8601 strings, UNIX epoch
 * seconds/milliseconds, and FIT epoch seconds (seconds since 1989-12-31).
 */
function toIsoTimestamp(value: unknown): string | null {
    if (!value) {
        return null;
    }
    if (value instanceof Date) {
        const time = value.getTime();
        return Number.isFinite(time) ? value.toISOString() : null;
    }
    if (typeof value === "string") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        if (value > 1e12) {
            return new Date(value).toISOString();
        }
        if (value > 1e9) {
            return new Date(value * 1000).toISOString();
        }
        if (value > 0) {
            return new Date(
                (value + FIT_EPOCH_OFFSET_SECONDS) * 1000
            ).toISOString();
        }
    }
    return null;
}

/** Internal helpers exposed for focused serializer unit tests. */
export const __testUtils = {
    escapeXml,
    formatCoordinate,
    formatElevation,
    normalizeLabel,
    normalizeMetric,
    semicirclesToDegrees,
    toIsoTimestamp,
};
