/**
 * Debug utilities for inspecting sensor data extracted from FIT files.
 */

import {
    getManufacturerName,
    getProductName,
} from "../formatting/display/formatAntNames.js";
import { formatManufacturer } from "../formatting/formatters/formatManufacturer.js";
import { formatProduct } from "../formatting/formatters/formatProduct.js";
import { formatSensorName } from "../formatting/formatters/formatSensorName.js";
import { getActiveFitTableData } from "../state/domain/fitTableDataState.js";

type SensorEntry = Record<string, unknown> & {
    readonly device_index?: unknown;
    readonly device_type?: unknown;
    readonly deviceIndex?: unknown;
    readonly deviceType?: unknown;
    readonly garmin_product?: unknown;
    readonly garminProduct?: unknown;
    readonly manufacturer?: unknown;
    readonly manufacturer_id?: unknown;
    readonly manufacturerId?: unknown;
    readonly product?: unknown;
    readonly product_name?: unknown;
    readonly productName?: unknown;
    readonly serial_number?: unknown;
    readonly serialNumber?: unknown;
    readonly source: string;
};

type FitSensorData = Record<string, unknown>;

type SensorIssue = {
    readonly actualManufacturer?: unknown;
    readonly index?: number;
    readonly product?: unknown;
};

type SensorAnalysis = {
    readonly manufacturerIssues: SensorIssue[];
    readonly productIssues: SensorIssue[];
    readonly summary: Record<string, unknown>;
    readonly totalSensors: number;
};

type ManufacturerIdResult = {
    readonly formatted: string;
    readonly id: number;
    readonly resolved: unknown;
};

type ProductIdResult = {
    readonly formattedProduct: string;
    readonly manufacturerId: number;
    readonly manufacturerName: unknown;
    readonly productId: number;
    readonly resolvedProduct: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object";
}

function getLoadedFitData(): FitSensorData | null {
    const data = getActiveFitTableData().rawData;
    return isRecord(data) ? data : null;
}

function getArrayValue(data: FitSensorData, key: string): unknown[] {
    const value = data[key];
    return Array.isArray(value) ? value : [];
}

function withSource(value: unknown, source: string): SensorEntry {
    return {
        ...(isRecord(value) ? value : {}),
        source,
    };
}

/**
 * Quick data availability check
 *
 * @returns Current active FIT data, or null when no parsed data is loaded.
 */
export function checkDataAvailability(): FitSensorData | null {
    const data = getLoadedFitData();

    console.log("🔍 DATA AVAILABILITY CHECK:");
    console.log(`Active FIT data exists: ${Boolean(data)}`);
    console.log(`Active FIT data type: ${typeof data}`);

    if (data) {
        console.log(`Keys count: ${Object.keys(data).length}`);
        console.log(`Available keys: ${Object.keys(data).join(", ")}`);

        // Check specifically for sensor-related data
        const sensorKeys = Object.keys(data).filter(
            (key) =>
                key.includes("device") ||
                key.includes("session") ||
                key.includes("file_id") ||
                key.includes("sensor")
        );
        console.log(
            `Sensor-related keys: ${sensorKeys.join(", ") || "none found"}`
        );
    }

    return data;
}

/**
 * Extracts and displays detailed sensor information from active FIT data.
 *
 * @returns Sensor analysis summary, or null if no data is available.
 */
