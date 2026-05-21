import { getLabelsForRecords } from "./renderChartLabelCache.js";
import { getRecordValue } from "./renderChartModuleHelpers.js";
import { getNotificationSuppressed, setNotificationSuppressed, } from "./renderChartNotificationHelpers.js";
import { normalizeMaxPointsValue } from "./renderChartPointUtils.js";
import { getCachedSeriesForSettings, getFieldSeriesEntry, } from "./renderChartSeriesCache.js";
import { getStateManagerSafe } from "./renderChartStateAccess.js";
import { getConvertersSafe, getFormatChartFieldsSafe, } from "./renderChartDependencyAccessors.js";
import { isDevelopmentEnvironment } from "./renderChartRuntimeHelpers.js";
import { ensureDataSettingsSignature } from "./renderChartDataSettingsCache.js";
const CACHE_LOG_PREFIX = "[ChartJS Cache]";
const MAX_FIELDS_BY_RECORD_COUNT = [
    { maxFields: 2, minRecords: 250_000 },
    { maxFields: 4, minRecords: 120_000 },
    { maxFields: 6, minRecords: 60_000 },
];
const PRIORITY_FIELDS = [
    "speed",
    "enhanced_speed",
    "heart_rate",
    "heartRate",
    "aux_heart_rate",
    "auxHeartRate",
    "power",
    "enhanced_power",
    "altitude",
    "enhanced_altitude",
    "cadence",
    "temperature",
];
function getFieldsToPrewarm(recordMesgs, getFieldVisibility) {
    const fields = getFormatChartFieldsSafe();
    let fieldsToPrewarm = Array.isArray(fields)
        ? fields.filter((field) => (getFieldVisibility(field) || "visible") !== "hidden")
        : [];
    if (!fieldsToPrewarm.length) {
        try {
            const sample = recordMesgs.find((row) => row && typeof row === "object") ??
                {};
            fieldsToPrewarm = Object.keys(sample)
                .filter((key) => key !== "timestamp")
                .filter((key) => typeof getRecordValue(sample, key) === "number");
        }
        catch {
            // Keep empty field list.
        }
    }
    const maxFieldsToPrewarm = MAX_FIELDS_BY_RECORD_COUNT.find(({ minRecords }) => recordMesgs.length >= minRecords)?.maxFields ?? 8;
    const prioritized = [];
    const candidateSet = new Set(fieldsToPrewarm);
    for (const field of PRIORITY_FIELDS) {
        if (candidateSet.has(field)) {
            prioritized.push(field);
            candidateSet.delete(field);
        }
    }
    const remaining = fieldsToPrewarm.filter((field) => candidateSet.has(field));
    return [...prioritized, ...remaining].slice(0, maxFieldsToPrewarm);
}
function isChartsTab(tab) {
    return tab === "chart" || tab === "chartjs";
}
function isNonEmptyRecordArray(recordMesgs) {
    return Array.isArray(recordMesgs) && recordMesgs.length > 0;
}
function waitForNextTask() {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            clearTimeout(timeout);
            resolve();
        }, 0);
    });
}
/**
 * Pre-warms expensive chart label and series caches without touching the DOM.
 *
 * @param params - Cache prewarm parameters.
 * @param dependencies - Runtime chart settings and invalidation hooks.
 * @returns Summary information for debugging.
 */
export async function prewarmChartRenderCaches(params, dependencies) {
    const { reason = "prewarm", recordMesgs, startTime, yieldEvery = 2, } = params;
    if (!isNonEmptyRecordArray(recordMesgs)) {
        return { processedFields: 0, skipped: true };
    }
    const { getState } = getStateManagerSafe();
    if (isChartsTab(getState("ui.activeTab"))) {
        return { processedFields: 0, skipped: true };
    }
    const chartsState = getState("charts");
    if (chartsState &&
        typeof chartsState === "object" &&
        (getRecordValue(chartsState, "isRendered") === true ||
            getRecordValue(chartsState, "isRendering") === true)) {
        return { processedFields: 0, skipped: true };
    }
    const prevSuppress = getNotificationSuppressed();
    setNotificationSuppressed(true);
    try {
        const settings = dependencies.getSettings();
        const normalizedMaxPoints = normalizeMaxPointsValue(getRecordValue(settings, "maxpoints"));
        const dataSettingsSignature = ensureDataSettingsSignature(settings, () => {
            dependencies.invalidateChartRenderCache("data-settings-changed");
        });
        const convert = getConvertersSafe();
        const labels = getLabelsForRecords(recordMesgs, startTime);
        const fieldsToPrewarm = getFieldsToPrewarm(recordMesgs, dependencies.getFieldVisibility);
        if (isDevelopmentEnvironment()) {
            console.log(`${CACHE_LOG_PREFIX} prewarm started (${reason}): ${fieldsToPrewarm.length} fields, ${recordMesgs.length} records`);
        }
        let processedFields = 0;
        for (const field of fieldsToPrewarm) {
            if (isChartsTab(getState("ui.activeTab"))) {
                return { processedFields, skipped: false };
            }
            if (dependencies.getFieldVisibility(field) === "hidden") {
                continue;
            }
            const entry = getFieldSeriesEntry(recordMesgs, field, dataSettingsSignature, convert);
            getCachedSeriesForSettings(entry, labels, normalizedMaxPoints);
            processedFields += 1;
            if (yieldEvery > 0 && processedFields % yieldEvery === 0) {
                await waitForNextTask();
            }
        }
        if (isDevelopmentEnvironment()) {
            console.log(`${CACHE_LOG_PREFIX} prewarm complete (${reason}): processedFields=${processedFields}`);
        }
        return { processedFields, skipped: false };
    }
    catch (error) {
        console.warn(`${CACHE_LOG_PREFIX} prewarm failed (${reason})`, error);
        return { processedFields: 0, skipped: false };
    }
    finally {
        setNotificationSuppressed(prevSuppress);
    }
}
