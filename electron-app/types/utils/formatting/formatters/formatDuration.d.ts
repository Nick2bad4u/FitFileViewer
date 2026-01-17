/**
 * Formats a duration given in seconds into a human-readable string
 *
 * Handles various input types and formats appropriately:
 * - Null/undefined inputs return empty string
 * - Invalid inputs throw descriptive errors
 * - Less than 60 seconds: "X sec"
 * - Less than 1 hour: "Y min Z sec"
 * - 1 hour or more: "H hr(s) M min"
 *
 * @param {number|string|null|undefined} seconds - The duration in seconds
 * @returns {string} The formatted duration string
 * @throws {Error} If the input is not a finite number or is negative
 *
 * @example
 * formatDuration(30);        // "30 sec"
 * formatDuration(90);        // "1 min 30 sec"
 * formatDuration(3661);      // "1 hr 1 min"
 * formatDuration(7320);      // "2 hrs 2 min"
 * formatDuration(null);      // ""
 * formatDuration(-10);       // throws Error
 */
export function formatDuration(seconds: number | string | null | undefined): string;
