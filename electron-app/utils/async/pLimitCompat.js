/**
 * @fileoverview Minimal p-limit compatible concurrency limiter.
 *
 * Why this exists:
 * - The upstream `p-limit@7` requires Node >= 20.
 * - FitFileViewer still targets a Windows 7 build via Electron 22 (Node 16).
 *
 * This implementation provides the subset we use:
 * - `pLimit(concurrency)` returns a `limit(fn)` function
 * - `limit(fn)` runs `fn` with a maximum number of concurrent executions
 *
 * It is intentionally tiny, dependency-free, and works in both browser and Node runtimes.
 */

/**
 * @template T
 * @typedef {() => Promise<T>} AsyncFactory
 */

/**
 * @template T
 * @param {number} concurrency
 * @returns {(factory: AsyncFactory<T>) => Promise<T>}
 */
export default function pLimitCompat(concurrency) {
    const safeConcurrency = Number.isFinite(concurrency) && concurrency > 0 ? Math.floor(concurrency) : 1;

    /** @type {Array<() => void>} */
    const queue = [];
    let activeCount = 0;

    const next = () => {
        if (activeCount >= safeConcurrency) {
            return;
        }
        const run = queue.shift();
        if (!run) {
            return;
        }
        run();
    };

    /**
     * @template R
     * @param {AsyncFactory<R>} factory
     * @returns {Promise<R>}
     */
    const limit = (factory) =>
        new Promise((resolve, reject) => {
            /**
             * @returns {void}
             */
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

    return limit;
}
