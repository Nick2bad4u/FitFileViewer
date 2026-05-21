const invalidateChartRenderCacheListeners = new Set();
/** Registers a chart render cache invalidation listener. */
export function addInvalidateChartRenderCacheListener(listener) {
    if (typeof listener !== "function") {
        return () => {};
    }
    const typedListener = listener;
    invalidateChartRenderCacheListeners.add(typedListener);
    return () => {
        invalidateChartRenderCacheListeners.delete(typedListener);
    };
}
/** Notifies all registered chart render cache invalidation listeners. */
export function notifyInvalidateChartRenderCacheListeners(
    reason,
    logPrefix = "[ChartJS Cache]"
) {
    for (const listener of invalidateChartRenderCacheListeners) {
        try {
            listener(reason);
        } catch (error) {
            console.warn(`${logPrefix} listener error`, error);
        }
    }
}
