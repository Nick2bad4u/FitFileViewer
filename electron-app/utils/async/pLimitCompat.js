/**
 * Minimal p-limit compatible concurrency limiter.
 *
 * The upstream `p-limit@7` requires Node \>= 20. FitFileViewer still keeps
 * legacy Electron/Windows compatibility paths, so this module provides only the
 * subset the app uses: `pLimitCompat(concurrency)` returns a `limit(factory)`
 * function that caps concurrent executions.
 */
/**
 * Create a dependency-free concurrency limiter.
 *
 * @param concurrency - Maximum number of factories to run at once.
 * @returns Function that schedules factories and resolves with their result.
 */
export default function pLimitCompat(concurrency) {
    const safeConcurrency = Number.isFinite(concurrency) && concurrency > 0
        ? Math.floor(concurrency)
        : 1;
    const queue = [];
    let activeCount = 0;
    const next = () => {
        if (activeCount >= safeConcurrency) {
            return;
        }
        const run = queue.shift();
        if (run === undefined) {
            return;
        }
        run();
    };
    return (factory) => new Promise((resolve, reject) => {
        const execute = () => {
            activeCount++;
            Promise.resolve()
                .then(factory)
                .then(resolve, reject)
                .finally(() => {
                activeCount--;
                next();
            });
        };
        queue.push(execute);
        next();
    });
}
