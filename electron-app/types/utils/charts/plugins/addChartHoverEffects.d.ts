/**
 * Adds fancy hover effects to chart canvases to match the info box styling
 * @param {HTMLElement} chartContainer - Container with chart canvases
 * @param {Object} themeConfig - Theme configuration object
 */
/**
 * @param {HTMLElement} chartContainer
 * @param {{ colors: { [k:string]: string, border?:string, surface?:string, shadowLight?:string, primaryShadowLight?:string, primary?:string, accent?:string, textPrimary?:string, shadow?:string, primaryShadowHeavy?:string, surfaceSecondary?:string } }} themeConfig
 */
export function addChartHoverEffects(chartContainer: HTMLElement, themeConfig: {
    colors: {
        [k: string]: string;
        border?: string;
        surface?: string;
        shadowLight?: string;
        primaryShadowLight?: string;
        primary?: string;
        accent?: string;
        textPrimary?: string;
        shadow?: string;
        primaryShadowHeavy?: string;
        surfaceSecondary?: string;
    };
}): void;
export function addHoverEffectsToExistingCharts(): void; /**
 * Development helper function to manually add hover effects to existing charts
 * This can be called from the browser console for testing
 */
/**
 * Removes hover effects from chart containers (cleanup function)
 * @param {HTMLElement} chartContainer - Container with chart canvases
 */
export function removeChartHoverEffects(chartContainer: HTMLElement): void;
//# sourceMappingURL=addChartHoverEffects.d.ts.map