export function debugSensorInfo(): SensorAnalysis | null {
    const data = getLoadedFitData();
    if (!data || Object.keys(data).length === 0) {
        console.warn("❌ No active FIT data available. Load a FIT file first.");
        return null;
    }

    console.log("🔍 SENSOR INFORMATION DEBUG");
    console.log("=".repeat(50));
    // Look for sensor data in different locations
    const sensors: SensorEntry[] = [];

    // Check deviceInfoMesgs (actual FIT file structure)
    const deviceInfoMesgs = getArrayValue(data, "deviceInfoMesgs");
    if (deviceInfoMesgs.length > 0) {
        console.log(
            `📱 Found ${deviceInfoMesgs.length} deviceInfoMesgs entries`
        );
        sensors.push(
            ...deviceInfoMesgs.map((device) =>
                withSource(device, "deviceInfoMesgs")
            )
        );
    }

    // Check deviceSettingsMesgs
    const deviceSettingsMesgs = getArrayValue(data, "deviceSettingsMesgs");
    if (deviceSettingsMesgs.length > 0) {
        console.log(
            `⚙️  Found ${deviceSettingsMesgs.length} deviceSettingsMesgs entries`
        );
        sensors.push(
            ...deviceSettingsMesgs.map((device) =>
                withSource(device, "deviceSettingsMesgs")
            )
        );
    }

    // Check legacy device_info format (for backward compatibility)
    const deviceInfo = getArrayValue(data, "device_info");
    if (deviceInfo.length > 0) {
        console.log(`📱 Found ${deviceInfo.length} device_info entries`);
        sensors.push(
            ...deviceInfo.map((device) => withSource(device, "device_info"))
        );
    }

    // Check sessionMesgs messages for sensor info
    const sessionMesgs = getArrayValue(data, "sessionMesgs");
    if (sessionMesgs.length > 0) {
        const session = withSource(sessionMesgs[0], "sessionMesgs");
        console.log("📊 Session data available");
        if (
            session.manufacturer ||
            session.manufacturerId ||
            session.manufacturer_id
        ) {
            sensors.push(session);
        }
    }

    // Check legacy session format
    const sessions = getArrayValue(data, "session");
    if (sessions.length > 0) {
        const session = withSource(sessions[0], "session");
        console.log("📊 Legacy session data available");
        if (session.manufacturer || session.manufacturer_id) {
            sensors.push(session);
        }
    }

    // Check fileIdMesgs for creator info
    const fileIdMesgs = getArrayValue(data, "fileIdMesgs");
    if (fileIdMesgs.length > 0) {
        const fileId = withSource(fileIdMesgs[0], "fileIdMesgs");
        console.log("📄 File ID data available");
        if (
            fileId.manufacturer ||
            fileId.manufacturerId ||
            fileId.manufacturer_id
        ) {
            sensors.push(fileId);
        }
    }

    // Check legacy file_id format
    const fileIds = getArrayValue(data, "file_id");
    if (fileIds.length > 0) {
        const fileId = withSource(fileIds[0], "file_id");
        console.log("📄 Legacy file ID data available");
        if (fileId.manufacturer || fileId.manufacturer_id) {
            sensors.push(fileId);
        }
    }

    // Check for additional sensor-related data.
    const sensorKeys = Object.keys(data).filter(
        (key) =>
            key.includes("sensor") ||
            key.includes("device") ||
            key.includes("manufacturer")
    );

    if (sensorKeys.length > 0) {
        console.log(
            `🔧 Additional sensor-related keys found: ${sensorKeys.join(", ")}`
        );
    }

    if (sensors.length === 0) {
        console.warn("⚠️ No sensor information found in the data");
        return null;
    }

    console.log(`\n🎯 ANALYZING ${sensors.length} SENSOR ENTRIES:`);
    console.log("-".repeat(50));

    const analysis: SensorAnalysis = {
        manufacturerIssues: [],
        productIssues: [],
        summary: {},
        totalSensors: sensors.length,
    };

    for (const [index, sensor] of sensors.entries()) {
        console.log(`\n[${index + 1}] Source: ${sensor.source}`);
        console.log(`    Raw Data:`, {
            device_index: sensor.device_index,
            device_type: sensor.device_type,
            deviceIndex: sensor.deviceIndex,
            deviceType: sensor.deviceType,
            garmin_product: sensor.garmin_product,
            garminProduct: sensor.garminProduct,
            manufacturer: sensor.manufacturer,
            manufacturer_id: sensor.manufacturer_id,
            manufacturerId: sensor.manufacturerId,
            product: sensor.product,
            product_name: sensor.product_name,
            productName: sensor.productName,
            serial_number: sensor.serial_number,
            serialNumber: sensor.serialNumber,
        }); // Check manufacturer resolution
        let resolvedManufacturer = sensor.manufacturer;
        const manufacturerId = sensor.manufacturerId || sensor.manufacturer_id;

        if (manufacturerId && !resolvedManufacturer) {
            resolvedManufacturer = getManufacturerName(manufacturerId);
            console.log(
                `    📋 Resolved manufacturer ID ${manufacturerId} → "${resolvedManufacturer}"`
            );
        }

        // Check product resolution
        const productField =
            sensor.product || sensor.productName || sensor.product_name;
        let resolvedProduct = productField;

        if (manufacturerId && productField) {
            resolvedProduct = getProductName(manufacturerId, productField);
            if (resolvedProduct !== productField) {
                console.log(
                    `    📦 Resolved product ID ${productField} → "${resolvedProduct}"`
                );
            }
        } // Test formatting
        const formattedManufacturer = formatManufacturer(
                resolvedManufacturer || sensor.manufacturer
            ),
            formattedName = formatSensorName(sensor),
            formattedProduct =
                (manufacturerId || sensor.manufacturer) && productField
                    ? formatProduct(
                          manufacturerId || sensor.manufacturer,
                          productField
                      )
                    : productField;

        console.log(`    🎨 Formatted Name: "${formattedName}"`);
        console.log(
            `    🏭 Formatted Manufacturer: "${formattedManufacturer}"`
        );
        if (formattedProduct && formattedProduct !== productField) {
            console.log(`    📦 Formatted Product: "${formattedProduct}"`);
        }
    }

    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`    Total sensors: ${analysis.totalSensors}`);
    console.log(`    Product field issues: ${analysis.productIssues.length}`);

    if (analysis.productIssues.length > 0) {
        console.log(`\n⚠️  PRODUCT FIELD ISSUES DETECTED:`);
        for (const issue of analysis.productIssues) {
            console.log(
                `    Sensor ${issue.index}: product="${issue.product}" should be manufacturer="${issue.actualManufacturer}"`
            );
        }
    }

    return analysis;
}

