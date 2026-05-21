const CACHE_LOG_PREFIX = "[ChartJS Cache]";
/**
 * Creates the chart render cache manager used by renderChartJS orchestration.
 *
 * @param dependencies - Cache stores, listener registry, and environment hooks.
 *
 * @returns Cache invalidation and signature helper facade.
 */
export function createChartRenderCacheManager(dependencies) {
    const invalidateChartRenderCache = (reason = "manual") => {
        if (dependencies.isDevelopmentEnvironment()) {
            console.log(`${CACHE_LOG_PREFIX} invalidated: ${reason}`);
        }
        dependencies.clearChartSeriesCache();
        dependencies.clearChartLabelsCache();
        dependencies.clearPerformanceSettingsCache();
        dependencies.clearDataSettingsSignatureCache();
        dependencies.notifyInvalidateChartRenderCacheListeners(
            reason,
            CACHE_LOG_PREFIX
        );
    };
    return {
        addInvalidateChartRenderCacheListener(listener) {
            return dependencies.addInvalidateChartRenderCacheListener(listener);
        },
        ensureDataSettingsSignature(settings) {
            return dependencies.ensureDataSettingsSignature(settings, () => {
                invalidateChartRenderCache("data-settings-changed");
            });
        },
        getChartSeriesCacheStats() {
            return dependencies.getChartSeriesCacheStats();
        },
        invalidateChartRenderCache,
    };
}
