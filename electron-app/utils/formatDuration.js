/**
 * Formats a duration given in seconds into a human-readable string.
 *
 * - If the duration is less than 60 seconds, returns "X sec".
 * - If the duration is less than 1 hour, returns "Y min Z sec".
 * - If the duration is 1 hour or more, returns "H hr(s) M min".
 *
 * @param {number} seconds - The duration in seconds.
 * @returns {string | ''} The formatted duration string, or an empty string if input is invalid.
 */
export function formatDuration(seconds) {
	// Return an empty string if the input is null or undefined.
	if (seconds === null || seconds === undefined) return '';

	// Throw an error if the input is not an integer.
	if (!Number.isInteger(seconds))
		throw new Error('Input seconds must be an integer.');

	// If the duration is less than 60 seconds, return it in seconds format.
	if (seconds < 60) return `${seconds} sec`;

	// If the duration is less than 1 hour, return it in minutes and seconds format.
	if (seconds < 3600)
		return `${Math.floor(seconds / 60)} min ${seconds % 60} sec`;

	// If the duration is 1 hour or more, calculate hours and minutes and return the formatted string.
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min`;
}
