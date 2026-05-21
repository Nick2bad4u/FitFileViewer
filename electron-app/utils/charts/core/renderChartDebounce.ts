/** Function returned by debounce with an explicit pending-call cancel hook. */
export type DebouncedFunction<Arguments extends readonly unknown[]> = ((
    ...args: Arguments
) => void) & {
    cancel: () => void;
};

/** Returns a function that invokes callback only after calls stop for waitMs. */
export function debounce<Arguments extends readonly unknown[]>(
    callback: (...args: Arguments) => void,
    waitMs: number
): DebouncedFunction<Arguments> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const debounced = ((...args: Arguments) => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            timeoutId = undefined;
            callback(...args);
        }, waitMs);
    }) as DebouncedFunction<Arguments>;

    debounced.cancel = () => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    };

    return debounced;
}
