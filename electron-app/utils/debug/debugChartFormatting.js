/**
 * Test utility to demonstrate the new manufacturer and product ID mappings
 */

import { formatSensorName } from "../formatting/formatters/formatSensorName.js";
import { formatManufacturer } from "../formatting/formatters/formatManufacturer.js";
import { formatProduct } from "../formatting/formatters/formatProduct.js";
import {
    getManufacturerName,
    getProductName,
    getManufacturerIdFromName,
} from "../formatting/display/formatAntNames.js";

/**
 * Test the new formatting with sample data
 */
export function testNewFormatting() {
    console.log("🧪 TESTING NEW MANUFACTURER & PRODUCT FORMATTING");
    console.log("=".repeat(60));

    // Test cases based on your original issue
    const testCases = [
        {
            name: "Favero Electronics Assioma Duo",
            sensor: {
                manufacturer: 269, // Favero Electronics ID
                product: 12, // assioma_duo product ID
            },
        },
        {
            name: "Garmin Edge 530",
            sensor: {
                manufacturer: 1, // Garmin ID
                product: 1325, // Edge 530 product ID
            },
        },
        {
            name: "Wahoo ELEMNT BOLT",
            sensor: {
                manufacturer: 32, // Wahoo Fitness ID
                product: 11, // ELEMNT BOLT product ID
            },
        },
        {
            name: "String-based manufacturer (legacy)",
            sensor: {
                manufacturer: "garmin",
                product: "some_product",
            },
        },
        {
            name: "Garmin Product (special case)",
            sensor: {
                garminProduct: "Forerunner 945",
            },
        },
        {
            name: "Unknown manufacturer ID",
            sensor: {
                manufacturer: 9999,
                product: 123,
            },
        },
    ];

    testCases.forEach((testCase, index) => {
        console.log(`\n[${index + 1}] ${testCase.name}:`);
        console.log(`    Input: manufacturer=${testCase.sensor.manufacturer}, product=${testCase.sensor.product}`);

        // Test individual components
        if (testCase.sensor.manufacturer && testCase.sensor.manufacturer !== testCase.sensor.garminProduct) {
            const mfgName = getManufacturerName(testCase.sensor.manufacturer);
            const formattedMfg = formatManufacturer(testCase.sensor.manufacturer);
            console.log(`    Manufacturer: ${testCase.sensor.manufacturer} → "${mfgName}" → "${formattedMfg}"`);

            if (testCase.sensor.product) {
                const prodName = getProductName(testCase.sensor.manufacturer, testCase.sensor.product);
                const formattedProd = formatProduct(testCase.sensor.manufacturer, testCase.sensor.product);
                console.log(`    Product: ${testCase.sensor.product} → "${prodName}" → "${formattedProd}"`);
            }
        }

        // Test complete sensor name
        const finalResult = formatSensorName(testCase.sensor);
        console.log(`    📱 Final Result: "${finalResult}"`);
    });

    console.log("\n✅ Testing complete!");
    return testCases;
}

// Test specific Favero case
export function testFaveroCase() {
    console.log("🎯 TESTING FAVERO ELECTRONICS CASE (YOUR ORIGINAL ISSUE)");
    console.log("=".repeat(60));

    const faveroSensor = {
        manufacturer: 269, // Favero Electronics
        product: 12, // assioma_duo
    };

    console.log("Original issue: 'Favero Electronics 12' should become 'Favero Electronics Assioma Duo'");
    console.log(`Input data: manufacturer=${faveroSensor.manufacturer}, product=${faveroSensor.product}`);

    // Step-by-step breakdown
    const mfgName = getManufacturerName(faveroSensor.manufacturer);
    console.log(`Step 1 - Manufacturer ID ${faveroSensor.manufacturer} resolves to: "${mfgName}"`);

    const formattedMfg = formatManufacturer(faveroSensor.manufacturer);
    console.log(`Step 2 - Manufacturer formatted as: "${formattedMfg}"`);

    const prodName = getProductName(faveroSensor.manufacturer, faveroSensor.product);
    console.log(`Step 3 - Product ID ${faveroSensor.product} resolves to: "${prodName}"`);

    const formattedProd = formatProduct(faveroSensor.manufacturer, faveroSensor.product);
    console.log(`Step 4 - Product formatted as: "${formattedProd}"`);

    const finalResult = formatSensorName(faveroSensor);
    console.log(`Step 5 - Final sensor name: "${finalResult}"`);

    const expected = "Favero Electronics Assioma Duo";
    const success = finalResult === expected;

    console.log(`\n${success ? "✅" : "❌"} Result: ${success ? "SUCCESS" : "FAILED"}`);
    console.log(`Expected: "${expected}"`);
    console.log(`Got:      "${finalResult}"`);

    return { success, expected, actual: finalResult };
}

// Test with string manufacturer name (like your current data)
export function testFaveroStringCase() {
    console.log("🎯 TESTING FAVERO STRING CASE (CURRENT ISSUE)");
    console.log("=".repeat(60));

    const faveroSensor = {
        manufacturer: "faveroElectronics", // String name like in your data
        product: 12, // assioma_duo
    };

    console.log(
        "Current issue: manufacturer='faveroElectronics', product=12 should become 'Favero Electronics Assioma Duo'"
    );
    console.log(`Input data: manufacturer="${faveroSensor.manufacturer}", product=${faveroSensor.product}`);

    // Step-by-step breakdown
    const mfgIdFromName = getManufacturerIdFromName(faveroSensor.manufacturer);
    console.log(`Step 1 - Manufacturer name "${faveroSensor.manufacturer}" resolves to ID: ${mfgIdFromName}`);

    const formattedMfg = formatManufacturer(faveroSensor.manufacturer);
    console.log(`Step 2 - Manufacturer formatted as: "${formattedMfg}"`);

    const prodName = getProductName(mfgIdFromName, faveroSensor.product);
    console.log(`Step 3 - Product ID ${faveroSensor.product} resolves to: "${prodName}"`);

    const formattedProd = formatProduct(faveroSensor.manufacturer, faveroSensor.product);
    console.log(`Step 4 - Product formatted as: "${formattedProd}"`);

    const finalResult = formatSensorName(faveroSensor);
    console.log(`Step 5 - Final sensor name: "${finalResult}"`);

    const expected = "Favero Electronics Assioma Duo";
    const success = finalResult === expected;

    console.log(`\n${success ? "✅" : "❌"} Result: ${success ? "SUCCESS" : "FAILED"}`);
    console.log(`Expected: "${expected}"`);
    console.log(`Got:      "${finalResult}"`);

    return { success, expected, actual: finalResult };
}

// Test functions are exported for use in renderer.js
// The renderer will expose them globally in development mode
