import { formatManufacturer } from "./formatManufacturer.js";
import { formatProduct } from "./formatProduct.js";

const SENSOR_FORMAT_CONFIG = {
    ERROR_MESSAGES: {
        FORMATTING_ERROR: "Error formatting sensor name:",
        INVALID_SENSOR: "Invalid sensor object provided:",
    },
    FALLBACK_NAME: "Unknown Sensor",
    FORMATTED_SEPARATOR: " ",
    NAME_SEPARATOR: " ",
    WORD_SEPARATOR: "_",
} as const;

type SensorInfo = {
    readonly garminProduct?: unknown;
    readonly manufacturer?: unknown;
    readonly product?: unknown;
};

/**
 * Formats sensor names for consistent display across the application.
 *
 * @param sensor - Sensor device info object.
 *
 * @returns Formatted sensor name.
 */
export function formatSensorName(sensor: unknown): string {
    if (!isSensorInfo(sensor)) {
        console.warn(
            `[formatSensorName] ${SENSOR_FORMAT_CONFIG.ERROR_MESSAGES.INVALID_SENSOR}`,
            sensor
        );
        return SENSOR_FORMAT_CONFIG.FALLBACK_NAME;
    }

    try {
        if (hasManufacturerAndProduct(sensor)) {
            return formatManufacturerProduct(sensor);
        }

        if (sensor.garminProduct) {
            return formatGarminProduct(sensor.garminProduct);
        }

        if (sensor.manufacturer) {
            return formatManufacturer(sensor.manufacturer);
        }

        return SENSOR_FORMAT_CONFIG.FALLBACK_NAME;
    } catch (error) {
        console.error(
            `[formatSensorName] ${SENSOR_FORMAT_CONFIG.ERROR_MESSAGES.FORMATTING_ERROR}`,
            error
        );
        return SENSOR_FORMAT_CONFIG.FALLBACK_NAME;
    }
}

function formatGarminProduct(garminProduct: unknown): string {
    return String(garminProduct)
        .split(SENSOR_FORMAT_CONFIG.WORD_SEPARATOR)
        .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(SENSOR_FORMAT_CONFIG.FORMATTED_SEPARATOR);
}

function formatManufacturerProduct(sensor: SensorInfo): string {
    const manufacturerName = formatManufacturer(sensor.manufacturer);
    const productName = formatProduct(sensor.manufacturer, sensor.product);

    if (productName.toLowerCase().includes(manufacturerName.toLowerCase())) {
        return productName;
    }

    return `${manufacturerName}${SENSOR_FORMAT_CONFIG.NAME_SEPARATOR}${productName}`;
}

function hasManufacturerAndProduct(sensor: SensorInfo): boolean {
    return (
        sensor.manufacturer !== null &&
        sensor.manufacturer !== undefined &&
        sensor.product !== null &&
        sensor.product !== undefined
    );
}

function isSensorInfo(value: unknown): value is SensorInfo {
    return typeof value === "object" && value !== null;
}
