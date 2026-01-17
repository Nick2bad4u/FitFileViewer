/**
 * Renders all data tables from the provided dataFrames object into the specified container.
 *
 * - Uses Arquero (window.aq) to convert arrays to tables.
 * - Renders each table using renderTable().
 * - 'recordMesgs' is always rendered first, then other tables alphabetically.
 *
 * @param {Object} dataFrames - An object where each key is a table name and the value is an array of row objects.
 * @param {HTMLElement} [containerOverride] - Optional container element to render tables into. Defaults to element with id 'content-data'.
 *
 * Note: The `renderTable` function receives an additional `index` parameter, which represents the order of the table being rendered.
 */
export function createTables(dataFrames: Object, containerOverride?: HTMLElement): void;
