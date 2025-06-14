/**
 * Formats a duration given in seconds into a human-readable string.
 *
 * - If the input is null or undefined, returns an empty string.
 * - If the input is not a finite number, throws an error.
 * - For durations less than 60 seconds, returns "X sec".
 * - For durations less than 1 hour, returns "Y min Z sec".
 * - For durations of 1 hour or more, returns "H hr(s) M min".
 *
 * @param {number|string} seconds - The duration in seconds.
 * @returns {string} The formatted duration string.
 * @throws {Error} If the input is not a finite number.
 */
export function formatDuration(seconds) {
    // Return an empty string if the input is null or undefined.
    if (seconds === null || seconds === undefined) return "";

    // Convert to integer if possible
    if (typeof seconds === "string" && seconds.trim() !== "") {
        seconds = Number(seconds);
    }
    if (typeof seconds === "number" && !Number.isInteger(seconds)) {
        seconds = Math.round(seconds);
    }

    // Throw an error if the input is not a finite number
    if (!Number.isFinite(seconds)) throw new Error("Input seconds must be a finite number.");

    // If the duration is less than 60 seconds, return it in seconds format.
    if (seconds < 60) return `${seconds} sec`;

    // If the duration is less than 1 hour, return it in minutes and seconds format.
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ${seconds % 60} sec`;

    // If the duration is 1 hour or more, calculate hours and minutes and return the formatted string.
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hr${hours > 1 ? "s" : ""} ${minutes} min`;
}
