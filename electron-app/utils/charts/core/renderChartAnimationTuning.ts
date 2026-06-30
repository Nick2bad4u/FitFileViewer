const ESTIMATED_NON_METRIC_CHARTS = 12;

interface ChartAnimationTuning {
    effectiveAnimationStyle: string;
    estimatedChartCount: number;
}

/**
 * Resolves per-render animation tuning without changing persisted settings.
 *
 * @param animationStyle - Configured chart animation style.
 * @param metricChartCount - Number of metric charts expected from record
 *   fields.
 *
 * @returns Effective animation style and estimated total chart count.
 */
export function resolveChartAnimationTuning(
    animationStyle: string,
    metricChartCount: number
): ChartAnimationTuning {
    const estimatedChartCount = metricChartCount + ESTIMATED_NON_METRIC_CHARTS;
    let effectiveAnimationStyle = animationStyle;

    if (animationStyle === "normal" && estimatedChartCount >= 20) {
        effectiveAnimationStyle = "none";
    } else if (animationStyle === "normal" && estimatedChartCount >= 12) {
        effectiveAnimationStyle = "fast";
    }

    return {
        effectiveAnimationStyle,
        estimatedChartCount,
    };
}
