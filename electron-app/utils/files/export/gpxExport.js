/**
 * GPX export utilities used across the renderer for generating standards-compliant GPX documents
 * from FIT record messages. Centralizing the GPX serialization ensures every export surface
 * produces identical output and avoids subtle incompatibilities reported by third-party viewers.
 *
 * GPX specification reference: https://www.topografix.com/gpx.asp
 */

/** @typedef {import('../../state/domain/fitFileState.js').FitFileRecord} FitFileRecord */

const GPX_NAMESPACE = "http://www.topografix.com/GPX/1/1";
const GPX_XSI_NAMESPACE = "http://www.w3.org/2001/XMLSchema-instance";
const GPX_SCHEMA_LOCATION = `${GPX_NAMESPACE} ${GPX_NAMESPACE}/gpx.xsd`;
const GPX_TRACKPOINT_EXTENSION_NAMESPACE = "http://www.garmin.com/xmlschemas/TrackPointExtension/v1";
const SEMICIRCLE_TO_DEGREES = 180 / 2_147_483_648; // 2 ** 31 per FIT protocol
const FIT_EPOCH_OFFSET_SECONDS = 631_065_600; // 1989-12-31T00:00:00Z

/**
 * Character entities that must be escaped inside XML text nodes and attributes.
 * Kept minimal to avoid double-encoding.
 */
const XML_ESCAPE_MAP = Object.freeze({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
});

/**
 * Builds a GPX 1.1 document string from FIT record messages. The generated markup includes
 * metadata, track segments, and optional extensions for heart rate, cadence, temperature, and
 * power when available. When no valid coordinates exist the function returns null, allowing
 * callers to surface user-friendly notifications.
 *
 * @param {Array<Partial<FitFileRecord>>|undefined|null} records - Raw FIT record messages
 * @param {GpxBuildOptions} [options] - GPX document metadata options
 * @returns {string|null} GPX document compatible with third-party viewers or null when invalid
 */
