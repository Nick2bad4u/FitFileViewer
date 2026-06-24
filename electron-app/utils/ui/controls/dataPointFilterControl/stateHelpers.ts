import {
    computeMetricStatistics,
    type MapDataPointFilterConfig,
    type MetricRecord,
    type MetricStatistics,
} from "../../../maps/filters/mapMetricFilter.js";
import {
    getMapDataPointFilter,
    setMapDataPointFilter,
} from "../../../maps/state/mapDataPointFilterState.js";
import { FitFileSelectors } from "../../../state/domain/fitFileState.js";

type RangeValues = {
    readonly max: number;
    readonly min: number;
};

type RangeSliderValues = {
    readonly max: string;
    readonly min: string;
};

type ComputeRangeStateOptions = {
    readonly preserveSelection?: boolean;
};

type ComputedRangeState =
    | {
          readonly rangeValues: null;
          readonly sliderValues: null;
          readonly stats: null;
      }
    | {
          readonly rangeValues: RangeValues;
          readonly sliderValues: RangeSliderValues;
          readonly stats: MetricStatistics;
      };

/** Fully resolved filter configuration stored by the data-point filter UI. */
export type ResolvedDataPointFilterConfig = {
    readonly enabled: boolean;
    readonly maxValue: number | undefined;
    readonly metric: string;
    readonly minValue: number | undefined;
    readonly mode: NonNullable<MapDataPointFilterConfig["mode"]>;
    readonly percent: number;
};

/** Clamps a top-percent filter value to the supported integer range. */
export function clampPercent(value: number): number {
    if (!Number.isFinite(value) || Number.isNaN(value) || value < 1) {
        return 1;
    }
    if (value > 100) {
        return 100;
    }
    return Math.trunc(value);
}

/** Clamps a range endpoint to the available metric statistics. */
export function clampRangeValue(
    value: number,
    stats: Pick<MetricStatistics, "max" | "min">
): number {
    if (!Number.isFinite(value)) {
        return stats.min;
    }
    if (value < stats.min) {
        return stats.min;
    }
    if (value > stats.max) {
        return stats.max;
    }
    return value;
}

/** Computes statistics for the active FIT record set. */
export function computeMetricStats(metricKey: string): MetricStatistics | null {
    const records = getActiveMetricRecords();
    return computeMetricStatistics(records, metricKey);
}

/** Computes the normalized range state used by the filter sliders. */
export function computeRangeState(
    metricKey: string,
    currentRangeValues: RangeValues | null | undefined,
    options: ComputeRangeStateOptions = {}
): ComputedRangeState {
    try {
        const stats = computeMetricStats(metricKey);
        if (!stats) {
            return { stats: null, rangeValues: null, sliderValues: null };
        }

        const preserveSelection = Boolean(options.preserveSelection);
        let minValue =
            preserveSelection && currentRangeValues?.min !== undefined
                ? currentRangeValues.min
                : stats.min;
        let maxValue =
            preserveSelection && currentRangeValues?.max !== undefined
                ? currentRangeValues.max
                : stats.max;

        minValue = clampRangeValue(minValue, stats);
        maxValue = clampRangeValue(maxValue, stats);
        if (minValue > maxValue) {
            minValue = stats.min;
            maxValue = stats.max;
        }

        return {
            stats,
            rangeValues: { min: minValue, max: maxValue },
            sliderValues: {
                min: toSliderString(minValue, stats.decimals),
                max: toSliderString(maxValue, stats.decimals),
            },
        };
    } catch (error) {
        console.error(
            "[dataPointFilter] Failed to compute metric statistics",
            error
        );
        return { stats: null, rangeValues: null, sliderValues: null };
    }
}

/** Formats a metric value with a stable decimal count. */
export function formatMetricValue(
    value: number,
    stats?: Pick<MetricStatistics, "decimals"> | null,
    decimalsOverride?: number
): string {
    const decimalsRaw =
        typeof decimalsOverride === "number"
            ? decimalsOverride
            : (stats?.decimals ?? (Number.isInteger(value) ? 0 : 2));
    const decimals = Math.min(4, Math.max(0, decimalsRaw));
    const formatter = new Intl.NumberFormat(undefined, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals > 0 ? Math.min(decimals, 2) : 0,
    });
    return formatter.format(value);
}

/** Formats a percent value for display. */
export function formatPercent(value: number): string {
    if (!Number.isFinite(value)) {
        return "0";
    }
    const formatter = new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
    });
    return formatter.format(value);
}

/** Reads FIT record messages from managed active FIT state. */
export function getActiveMetricRecords(): MetricRecord[] {
    return FitFileSelectors.getRecordMessages<MetricRecord>();
}

/** Resolves persisted filter settings against UI defaults. */
export function resolveInitialConfig(
    defaultMetric: string,
    defaultPercent: string
): ResolvedDataPointFilterConfig {
    const existing = getMapDataPointFilter<
        Partial<MapDataPointFilterConfig> | ResolvedDataPointFilterConfig
    >();
    const metricKey =
        typeof existing?.metric === "string" ? existing.metric : defaultMetric;
    const mode = existing?.mode === "valueRange" ? "valueRange" : "topPercent";
    const percentValue = clampPercent(
        typeof existing?.percent === "number"
            ? existing.percent
            : Number.parseInt(defaultPercent, 10) || 10
    );
    const minValue =
        typeof existing?.minValue === "number" ? existing.minValue : undefined;
    const maxValue =
        typeof existing?.maxValue === "number" ? existing.maxValue : undefined;
    return {
        enabled: Boolean(existing?.enabled),
        maxValue,
        metric: metricKey,
        minValue,
        mode,
        percent: percentValue,
    };
}

/** Converts a metric value to the exact slider string expected by the UI. */
export function toSliderString(value: number, decimals: number): string {
    if (!Number.isFinite(value)) {
        return "0";
    }
    if (decimals > 0) {
        const limited = Math.min(4, Math.max(0, decimals));
        return value.toFixed(limited);
    }
    return String(Math.round(value));
}

/** Stores the active data-point filter config in typed map filter state. */
export function updateDataPointFilterState(
    config: MapDataPointFilterConfig | ResolvedDataPointFilterConfig
): void {
    setMapDataPointFilter(config);
}
