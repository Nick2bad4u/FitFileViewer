/** Point count above which Chart.js decimation and span-gap tuning are enabled. */
export const DECIMATION_THRESHOLD = 2500;

/** Target maximum x-axis tick sample size before reducing tick calculations. */
export const MAX_TICK_TARGET = 600;

type ChartSettings = {
    readonly chartType?: unknown;
};

type DecimationSettings =
    | {
          readonly enabled: false;
      }
    | {
          readonly algorithm: "min-max";
          readonly enabled: true;
          readonly samples: number;
          readonly threshold: number;
      };

/** Performance-related Chart.js options derived from data size and chart type. */
export type ChartPerformanceSettings = {
    readonly decimation: DecimationSettings;
    readonly enableSpanGaps: boolean;
    readonly tickSampleSize: number | undefined;
};

const performanceSettingsCache = new Map<string, ChartPerformanceSettings>();

function getChartTypeSetting(
    settings: ChartSettings | null | undefined
): string {
    return typeof settings?.chartType === "string"
        ? settings.chartType
        : "line";
}

/** Clears cached chart performance settings after data or settings changes. */
export function clearPerformanceSettingsCache(): void {
    performanceSettingsCache.clear();
}

/** Resolves performance tuning options for a chart render. */
export function resolvePerformanceSettings(
    totalPoints: number,
    settings: ChartSettings | null | undefined,
    dataSettingsSignature: string
): ChartPerformanceSettings {
    const chartType = getChartTypeSetting(settings);
    const key = `${totalPoints}|${chartType}|${dataSettingsSignature}`;
    const cached = performanceSettingsCache.get(key);
    if (cached) {
        return cached;
    }

    const allowDecimation =
        [
            "area",
            "line",
            "radar",
        ].includes(chartType) &&
        totalPoints > DECIMATION_THRESHOLD;

    const decimation: DecimationSettings = allowDecimation
        ? {
              algorithm: "min-max",
              enabled: true,
              samples: 4,
              threshold: 1000,
          }
        : { enabled: false };

    const tickSampleSize =
        totalPoints > MAX_TICK_TARGET
            ? Math.ceil(totalPoints / MAX_TICK_TARGET)
            : undefined;
    const enableSpanGaps = totalPoints > DECIMATION_THRESHOLD;

    const result = { decimation, enableSpanGaps, tickSampleSize };
    performanceSettingsCache.set(key, result);

    return result;
}

/** Returns whether a dataset should use Chart.js spanGaps. */
export function shouldUseSpanGaps(
    performanceSettings: ChartPerformanceSettings | null | undefined,
    seriesEntry: { readonly hasNull?: unknown } | null | undefined
): boolean {
    if (!performanceSettings?.enableSpanGaps) {
        return false;
    }

    return Boolean(seriesEntry?.hasNull);
}
