import { convertTimeUnits } from "./convertTimeUnits.js";

/**
 * Formats seconds into MM:SS or HH:MM:SS format, or converts to user's preferred time units
 * @param {number} seconds - Time in seconds
 * @param {boolean} useUserUnits - Whether to use user's preferred units or always use MM:SS format
 * @returns {string} Formatted time string
 */
export function formatTime(seconds, useUserUnits = false) {
    if (typeof seconds !== "number") return "0:00";

    if (useUserUnits) {
        const timeUnits = localStorage.getItem("chartjs_timeUnits") || "seconds";
        const convertedValue = convertTimeUnits(seconds, timeUnits);

        switch (timeUnits) {
            case "hours":
                return `${convertedValue.toFixed(2)}h`;
            case "minutes":
                return `${convertedValue.toFixed(1)}m`;
            case "seconds":
            default:
                // For seconds, still use MM:SS format for better readability
                break;
        }
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }
}
