/** Sensor entry found while inspecting FIT global data. */
export type SensorEntry = Record<string, unknown> & {
    source?: string;
};

/** Sensor formatting issue captured during debug analysis. */
export type SensorIssue = {
    actualManufacturer?: unknown;
    index?: number;
    product?: unknown;
};

/** Summary returned by sensor debug analysis. */
export type SensorAnalysis = {
    manufacturerIssues: SensorIssue[];
    productIssues: SensorIssue[];
    summary: Record<string, unknown>;
    totalSensors: number;
};

/** Quick global FIT data availability check. */
export function checkDataAvailability(): null | Record<string, unknown>;

/** Extract and display detailed sensor information from global FIT data. */
export function debugSensorInfo(): null | SensorAnalysis;

/** Show all available global FIT data keys for debugging. */
export function showDataKeys(): void;

/** Show formatted sensor names from global FIT data. */
export function showSensorNames(): void;

/** Test manufacturer ID resolution and formatting. */
export function testManufacturerId(manufacturerId: number | string): {
    formatted: string;
    id: number;
    resolved: string;
};

/** Test product ID resolution and formatting. */
export function testProductId(
    manufacturerId: number | string,
    productId: number | string
): {
    formattedProduct: string;
    manufacturerId: number;
    manufacturerName: string;
    productId: number;
    resolvedProduct: string;
};
