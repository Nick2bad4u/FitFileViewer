/**
 * Enhance all chart canvases inside the provided container with rich hover effects.
 * @param {HTMLElement | null} chartContainer
 * @param {{ colors?: Record<string, string> }} [themeConfig]
 */
export function addChartHoverEffects(chartContainer: HTMLElement | null, themeConfig?: {
    colors?: Record<string, string>;
}): void;
/**
 * Convenience helper to enhance the default chart container on demand.
 */
export function addHoverEffectsToExistingCharts(): void;
/**
 * Remove hover effects and restore canvases to their original wrapper-less layout.
 * @param {HTMLElement | null} chartContainer
 */
export function removeChartHoverEffects(chartContainer: HTMLElement | null): void;
//# sourceMappingURL=addChartHoverEffects.d.ts.map