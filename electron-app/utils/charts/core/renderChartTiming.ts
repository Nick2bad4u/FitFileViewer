import {
    getRenderChartTimerRuntime,
    type RenderChartTimerRuntime,
} from "./renderChartTimerRuntime.js";

/** Minimum time between direct chart render attempts. */
export const RENDER_DEBOUNCE_MS = 200;

interface RenderTimingGate {
    waitIfRapidRender(): Promise<void>;
}

/**
 * Creates a stateful timing gate for rapid render calls.
 *
 * @param waitMs - Minimum interval before calls are treated as non-rapid.
 *
 * @returns Render timing gate.
 */
export function createRenderTimingGate(
    waitMs = RENDER_DEBOUNCE_MS,
    runtime: RenderChartTimerRuntime = getRenderChartTimerRuntime()
): RenderTimingGate {
    let lastRenderTime = 0;

    return {
        async waitIfRapidRender() {
            const now = runtime.dateNow();
            const elapsed = now - lastRenderTime;
            lastRenderTime = now;
            if (elapsed < waitMs) {
                console.log("[ChartJS] Debouncing rapid render calls");
                await runtime.wait(waitMs);
            }
        },
    };
}
