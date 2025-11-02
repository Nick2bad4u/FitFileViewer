import { MAP_FILTER_METRICS } from "../../maps/filters/mapMetricFilter.js";

/**
 * Build the DOM structure for the data point filter control.
 * @param {number} instanceId
 * @returns {{
 *  applyButton: HTMLButtonElement;
 *  container: HTMLDivElement;
 *  panel: HTMLDivElement;
 *  percentGroup: HTMLDivElement;
 *  percentInput: HTMLInputElement;
 *  rangeGroup: HTMLDivElement;
 *  rangeOption: HTMLLabelElement;
 *  rangeRadio: HTMLInputElement;
 *  rangeSliderMax: HTMLInputElement;
 *  rangeSliderMin: HTMLInputElement;
 *  rangeValueDisplay: HTMLDivElement;
 *  resetButton: HTMLButtonElement;
 *  summary: HTMLParagraphElement;
 *  toggleButton: HTMLButtonElement;
 *  topPercentOption: HTMLLabelElement;
 *  topPercentRadio: HTMLInputElement;
 *  metricSelect: HTMLSelectElement;
 * }}
 */
export function buildDataPointFilterControlElements(instanceId) {
    const container = document.createElement("div");
    container.className = "data-point-filter-control";

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "map-action-btn data-point-filter-control__toggle";
    toggleButton.id = `map-data-point-filter-toggle-${instanceId}`;
    toggleButton.setAttribute("aria-haspopup", "dialog");
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M4 5h16l-6 7v6l-4 2v-8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
        </svg>
        <span>Top Metrics</span>
    `;

    const panel = document.createElement("div");
    panel.className = "data-point-filter-control__panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Filter map data points");
    panel.setAttribute("aria-labelledby", toggleButton.id);
    panel.hidden = true;
    const panelId = `map-data-point-filter-panel-${instanceId}`;
    panel.id = panelId;
    toggleButton.setAttribute("aria-controls", panelId);

    const metricSelectId = `map-filter-metric-${instanceId}`;
    const percentInputId = `map-filter-percent-${instanceId}`;
    const rangeMinSliderId = `map-filter-range-min-${instanceId}`;
    const rangeMaxSliderId = `map-filter-range-max-${instanceId}`;
    const modeRadioName = `map-filter-mode-${instanceId}`;

    const metricLabel = document.createElement("label");
    metricLabel.textContent = "Metric";
    metricLabel.htmlFor = metricSelectId;

    const metricSelect = document.createElement("select");
    metricSelect.id = metricSelectId;
    metricSelect.className = "data-point-filter-control__select";
    for (const metric of MAP_FILTER_METRICS) {
        const option = document.createElement("option");
        option.value = metric.key;
        option.textContent = metric.label;
        metricSelect.append(option);
    }

    const metricGroup = document.createElement("div");
    metricGroup.className = "data-point-filter-control__group";
    metricGroup.append(metricLabel, metricSelect);

    const modeGroup = document.createElement("div");
    modeGroup.className = "data-point-filter-control__group data-point-filter-control__group--mode";

    const modeLegend = document.createElement("span");
    modeLegend.className = "data-point-filter-control__mode-label";
    modeLegend.textContent = "Filter type";
    modeGroup.append(modeLegend);

    const topPercentRadio = document.createElement("input");
    topPercentRadio.type = "radio";
    topPercentRadio.name = modeRadioName;
    topPercentRadio.value = "topPercent";
    topPercentRadio.className = "data-point-filter-control__mode-radio";
    topPercentRadio.id = `map-filter-mode-top-${instanceId}`;

    const topPercentOption = document.createElement("label");
    topPercentOption.className = "data-point-filter-control__mode-option";
    topPercentOption.htmlFor = topPercentRadio.id;
    const topPercentLabelText = document.createElement("span");
    topPercentLabelText.className = "data-point-filter-control__mode-text";
    topPercentLabelText.textContent = "Top %";
    topPercentOption.append(topPercentRadio, topPercentLabelText);
    modeGroup.append(topPercentOption);

    const rangeRadio = document.createElement("input");
    rangeRadio.type = "radio";
    rangeRadio.name = modeRadioName;
    rangeRadio.value = "valueRange";
    rangeRadio.className = "data-point-filter-control__mode-radio";
    rangeRadio.id = `map-filter-mode-range-${instanceId}`;

    const rangeOption = document.createElement("label");
    rangeOption.className = "data-point-filter-control__mode-option";
    rangeOption.htmlFor = rangeRadio.id;
    const rangeLabelText = document.createElement("span");
    rangeLabelText.className = "data-point-filter-control__mode-text";
    rangeLabelText.textContent = "Value range";
    rangeOption.append(rangeRadio, rangeLabelText);
    modeGroup.append(rangeOption);

    const percentLabel = document.createElement("label");
    percentLabel.textContent = "Top %";
    percentLabel.htmlFor = percentInputId;

    const percentInput = document.createElement("input");
    percentInput.type = "number";
    percentInput.min = "1";
    percentInput.max = "100";
    percentInput.step = "1";
    percentInput.id = percentInputId;
    percentInput.className = "data-point-filter-control__input";
    percentInput.value = "10";

    const percentGroup = document.createElement("div");
    percentGroup.className = "data-point-filter-control__group data-point-filter-control__percent";
    percentGroup.append(percentLabel, percentInput);

    const rangeGroup = document.createElement("div");
    rangeGroup.className = "data-point-filter-control__group data-point-filter-control__range";

    const rangeLabel = document.createElement("span");
    rangeLabel.className = "data-point-filter-control__range-label";
    rangeLabel.textContent = "Value range";

    const rangeSliderMin = document.createElement("input");
    rangeSliderMin.type = "range";
    rangeSliderMin.id = rangeMinSliderId;
    rangeSliderMin.className = "data-point-filter-control__range-slider";

    const rangeSliderMax = document.createElement("input");
    rangeSliderMax.type = "range";
    rangeSliderMax.id = rangeMaxSliderId;
    rangeSliderMax.className = "data-point-filter-control__range-slider";

    const rangeValueDisplay = document.createElement("div");
    rangeValueDisplay.className = "data-point-filter-control__range-values";
    rangeValueDisplay.textContent = "Range unavailable";

    rangeGroup.append(rangeLabel, rangeSliderMin, rangeSliderMax, rangeValueDisplay);

    const summary = document.createElement("p");
    summary.className = "data-point-filter-control__summary";
    summary.textContent = "Highlight the most intense sections of your ride.";

    const actions = document.createElement("div");
    actions.className = "data-point-filter-control__actions";

    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.className = "data-point-filter-control__apply";
    applyButton.textContent = "Apply";

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "data-point-filter-control__reset";
    resetButton.textContent = "Clear";

    actions.append(applyButton, resetButton);
    panel.append(metricGroup, modeGroup, percentGroup, rangeGroup, summary, actions);

    container.append(toggleButton);

    return {
        applyButton,
        container,
        panel,
        percentGroup,
        percentInput,
        rangeGroup,
        rangeOption,
        rangeRadio,
        rangeSliderMax,
        rangeSliderMin,
        rangeValueDisplay,
        resetButton,
        summary,
        toggleButton,
        topPercentOption,
        topPercentRadio,
        metricSelect,
    };
}
