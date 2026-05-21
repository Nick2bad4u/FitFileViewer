/**
 * Auxiliary heart rate detection and normalization utilities.
 *
 * Provides helpers to detect auxiliary heart rate fields across varying FIT
 * parsers and devices, then exposes a canonical `auxHeartRate` field for chart,
 * map, and table rendering.
 */
const AUX_HEART_RATE_FIELD = "auxHeartRate";
const AUX_HEART_RATE_CACHE = new WeakMap();
const MAX_SCAN_RECORDS = 200;
const PRIMARY_HEART_RATE_KEYS = new Set([
    "enhanced_heart_rate",
    "enhancedHeartRate",
    "enhancedheartrate",
    "heart_rate",
    "heartRate",
    "heartrate",
    "hr",
]);
const EXCLUDED_HEART_RATE_KEYS = new Set([
    "avg_heart_rate",
    "avgHeartRate",
    "default_max_biking_heart_rate",
    "default_max_heart_rate",
    "default_max_running_heart_rate",
    "defaultMaxBikingHeartRate",
    "defaultMaxHeartRate",
    "defaultMaxRunningHeartRate",
    "heart_rate_reserve",
    "heart_rate_zone",
    "heartRateReserve",
    "heartRateZone",
    "max_heart_rate",
    "maxHeartRate",
    "min_heart_rate",
    "minHeartRate",
    "resting_heart_rate",
    "restingHeartRate",
    "time_in_heart_rate_zone",
    "timeInHeartRateZone",
]);
const AUX_HEART_RATE_HINTS = [
    "auxHeartRate",
    "aux_heart_rate",
    "auxiliaryHeartRate",
    "auxiliary_heart_rate",
    "heartRateAux",
    "heart_rate_aux",
    "auxHr",
    "aux_hr",
    "aux_hrm",
    "externalHeartRate",
    "external_heart_rate",
    "secondaryHeartRate",
    "secondary_heart_rate",
    "heartRate2",
    "heart_rate_2",
    "heartRate3",
    "heart_rate_3",
    "heart_rate_4",
    "heartRate4",
];
const AUX_HINTS_NORMALIZED = new Set(
    AUX_HEART_RATE_HINTS.map((key) => normalizeKey(key))
);
function normalizeKey(key) {
    return String(key)
        .toLowerCase()
        .replaceAll(/[^a-z0-9]/gu, "");
}
function isDataRecord(value) {
    return Boolean(value) && typeof value === "object";
}
function isNumericValue(value) {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric);
}
/**
 * Resolves field description messages from a FIT data object.
 *
 * @param fitData - Parsed FIT data object.
 *
 * @returns Field description messages, or an empty array when unavailable.
 */
