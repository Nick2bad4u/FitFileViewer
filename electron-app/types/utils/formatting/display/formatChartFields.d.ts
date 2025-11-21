/**
 * List of supported chart field keys for FIT file data visualization.
 * These correspond to actual FIT file field names and are used to determine
 * which data series can be rendered in charts throughout the application.
 *
 * @type {string[]}
 * @example
 * import { formatChartFields } from '../formatting/display/formatChartFields';
 * if (formatChartFields.includes(fieldName)) { ... }
 */
/**
 * Ordered list of supported chart field keys.
 * @type {string[]}
 */
export const formatChartFields: string[];
/**
 * Maps FIT file field keys to human-readable chart labels.
 * Used throughout the application to display user-friendly names
 * for chart axes, legends, tooltips, and UI elements.
 *
 * @type {Object.<string, string>}
 * @example
 * import { fieldLabels } from '../formatting/display/formatChartFields';
 * const label = fieldLabels[fieldKey] || fieldKey;
 */
export const fieldLabels: {
    [x: string]: string;
};
export namespace fieldColors {
    let altitude: string;
    let altitude_profile: string;
    let cadence: string;
    let distance: string;
    let enhancedAltitude: string;
    let enhancedSpeed: string;
    let event_messages: string;
    let flow: string;
    let gps_track: string;
    let grit: string;
    let heartRate: string;
    let hr_lap_zone_individual: string;
    let hr_lap_zone_stacked: string;
    let hr_zone_doughnut: string;
    let positionLat: string;
    let positionLong: string;
    let power: string;
    let power_lap_zone_individual: string;
    let power_lap_zone_stacked: string;
    let power_vs_hr: string;
    let power_zone_doughnut: string;
    let resistance: string;
    let speed: string;
    let speed_vs_distance: string;
    let temperature: string;
}
//# sourceMappingURL=formatChartFields.d.ts.map
