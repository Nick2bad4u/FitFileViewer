/**
 * Creates the public cache API exported by renderChartJS.
 *
 * @param dependencies - Cache manager, settings manager, and prewarm worker.
 *
 * @returns Cache facade preserving the renderChartJS public API.
 */
export function createChartRenderCacheApi(dependencies) {
    const { chartRenderCacheManager, chartSettingsManager } = dependencies;
    const invalidateChartRenderCache = (reason = "manual") => {
        chartRenderCacheManager.invalidateChartRenderCache(reason);
    };
    return {
        addInvalidateChartRenderCacheListener(listener) {
            return chartRenderCacheManager.addInvalidateChartRenderCacheListener(
                listener
            );
        },
        ensureDataSettingsSignature(settings) {
            return chartRenderCacheManager.ensureDataSettingsSignature(
                settings
            );
        },
        getChartSeriesCacheStats() {
            return chartRenderCacheManager.getChartSeriesCacheStats();
        },
        invalidateChartRenderCache,
        prewarmChartRenderCaches(params) {
            return dependencies.prewarmChartRenderCaches(params, {
                getFieldVisibility: (field) =>
                    chartSettingsManager.getFieldVisibility(field),
                getSettings: () => chartSettingsManager.getSettings(),
                invalidateChartRenderCache,
            });
        },
    };
}
