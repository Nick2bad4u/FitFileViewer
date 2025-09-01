/**
 * @fileoverview Debug utility for extracting and displaying sensor information
 *
 * This utility provides console commands to inspect sensor data from FIT files
 *        console.log(`    🎨 Formatted Name: "${formattedName}"`);
        console.log(`    🏭 Formatted Manufacturer: "${formattedManufacturer}"`);
        if (formattedProduct && formattedProduct !== productField) {
            console.log(`    📦 Formatted Product: "${formattedProduct}"`);
        }

        if (verbose) {
            console.log(`    🔬 Full sensor object:`, sensor);
        }help debug manufacturer/product formatting issues.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

import { formatSensorName } from "../formatting/formatters/formatSensorName.js";
import { formatManufacturer } from "../formatting/formatters/formatManufacturer.js";
import { formatProduct } from "../formatting/formatters/formatProduct.js";
import { getManufacturerName, getProductName } from "../formatting/display/formatAntNames.js";

/**
 * Extracts and displays detailed sensor information from global data
 * @returns {Object|null} Sensor analysis summary or null if no data
 */
export function debugSensorInfo() {
    if (!window.globalData || Object.keys(window.globalData).length === 0) {
        console.warn("❌ No global data available. Load a FIT file first.");
        return null;
    }

    const data = window.globalData;
    console.log("🔍 SENSOR INFORMATION DEBUG");
    console.log("=".repeat(50));
    // Look for sensor data in different locations
    const sensors = [];

    // Check deviceInfoMesgs (actual FIT file structure)
    if (data.deviceInfoMesgs) {
        console.log(`📱 Found ${data.deviceInfoMesgs.length} deviceInfoMesgs entries`);
        sensors.push(
            ...data.deviceInfoMesgs.map(
                /** @param {*} device */ (device) => ({
                    ...device,
                    source: "deviceInfoMesgs",
                })
            )
        );
    }

    // Check deviceSettingsMesgs
    if (data.deviceSettingsMesgs) {
        console.log(`⚙️  Found ${data.deviceSettingsMesgs.length} deviceSettingsMesgs entries`);
        sensors.push(
            ...data.deviceSettingsMesgs.map(
                /** @param {*} device */ (device) => ({
                    ...device,
                    source: "deviceSettingsMesgs",
                })
            )
        );
    }

    // Check legacy device_info format (for backward compatibility)
    if (data.device_info) {
        console.log(`📱 Found ${data.device_info.length} device_info entries`);
        sensors.push(
            ...data.device_info.map(
                /** @param {*} device */ (device) => ({
                    ...device,
                    source: "device_info",
                })
            )
        );
    }

    // Check sessionMesgs messages for sensor info
    if (data.sessionMesgs && data.sessionMesgs.length > 0) {
        const session = data.sessionMesgs[0];
        console.log("📊 Session data available");
        if (session.manufacturer || session.manufacturerId || session.manufacturer_id) {
            sensors.push({
                ...session,
                source: "sessionMesgs",
            });
        }
    }

    // Check legacy session format
    if (data.session && data.session.length > 0) {
        const session = data.session[0];
        console.log("📊 Legacy session data available");
        if (session.manufacturer || session.manufacturer_id) {
            sensors.push({
                ...session,
                source: "session",
            });
        }
    }

    // Check fileIdMesgs for creator info
    if (data.fileIdMesgs && data.fileIdMesgs.length > 0) {
        const fileId = data.fileIdMesgs[0];
        console.log("📄 File ID data available");
        if (fileId.manufacturer || fileId.manufacturerId || fileId.manufacturer_id) {
            sensors.push({
                ...fileId,
                source: "fileIdMesgs",
            });
        }
    }

    // Check legacy file_id format
    if (data.file_id && data.file_id.length > 0) {
        const fileId = data.file_id[0];
        console.log("📄 Legacy file ID data available");
        if (fileId.manufacturer || fileId.manufacturer_id) {
            sensors.push({
                ...fileId,
                source: "file_id",
            });
        }
    }

    // Check for any other sensor-related data
    const sensorKeys = Object.keys(data).filter(
        (key) => key.includes("sensor") || key.includes("device") || key.includes("manufacturer")
    );

    if (sensorKeys.length > 0) {
        console.log(`🔧 Additional sensor-related keys found: ${sensorKeys.join(", ")}`);
    }

    if (sensors.length === 0) {
        console.warn("⚠️ No sensor information found in the data");
        return null;
    }

    console.log(`\n🎯 ANALYZING ${sensors.length} SENSOR ENTRIES:`);
    console.log("-".repeat(50));

    const analysis = {
        totalSensors: sensors.length,
        manufacturerIssues: /** @type {Array<*>} */ ([]),
        productIssues: /** @type {Array<*>} */ ([]),
        summary: {},
    };

    sensors.forEach((sensor, index) => {
        console.log(`\n[${index + 1}] Source: ${sensor.source}`);
        console.log(`    Raw Data:`, {
            manufacturer: sensor.manufacturer,
            manufacturerId: sensor.manufacturerId,
            manufacturer_id: sensor.manufacturer_id,
            product: sensor.product,
            productName: sensor.productName,
            product_name: sensor.product_name,
            garminProduct: sensor.garminProduct,
            garmin_product: sensor.garmin_product,
            deviceType: sensor.deviceType,
            device_type: sensor.device_type,
            serialNumber: sensor.serialNumber,
            serial_number: sensor.serial_number,
            deviceIndex: sensor.deviceIndex,
            device_index: sensor.device_index,
        }); // Check manufacturer resolution
        let resolvedManufacturer = sensor.manufacturer;
        const manufacturerId = sensor.manufacturerId || sensor.manufacturer_id;

        if (manufacturerId && !resolvedManufacturer) {
            resolvedManufacturer = getManufacturerName(manufacturerId);
            console.log(`    📋 Resolved manufacturer ID ${manufacturerId} → "${resolvedManufacturer}"`);
        }

        // Check product resolution
        const productField = sensor.product || sensor.productName || sensor.product_name;
        let resolvedProduct = productField;

        if (manufacturerId && productField) {
            resolvedProduct = getProductName(manufacturerId, productField);
            if (resolvedProduct !== productField) {
                console.log(`    📦 Resolved product ID ${productField} → "${resolvedProduct}"`);
            }
        } // Test formatting
        const formattedName = formatSensorName(sensor),
         formattedManufacturer = formatManufacturer(resolvedManufacturer || sensor.manufacturer),
         formattedProduct =
            (manufacturerId || sensor.manufacturer) && productField
                ? formatProduct(manufacturerId || sensor.manufacturer, productField)
                : productField;

        console.log(`    🎨 Formatted Name: "${formattedName}"`);
        console.log(`    🏭 Formatted Manufacturer: "${formattedManufacturer}"`);
        if (formattedProduct && formattedProduct !== productField) {
            console.log(`    � Formatted Product: "${formattedProduct}"`);
        }
    });

    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`    Total sensors: ${analysis.totalSensors}`);
    console.log(`    Product field issues: ${analysis.productIssues.length}`);

    if (analysis.productIssues.length > 0) {
        console.log(`\n⚠️  PRODUCT FIELD ISSUES DETECTED:`);
        analysis.productIssues.forEach((issue) => {
            console.log(
                `    Sensor ${issue.index}: product="${issue.product}" should be manufacturer="${issue.actualManufacturer}"`
            );
        });
    }

    return analysis;
}