export function resolveFieldDescriptionMessages(fitData) {
    if (!isDataRecord(fitData)) {
        return [];
    }
    const candidates = [
        fitData["fieldDescriptionMesgs"],
        fitData["field_description_mesgs"],
        fitData["field_description"],
        fitData["fieldDescriptions"],
        fitData["fieldDescription"],
        fitData["fieldDescriptionMsg"],
        fitData["fieldDescriptionMesg"],
    ];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }
    return [];
}
function isAuxHeartRateKeyCandidate(key) {
    if (!key) {
        return false;
    }
    const normalized = normalizeKey(key);
    if (AUX_HINTS_NORMALIZED.has(normalized)) {
        return true;
    }
    if (
        PRIMARY_HEART_RATE_KEYS.has(key) ||
        PRIMARY_HEART_RATE_KEYS.has(normalized)
    ) {
        return false;
    }
    if (
        EXCLUDED_HEART_RATE_KEYS.has(key) ||
        EXCLUDED_HEART_RATE_KEYS.has(normalized)
    ) {
        return false;
    }
    const lower = key.toLowerCase();
    const hasHeartRate = /heart\s*rate/iu.test(lower);
    const hasHrToken = /\bhr\b/iu.test(lower) || /hrm/iu.test(lower);
    const hasAuxQualifier =
        /(aux|auxiliary|external|secondary|strap|chest)/iu.test(lower);
    const hasNumericSuffix = /(heart\s*rate|hr)[^0-9]*\d/iu.test(lower);
    return (
        (hasHeartRate && hasAuxQualifier) ||
        (hasHeartRate && hasNumericSuffix) ||
        (hasHrToken && hasAuxQualifier)
    );
}
function countNumericValues(recordMesgs, key) {
    let count = 0;
    for (const row of recordMesgs) {
        if (isNumericValue(row[key])) {
            count += 1;
        }
    }
    return count;
}
function scanRecordKeysForAuxHeartRate(recordMesgs) {
    if (recordMesgs.length === 0) {
        return { count: 0, key: null };
    }
    const explicitCount = countNumericValues(recordMesgs, AUX_HEART_RATE_FIELD);
    if (explicitCount > 0) {
        return {
            count: explicitCount,
            key: AUX_HEART_RATE_FIELD,
        };
    }
    const candidateCounts = new Map();
    const limit = Math.min(MAX_SCAN_RECORDS, recordMesgs.length);
    for (let i = 0; i < limit; i += 1) {
        const row = recordMesgs[i];
        if (!row) {
            continue;
        }
        for (const key of Object.keys(row)) {
            if (!isAuxHeartRateKeyCandidate(key)) {
                continue;
            }
            if (!isNumericValue(row[key])) {
                continue;
            }
            candidateCounts.set(key, (candidateCounts.get(key) ?? 0) + 1);
        }
    }
    if (candidateCounts.size === 0) {
        return { count: 0, key: null };
    }
    let bestKey = null;
    let bestCount = 0;
    for (const [key, count] of candidateCounts.entries()) {
        if (count > bestCount) {
            bestKey = key;
            bestCount = count;
        }
    }
    return { count: bestCount, key: bestKey };
}
function normalizeFieldDescription(message) {
    const fieldNameCandidate =
        message["field_name"] ??
        message["fieldName"] ??
        message["field"] ??
        message["name"] ??
        message["field_description"] ??
        message["fieldDescription"];
    const fieldDefinitionNumberCandidate =
        message["field_definition_number"] ??
        message["fieldDefinitionNumber"] ??
        message["field_def_number"] ??
        message["fieldDefNumber"] ??
        message["field_definition_num"] ??
        message["fieldDefinitionNum"];
    const developerDataIndexCandidate =
        message["developer_data_index"] ??
        message["developerDataIndex"] ??
        message["developer_data_id"] ??
        message["developerDataId"];
    const fieldName =
        typeof fieldNameCandidate === "string" && fieldNameCandidate.trim()
            ? fieldNameCandidate.trim()
            : null;
    const fieldDefinitionNumber = Number.isFinite(
        Number(fieldDefinitionNumberCandidate)
    )
        ? String(fieldDefinitionNumberCandidate)
        : null;
    const developerDataIndex = Number.isFinite(
        Number(developerDataIndexCandidate)
    )
        ? String(developerDataIndexCandidate)
        : null;
    return { developerDataIndex, fieldDefinitionNumber, fieldName };
}
function resolveAuxDeveloperField(fieldDescriptionMesgs) {
    if (fieldDescriptionMesgs.length === 0) {
        return null;
    }
    for (const message of fieldDescriptionMesgs) {
        if (!isDataRecord(message)) {
            continue;
        }
        const { fieldName, fieldDefinitionNumber, developerDataIndex } =
            normalizeFieldDescription(message);
        if (!fieldName || !fieldDefinitionNumber) {
            continue;
        }
        const lowerName = fieldName.toLowerCase();
        const hasHeartRate =
            /heart\s*rate/iu.test(lowerName) || /\bhr\b/iu.test(lowerName);
        const hasAuxQualifier =
            /(aux|auxiliary|external|secondary|strap|chest)/iu.test(lowerName);
        if (!hasHeartRate || !hasAuxQualifier) {
            continue;
        }
        const fieldIds = new Set();
        fieldIds.add(fieldDefinitionNumber);
        if (developerDataIndex) {
            fieldIds.add(`${developerDataIndex}.${fieldDefinitionNumber}`);
            fieldIds.add(`${developerDataIndex}:${fieldDefinitionNumber}`);
            fieldIds.add(`${developerDataIndex}_${fieldDefinitionNumber}`);
        }
        return {
            fieldIds: Array.from(fieldIds),
            fieldName,
        };
    }
    return null;
}
function getDeveloperFieldValue(row, fieldIds) {
    if (fieldIds.length === 0) {
        return null;
    }
    const devFieldValue = row["developerFields"];
    let devFields = null;
    if (typeof devFieldValue === "string") {
        try {
            const parsed = JSON.parse(devFieldValue);
            devFields = isDataRecord(parsed) ? parsed : null;
        } catch {
            devFields = null;
        }
    } else if (isDataRecord(devFieldValue)) {
        devFields = devFieldValue;
    }
    if (!devFields) {
        return null;
    }
    for (const fieldId of fieldIds) {
        if (!Object.hasOwn(devFields, fieldId)) {
            continue;
        }
        const rawValue = devFields[fieldId];
        if (Array.isArray(rawValue)) {
            const numericValue = rawValue.find((val) => isNumericValue(val));
            if (isNumericValue(numericValue)) {
                return Number(numericValue);
            }
            continue;
        }
        if (isNumericValue(rawValue)) {
            return Number(rawValue);
        }
    }
    return null;
}
/**
 * Resolves auxiliary heart rate metadata for a record set.
 *
 * @param recordMesgs - FIT record messages.
 * @param fieldDescriptionMesgs - Optional FIT field description messages.
 *
 * @returns The resolved auxiliary heart rate source.
 */
