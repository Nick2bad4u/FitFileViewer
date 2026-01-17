/**
 * Creates and wires the static DOM structure for the data point filter control.
 *
 * @param {number} instanceId Unique identifier for this control instance.
 * @returns {{
 *   container: HTMLDivElement;
 *   panel: HTMLDivElement;
 *   toggleButton: HTMLButtonElement;
 *   summary: HTMLParagraphElement;
 *   metricSelect: HTMLSelectElement;
 *   percentInput: HTMLInputElement;
 *   rangeSliderMin: HTMLInputElement;
 *   rangeSliderMax: HTMLInputElement;
 *   rangeValueDisplay: HTMLDivElement;
 *   topPercentRadio: HTMLInputElement;
 *   rangeRadio: HTMLInputElement;
 *   percentGroup: HTMLDivElement;
 *   rangeGroup: HTMLDivElement;
 *   topPercentOption: HTMLLabelElement;
 *   rangeOption: HTMLLabelElement;
 *   applyButton: HTMLButtonElement;
 *   resetButton: HTMLButtonElement;
 *   ids: {
 *     modeRadioName: string;
 *   };
 * }}
 */
export function createFilterControlElements(instanceId: number): {
    container: HTMLDivElement;
    panel: HTMLDivElement;
    toggleButton: HTMLButtonElement;
    summary: HTMLParagraphElement;
    metricSelect: HTMLSelectElement;
    percentInput: HTMLInputElement;
    rangeSliderMin: HTMLInputElement;
    rangeSliderMax: HTMLInputElement;
    rangeValueDisplay: HTMLDivElement;
    topPercentRadio: HTMLInputElement;
    rangeRadio: HTMLInputElement;
    percentGroup: HTMLDivElement;
    rangeGroup: HTMLDivElement;
    topPercentOption: HTMLLabelElement;
    rangeOption: HTMLLabelElement;
    applyButton: HTMLButtonElement;
    resetButton: HTMLButtonElement;
    ids: {
        modeRadioName: string;
    };
};
