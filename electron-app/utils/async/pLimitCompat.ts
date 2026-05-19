/**
 * Minimal p-limit compatible concurrency limiter.
 *
 * The upstream `p-limit@7` requires Node \>= 20. FitFileViewer still keeps
 * legacy Electron/Windows compatibility paths, so this module provides only the
 * subset the app uses: `pLimitCompat(concurrency)` returns a `limit(factory)`
 * function that caps concurrent executions.
 */

type MaybePromise<T> = Promise<T> | T;

/**
 * Factory function scheduled through the concurrency limiter.
 */
export type AsyncFactory<T> = () => MaybePromise<T>;

/**
 * Function returned by the limiter.
 */
export type LimitFunction = <T>(factory: AsyncFactory<T>) => Promise<T>;

/**
 * Create a dependency-free concurrency limiter.
 *
 * @param concurrency - Maximum number of factories to run at once.
 * @returns Function that schedules factories and resolves with their result.
 */
export default function pLimitCompat(concurrency: number): LimitFunction {
    const safeConcurrency =
        Number.isFinite(concurrency) && concurrency > 0
            ? Math.floor(concurrency)
            : 1;

    const queue: Array<() => void> = [];
    let activeCount = 0;

    const next = (): void => {
        if (activeCount >= safeConcurrency) {
            return;
        }

        const run = queue.shift();
        if (run === undefined) {
            return;
        }

        run();
    };

    return <T>(factory: AsyncFactory<T>): Promise<T> =>
        new Promise<T>((resolve, reject) => {
            const execute = (): void => {
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
