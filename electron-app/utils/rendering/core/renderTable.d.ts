/** Row shape accepted by the legacy raw-data table renderer. */
export type RenderTableRow = Record<string, unknown>;

/** Data wrapper consumed by the legacy raw-data table renderer. */
export type RenderTableData = {
    rows: RenderTableRow[];
};

/** Renders a collapsible raw-data table section into the supplied container. */
export function renderTable(
    container: HTMLElement,
    title: string,
    table: RenderTableData,
    index: number
): void;
