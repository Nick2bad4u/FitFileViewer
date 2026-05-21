import type { ChartCacheInvalidationListener } from "./renderChartCacheInvalidationListeners.js";
import type { ChartRenderCacheManager } from "./renderChartCacheManager.js";
import type {
    ChartCachePrewarmDependencies,
    PrewarmChartRenderCachesParams,
    PrewarmChartRenderCachesResult,
} from "./renderChartCachePrewarm.js";

type ChartSettingsManagerForCache = {
    getFieldVisibility(field: string): unknown;
    getSettings(): unknown;
};

type PrewarmChartRenderCaches = (
    params: PrewarmChartRenderCachesParams,
    dependencies: ChartCachePrewarmDependencies
) => Promise<PrewarmChartRenderCachesResult>;

interface CreateChartRenderCacheApiDependencies {
    chartRenderCacheManager: ChartRenderCacheManager;
    chartSettingsManager: ChartSettingsManagerForCache;
    prewarmChartRenderCaches: PrewarmChartRenderCaches;
}

/** Public cache facade exported through renderChartJS. */
export interface ChartRenderCacheApi {
    addInvalidateChartRenderCacheListener(
        listener: ChartCacheInvalidationListener
    ): () => void;
    ensureDataSettingsSignature(settings: unknown): string;
    getChartSeriesCacheStats(): unknown;
    invalidateChartRenderCache(reason?: string): void;
    prewarmChartRenderCaches(
        params: PrewarmChartRenderCachesParams
    ): Promise<PrewarmChartRenderCachesResult>;
}

/**
 * Creates the public cache API exported by renderChartJS.
 *
 * @param dependencies - Cache manager, settings manager, and prewarm worker.
 * @returns Cache facade preserving the renderChartJS public API.
 */
export function createChartRenderCacheApi(
    dependencies: CreateChartRenderCacheApiDependencies
): ChartRenderCacheApi {
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