export function buildGpxFromRecords(records, options = {}) {
    if (!Array.isArray(records) || records.length === 0) {
        return null;
    }

    const trackName = normalizeLabel(options.trackName, "Exported Track");
    const creator = normalizeLabel(options.creator, "FitFileViewer");
    const includeExtensions = options.includeExtensions !== false;

    /** @type {string[]} */
    const trackPoints = [];
    let firstTimestamp = null;
    let extensionsPresent = false;

    for (const record of records) {
        if (!record) {
            continue;
        }
        const lat = semicirclesToDegrees(/** @type {number|undefined} */(record.positionLat));
        const lon = semicirclesToDegrees(/** @type {number|undefined} */(record.positionLong));
        if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
            continue;
        }

        const elevation = typeof record.enhancedAltitude === "number" ? record.enhancedAltitude : record.altitude;
        const timestampIso = toIsoTimestamp(record.timestamp);
        if (!firstTimestamp && timestampIso) {
            firstTimestamp = timestampIso;
        }

        const elevationLines =
            typeof elevation === "number" && Number.isFinite(elevation)
                ? [`  <ele>${formatElevation(elevation)}</ele>`]
                : [];
        const timeLines = timestampIso ? [`  <time>${timestampIso}</time>`] : [];

        let extensionLines = [];
        if (includeExtensions) {
            const hr = normalizeMetric(record.heartRate);
            const cadence = normalizeMetric(record.cadence ?? record.cadenceRunning ?? record.cadenceCycling);
            const temperature = normalizeMetric(
                record.temperature ?? record.bodyTemperature ?? record.ambientTemperature
            );
            const power = normalizeMetric(record.power ?? record.instantPower ?? record.avgPower);

            const extensionValues = [
                ...(hr ? [`    <gpxtpx:hr>${hr}</gpxtpx:hr>`] : []),
                ...(cadence ? [`    <gpxtpx:cad>${cadence}</gpxtpx:cad>`] : []),
                ...(temperature ? [`    <gpxtpx:atemp>${temperature}</gpxtpx:atemp>`] : []),
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
        rootAttributes.push(`xmlns:gpxtpx="${GPX_TRACKPOINT_EXTENSION_NAMESPACE}"`);
    }

    const description =
        typeof options.description === "string" && options.description.trim().length > 0
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
 *
 * @param {Array<{ filePath?: string; displayName?: string; name?: string }> | undefined | null} loadedFitFiles -
 *        Array of loaded FIT file descriptors exposed on the window object
 * @param {string} [fallback="Exported Track"] - Fallback value when no contextual name exists
 * @returns {string} Resolved track name suitable for metadata
 */
export function resolveTrackNameFromLoadedFiles(loadedFitFiles, fallback = "Exported Track") {
    if (!Array.isArray(loadedFitFiles) || loadedFitFiles.length === 0) {
        return fallback;
    }

    const [primary] = loadedFitFiles;
    const baseCandidates = [primary?.displayName, primary?.name];
    const fileName =
        typeof primary?.filePath === "string"
            ? primary.filePath.split(/[/\\]/).pop()?.replace(/\.[^.]+$/u, "") ?? ""
            : "";

    const resolved = [...baseCandidates, fileName].find(
        (candidate) => typeof candidate === "string" && candidate.trim().length > 0
    );

    return resolved ? resolved.trim() : fallback;
}

/**
 * Escapes XML special characters within a string.
 *
 * @param {string} value - Arbitrary text content
 * @returns {string} XML-safe string
 */
function escapeXml(value) {
    return value.replaceAll(/["&'<>]/g, (char) => XML_ESCAPE_MAP[char]);
}

/**
 * Formats a number as a coordinate string with 7 decimal places (≈1cm precision).
 *
 * @param {number} value - Decimal degree coordinate
 * @returns {string} Formatted coordinate literal
 */
function formatCoordinate(value) {
    return value.toFixed(7);
}

/**
 * Formats an elevation measurement in metres using two decimal places.
 *
 * @param {number} value - Elevation in metres
 * @returns {string} Elevation literal
 */
function formatElevation(value) {
    return value.toFixed(2);
}

/**
 * Normalizes a potential track name or creator string into safe XML content.
 *
 * @param {string|undefined|null} value - Raw title string
 * @param {string} fallback - Fallback value when the input is empty
 * @returns {string} Sanitized string suitable for GPX metadata
 */
function normalizeLabel(value, fallback) {
    if (typeof value !== "string" || value.trim().length === 0) {
        return fallback;
    }
    return escapeXml(value.trim());
}

/**
 * Normalizes a numeric metric (e.g., HR, cadence) into an integer string.
 *
 * @param {unknown} value - Raw metric value
 * @returns {string|null} Rounded integer string or null when invalid
 */
function normalizeMetric(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return null;
    }
    return String(Math.round(value));
}

/**
 * Converts FIT semicircle coordinates to decimal degrees.
 *
 * @param {unknown} raw - Raw semicircle value
 * @returns {number|null} Decimal degrees or null when invalid
 */
function semicirclesToDegrees(raw) {
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
        return null;
    }
    const degrees = raw * SEMICIRCLE_TO_DEGREES;
    if (!Number.isFinite(degrees) || Math.abs(degrees) > 180) {
        return null;
    }
    return degrees;
}

/**
 * Attempts to coerce a timestamp-like value into an ISO 8601 string for GPX output.
 * Supports Date instances, ISO8601 strings, UNIX epoch seconds/milliseconds, and
 * FIT epoch seconds (seconds since 1989-12-31).
 *
 * @param {unknown} value - Raw timestamp value from FIT record messages
 * @returns {string|null} ISO8601 timestamp or null when conversion fails
 */
function toIsoTimestamp(value) {
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
            return new Date((value + FIT_EPOCH_OFFSET_SECONDS) * 1000).toISOString();
        }
    }
    return null;
}

/**
 * @typedef {Object} GpxBuildOptions
 * @property {string} [trackName] - Display name for the GPX track
 * @property {string} [creator] - Creator metadata for the GPX document
 * @property {string} [description] - Optional description appended to the track
 * @property {boolean} [includeExtensions=true] - Whether to emit Garmin TrackPoint extensions
 */

export const __testUtils = {
    escapeXml,
    formatCoordinate,
    formatElevation,
    normalizeLabel,
    normalizeMetric,
    semicirclesToDegrees,
    toIsoTimestamp,
};
