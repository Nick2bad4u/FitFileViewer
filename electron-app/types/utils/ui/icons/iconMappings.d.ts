/**
 * Creates an Iconify web component element sized for inline use.
 * @param {string | null | undefined} iconName
 * @param {number} [size=18]
 * @returns {HTMLElement}
 */
export function createIconElement(iconName: string | null | undefined, size?: number): HTMLElement;
/**
 * Builds an axis label prefixed with a related emoji when available.
 * @param {string | null | undefined} keyword
 * @param {string} label
 * @returns {string}
 */
export function getAxisLabelWithEmoji(keyword: string | null | undefined, label: string): string;
/**
 * Resolves an emoji for a chart or metric key.
 * @param {string | null | undefined} identifier
 * @returns {string}
 */
export function getChartEmoji(identifier: string | null | undefined): string;
/**
 * Resolves an icon identifier for a chart or metric key.
 * @param {string | null | undefined} identifier
 * @returns {string}
 */
export function getChartIcon(identifier: string | null | undefined): string;
/**
 * Builds a chart title prefixed with an emoji when available.
 * @param {string | null | undefined} fieldKey
 * @param {string | null | undefined} fallbackLabel
 * @returns {string}
 */
export function getChartTitleWithEmoji(fieldKey: string | null | undefined, fallbackLabel: string | null | undefined): string;
/**
 * Returns the icon identifier for a FIT message table section.
 * @param {string | null | undefined} key
 * @returns {string}
 */
export function getDataTableIcon(key: string | null | undefined): string;
/**
 * Returns a human readable label for a field key using shared formatting.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function getHumanizedLabel(value: string | null | undefined): string;
/**
 * Resolves the emoji best matching a summary metric.
 * @param {string | null | undefined} key
 * @returns {string}
 */
export function getSummaryEmoji(key: string | null | undefined): string;
/**
 * Resolves the primary summary icon for a labeled metric.
 * @param {string | null | undefined} key
 * @returns {string}
 */
export function getSummaryIcon(key: string | null | undefined): string;
/**
 * Resolves the emoji used for heart-rate and power zone charts.
 * @param {string | null | undefined} chartId
 * @returns {string}
 */
export function getZoneChartEmoji(chartId: string | null | undefined): string;
/**
 * Resolves the icon used for heart-rate and power zone charts.
 * @param {string | null | undefined} chartId
 * @returns {string}
 */
export function getZoneChartIcon(chartId: string | null | undefined): string;
//# sourceMappingURL=iconMappings.d.ts.map