export function resolveAuxHeartRateResolution(
    recordMesgs,
    fieldDescriptionMesgs = []
) {
    if (recordMesgs.length === 0) {
        return { source: "none" };
    }
    const cached = AUX_HEART_RATE_CACHE.get(recordMesgs);
    if (
        cached &&
        (!fieldDescriptionMesgs.length ||
            cached.fieldDescriptionMesgs === fieldDescriptionMesgs)
    ) {
        return cached.resolution;
    }
    const { key: candidateKey, count } =
        scanRecordKeysForAuxHeartRate(recordMesgs);
    if (candidateKey && count > 0) {
        const resolution = {
            fieldKey: candidateKey,
            source: "recordKey",
        };
        AUX_HEART_RATE_CACHE.set(recordMesgs, {
            fieldDescriptionMesgs,
            resolution,
        });
        return resolution;
    }
    const developerFieldMatch = resolveAuxDeveloperField(fieldDescriptionMesgs);
    if (developerFieldMatch?.fieldIds.length) {
        const devCount = countDeveloperFieldValues(
            recordMesgs,
            developerFieldMatch.fieldIds
        );
        if (devCount > 0) {
            const resolution = {
                developerFieldIds: developerFieldMatch.fieldIds,
                fieldName: developerFieldMatch.fieldName,
                source: "developerField",
            };
            AUX_HEART_RATE_CACHE.set(recordMesgs, {
                fieldDescriptionMesgs,
                resolution,
            });
            return resolution;
        }
    }
    const resolution = { source: "none" };
    AUX_HEART_RATE_CACHE.set(recordMesgs, {
        fieldDescriptionMesgs,
        resolution,
    });
    return resolution;
}
function countDeveloperFieldValues(recordMesgs, fieldIds) {
    let count = 0;
    for (const row of recordMesgs) {
        const value = getDeveloperFieldValue(row, fieldIds);
        if (isNumericValue(value)) {
            count += 1;
        }
    }
    return count;
}
/**
 * Gets an auxiliary heart rate value from a single record.
 *
 * @param row - FIT record message.
 * @param options - Optional record context and precomputed resolution.
 *
 * @returns The auxiliary heart rate value, or `null` when unavailable.
 */
export function getAuxHeartRateValue(row, options = {}) {
    if (!isDataRecord(row)) {
        return null;
    }
    const existing = row[AUX_HEART_RATE_FIELD];
    if (isNumericValue(existing)) {
        return Number(existing);
    }
    if (!options.recordMesgs || options.recordMesgs.length === 0) {
        for (const key of Object.keys(row)) {
            if (!isAuxHeartRateKeyCandidate(key)) {
                continue;
            }
            const value = row[key];
            if (isNumericValue(value)) {
                return Number(value);
            }
        }
    }
    const resolution =
        options.resolution ??
        resolveAuxHeartRateResolution(
            options.recordMesgs ?? [],
            options.fieldDescriptionMesgs ?? []
        );
    if (resolution.source === "recordKey" && resolution.fieldKey) {
        const value = row[resolution.fieldKey];
        return isNumericValue(value) ? Number(value) : null;
    }
    if (
        resolution.source === "developerField" &&
        Array.isArray(resolution.developerFieldIds)
    ) {
        return getDeveloperFieldValue(row, resolution.developerFieldIds);
    }
    return null;
}
/**
 * Applies auxiliary heart rate detection and normalization to record messages.
 *
 * @param params - Records and optional field descriptions to inspect.
 *
 * @returns Summary of whether values were applied.
 */
export function applyAuxHeartRateToRecords({
    recordMesgs,
    fieldDescriptionMesgs = [],
}) {
    if (recordMesgs.length === 0) {
        return {
            applied: false,
            resolution: { source: "none" },
            valuesFound: 0,
        };
    }
    const resolution = resolveAuxHeartRateResolution(
        recordMesgs,
        fieldDescriptionMesgs
    );
    if (resolution.source === "none") {
        return { applied: false, resolution, valuesFound: 0 };
    }
    let valuesFound = 0;
    for (const row of recordMesgs) {
        const existing = row[AUX_HEART_RATE_FIELD];
        if (isNumericValue(existing)) {
            valuesFound += 1;
            continue;
        }
        const value = getAuxHeartRateValue(row, {
            fieldDescriptionMesgs,
            recordMesgs,
            resolution,
        });
        if (isNumericValue(value)) {
            row[AUX_HEART_RATE_FIELD] = Number(value);
            valuesFound += 1;
        }
    }
    return {
        applied: valuesFound > 0,
        resolution,
        valuesFound,
    };
}
/**
 * Canonical auxiliary heart rate record field key.
 */
export const AUX_HEART_RATE_FIELD_KEY = AUX_HEART_RATE_FIELD;
