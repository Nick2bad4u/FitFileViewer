/**
 * Gets the unit symbol for display.
 * @param {string} field - Field name (e.g., "distance", "temperature", "speed", etc.)
 * @param {string} [unitType] - Axis unit context (currently only supports "time" for time axis units; ignored for other fields)
 * @returns {string} Unit symbol
 */
// Fallback to original field labels (moved above function for clarity and to avoid hoisting confusion)
const originalLabels = {
    heartRate: "bpm",
    power: "W",
    cadence: "rpm",
    resistance: "",
    flow: "#",
    grit: "#",
    positionLat: "°",
    positionLong: "°",
};

export function getUnitSymbol(field, unitType) {
    // NOTE: The following localStorage keys use the "chartjs_" prefix for historical reasons.
    // This function is generic, but currently depends on these keys for user unit preferences.
    // Consider refactoring or documenting if decoupling from Chart.js is desired.
    const timeUnits = localStorage.getItem("chartjs_timeUnits") || "seconds";
    const distanceUnits = localStorage.getItem("chartjs_distanceUnits") || "kilometers";
    const temperatureUnits = localStorage.getItem("chartjs_temperatureUnits") || "celsius";

    // Distance-related fields
    if (field === "distance" || field === "altitude" || field === "enhancedAltitude") {
        switch (distanceUnits) {
            case "kilometers":
                return "km";
            case "feet":
                return "ft";
            case "miles":
                return "mi";
            case "meters":
            default:
                return "m";
        }
    }

    // Temperature fields
    if (field === "temperature") {
        return temperatureUnits === "fahrenheit" ? "°F" : "°C";
    }

    // Speed fields - always show multiple units in tooltips
    if (field === "speed" || field === "enhancedSpeed") {
        return "m/s";
    }

    // Time fields (for axes)
    if (unitType === "time") {
        switch (timeUnits) {
            case "minutes":
                return "min";
            case "hours":
                return "h";
            case "seconds":
            default:
                return "s";
        }
    }

    // Fallback to original field labels
    return originalLabels[field] || "";
}
