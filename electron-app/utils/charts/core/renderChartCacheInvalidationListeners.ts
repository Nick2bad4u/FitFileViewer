/** Listener called after chart render caches are invalidated. */
export type ChartCacheInvalidationListener = (reason: string) => void;

const invalidateChartRenderCacheListeners =
    new Set<ChartCacheInvalidationListener>();

/** Registers a chart render cache invalidation listener. */
export function addInvalidateChartRenderCacheListener(
    listener: unknown
): () => void {
    if (typeof listener !== "function") {
        return () => {};
    }

    const typedListener = listener as ChartCacheInvalidationListener;
    invalidateChartRenderCacheListeners.add(typedListener);

    return () => {
        invalidateChartRenderCacheListeners.delete(typedListener);
    };
}

/** Notifies all registered chart render cache invalidation listeners. */
export function notifyInvalidateChartRenderCacheListeners(
    reason: string,
    logPrefix = "[ChartJS Cache]"
): void {
    for (const listener of invalidateChartRenderCacheListeners) {
        try {
            listener(reason);
        } catch (error) {
            console.warn(`${logPrefix} listener error`, error);
        }
    }
}
