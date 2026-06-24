export type RenderChartTimeout = ReturnType<typeof globalThis.setTimeout>;

export interface RenderChartTimerRuntimeScope {
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface RenderChartTimerRuntime {
    clearTimeout: (timeout: RenderChartTimeout) => void;
    dateNow: () => number;
    setTimeout: (callback: () => void, delay: number) => RenderChartTimeout;
    wait: (delay: number) => Promise<void>;
    waitForNextTask: () => Promise<void>;
}

const defaultRenderChartTimerRuntimeScope: RenderChartTimerRuntimeScope = {
    getClearTimeout: () => globalThis.clearTimeout,
    getDateNow: () => Date.now,
    getSetTimeout: () => globalThis.setTimeout,
};

export function getRenderChartTimerRuntime(
    scope: RenderChartTimerRuntimeScope = defaultRenderChartTimerRuntimeScope
): RenderChartTimerRuntime {
    const clearScheduledTimeout = (timeout: RenderChartTimeout): void => {
        const clearTimeout = scope.getClearTimeout?.();
        if (typeof clearTimeout !== "function") {
            throw new TypeError("render chart timers require clearTimeout");
        }

        clearTimeout(timeout);
    };

    const dateNow = (): number => {
        const dateNowRef = scope.getDateNow?.();
        if (typeof dateNowRef !== "function") {
            throw new TypeError("render chart timers require dateNow");
        }

        return dateNowRef();
    };

    const scheduleTimeout = (
        callback: () => void,
        delay: number
    ): RenderChartTimeout => {
        const setTimeout = scope.getSetTimeout?.();
        if (typeof setTimeout !== "function") {
            throw new TypeError("render chart timers require setTimeout");
        }

        return setTimeout(callback, delay);
    };

    const wait = async (delay: number): Promise<void> => {
        let timeoutId: RenderChartTimeout | undefined;

        try {
            await new Promise<void>((resolve) => {
                timeoutId = scheduleTimeout(() => {
                    timeoutId = undefined;
                    resolve();
                }, delay);
            });
        } finally {
            if (timeoutId !== undefined) {
                clearScheduledTimeout(timeoutId);
                timeoutId = undefined;
            }
        }
    };

    return {
        clearTimeout: clearScheduledTimeout,
        dateNow,
        setTimeout: scheduleTimeout,
        wait,
        waitForNextTask: () => wait(0),
    };
}
