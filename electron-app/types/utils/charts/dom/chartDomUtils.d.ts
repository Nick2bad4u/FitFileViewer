export function getChartContentContainer(
    doc: Document | ParentNode | null | undefined
): HTMLElement | null;

export function getChartRenderContainer(
    doc: Document | ParentNode | null | undefined
): HTMLElement | null;

export function getChartBackgroundContainer(
    doc: Document | ParentNode | null | undefined
): HTMLElement | null;

export function getChartSettingsWrapper(
    doc: Document | ParentNode | null | undefined
): HTMLElement | null;

export function getChartControlsToggle(
    doc: Document | ParentNode | null | undefined
): HTMLElement | null;

export function resolveChartContainer(
    doc: Document | ParentNode | null | undefined,
    targetContainer?: Element | string | null
): HTMLElement | null;

export const CHART_DOM_IDS: {
    backgroundContainer: string;
    contentContainers: string[];
    controlsToggleSelector: string;
    renderContainers: string[];
    settingsWrapperSelector: string;
};
