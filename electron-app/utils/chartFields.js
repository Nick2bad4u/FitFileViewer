/**
 * List of supported chart field keys for FIT file data visualization.
 * These correspond to actual FIT file field names and are used to determine
 * which data series can be rendered in charts throughout the application.
 *
 * @type {string[]}
 * @example
 * import { chartFields } from './chartFields.js';
 * if (chartFields.includes(fieldName)) { ... }
 */

// Enhanced chart fields with better categorization - match actual FIT file field names
/**
 *
 * Mapping of chart field keys to their associated color codes for consistent and accessible chart rendering.
 * Use this object to retrieve the color for a given field when rendering charts or visualizations.
 *
 * @type {Object.<string, string>}
 * @example
 * import { fieldColors } from './chartFields.js';
 * const color = fieldColors['speed']; // "#1976d2"
 */
export const chartFields = [
    "speed",
    "heartRate",
    "altitude",
    "power",
    "cadence",
    "temperature",
    "distance",
    "enhancedSpeed",
    "enhancedAltitude",
    "resistance",
    "flow",
    "grit",
    "positionLat",
    "positionLong",
];
/**
 * Maps FIT file field keys to human-readable chart labels.
 * Used throughout the application to display user-friendly names
 * for chart axes, legends, tooltips, and UI elements.
 *
 * @type {Object.<string, string>}
 * @example
 * import { fieldLabels } from './chartFields.js';
 * const label = fieldLabels[fieldKey] || fieldKey;
 */
export const fieldLabels = {
    speed: "Speed",
    heartRate: "Heart Rate",
    altitude: "Altitude",
    power: "Power",
    cadence: "Cadence",
    temperature: "Temperature",
    distance: "Distance",
    enhancedSpeed: "Enhanced Speed",
    enhancedAltitude: "Enhanced Altitude",
    resistance: "Resistance",
    flow: "Flow",
    grit: "Grit",
    positionLat: "Latitude",
    positionLong: "Longitude",
    gps_track: "GPS Track",
    speed_vs_distance: "Speed vs Distance",
    power_vs_hr: "Power vs Heart Rate",
    altitude_profile: "Altitude Profile",
    hr_zone_doughnut: "HR Zone Distribution",
    hr_zone_bar: "HR Zone Time",
    power_zone_doughnut: "Power Zone Distribution",
    power_zone_bar: "Power Zone Time",
    event_messages: "Event Messages",
    hr_lap_zone_stacked: "HR Lap Zone Stacked",
    hr_lap_zone_individual: "HR Lap Zone Individual",
    power_lap_zone_stacked: "Power Lap Zone Stacked",
    power_lap_zone_individual: "Power Lap Zone Individual",
};
// Enhanced color scheme with better accessibility - match actual field names
export const fieldColors = {
    speed: "#1976d2",
    heartRate: "#e53935",
    altitude: "#43a047",
    power: "#ff9800",
    cadence: "#8e24aa",
    temperature: "#00bcd4",
    distance: "#607d8b",
    enhancedSpeed: "#009688",
    enhancedAltitude: "#cddc39",
    resistance: "#795548",
    flow: "#c42196",
    grit: "#6e1cbb",
    positionLat: "#ff5722",
    positionLong: "#3f51b5",
    gps_track: "#4caf50",
    speed_vs_distance: "#2196f3",
    power_vs_hr: "#ff5722",
    altitude_profile: "#8bc34a",
    hr_zone_doughnut: "#e53935",
    hr_zone_bar: "#d32f2f",
    power_zone_doughnut: "#ff9800",
    power_zone_bar: "#f57c00",
    event_messages: "#9c27b0",
    hr_lap_zone_stacked: "#f44336",
    hr_lap_zone_individual: "#e91e63",
    power_lap_zone_stacked: "#ff5722",
    power_lap_zone_individual: "#ff9800",
};
