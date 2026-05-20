/**
 * Current visibility state for power zone charts.
 */
export type PowerZoneVisibilitySettings = {
    readonly doughnutVisible: boolean;
    readonly lapIndividualVisible: boolean;
    readonly lapStackedVisible: boolean;
};

/**
 * Creates the power zone controls section.
 */
export function createPowerZoneControls(
    parentContainer: HTMLElement
): HTMLElement;

/**
 * Gets the current power zone chart visibility settings.
 */
export function getPowerZoneVisibilitySettings(): PowerZoneVisibilitySettings;

/**
 * Moves existing power zone field controls into the dedicated section.
 */
export function movePowerZoneControlsToSection(): void;

/**
 * Shows or hides power zone controls based on data availability.
 */
export function updatePowerZoneControlsVisibility(hasData: boolean): void;
