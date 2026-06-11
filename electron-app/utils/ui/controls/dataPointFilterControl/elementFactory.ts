import { MAP_FILTER_METRICS } from "../../../maps/filters/mapMetricFilter.js";
import {
    getDataPointFilterElementFactoryRuntime,
    type DataPointFilterElementFactoryRuntime,
} from "./elementFactoryRuntime.js";

/** Static DOM elements used by the data point filter control controller. */
export interface FilterControlElements {
    applyButton: HTMLButtonElement;
    container: HTMLDivElement;
    ids: {
        modeRadioName: string;
    };
    metricSelect: HTMLSelectElement;
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
}

function createFilterIcon(
    runtime: DataPointFilterElementFactoryRuntime
): SVGSVGElement {
    const icon = runtime.createSvgElement("svg");
    icon.classList.add("icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");

    const path = runtime.createSvgElement("path");
    path.setAttribute("d", "M4 5h16l-6 7v6l-4 2v-8z");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.6");
    path.setAttribute("stroke-linejoin", "round");
    icon.append(path);

    return icon;
}

/** Creates and wires the static DOM structure for the data point filter control. */
export function createFilterControlElements(
    instanceId: number
): FilterControlElements {
    const runtime = getDataPointFilterElementFactoryRuntime();
    const container = runtime.createElement("div");
    container.className = "data-point-filter-control";

    const toggleButton = runtime.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "map-action-btn data-point-filter-control__toggle";
    toggleButton.id = `map-data-point-filter-toggle-${instanceId}`;
    toggleButton.setAttribute("aria-haspopup", "dialog");
    toggleButton.setAttribute("aria-expanded", "false");
    const toggleLabel = runtime.createElement("span");
    toggleLabel.textContent = "Top Metrics";
    toggleButton.append(createFilterIcon(runtime), toggleLabel);

    const panel = runtime.createElement("div");
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

    const metricLabel = runtime.createElement("label");
    metricLabel.textContent = "Metric";
    metricLabel.htmlFor = metricSelectId;

    const metricSelect = runtime.createElement("select");
    metricSelect.id = metricSelectId;
    metricSelect.className = "data-point-filter-control__select";
    for (const metric of MAP_FILTER_METRICS) {
        const option = runtime.createElement("option");
        option.value = metric.key;
        option.textContent = metric.label;
        metricSelect.append(option);
    }

    const metricGroup = runtime.createElement("div");
    metricGroup.className = "data-point-filter-control__group";
    metricGroup.append(metricLabel, metricSelect);

    const modeGroup = runtime.createElement("div");
    modeGroup.className =
        "data-point-filter-control__group data-point-filter-control__group--mode";

    const modeLegend = runtime.createElement("span");
    modeLegend.className = "data-point-filter-control__mode-label";
    modeLegend.textContent = "Filter type";
    modeGroup.append(modeLegend);

    const topPercentRadio = runtime.createElement("input");
    topPercentRadio.type = "radio";
    topPercentRadio.name = modeRadioName;
    topPercentRadio.value = "topPercent";
    topPercentRadio.className = "data-point-filter-control__mode-radio";
    topPercentRadio.id = `map-filter-mode-top-${instanceId}`;

    const topPercentOption = runtime.createElement("label");
    topPercentOption.className = "data-point-filter-control__mode-option";
    topPercentOption.htmlFor = topPercentRadio.id;
    const topPercentLabelText = runtime.createElement("span");
    topPercentLabelText.className = "data-point-filter-control__mode-text";
    topPercentLabelText.textContent = "Top %";
    topPercentOption.append(topPercentRadio, topPercentLabelText);
    modeGroup.append(topPercentOption);

    const rangeRadio = runtime.createElement("input");
    rangeRadio.type = "radio";
    rangeRadio.name = modeRadioName;
    rangeRadio.value = "valueRange";
    rangeRadio.className = "data-point-filter-control__mode-radio";
    rangeRadio.id = `map-filter-mode-range-${instanceId}`;

    const rangeOption = runtime.createElement("label");
    rangeOption.className = "data-point-filter-control__mode-option";
    rangeOption.htmlFor = rangeRadio.id;
    const rangeLabelText = runtime.createElement("span");
    rangeLabelText.className = "data-point-filter-control__mode-text";
    rangeLabelText.textContent = "Value range";
    rangeOption.append(rangeRadio, rangeLabelText);
    modeGroup.append(rangeOption);

    const percentLabel = runtime.createElement("label");
    percentLabel.textContent = "Top %";
    percentLabel.htmlFor = percentInputId;

    const percentInput = runtime.createElement("input");
    percentInput.type = "number";
    percentInput.min = "1";
    percentInput.max = "100";
    percentInput.step = "1";
    percentInput.id = percentInputId;
    percentInput.className = "data-point-filter-control__input";
    percentInput.value = "10";

    const percentGroup = runtime.createElement("div");
    percentGroup.className =
        "data-point-filter-control__group data-point-filter-control__percent";
    percentGroup.append(percentLabel, percentInput);

    const rangeGroup = runtime.createElement("div");
    rangeGroup.className =
        "data-point-filter-control__group data-point-filter-control__range";

    const rangeLabel = runtime.createElement("span");
    rangeLabel.className = "data-point-filter-control__range-label";
    rangeLabel.textContent = "Value range";

    const rangeSliderMin = runtime.createElement("input");
    rangeSliderMin.type = "range";
    rangeSliderMin.id = rangeMinSliderId;
    rangeSliderMin.className = "data-point-filter-control__range-slider";

    const rangeSliderMax = runtime.createElement("input");
    rangeSliderMax.type = "range";
    rangeSliderMax.id = rangeMaxSliderId;
    rangeSliderMax.className = "data-point-filter-control__range-slider";

    const rangeValueDisplay = runtime.createElement("div");
    rangeValueDisplay.className = "data-point-filter-control__range-values";
    rangeValueDisplay.textContent = "Range unavailable";

    rangeGroup.append(
        rangeLabel,
        rangeSliderMin,
        rangeSliderMax,
        rangeValueDisplay
    );

    const summary = runtime.createElement("p");
    summary.className = "data-point-filter-control__summary";
    summary.textContent = "Highlight the most intense sections of your ride.";

    const actions = runtime.createElement("div");
    actions.className = "data-point-filter-control__actions";

    const applyButton = runtime.createElement("button");
    applyButton.type = "button";
    applyButton.className = "data-point-filter-control__apply";
    applyButton.textContent = "Apply";

    const resetButton = runtime.createElement("button");
    resetButton.type = "button";
    resetButton.className = "data-point-filter-control__reset";
    resetButton.textContent = "Clear";

    actions.append(applyButton, resetButton);
    panel.append(
        metricGroup,
        modeGroup,
        percentGroup,
        rangeGroup,
        summary,
        actions
    );

    container.append(toggleButton);

    return {
        container,
        panel,
        toggleButton,
        summary,
        metricSelect,
        percentInput,
        rangeSliderMin,
        rangeSliderMax,
        rangeValueDisplay,
        topPercentRadio,
        rangeRadio,
        percentGroup,
        rangeGroup,
        topPercentOption,
        rangeOption,
        applyButton,
        resetButton,
        ids: {
            modeRadioName,
        },
    };
}
