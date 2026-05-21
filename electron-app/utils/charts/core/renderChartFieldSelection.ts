import type { ChartDataRecord } from "./renderChartDataPreparation.js";
import { getRecordValue } from "./renderChartModuleHelpers.js";

const DEFAULT_RENDERABLE_FIELDS = [
    "speed",
    "elevation",
    "heart_rate",
    "power",
] as const;

function getFirstRecord(records: readonly ChartDataRecord[]): ChartDataRecord {
    return records[0] ?? {};
}

function getNumericRecordFields(record: ChartDataRecord): string[] {
    return Object.keys(record)
        .filter((key) => key !== "timestamp")
        .filter((key) => typeof getRecordValue(record, key) === "number");
}

function getDefaultRecordFields(record: ChartDataRecord): string[] {
    return DEFAULT_RENDERABLE_FIELDS.filter((field) => field in record);
}

/**
 * Resolves the candidate data fields to render for the current chart pass.
 *
 * @param renderableFields - State-managed renderable field list.
 * @param records - FIT record messages used as fallback field source.
 *
 * @returns Candidate chart fields in render order.
 */
export function resolveRenderableChartFields(
    renderableFields: unknown,
    records: readonly ChartDataRecord[]
): string[] {
    if (Array.isArray(renderableFields) && renderableFields.length > 0) {
        return renderableFields.filter(
            (field): field is string => typeof field === "string"
        );
    }

    const sample = getFirstRecord(records);
    const numericFields = getNumericRecordFields(sample);

    return numericFields.length > 0
        ? numericFields
        : getDefaultRecordFields(sample);
}
