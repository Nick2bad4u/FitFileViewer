/** Minimum time between direct chart render attempts. */
export const RENDER_DEBOUNCE_MS = 200;
function wait(waitMs) {
    let timeoutId;
    return new Promise((resolve) => {
        timeoutId = setTimeout(() => {
            timeoutId = undefined;
            resolve();
        }, waitMs);
    }).finally(() => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    });
}
/**
 * Creates a stateful timing gate for rapid render calls.
 *
 * @param waitMs - Minimum interval before calls are treated as non-rapid.
 *
 * @returns Render timing gate.
 */
export function createRenderTimingGate(waitMs = RENDER_DEBOUNCE_MS) {
    let lastRenderTime = 0;
    return {
        async waitIfRapidRender() {
            const now = Date.now();
            if (now - lastRenderTime < waitMs) {
                console.log("[ChartJS] Debouncing rapid render calls");
                await wait(waitMs);
            }
            lastRenderTime = Date.now();
        },
    };
}
