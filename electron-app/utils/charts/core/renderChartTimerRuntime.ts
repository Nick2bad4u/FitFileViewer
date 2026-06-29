import {
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type RenderChartTimeout = BrowserTimerHandle;

export interface RenderChartTimerRuntimeScope {
    readonly getClearTimeout: RenderChartTimerRuntimeProvider<BrowserClearTimeout>;
    readonly getDateNow: RenderChartTimerRuntimeProvider<() => number>;
    readonly getSetTimeout: RenderChartTimerRuntimeProvider<BrowserSetTimeout>;
}

export interface RenderChartTimerRuntime {
    clearTimeout: (timeout: RenderChartTimeout) => void;
    dateNow: () => number;
    setTimeout: (callback: () => void, delay: number) => RenderChartTimeout;
    wait: (delay: number) => Promise<void>;
    waitForNextTask: () => Promise<void>;
}

type RenderChartTimerRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultRenderChartTimerRuntimeScope: RenderChartTimerRuntimeScope = {
    getClearTimeout: getBrowserClearTimeout,
    getDateNow: getBrowserDateNow,
    getSetTimeout: getBrowserSetTimeout,
};

export function getRenderChartTimerRuntime(
    scope: RenderChartTimerRuntimeScope = defaultRenderChartTimerRuntimeScope
): RenderChartTimerRuntime {
    const getClearTimeout = getRequiredProvider(
        scope.getClearTimeout,
        "clearTimeout"
    );
    const getDateNow = getRequiredProvider(scope.getDateNow, "dateNow");
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    );

    const clearScheduledTimeout = (timeout: RenderChartTimeout): void => {
        const clearTimeout = getClearTimeout();
        if (typeof clearTimeout !== "function") {
            throw new TypeError("render chart timers require clearTimeout");
        }

        clearTimeout(timeout);
    };

    const dateNow = (): number => {
        const dateNowRef = getDateNow();
        if (typeof dateNowRef !== "function") {
            throw new TypeError("render chart timers require dateNow");
        }

        return dateNowRef();
    };

    const scheduleTimeout = (
        callback: () => void,
        delay: number
    ): RenderChartTimeout => {
        const setTimeout = getSetTimeout();
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

function getRequiredProvider<T>(
    provider: RenderChartTimerRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `render chart timers require a ${providerName} provider`
        );
    }

    return provider;
}
