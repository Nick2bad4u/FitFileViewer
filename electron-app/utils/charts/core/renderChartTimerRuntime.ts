export type RenderChartTimeout = ReturnType<typeof globalThis.setTimeout>;

export interface RenderChartTimerRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout;
    readonly setTimeout?: typeof globalThis.setTimeout;
}

export interface RenderChartTimerRuntime {
    clearTimeout: (timeout: RenderChartTimeout) => void;
    setTimeout: (
        callback: () => void,
        delay: number
    ) => RenderChartTimeout;
    wait: (delay: number) => Promise<void>;
    waitForNextTask: () => Promise<void>;
}

const defaultRenderChartTimerRuntimeScope: RenderChartTimerRuntimeScope =
    globalThis;

export function getRenderChartTimerRuntime(
    scope: RenderChartTimerRuntimeScope = defaultRenderChartTimerRuntimeScope
): RenderChartTimerRuntime {
    const clearScheduledTimeout = (timeout: RenderChartTimeout): void => {
        const clearTimeout = scope.clearTimeout;
        if (typeof clearTimeout !== "function") {
            throw new TypeError("render chart timers require clearTimeout");
        }

        clearTimeout(timeout);
    };

    const scheduleTimeout = (
        callback: () => void,
        delay: number
    ): RenderChartTimeout => {
        const setTimeout = scope.setTimeout;
        if (typeof setTimeout !== "function") {
            throw new TypeError("render chart timers require setTimeout");
        }

        return setTimeout(callback, delay);
    };

    const wait = (delay: number): Promise<void> => {
        let timeoutId: RenderChartTimeout | undefined;

        return new Promise<void>((resolve) => {
            timeoutId = scheduleTimeout(() => {
                timeoutId = undefined;
                resolve();
            }, delay);
        }).finally(() => {
            if (timeoutId !== undefined) {
                clearScheduledTimeout(timeoutId);
                timeoutId = undefined;
            }
        });
    };

    return {
        clearTimeout: clearScheduledTimeout,
        setTimeout: scheduleTimeout,
        wait,
        waitForNextTask: () => wait(0),
    };
}
