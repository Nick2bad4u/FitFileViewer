const ESTIMATED_NON_METRIC_CHARTS = 12;
/**
 * Resolves per-render animation tuning without changing persisted settings.
 *
 * @param animationStyle - Configured chart animation style.
 * @param metricChartCount - Number of metric charts expected from record
 *   fields.
 *
 * @returns Effective animation style and estimated total chart count.
 */
export function resolveChartAnimationTuning(animationStyle, metricChartCount) {
    const estimatedChartCount = metricChartCount + ESTIMATED_NON_METRIC_CHARTS;
    const effectiveAnimationStyle =
        animationStyle === "normal" && estimatedChartCount >= 20
            ? "none"
            : animationStyle === "normal" && estimatedChartCount >= 12
              ? "fast"
              : animationStyle;
    return {
        effectiveAnimationStyle,
        estimatedChartCount,
    };
}
