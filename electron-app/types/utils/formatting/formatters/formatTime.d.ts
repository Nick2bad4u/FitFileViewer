/**
 * Formats seconds into MM:SS or HH:MM:SS format, or converts to user's preferred time units
 * @param {number} seconds - Time in seconds
 * @param {boolean} useUserUnits - Whether to use user's preferred units or always use MM:SS format
 * @returns {string} Formatted time string
 * @example
 * // Format time in MM:SS format
 * const timeStr = formatTime(3661); // "1:01:01"
 *
 * // Format with user units
 * const timeUnits = formatTime(3600, true); // "1.0h" (if user prefers hours)
 */
export function formatTime(seconds: number, useUserUnits?: boolean): string;
//# sourceMappingURL=formatTime.d.ts.map
