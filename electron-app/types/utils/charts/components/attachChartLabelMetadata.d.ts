/**
 * @typedef {Object} ChartLabelMetadata
 * @property {string} [titleIcon]
 * @property {string} [titleText]
 * @property {string} [titleColor]
 * @property {string} [xIcon]
 * @property {string} [xText]
 * @property {string} [xColor]
 * @property {string} [yIcon]
 * @property {string} [yText]
 * @property {string} [yColor]
 */
/**
 * Persists icon and label metadata on a chart canvas so downstream UI enhancers can build overlays.
 * @param {HTMLCanvasElement} canvas
 * @param {ChartLabelMetadata} metadata
 */
export function attachChartLabelMetadata(canvas: HTMLCanvasElement, metadata: ChartLabelMetadata): void;
export type ChartLabelMetadata = {
    titleIcon?: string;
    titleText?: string;
    titleColor?: string;
    xIcon?: string;
    xText?: string;
    xColor?: string;
    yIcon?: string;
    yText?: string;
    yColor?: string;
};
//# sourceMappingURL=attachChartLabelMetadata.d.ts.map