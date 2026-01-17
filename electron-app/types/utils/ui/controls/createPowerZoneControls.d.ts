/**
 * Creates the power zone controls section by extracting existing controls
 * @param {HTMLElement} parentContainer - Parent container to append controls to
 * @returns {HTMLElement} The created power zone controls section
 */
export function createPowerZoneControls(parentContainer: HTMLElement): HTMLElement;
/**
 * Gets current power zone chart visibility settings
 * @returns {Object} Visibility settings for power zone charts
 */
export function getPowerZoneVisibilitySettings(): Object;
/**
 * Moves existing power zone controls to the dedicated power zone section
 * This should be called after the field toggles are created
 */
export function movePowerZoneControlsToSection(): void;
/**
 * Updates power zone controls visibility based on data availability
 * @param {boolean} hasData - Whether power zone data is available
 */
export function updatePowerZoneControlsVisibility(hasData: boolean): void;
