import {
    getRenderChartTimerRuntime,
    type RenderChartTimerRuntime,
    type RenderChartTimeout,
} from "./renderChartTimerRuntime.js";

/** Function returned by debounce with an explicit pending-call cancel hook. */
export type DebouncedFunction<Arguments extends readonly unknown[]> = ((
    ...args: Arguments
) => void) & {
    cancel: () => void;
};

/** Returns a function that invokes callback only after calls stop for waitMs. */
export function debounce<Arguments extends readonly unknown[]>(
    callback: (...args: Arguments) => void,
    waitMs: number,
    runtime: RenderChartTimerRuntime = getRenderChartTimerRuntime()
): DebouncedFunction<Arguments> {
    let timeoutId: RenderChartTimeout | undefined;

    const debounced = ((...args: Arguments) => {
        if (timeoutId !== undefined) {
            runtime.clearTimeout(timeoutId);
        }

        timeoutId = runtime.setTimeout(() => {
            timeoutId = undefined;
            callback(...args);
        }, waitMs);
    }) as DebouncedFunction<Arguments>;

    debounced.cancel = () => {
        if (timeoutId !== undefined) {
            runtime.clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    };

    return debounced;
}
