import {
    getRendererActiveTab,
    isRendererChartTab,
} from "../../state/domain/rendererActiveTabState.js";
import { getLabelsForRecords } from "./renderChartLabelCache.js";
import { getRecordValue, isObjectRecord } from "./renderChartModuleHelpers.js";
import {
    isNonEmptyChartDataRecordArray,
    type ActivityStartTime,
    type ChartDataRecord,
} from "./renderChartDataPreparation.js";
import {
    getNotificationSuppressed,
    setNotificationSuppressed,
} from "./renderChartNotificationHelpers.js";
import { isRendererChartRenderBusy } from "../../state/domain/rendererChartRenderState.js";
import { normalizeMaxPointsValue } from "./renderChartPointUtils.js";
import {
    getCachedSeriesForSettings,
    getFieldSeriesEntry,
} from "./renderChartSeriesCache.js";
import {
    getConvertersSafe,
    getFormatChartFieldsSafe,
} from "./renderChartDependencyAccessors.js";
import { isDevelopmentEnvironment } from "./renderChartRuntimeHelpers.js";
import { ensureDataSettingsSignature } from "./renderChartDataSettingsCache.js";
import {
    getRenderChartTimerRuntime,
    type RenderChartTimerRuntime,
} from "./renderChartTimerRuntime.js";

const CACHE_LOG_PREFIX = "[ChartJS Cache]";
const MAX_FIELDS_BY_RECORD_COUNT = [
    { maxFields: 2, minRecords: 250_000 },
    { maxFields: 4, minRecords: 120_000 },
    { maxFields: 6, minRecords: 60_000 },
] as const;
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
] as const;

/** Dependencies supplied by the chart orchestration module. */
export interface ChartCachePrewarmDependencies {
    getFieldVisibility(field: string): unknown;
    getSettings(): unknown;
    invalidateChartRenderCache(reason: string): void;
}

/** Parameters for prewarming chart render caches. */
export interface PrewarmChartRenderCachesParams {
    reason?: string;
    recordMesgs: unknown;
    startTime: ActivityStartTime;
    yieldEvery?: number;
}

/** Summary of cache prewarm work. */
export interface PrewarmChartRenderCachesResult {
    processedFields: number;
    skipped: boolean;
}

function getFieldsToPrewarm(
    recordMesgs: readonly ChartDataRecord[],
    getFieldVisibility: (field: string) => unknown
): string[] {
    const fields = getFormatChartFieldsSafe();
    let fieldsToPrewarm = fields.filter((field) => {
        const visibility = getFieldVisibility(field);
        return (
            (typeof visibility === "string" ? visibility : "visible") !==
            "hidden"
        );
    });

    if (fieldsToPrewarm.length === 0) {
        try {
            const sample = recordMesgs.find(isObjectRecord) ?? {};
            fieldsToPrewarm = Object.keys(sample)
                .filter((key) => key !== "timestamp")
                .filter(
                    (key) => typeof getRecordValue(sample, key) === "number"
                );
        } catch {
            // Keep empty field list.
        }
    }

    const maxFieldsToPrewarm =
        MAX_FIELDS_BY_RECORD_COUNT.find(
            ({ minRecords }) => recordMesgs.length >= minRecords
        )?.maxFields ?? 8;

    const prioritized: string[] = [];
    const candidateSet = new Set(fieldsToPrewarm);
    for (const field of PRIORITY_FIELDS) {
        if (candidateSet.has(field)) {
            prioritized.push(field);
            candidateSet.delete(field);
        }
    }

    const remaining = fieldsToPrewarm.filter((field) =>
        candidateSet.has(field)
    );
    return [...prioritized, ...remaining].slice(0, maxFieldsToPrewarm);
}

interface PrewarmFieldProcessingInput {
    convert: (value: number, field: string) => number;
    dataSettingsSignature: string;
    fieldsToPrewarm: readonly string[];
    getActiveTab(): unknown;
    getFieldVisibility(field: string): unknown;
    labels: readonly unknown[];
    normalizedMaxPoints: ReturnType<typeof normalizeMaxPointsValue>;
    processedFields: number;
    recordMesgs: readonly ChartDataRecord[];
    startIndex: number;
    timerRuntime: RenderChartTimerRuntime;
    yieldEvery: number;
}

