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
export function buildGpxFromRecords(
    records: Array<Partial<FitFileRecord>> | undefined | null,
    options?: GpxBuildOptions
): string | null;
/**
 * Resolves a user-friendly track name based on loaded FIT file context.
 *
 * @param {Array<{ filePath?: string; displayName?: string; name?: string }> | undefined | null} loadedFitFiles -
 *        Array of loaded FIT file descriptors exposed on the window object
 * @param {string} [fallback="Exported Track"] - Fallback value when no contextual name exists
 * @returns {string} Resolved track name suitable for metadata
 */
export function resolveTrackNameFromLoadedFiles(
    loadedFitFiles:
        | Array<{
              filePath?: string;
              displayName?: string;
              name?: string;
          }>
        | undefined
        | null,
    fallback?: string
): string;
export namespace __testUtils {
    export { escapeXml };
    export { formatCoordinate };
    export { formatElevation };
    export { normalizeLabel };
    export { normalizeMetric };
    export { semicirclesToDegrees };
    export { toIsoTimestamp };
}
export type FitFileRecord = import("../../state/domain/fitFileState.js").FitFileRecord;
export type GpxBuildOptions = {
    /**
     * - Display name for the GPX track
     */
    trackName?: string;
    /**
     * - Creator metadata for the GPX document
     */
    creator?: string;
    /**
     * - Optional description appended to the track
     */
    description?: string;
    /**
     * - Whether to emit Garmin TrackPoint extensions
     */
    includeExtensions?: boolean;
};
/**
 * Escapes XML special characters within a string.
 *
 * @param {string} value - Arbitrary text content
 * @returns {string} XML-safe string
 */
declare function escapeXml(value: string): string;
/**
 * Formats a number as a coordinate string with 7 decimal places (≈1cm precision).
 *
 * @param {number} value - Decimal degree coordinate
 * @returns {string} Formatted coordinate literal
 */
declare function formatCoordinate(value: number): string;
/**
 * Formats an elevation measurement in metres using two decimal places.
 *
 * @param {number} value - Elevation in metres
 * @returns {string} Elevation literal
 */
declare function formatElevation(value: number): string;
/**
 * Normalizes a potential track name or creator string into safe XML content.
 *
 * @param {string|undefined|null} value - Raw title string
 * @param {string} fallback - Fallback value when the input is empty
 * @returns {string} Sanitized string suitable for GPX metadata
 */
declare function normalizeLabel(value: string | undefined | null, fallback: string): string;
/**
 * Normalizes a numeric metric (e.g., HR, cadence) into an integer string.
 *
 * @param {unknown} value - Raw metric value
 * @returns {string|null} Rounded integer string or null when invalid
 */
declare function normalizeMetric(value: unknown): string | null;
/**
 * Converts FIT semicircle coordinates to decimal degrees.
 *
 * @param {unknown} raw - Raw semicircle value
 * @returns {number|null} Decimal degrees or null when invalid
 */
declare function semicirclesToDegrees(raw: unknown): number | null;
/**
 * Attempts to coerce a timestamp-like value into an ISO 8601 string for GPX output.
 * Supports Date instances, ISO8601 strings, UNIX epoch seconds/milliseconds, and
 * FIT epoch seconds (seconds since 1989-12-31).
 *
 * @param {unknown} value - Raw timestamp value from FIT record messages
 * @returns {string|null} ISO8601 timestamp or null when conversion fails
 */
declare function toIsoTimestamp(value: unknown): string | null;
export {};
//# sourceMappingURL=gpxExport.d.ts.map
