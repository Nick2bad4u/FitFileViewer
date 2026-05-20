export function getChartBackgroundContainer(
    doc: Document | null | undefined
): HTMLElement | null;

export function getChartContentContainer(
    doc: Document | ParentNode | null | undefined
): HTMLElement | null;

export function getChartRenderContainer(
    doc: Document | ParentNode | null | undefined
): HTMLElement | null;

export function getChartControlsToggle(
    doc: Document | null | undefined
): HTMLElement | null;

export function getChartSettingsWrapper(
    doc: Document | null | undefined
): HTMLElement | null;

export function resolveChartContainer(
    doc: Document | null | undefined,
    targetContainer?: Element | null | string
): HTMLElement | null;

/** Stable chart DOM identifiers used by chart container lookup helpers. */
export const CHART_DOM_IDS: {
    readonly backgroundContainer: string;
    readonly contentContainers: readonly string[];
    readonly controlsToggleSelector: string;
    readonly renderContainers: readonly string[];
    readonly settingsWrapperSelector: string;
};
