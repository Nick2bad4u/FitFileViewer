/**
 * Current visibility state for heart rate zone charts.
 */
export type HRZoneVisibilitySettings = {
    readonly doughnutVisible: boolean;
    readonly lapIndividualVisible: boolean;
    readonly lapStackedVisible: boolean;
};

/**
 * Creates the heart rate zone controls section.
 */
export function createHRZoneControls(
    parentContainer: HTMLElement
): HTMLElement;

/**
 * Gets the current heart rate zone chart visibility settings.
 */
export function getHRZoneVisibilitySettings(): HRZoneVisibilitySettings;

/**
 * Moves existing heart rate zone field controls into the dedicated section.
 */
export function moveHRZoneControlsToSection(): void;

/**
 * Shows or hides heart rate zone controls based on data availability.
 */
export function updateHRZoneControlsVisibility(hasData: boolean): void;