/**
 * Shows all available active FIT data keys for debugging.
 */
export function showDataKeys(): void {
    const data = getLoadedFitData();
    if (!data || Object.keys(data).length === 0) {
        console.warn("❌ No active FIT data available. Load a FIT file first.");
        return;
    }

    console.log("🗂️  AVAILABLE DATA KEYS:");
    for (const key of Object.keys(data)) {
        const count = Array.isArray(data[key]) ? data[key].length : 1;
        console.log(
            `    ${key}: ${count} ${Array.isArray(data[key]) ? "items" : "item"}`
        );
    }
}

/**
 * Shows only the formatted sensor names from the loaded active FIT data.
 */
export function showSensorNames(): void {
    const data = getLoadedFitData();
    if (!data || Object.keys(data).length === 0) {
        console.warn("❌ No active FIT data available. Load a FIT file first.");
        return;
    }

    const sensors: SensorEntry[] = [];
    // Collect all potential sensors
    const deviceInfoMesgs = getArrayValue(data, "deviceInfoMesgs");
    if (deviceInfoMesgs.length > 0) {
        sensors.push(
            ...deviceInfoMesgs.map((device) =>
                withSource(device, "deviceInfoMesgs")
            )
        );
    }
    const deviceSettingsMesgs = getArrayValue(data, "deviceSettingsMesgs");
    if (deviceSettingsMesgs.length > 0) {
        sensors.push(
            ...deviceSettingsMesgs.map((device) =>
                withSource(device, "deviceSettingsMesgs")
            )
        );
    }
    const deviceInfo = getArrayValue(data, "device_info");
    if (deviceInfo.length > 0) {
        sensors.push(
            ...deviceInfo.map((device) => withSource(device, "device_info"))
        );
    }
    const sessionMesgs = getArrayValue(data, "sessionMesgs");
    if (sessionMesgs[0]) {
        sensors.push(withSource(sessionMesgs[0], "sessionMesgs"));
    }
    const sessions = getArrayValue(data, "session");
    if (sessions[0]) {
        sensors.push(withSource(sessions[0], "session"));
    }
    const fileIdMesgs = getArrayValue(data, "fileIdMesgs");
    if (fileIdMesgs[0]) {
        sensors.push(withSource(fileIdMesgs[0], "fileIdMesgs"));
    }
    const fileIds = getArrayValue(data, "file_id");
    if (fileIds[0]) {
        sensors.push(withSource(fileIds[0], "file_id"));
    }

    console.log("🏷️  SENSOR NAMES:");
    for (const [index, sensor] of sensors.entries()) {
        const formattedName = formatSensorName(sensor);
        console.log(`  ${index + 1}. ${formattedName} (${sensor.source})`);
    }
}

/**
 * Tests manufacturer ID resolution.
 *
 * @param manufacturerId - Manufacturer ID to test.
 *
 * @returns Resolution and formatting details for the manufacturer ID.
 */
export function testManufacturerId(
    manufacturerId: number | string
): ManufacturerIdResult {
    const id = Number.parseInt(String(manufacturerId), 10),
        resolved = getManufacturerName(id),
        formatted = formatManufacturer(resolved);

    console.log(`🧪 TESTING MANUFACTURER ID: ${id}`);
    console.log(`    Resolved to: "${resolved}"`);
    console.log(`    Formatted as: "${formatted}"`);

    return { formatted, id, resolved };
}

/**
 * Tests product ID resolution.
 *
 * @param manufacturerId - Manufacturer ID.
 * @param productId - Product ID to test.
 *
 * @returns Resolution and formatting details for the product ID.
 */
export function testProductId(
    manufacturerId: number | string,
    productId: number | string
): ProductIdResult {
    const mfgId = Number.parseInt(String(manufacturerId), 10),
        prodId = Number.parseInt(String(productId), 10),
        formattedProduct = formatProduct(mfgId, prodId),
        manufacturerName = getManufacturerName(mfgId),
        resolvedProduct = getProductName(mfgId, prodId);

    console.log(`🧪 TESTING PRODUCT ID: ${prodId} for manufacturer ${mfgId}`);
    console.log(`    Manufacturer: "${manufacturerName}"`);
    console.log(`    Product resolved to: "${resolvedProduct}"`);
    console.log(`    Product formatted as: "${formattedProduct}"`);
    console.log(
        `    Full sensor name: "${formatManufacturer(manufacturerName)} ${formattedProduct}"`
    );

    return {
        formattedProduct,
        manufacturerId: mfgId,
        manufacturerName,
        productId: prodId,
        resolvedProduct,
    };
}

// Debug functions are exported for use in renderer.js
// Debug functions stay as module exports for development diagnostics.
