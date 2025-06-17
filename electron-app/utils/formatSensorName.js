import { formatManufacturer } from "./formatManufacturer.js";
import { formatProduct } from "./formatProduct.js";

/**
 * Formats sensor names for display
 * @param {Object} sensor - Sensor device info
 * @returns {string} Formatted sensor name
 */

export function formatSensorName(sensor) {
    if (sensor.garminProduct) {
        // Ensure garminProduct is a string before formatting
        const garminProductStr = String(sensor.garminProduct);
        return garminProductStr
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    } else if (sensor.manufacturer && sensor.product) {
        const manufacturerName = formatManufacturer(sensor.manufacturer);
        const productName = formatProduct(sensor.manufacturer, sensor.product);
        return `${manufacturerName} ${productName}`;
    } else if (sensor.manufacturer) {
        return formatManufacturer(sensor.manufacturer);
    } else {
        return "Unknown Sensor";
    }
}
