/**
 * Ordered list of supported FIT data field keys that can be charted.
 */
export const formatChartFields = [
    "speed",
    "heartRate",
    "auxHeartRate",
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
 * Chartable FIT field keys.
 */
export type ChartField = (typeof formatChartFields)[number];

/**
 * Maps FIT field keys and derived chart type keys to user-facing labels.
 */
export const fieldLabels: Record<string, string> = {
    altitude: "Altitude",
    altitude_profile: "Altitude Profile",
    auxHeartRate: "Aux Heart Rate",
    cadence: "Cadence",
    distance: "Distance",
    enhancedAltitude: "Enhanced Altitude",
    enhancedSpeed: "Enhanced Speed",
    estimatedPower: "Est. Power",
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
    power_lap_zone_individual: "Power Zone by Lap (Individual)",
    power_lap_zone_stacked: "Power Zone by Lap (Stacked)",
    power_vs_hr: "Power vs Heart Rate",
    power_zone_doughnut: "Power Zone Distribution (Doughnut)",
    resistance: "Resistance",
    speed: "Speed",
    speed_vs_distance: "Speed vs Distance",
    temperature: "Temperature",
};

/**
 * Maps FIT field keys and derived chart type keys to chart colors.
 */
export const fieldColors: Record<string, string> = {
    altitude: "#43a047",
    altitude_profile: "#8bc34a",
    auxHeartRate: "#d946ef",
    cadence: "#8e24aa",
    distance: "#607d8b",
    enhancedAltitude: "#cddc39",
    enhancedSpeed: "#009688",
    estimatedPower: "#f59e0b",
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
    power_lap_zone_individual: "#ff9800",
    power_lap_zone_stacked: "#ff5722",
    power_vs_hr: "#ff5722",
    power_zone_doughnut: "#ff9800",
    resistance: "#795548",
    speed: "#1976d2",
    speed_vs_distance: "#2196f3",
    temperature: "#00bcd4",
};
