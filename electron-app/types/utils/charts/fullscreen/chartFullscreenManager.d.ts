/**
 * Enter fullscreen mode for the chart wrapper.
 * @param {HTMLElement} wrapper
 * @param {{title?: string, onEnter?: () => void, onExit?: () => void}} [options]
 */
export function enterChartFullscreen(wrapper: HTMLElement, options?: {
    title?: string;
    onEnter?: () => void;
    onExit?: () => void;
}): void;
/**
 * Exit fullscreen mode if active.
 */
export function exitChartFullscreen(): void;
/**
 * Check if any chart is currently in fullscreen.
 * @param {HTMLElement} [wrapper]
 * @returns {boolean}
 */
export function isChartFullscreenActive(wrapper?: HTMLElement): boolean;
/**
 * Subscribe to fullscreen state changes.
 * @param {(state: {active: boolean, wrapper: HTMLElement|null}) => void} listener
 * @returns {() => void} Cleanup function.
 */
export function subscribeToChartFullscreen(listener: (state: {
    active: boolean;
    wrapper: HTMLElement | null;
}) => void): () => void;
/**
 * Toggle fullscreen for the provided wrapper element.
 * @param {HTMLElement} wrapper
 * @param {{title?: string, onEnter?: () => void, onExit?: () => void}} [options]
 */
export function toggleChartFullscreen(wrapper: HTMLElement, options?: {
    title?: string;
    onEnter?: () => void;
    onExit?: () => void;
}): void;
//# sourceMappingURL=chartFullscreenManager.d.ts.map