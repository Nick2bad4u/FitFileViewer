import { formatManufacturer } from "./formatManufacturer.js";
import { formatProduct } from "./formatProduct.js";

/**
 * Formats sensor names for display
 * @param {Object} sensor - Sensor device info
 * @returns {string} Formatted sensor name
 */

export function formatSensorName(sensor) {
    if (sensor.garminProduct) {
        return sensor.garminProduct;
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
