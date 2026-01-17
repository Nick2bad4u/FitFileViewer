/**
 * Force update all chart theme elements
 * @param {HTMLElement} chartsContainer - The container holding all charts
 * @param {HTMLElement} settingsContainer - The settings panel container
 */
export function forceUpdateChartTheme(chartsContainer: HTMLElement, settingsContainer: HTMLElement): void;
/**
 * Remove theme change listener
 */
export function removeChartThemeListener(): void;
/**
 * Set up theme change listener for charts
 * @param {HTMLElement} chartsContainer - The container holding all charts
 * @param {HTMLElement} settingsContainer - The settings panel container
 */
export function setupChartThemeListener(chartsContainer: HTMLElement, settingsContainer: HTMLElement): void;
export type ThemeChangeEvent = CustomEvent & {
    detail: {
        theme?: string;
    };
};
