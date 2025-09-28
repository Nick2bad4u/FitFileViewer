/**
 * Clears all saved zone color data for a specific field
 * @param {string} field - Chart field
 * @param {number} zoneCount - Number of zones
 */
export function clearZoneColorData(field: string, zoneCount: number): void;
/**
 * Creates an inline zone color selector
 * @param {string} field - The chart field (e.g., "hr_zone", "power_zone")
 * @param {HTMLElement} container - Container to append the selector to
 * @returns {HTMLElement} The created selector element
 */
/**
 * @typedef {Object} ZoneDataItem
 * @property {string} [label]
 * @property {number} [zone]
 * @property {number} [time]
 * @property {number} [value]
 * @property {string} [color]
 */
/**
 * @param {string} field
 * @param {HTMLElement} container
 */
export function createInlineZoneColorSelector(field: string, container: HTMLElement): HTMLDivElement | null;
/**
 * Gets the current color scheme for a field
 * @param {string} field - Chart field
 * @returns {string} Current color scheme ("custom", "classic", "vibrant", "monochrome")
 */
export function getCurrentColorScheme(field: string): string;
/**
 * Removes existing inline zone color selectors from a container
 * @param {HTMLElement} container - Container to clean up
 */
export function removeInlineZoneColorSelectors(container: HTMLElement): void;
/**
 * Updates all inline zone color selectors in a container
 * @param {HTMLElement} container - Container with selectors
 */
export function updateInlineZoneColorSelectors(container: HTMLElement): void;
export type ZoneDataItem = {
    label?: string;
    zone?: number;
    time?: number;
    value?: number;
    color?: string;
};
//# sourceMappingURL=createInlineZoneColorSelector.d.ts.map