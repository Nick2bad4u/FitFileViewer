/** Returns a function that invokes callback only after calls stop for waitMs. */
export function debounce(callback, waitMs) {
    let timeoutId;
    const debounced = (...args) => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            timeoutId = undefined;
            callback(...args);
        }, waitMs);
    };
    debounced.cancel = () => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    };
    return debounced;
}