async function processPrewarmFieldChunk(
    input: PrewarmFieldProcessingInput
): Promise<number> {
    const chunkSize =
        input.yieldEvery > 0 ? input.yieldEvery : input.fieldsToPrewarm.length;
    const endIndex = Math.min(
        input.fieldsToPrewarm.length,
        input.startIndex + chunkSize
    );
    let processedFields = input.processedFields;

    for (const field of input.fieldsToPrewarm.slice(
        input.startIndex,
        endIndex
    )) {
        if (isRendererChartTab(input.getActiveTab())) {
            return processedFields;
        }

        if (input.getFieldVisibility(field) === "hidden") {
            continue;
        }

        const entry = getFieldSeriesEntry(
            input.recordMesgs,
            field,
            input.dataSettingsSignature,
            input.convert
        );
        getCachedSeriesForSettings(
            entry,
            input.labels,
            input.normalizedMaxPoints
        );

        processedFields += 1;
    }

    if (endIndex >= input.fieldsToPrewarm.length) {
        return processedFields;
    }

    await input.timerRuntime.waitForNextTask();
    return processPrewarmFieldChunk({
        ...input,
        processedFields,
        startIndex: endIndex,
    });
}

/**
 * Pre-warms expensive chart label and series caches without touching the DOM.
 *
 * @param params - Cache prewarm parameters.
 * @param dependencies - Runtime chart settings and invalidation hooks.
 *
 * @returns Summary information for debugging.
 */
export async function prewarmChartRenderCaches(
    params: PrewarmChartRenderCachesParams,
    dependencies: ChartCachePrewarmDependencies,
    timerRuntime: RenderChartTimerRuntime = getRenderChartTimerRuntime()
): Promise<PrewarmChartRenderCachesResult> {
    const {
        reason = "prewarm",
        recordMesgs,
        startTime,
        yieldEvery = 2,
    } = params;

    if (!isNonEmptyChartDataRecordArray(recordMesgs)) {
        return { processedFields: 0, skipped: true };
    }

    if (isRendererChartTab(getRendererActiveTab())) {
        return { processedFields: 0, skipped: true };
    }

    if (isRendererChartRenderBusy()) {
        return { processedFields: 0, skipped: true };
    }

    const prevSuppress = getNotificationSuppressed();
    setNotificationSuppressed(true);

    try {
        const settings = dependencies.getSettings();
        const normalizedMaxPoints = normalizeMaxPointsValue(
            getRecordValue(settings, "maxpoints")
        );
        const dataSettingsSignature = ensureDataSettingsSignature(
            settings,
            () => {
                dependencies.invalidateChartRenderCache(
                    "data-settings-changed"
                );
            }
        );
        const convert = getConvertersSafe();
        const labels = getLabelsForRecords(recordMesgs, startTime);
        const fieldsToPrewarm = getFieldsToPrewarm(recordMesgs, (field) =>
            dependencies.getFieldVisibility(field)
        );

        if (isDevelopmentEnvironment()) {
            console.log(
                `${CACHE_LOG_PREFIX} prewarm started (${reason}): ${fieldsToPrewarm.length} fields, ${recordMesgs.length} records`
            );
        }

        const processedFields = await processPrewarmFieldChunk({
            convert,
            dataSettingsSignature,
            fieldsToPrewarm,
            getActiveTab: getRendererActiveTab,
            getFieldVisibility: (field) =>
                dependencies.getFieldVisibility(field),
            labels,
            normalizedMaxPoints,
            processedFields: 0,
            recordMesgs,
            startIndex: 0,
            timerRuntime,
            yieldEvery,
        });

        if (isDevelopmentEnvironment()) {
            console.log(
                `${CACHE_LOG_PREFIX} prewarm complete (${reason}): processedFields=${processedFields}`
            );
        }

        return { processedFields, skipped: false };
    } catch (error) {
        console.warn(`${CACHE_LOG_PREFIX} prewarm failed (${reason})`, error);
        return { processedFields: 0, skipped: false };
    } finally {
        setNotificationSuppressed(prevSuppress);
    }
}
