/**
 * Callback invoked with a selected chart instance.
 */
export type ChartSelectionCallback = (chart: unknown) => void;

/**
 * Applies inline styles to the chart settings panel wrapper.
 */
export function applySettingsPanelStyles(wrapper: HTMLElement): void;

/**
 * Creates the chart option controls section inside the settings panel.
 */
export function createControlsSection(wrapper: HTMLElement): void;

/**
 * Creates the chart export controls section inside the settings panel.
 */
export function createExportSection(wrapper: HTMLElement): void;

/**
 * Creates the per-field chart visibility toggles section.
 */
export function createFieldTogglesSection(wrapper: HTMLElement): void;

/**
 * Creates the settings panel header.
 */
export function createSettingsHeader(wrapper: HTMLElement): void;

/**
 * Shows the chart selection modal for export actions.
 */
export function showChartSelectionModal(
    actionType: string,
    singleCallback: ChartSelectionCallback,
    combinedCallback: ChartSelectionCallback
): void;
