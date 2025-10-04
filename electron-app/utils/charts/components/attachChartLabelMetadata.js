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
export function attachChartLabelMetadata(canvas, metadata) {
    if (!(canvas instanceof HTMLCanvasElement)) {
        return;
    }

    const { dataset } = canvas;
    if (!dataset) {
        return;
    }

    const apply = (key, value) => {
        if (typeof value === "string" && value.trim() !== "") {
            dataset[key] = value;
        } else if (key in dataset) {
            delete dataset[key];
        }
    };

    apply("chartTitleIcon", metadata.titleIcon);
    apply("chartTitleText", metadata.titleText);
    apply("chartTitleColor", metadata.titleColor);

    const axisDefaultColor = metadata.titleColor;

    apply("chartXAxisIcon", metadata.xIcon);
    apply("chartXAxisText", metadata.xText);
    apply("chartXAxisColor", metadata.xColor || axisDefaultColor);

    apply("chartYAxisIcon", metadata.yIcon);
    apply("chartYAxisText", metadata.yText);
    apply("chartYAxisColor", metadata.yColor || axisDefaultColor);

    dataset.chartLabelMetadata = "true";
}
