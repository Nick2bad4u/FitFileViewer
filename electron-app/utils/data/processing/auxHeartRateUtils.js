/**
 * @file Auxiliary heart rate detection and normalization utilities.
 *
 *   Provides helpers to detect auxiliary heart rate fields across varying FIT
 *   parsers / devices and expose a canonical `auxHeartRate` field for chart,
 *   map, and table rendering.
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

/**
 * @typedef {Object} AuxHeartRateResolution
 *
 * @property {"recordKey" | "developerField" | "none"} source
 * @property {string | null} [fieldKey]
 * @property {string[] | null} [developerFieldIds]
 * @property {string | null} [fieldName]
 */

/**
 * @typedef {Object} ApplyAuxHeartRateResult
 *
 * @property {boolean} applied
 * @property {number} valuesFound
 * @property {AuxHeartRateResolution} resolution
 */

/**
 * @typedef {Object} DeveloperFieldMatch
 *
 * @property {string} fieldName
 * @property {string[]} fieldIds
 */

/**
 * Normalize a field key for comparison.
 *
 * @param {string} key
 *
 * @returns {string}
 */
function normalizeKey(key) {
    return String(key)
        .toLowerCase()
        .replaceAll(/[^a-z0-9]/gu, "");
}

/**
 * Check if a value is numeric.
 *
 * @param {unknown} value
 *
 * @returns {boolean}
 */
function isNumericValue(value) {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric);
}

/**
 * Resolve field description messages from a FIT data object.
 *
 * @param {Record<string, unknown> | null | undefined} fitData
 *
 * @returns {Record<string, unknown>[]} Array of field description messages.
 */
export function resolveFieldDescriptionMessages(fitData) {
    if (!fitData || typeof fitData !== "object") {
        return [];
    }

    const candidates = [
        /** @type {any} */ (fitData).fieldDescriptionMesgs,
        /** @type {any} */ (fitData).field_description_mesgs,
        /** @type {any} */ (fitData).field_description,
        /** @type {any} */ (fitData).fieldDescriptions,
        /** @type {any} */ (fitData).fieldDescription,
        /** @type {any} */ (fitData).fieldDescriptionMsg,
        /** @type {any} */ (fitData).fieldDescriptionMesg,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }

    return [];
}

/**
 * Determine whether a key looks like an auxiliary heart rate field.
 *
 * @param {string} key
 *
 * @returns {boolean}
 */
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

    if (hasHeartRate && hasAuxQualifier) {
        return true;
    }

    if (hasHeartRate && hasNumericSuffix) {
        return true;
    }

    if (hasHrToken && hasAuxQualifier) {
        return true;
    }

    return false;
}

/**
 * Count how many numeric values exist for a key.
 *
 * @param {Record<string, unknown>[]} recordMesgs
 * @param {string} key
 *
 * @returns {number}
 */
function countNumericValues(recordMesgs, key) {
    let count = 0;
    for (const row of recordMesgs) {
        if (!row || typeof row !== "object") {
            continue;
        }
        const value = /** @type {any} */ (row)[key];
        if (isNumericValue(value)) {
            count += 1;
        }
    }
    return count;
}

/**
 * Resolve candidate keys in record messages that may represent auxiliary heart
 * rate data.
 *
 * @param {Record<string, unknown>[]} recordMesgs
 *
 * @returns {{ key: string | null; count: number }}
 */
