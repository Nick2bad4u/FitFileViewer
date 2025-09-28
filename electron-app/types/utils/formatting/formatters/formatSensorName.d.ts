/**
 * Formats sensor names for consistent display across the application
 *
 * Uses multiple formatting strategies depending on available sensor data:
 * 1. Manufacturer + Product combination (preferred)
 * 2. Garmin product name formatting
 * 3. Manufacturer name only
 * 4. Fallback to unknown sensor
 *
 * @param {Object} sensor - Sensor device info object
 * @param {string|number} [sensor.manufacturer] - Manufacturer ID or name
 * @param {string|number} [sensor.product] - Product ID
 * @param {string} [sensor.garminProduct] - Garmin-specific product identifier
 * @returns {string} Formatted sensor name
 * @throws {TypeError} If sensor is not an object
 * @example
 * // Format with manufacturer and product
 * const sensor1 = formatSensorName({
 *   manufacturer: "garmin",
 *   product: 1735
 * }); // "Garmin Edge 520"
 *
 * // Format with Garmin product only
 * const sensor2 = formatSensorName({
 *   garminProduct: "edge_520_plus"
 * }); // "Edge 520 Plus"
 *
 * // Format with manufacturer only
 * const sensor3 = formatSensorName({
 *   manufacturer: "wahoo"
 * }); // "Wahoo"
 */
export function formatSensorName(sensor: {
    manufacturer?: string | number | undefined;
    product?: string | number | undefined;
    garminProduct?: string | undefined;
}): string;
//# sourceMappingURL=formatSensorName.d.ts.map