/**
 * Quick command to show just the sensor names
 */
export function showSensorNames() {
    if (!window.globalData || Object.keys(window.globalData).length === 0) {
        console.warn("❌ No global data available. Load a FIT file first.");
        return;
    }

    const data = window.globalData,
     sensors = [];
    // Collect all potential sensors
    if (data.deviceInfoMesgs) {
        sensors.push(...data.deviceInfoMesgs.map(/** @param {*} d */ (d) => ({ ...d, source: "deviceInfoMesgs" })));
    }
    if (data.deviceSettingsMesgs) {
        sensors.push(
            ...data.deviceSettingsMesgs.map(/** @param {*} d */ (d) => ({ ...d, source: "deviceSettingsMesgs" }))
        );
    }
    if (data.device_info) {
        sensors.push(...data.device_info.map(/** @param {*} d */ (d) => ({ ...d, source: "device_info" })));
    }
    if (data.sessionMesgs && data.sessionMesgs[0]) {
        sensors.push({ ...data.sessionMesgs[0], source: "sessionMesgs" });
    }
    if (data.session && data.session[0]) {
        sensors.push({ ...data.session[0], source: "session" });
    }
    if (data.fileIdMesgs && data.fileIdMesgs[0]) {
        sensors.push({ ...data.fileIdMesgs[0], source: "fileIdMesgs" });
    }
    if (data.file_id && data.file_id[0]) {
        sensors.push({ ...data.file_id[0], source: "file_id" });
    }

    console.log("🏷️  SENSOR NAMES:");
    sensors.forEach((sensor, index) => {
        const formattedName = formatSensorName(sensor);
        console.log(`  ${index + 1}. ${formattedName} (${sensor.source})`);
    });
}