function scanRecordKeysForAuxHeartRate(recordMesgs) {
    if (!Array.isArray(recordMesgs) || recordMesgs.length === 0) {
        return { count: 0, key: null };
    }

    if (countNumericValues(recordMesgs, AUX_HEART_RATE_FIELD) > 0) {
        return {
            count: countNumericValues(recordMesgs, AUX_HEART_RATE_FIELD),
            key: AUX_HEART_RATE_FIELD,
        };
    }

    /** @type {Map<string, number>} */
    const candidateCounts = new Map();
    const limit = Math.min(MAX_SCAN_RECORDS, recordMesgs.length);

    for (let i = 0; i < limit; i += 1) {
        const row = recordMesgs[i];
        if (!row || typeof row !== "object") {
            continue;
        }

        for (const key of Object.keys(row)) {
            if (!isAuxHeartRateKeyCandidate(key)) {
                continue;
            }

            const value = /** @type {any} */ (row)[key];
            if (!isNumericValue(value)) {
                continue;
            }

            candidateCounts.set(key, (candidateCounts.get(key) || 0) + 1);
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

/**
 * Extract a normalized field description value from a message.
 *
 * @param {Record<string, unknown>} message
 *
 * @returns {{
 *     fieldName: string | null;
 *     fieldDefinitionNumber: string | null;
 *     developerDataIndex: string | null;
 * }}
 */
function normalizeFieldDescription(message) {
    const fieldNameCandidate =
        /** @type {any} */ (message).field_name ??
        /** @type {any} */ (message).fieldName ??
        /** @type {any} */ (message).field ??
        /** @type {any} */ (message).name ??
        /** @type {any} */ (message).field_description ??
        /** @type {any} */ (message).fieldDescription;

    const fieldDefinitionNumberCandidate =
        /** @type {any} */ (message).field_definition_number ??
        /** @type {any} */ (message).fieldDefinitionNumber ??
        /** @type {any} */ (message).field_def_number ??
        /** @type {any} */ (message).fieldDefNumber ??
        /** @type {any} */ (message).field_definition_num ??
        /** @type {any} */ (message).fieldDefinitionNum;

    const developerDataIndexCandidate =
        /** @type {any} */ (message).developer_data_index ??
        /** @type {any} */ (message).developerDataIndex ??
        /** @type {any} */ (message).developer_data_id ??
        /** @type {any} */ (message).developerDataId;

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

/**
 * Find matching developer field definitions for auxiliary heart rate data.
 *
 * @param {Record<string, unknown>[]} fieldDescriptionMesgs
 *
 * @returns {DeveloperFieldMatch | null}
 */
function resolveAuxDeveloperField(fieldDescriptionMesgs) {
    if (
        !Array.isArray(fieldDescriptionMesgs) ||
        fieldDescriptionMesgs.length === 0
    ) {
        return null;
    }

    /** @type {DeveloperFieldMatch | null} */
    let bestMatch = null;

    for (const message of fieldDescriptionMesgs) {
        if (!message || typeof message !== "object") {
            continue;
        }
        const { fieldName, fieldDefinitionNumber, developerDataIndex } =
            normalizeFieldDescription(
                /** @type {Record<string, unknown>} */ (message)
            );

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

        bestMatch = {
            fieldIds: Array.from(fieldIds),
            fieldName,
        };
        break;
    }

    return bestMatch;
}

/**
 * Get developer field values for candidate ids.
 *
 * @param {Record<string, unknown>} row
 * @param {string[]} fieldIds
 *
 * @returns {number | null}
 */
function getDeveloperFieldValue(row, fieldIds) {
    if (!row || typeof row !== "object" || fieldIds.length === 0) {
        return null;
    }

    const devFieldValue = /** @type {any} */ (row).developerFields;
    let devFields = null;

    if (typeof devFieldValue === "string") {
        try {
            devFields = JSON.parse(devFieldValue);
        } catch {
            devFields = null;
        }
    } else if (devFieldValue && typeof devFieldValue === "object") {
        devFields = devFieldValue;
    }

    if (!devFields || typeof devFields !== "object") {
        return null;
    }

    for (const fieldId of fieldIds) {
        if (!Object.hasOwn(devFields, fieldId)) {
            continue;
        }
        const rawValue = /** @type {any} */ (devFields)[fieldId];
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
 * Resolve auxiliary heart rate metadata for a record set.
 *
 * @param {Record<string, unknown>[]} recordMesgs
 * @param {Record<string, unknown>[]} [fieldDescriptionMesgs]
 *
 * @returns {AuxHeartRateResolution}
 */
export function resolveAuxHeartRateResolution(
    recordMesgs,
    fieldDescriptionMesgs = []
) {
    if (!Array.isArray(recordMesgs) || recordMesgs.length === 0) {
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
        const resolution = { fieldKey: candidateKey, source: "recordKey" };
        AUX_HEART_RATE_CACHE.set(recordMesgs, {
            fieldDescriptionMesgs,
            resolution,
        });
        return resolution;
    }

    const developerFieldMatch = resolveAuxDeveloperField(fieldDescriptionMesgs);
    if (developerFieldMatch?.fieldIds?.length) {
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

/**
 * Count developer field numeric values for a record set.
 *
 * @param {Record<string, unknown>[]} recordMesgs
 * @param {string[]} fieldIds
 *
 * @returns {number}
 */
function countDeveloperFieldValues(recordMesgs, fieldIds) {
    let count = 0;
    for (const row of recordMesgs) {
        if (!row || typeof row !== "object") {
            continue;
        }
        const value = getDeveloperFieldValue(row, fieldIds);
        if (isNumericValue(value)) {
            count += 1;
        }
    }
    return count;
}

/**
 * Get auxiliary heart rate value from a record.
 *
 * @param {Record<string, unknown>} row
 * @param {{
 *     recordMesgs?: Record<string, unknown>[];
 *     fieldDescriptionMesgs?: Record<string, unknown>[];
 *     resolution?: AuxHeartRateResolution;
 * }} [options]
 *
 * @returns {number | null}
 */
export function getAuxHeartRateValue(row, options = {}) {
    if (!row || typeof row !== "object") {
        return null;
    }

    const existing = /** @type {any} */ (row)[AUX_HEART_RATE_FIELD];
    if (isNumericValue(existing)) {
        return Number(existing);
    }

    if (!options.recordMesgs || options.recordMesgs.length === 0) {
        for (const key of Object.keys(row)) {
            if (!isAuxHeartRateKeyCandidate(key)) {
                continue;
            }
            const value = /** @type {any} */ (row)[key];
            if (isNumericValue(value)) {
                return Number(value);
            }
        }
    }

    const resolution =
        options.resolution ||
        resolveAuxHeartRateResolution(
            options.recordMesgs || [],
            options.fieldDescriptionMesgs || []
        );

    if (resolution.source === "recordKey" && resolution.fieldKey) {
        const value = /** @type {any} */ (row)[resolution.fieldKey];
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
 * Apply auxiliary heart rate detection and normalization to record messages.
 *
 * @param {{
 *     recordMesgs: Record<string, unknown>[];
 *     fieldDescriptionMesgs?: Record<string, unknown>[];
 * }} params
 *
 * @returns {ApplyAuxHeartRateResult}
 */
export function applyAuxHeartRateToRecords({
    recordMesgs,
    fieldDescriptionMesgs = [],
}) {
    if (!Array.isArray(recordMesgs) || recordMesgs.length === 0) {
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
        if (!row || typeof row !== "object") {
            continue;
        }

        const existing = /** @type {any} */ (row)[AUX_HEART_RATE_FIELD];
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
            /** @type {any} */ (row)[AUX_HEART_RATE_FIELD] = Number(value);
            valuesFound += 1;
        }
    }

    return {
        applied: valuesFound > 0,
        resolution,
        valuesFound,
    };
}

export const AUX_HEART_RATE_FIELD_KEY = AUX_HEART_RATE_FIELD;
