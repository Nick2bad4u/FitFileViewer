/**
 * List of supported chart field keys for FIT file data visualization. These
 * correspond to actual FIT file field names and are used to determine which
 * data series can be rendered in charts throughout the application.
 *
 * @example
 *     import { formatChartFields } from '../formatting/display/formatChartFields';
 *     if (formatChartFields.includes(fieldName)) { ... }
 *
 * @type {string[]}
 */

// Enhanced chart fields with better categorization - match actual FIT file field names
/**
 * Ordered list of supported chart field keys.
 *
 * @type {string[]}
 */
export const formatChartFields = [
    "speed",
    "heartRate",
    "altitude",
    "power",
    "estimatedPower",
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
 * Maps FIT file field keys to human-readable chart labels. Used throughout the
 * application to display user-friendly names for chart axes, legends, tooltips,
 * and UI elements.
 *
 * @example
 *     import { fieldLabels } from "../formatting/display/formatChartFields";
 *     const label = fieldLabels[fieldKey] || fieldKey;
 *
 * @type {Object<string, string>}
 */
export const fieldLabels = {
    altitude: "Altitude",
    altitude_profile: "Altitude Profile",
    cadence: "Cadence",
    distance: "Distance",
    enhancedAltitude: "Enhanced Altitude",
    enhancedSpeed: "Enhanced Speed",
    event_messages: "Event Messages",
    flow: "Flow",
    gps_track: "GPS Track",
    grit: "Grit",
    heartRate: "Heart Rate",
    hr_lap_zone_individual: "HR Zone by Lap (Individual)",
    hr_lap_zone_stacked: "HR Zone by Lap (Stacked)",
    hr_zone_doughnut: "HR Zone Distribution (Doughnut)",
    positionLat: "Latitude",
    positionLong: "Longitude",
    power: "Power",
    estimatedPower: "Est. Power",
    power_lap_zone_individual: "Power Zone by Lap (Individual)",
    power_lap_zone_stacked: "Power Zone by Lap (Stacked)",
    power_vs_hr: "Power vs Heart Rate",
    power_zone_doughnut: "Power Zone Distribution (Doughnut)",
    resistance: "Resistance",
    speed: "Speed",
    speed_vs_distance: "Speed vs Distance",
    temperature: "Temperature",
};
// Enhanced color scheme with better accessibility - match actual field names
export const fieldColors = {
    altitude: "#43a047",
    altitude_profile: "#8bc34a",
    cadence: "#8e24aa",
    distance: "#607d8b",
    enhancedAltitude: "#cddc39",
    enhancedSpeed: "#009688",
    event_messages: "#9c27b0",
    flow: "#c42196",
    gps_track: "#4caf50",
    grit: "#6e1cbb",
    heartRate: "#e53935",
    hr_lap_zone_individual: "#e91e63",
    hr_lap_zone_stacked: "#f44336",
    hr_zone_doughnut: "#e53935",
    positionLat: "#ff5722",
    positionLong: "#3f51b5",
    power: "#ff9800",
    estimatedPower: "#f59e0b",
    power_lap_zone_individual: "#ff9800",
    power_lap_zone_stacked: "#ff5722",
    power_vs_hr: "#ff5722",
    power_zone_doughnut: "#ff9800",
    resistance: "#795548",
    speed: "#1976d2",
    speed_vs_distance: "#2196f3",
    temperature: "#00bcd4",
};