/**
 * Test manufacturer ID resolution
 * @param {number|string} manufacturerId - Manufacturer ID to test
 */
export function testManufacturerId(manufacturerId) {
    const id = parseInt(String(manufacturerId), 10),
     resolved = getManufacturerName(id),
     formatted = formatManufacturer(resolved);

    console.log(`🧪 TESTING MANUFACTURER ID: ${id}`);
    console.log(`    Resolved to: "${resolved}"`);
    console.log(`    Formatted as: "${formatted}"`);

    return { id, resolved, formatted };
}

/**
 * Test product ID resolution
 * @param {number|string} manufacturerId - Manufacturer ID
 * @param {number|string} productId - Product ID to test
 */
export function testProductId(manufacturerId, productId) {
    const mfgId = parseInt(String(manufacturerId), 10),
     prodId = parseInt(String(productId), 10),
     resolvedProduct = getProductName(mfgId, prodId),
     formattedProduct = formatProduct(mfgId, prodId),
     manufacturerName = getManufacturerName(mfgId);

    console.log(`🧪 TESTING PRODUCT ID: ${prodId} for manufacturer ${mfgId}`);
    console.log(`    Manufacturer: "${manufacturerName}"`);
    console.log(`    Product resolved to: "${resolvedProduct}"`);
    console.log(`    Product formatted as: "${formattedProduct}"`);
    console.log(`    Full sensor name: "${formatManufacturer(manufacturerName)} ${formattedProduct}"`);

    return { manufacturerId: mfgId, productId: prodId, resolvedProduct, formattedProduct, manufacturerName };
}

/**
 * Show all available data keys for debugging
 */
export function showDataKeys() {
    if (!window.globalData || Object.keys(window.globalData).length === 0) {
        console.warn("❌ No global data available. Load a FIT file first.");
        return;
    }

    const data = window.globalData;
    console.log("🗂️  AVAILABLE DATA KEYS:");
    Object.keys(data).forEach((key) => {
        const count = Array.isArray(data[key]) ? data[key].length : 1;
        console.log(`    ${key}: ${count} ${Array.isArray(data[key]) ? "items" : "item"}`);
    });
}

/**
 * Quick data availability check
 */
export function checkDataAvailability() {
    console.log("🔍 DATA AVAILABILITY CHECK:");
    console.log(`window.globalData exists: ${Boolean(window.globalData)}`);
    console.log(`window.globalData type: ${typeof window.globalData}`);

    if (window.globalData) {
        console.log(`Keys count: ${Object.keys(window.globalData).length}`);
        console.log(`Available keys: ${Object.keys(window.globalData).join(", ")}`);

        // Check specifically for sensor-related data
        const sensorKeys = Object.keys(window.globalData).filter(
            (key) =>
                key.includes("device") || key.includes("session") || key.includes("file_id") || key.includes("sensor")
        );
        console.log(`Sensor-related keys: ${sensorKeys.join(", ") || "none found"}`);
    }

    return window.globalData;
}

// Debug functions are exported for use in renderer.js
// The renderer will expose them globally in development mode
