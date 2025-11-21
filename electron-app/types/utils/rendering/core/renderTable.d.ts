/**
 * Renders a collapsible table section with a header, copy-to-CSV button, and optional DataTables integration.
 *
 * @param {HTMLElement} container - The DOM element to which the table section will be appended.
 * @param {string} title - The title to display in the table header.
 * @param {Object} table - The table object with a `toHTML({ limit })` method for rendering HTML.
 * @param {number} index - A unique index used to generate element IDs for the table and its content.
 *
 * @example
 * renderTable(document.body, 'My Table', myTableObject, 0);
 */
export function renderTable(container: HTMLElement, title: string, table: Object, index: number): void;
//# sourceMappingURL=renderTable.d.ts.map
