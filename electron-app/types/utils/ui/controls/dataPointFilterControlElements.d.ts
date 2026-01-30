/**
 * Build the DOM structure for the data point filter control.
 *
 * @param {number} instanceId
 *
 * @returns {{
 *     applyButton: HTMLButtonElement;
 *     container: HTMLDivElement;
 *     panel: HTMLDivElement;
 *     percentGroup: HTMLDivElement;
 *     percentInput: HTMLInputElement;
 *     rangeGroup: HTMLDivElement;
 *     rangeOption: HTMLLabelElement;
 *     rangeRadio: HTMLInputElement;
 *     rangeSliderMax: HTMLInputElement;
 *     rangeSliderMin: HTMLInputElement;
 *     rangeValueDisplay: HTMLDivElement;
 *     resetButton: HTMLButtonElement;
 *     summary: HTMLParagraphElement;
 *     toggleButton: HTMLButtonElement;
 *     topPercentOption: HTMLLabelElement;
 *     topPercentRadio: HTMLInputElement;
 *     metricSelect: HTMLSelectElement;
 * }}
 */
export function buildDataPointFilterControlElements(instanceId: number): {
    applyButton: HTMLButtonElement;
    container: HTMLDivElement;
    panel: HTMLDivElement;
    percentGroup: HTMLDivElement;
    percentInput: HTMLInputElement;
    rangeGroup: HTMLDivElement;
    rangeOption: HTMLLabelElement;
    rangeRadio: HTMLInputElement;
    rangeSliderMax: HTMLInputElement;
    rangeSliderMin: HTMLInputElement;
    rangeValueDisplay: HTMLDivElement;
    resetButton: HTMLButtonElement;
    summary: HTMLParagraphElement;
    toggleButton: HTMLButtonElement;
    topPercentOption: HTMLLabelElement;
    topPercentRadio: HTMLInputElement;
    metricSelect: HTMLSelectElement;
};
