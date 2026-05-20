/**
 * Clears all saved zone color data for a specific field.
 */
export function clearZoneColorData(field: string, zoneCount: number): void;

/**
 * Creates an inline zone color selector for a zone chart field.
 */
export function createInlineZoneColorSelector(
    field: string,
    container: HTMLElement
): HTMLElement | null;

/**
 * Gets the current color scheme for a zone chart field.
 */
export function getCurrentColorScheme(field: string): string;

/**
 * Removes inline zone color selectors from a container.
 */
export function removeInlineZoneColorSelectors(container: HTMLElement): void;

/**
 * Updates inline zone color selectors in a container.
 */
export function updateInlineZoneColorSelectors(container: HTMLElement): void;
