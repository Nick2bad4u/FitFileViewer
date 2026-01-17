/**
 * Creates the heart rate zone controls section by extracting existing controls
 * @param {HTMLElement} parentContainer - Parent container to append controls to
 * @returns {HTMLElement} The created heart rate zone controls section
 */
export function createHRZoneControls(parentContainer: HTMLElement): HTMLElement;
/**
 * Gets current heart rate zone chart visibility settings
 * @returns {Object} Visibility settings for HR zone charts
 */
export function getHRZoneVisibilitySettings(): Object;
/**
 * Moves existing heart rate zone controls to the dedicated HR zone section
 * This should be called after the field toggles are created
 */
export function moveHRZoneControlsToSection(): void;
/**
 * Updates HR zone controls visibility based on data availability
 * @param {boolean} hasData - Whether HR zone data is available
 */
export function updateHRZoneControlsVisibility(hasData: boolean): void;
