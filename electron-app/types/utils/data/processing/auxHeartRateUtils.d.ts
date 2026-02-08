export type AuxHeartRateResolution = {
    source: "recordKey" | "developerField" | "none";
    fieldKey?: string | null;
    developerFieldIds?: string[] | null;
    fieldName?: string | null;
};

export type ApplyAuxHeartRateResult = {
    applied: boolean;
    valuesFound: number;
    resolution: AuxHeartRateResolution;
};

export function resolveFieldDescriptionMessages(
    fitData?: Record<string, unknown> | null
): Record<string, unknown>[];

export function resolveAuxHeartRateResolution(
    recordMesgs: Record<string, unknown>[],
    fieldDescriptionMesgs?: Record<string, unknown>[]
): AuxHeartRateResolution;

export function getAuxHeartRateValue(
    row: Record<string, unknown>,
    options?: {
        recordMesgs?: Record<string, unknown>[];
        fieldDescriptionMesgs?: Record<string, unknown>[];
        resolution?: AuxHeartRateResolution;
    }
): number | null;

export function applyAuxHeartRateToRecords(params: {
    recordMesgs: Record<string, unknown>[];
    fieldDescriptionMesgs?: Record<string, unknown>[];
}): ApplyAuxHeartRateResult;

export const AUX_HEART_RATE_FIELD_KEY: string;
