/* eslint-disable max-lines --
 * TODO(#ui-filter-modularization): The data point filter control is scheduled for modularization into smaller
 * focused modules (state, DOM wiring, and persistence). Until that refactor lands, we suppress the max-lines rule to
 * keep lint passing without introducing noisy, interim splits that would be discarded during the planned redesign.
 */
/**
 * Creates a map control for filtering markers by top metric percentiles.
 */

import {
    computeMetricStatistics,
    createMetricFilter,
    MAP_FILTER_METRICS,
} from "../../maps/filters/mapMetricFilter.js";
import { showNotification } from "../notifications/showNotification.js";

let filterControlInstance = 0;

/**
 * @typedef {import("../../maps/filters/mapMetricFilter.js").MapDataPointFilterConfig} MapDataPointFilterConfig
 */

/**
 * @param {(payload:{ action:"apply"|"clear"; config:MapDataPointFilterConfig; result?:import("../../maps/filters/mapMetricFilter.js").MetricFilterResult; })=>void} [onFilterChange]
 * @returns {HTMLDivElement}
 */
export function createDataPointFilterControl(onFilterChange) {
    filterControlInstance += 1;
    const instanceId = filterControlInstance;
    const container = document.createElement("div");
    container.className = "data-point-filter-control";

    const scheduleMicrotask =
        typeof queueMicrotask === "function" ? queueMicrotask : (callback) => Promise.resolve().then(callback);

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

    const viewportPadding = 16;
    let pendingFrame = 0;

    const initialConfig = resolveInitialConfig(metricSelect.value, percentInput.value);
    metricSelect.value = initialConfig.metric;
    percentInput.value = String(initialConfig.percent ?? 10);

    let currentMode = initialConfig.mode === "valueRange" ? "valueRange" : "topPercent";
    let currentStats = null;
    let currentRangeValues = {
        max: typeof initialConfig.maxValue === "number" ? initialConfig.maxValue : undefined,
        min: typeof initialConfig.minValue === "number" ? initialConfig.minValue : undefined,
    };

    topPercentRadio.checked = currentMode === "topPercent";
    rangeRadio.checked = currentMode === "valueRange";

    updateModeVisibility();
    updateModeSelectionState();
    updateRangeStats({ preserveSelection: true });

    if (!globalThis.mapDataPointFilter) {
        updateGlobalFilter(initialConfig);
    }

    if (initialConfig.enabled) {
        const preview = previewFilterResult(initialConfig);
        const text = buildSummaryText(preview, initialConfig);
        if (text) {
            summary.textContent = text;
        }
    }

    metricSelect.addEventListener("change", () => {
        currentRangeValues = { min: undefined, max: undefined };
        updateRangeStats({ preserveSelection: false });
        scheduleMicrotask(() => refreshSummary());
    });

    toggleButton.addEventListener("click", () => {
        if (panel.hidden) {
            openPanel();
        } else {
            closePanel();
        }
    });

    function handleOutsideClick(event) {
        const target = event.target instanceof Node ? event.target : null;
        if (!panel.hidden && target && !container.contains(target) && !panel.contains(target)) {
            closePanel();
        }
    }

    function ensurePanelAttached() {
        const { body } = document;
        if (body && panel.parentElement !== body) {
            body.append(panel);
            return;
        }
        if (!body && !panel.parentElement) {
            container.append(panel);
        }
    }

    function openPanel() {
        if (!panel.hidden) {
            return;
        }
        ensurePanelAttached();
        cancelAnimationFrame(pendingFrame);
        pendingFrame = 0;
        panel.hidden = false;
        panel.style.opacity = "0";
        panel.style.pointerEvents = "none";
        container.classList.add("data-point-filter-control--open");
        toggleButton.setAttribute("aria-expanded", "true");
        document.addEventListener("mousedown", handleOutsideClick, true);
        window.addEventListener("resize", handleViewportResize);
        window.addEventListener("scroll", handleViewportScroll, true);
        requestAnimationFrame(() => {
            repositionPanel();
            panel.style.opacity = "";
            panel.style.pointerEvents = "";
            metricSelect.focus();
        });
    }

    topPercentRadio.addEventListener("change", () => {
        if (!topPercentRadio.checked) {
            return;
        }
        currentMode = "topPercent";
        rangeRadio.checked = false;
        updateModeVisibility();
        updateModeSelectionState();
        scheduleMicrotask(() => refreshSummary());
    });

    rangeRadio.addEventListener("change", () => {
        if (!rangeRadio.checked) {
            return;
        }
        currentMode = "valueRange";
        topPercentRadio.checked = false;
        updateModeVisibility();
        updateModeSelectionState();
        updateRangeStats({ preserveSelection: true });
        scheduleMicrotask(() => refreshSummary());
    });

    const handleRangeMinInput = () => {
        if (currentMode !== "valueRange") {
            currentMode = "valueRange";
            rangeRadio.checked = true;
            topPercentRadio.checked = false;
            updateModeVisibility();
            updateModeSelectionState();
        }
        syncRangeSlider("min");
    };

    const handleRangeMaxInput = () => {
        if (currentMode !== "valueRange") {
            currentMode = "valueRange";
            rangeRadio.checked = true;
            topPercentRadio.checked = false;
            updateModeVisibility();
            updateModeSelectionState();
        }
        syncRangeSlider("max");
    };

    rangeSliderMin.addEventListener("input", handleRangeMinInput);
    rangeSliderMin.addEventListener("change", handleRangeMinInput);
    rangeSliderMax.addEventListener("input", handleRangeMaxInput);
    rangeSliderMax.addEventListener("change", handleRangeMaxInput);

    percentInput.addEventListener("change", () => {
        const percentValue = clampPercent(Number.parseInt(percentInput.value, 10));
        percentInput.value = String(percentValue);
    });

    applyButton.addEventListener("click", () => {
        const metricKey = metricSelect.value;

        if (currentMode === "valueRange") {
            if (!currentStats) {
                showNotification("No data points available for that metric.", "info");
                return;
            }

            const minValue = clampRangeValue(currentRangeValues.min ?? currentStats.min, currentStats);
            const maxValue = clampRangeValue(currentRangeValues.max ?? currentStats.max, currentStats);

            const config = {
                enabled: true,
                maxValue,
                metric: metricKey,
                minValue,
                mode: "valueRange",
            };

            const preview = previewFilterResult(config);
            const shouldEnable = preview && preview.isActive && !preview.reason && preview.selectedCount > 0;

            if (!shouldEnable) {
                updateGlobalFilter({ ...config, enabled: false });
                if (preview?.reason) {
                    showNotification(preview.reason, "info");
                    summary.textContent = preview.reason;
                } else {
                    showNotification("No data points available for that range.", "info");
                    summary.textContent = "Filter disabled due to insufficient data.";
                }
                notifyChange("clear", config, preview);
                return;
            }

            currentRangeValues = {
                min: clampRangeValue(preview.appliedMin ?? minValue, currentStats),
                max: clampRangeValue(preview.appliedMax ?? maxValue, currentStats),
            };

            updateGlobalFilter(config);
            closePanel();
            const summaryText = buildSummaryText(preview, config);
            if (summaryText) {
                summary.textContent = summaryText;
            }
            const minLabel = formatMetricValue(currentRangeValues.min ?? minValue);
            const maxLabel = formatMetricValue(currentRangeValues.max ?? maxValue);
            const coverage = formatPercent(preview.percent ?? 0);
            showNotification(
                `Showing ${preview.metricLabel ?? preview.metric} between ${minLabel} and ${maxLabel} (${coverage}% coverage)`,
                "success"
            );
            notifyChange("apply", config, preview);
            return;
        }

        const percentValue = clampPercent(Number.parseInt(percentInput.value, 10));
        percentInput.value = String(percentValue);

        const config = {
            enabled: true,
            metric: metricKey,
            mode: "topPercent",
            percent: percentValue,
        };

        const preview = previewFilterResult(config);
        const shouldEnable = preview && preview.isActive && !preview.reason && preview.selectedCount > 0;

        if (!shouldEnable) {
            updateGlobalFilter({ ...config, enabled: false });
            if (preview?.reason) {
                showNotification(preview.reason, "info");
                summary.textContent = preview.reason;
            } else {
                showNotification("No data points available for that metric.", "info");
                summary.textContent = "Filter disabled due to insufficient data.";
            }
            notifyChange("clear", config, preview);
            return;
        }

        updateGlobalFilter(config);
        closePanel();
        const summaryText = buildSummaryText(preview, config);
        if (summaryText) {
            summary.textContent = summaryText;
        }
        showNotification(`Showing top ${percentValue}% ${preview.metricLabel} data points`, "success");
        notifyChange("apply", config, preview);
    });

    resetButton.addEventListener("click", () => {
        const metricKey = metricSelect.value;
        let clearedConfig;

        if (currentMode === "valueRange") {
            if (currentStats) {
                const minValue = clampRangeValue(currentRangeValues.min ?? currentStats.min, currentStats);
                const maxValue = clampRangeValue(currentRangeValues.max ?? currentStats.max, currentStats);
                clearedConfig = {
                    enabled: false,
                    maxValue,
                    metric: metricKey,
                    minValue,
                    mode: "valueRange",
                };
            } else {
                clearedConfig = {
                    enabled: false,
                    metric: metricKey,
                    mode: "valueRange",
                };
            }
        } else {
            const percentValue = clampPercent(Number.parseInt(percentInput.value, 10));
            percentInput.value = String(percentValue);
            clearedConfig = {
                enabled: false,
                metric: metricKey,
                mode: "topPercent",
                percent: percentValue,
            };
        }
        updateGlobalFilter(clearedConfig);
        closePanel();
        summary.textContent = "Metric filtering disabled.";
        showNotification("Map metric filtering cleared", "info");
        notifyChange("clear", clearedConfig);
    });

    function updateModeVisibility() {
        const isRange = currentMode === "valueRange";
        percentGroup.style.display = isRange ? "none" : "";
        percentGroup.setAttribute("aria-hidden", isRange ? "true" : "false");
        rangeGroup.style.display = isRange ? "" : "none";
        rangeGroup.setAttribute("aria-hidden", isRange ? "false" : "true");
    }

    function updateModeSelectionState() {
        topPercentOption.dataset.checked = topPercentRadio.checked ? "true" : "false";
        rangeOption.dataset.checked = rangeRadio.checked ? "true" : "false";
    }

    /**
     * @param {"min"|"max"} source
     */
    function syncRangeSlider(source) {
        if (!currentStats) {
            return;
        }
        let minValue = Number(rangeSliderMin.value);
        let maxValue = Number(rangeSliderMax.value);
        if (!Number.isFinite(minValue)) {
            minValue = currentStats.min;
        }
        if (!Number.isFinite(maxValue)) {
            maxValue = currentStats.max;
        }
        if (minValue > maxValue) {
            if (source === "min") {
                maxValue = minValue;
                rangeSliderMax.value = toSliderString(maxValue, currentStats.decimals);
            } else {
                minValue = maxValue;
                rangeSliderMin.value = toSliderString(minValue, currentStats.decimals);
            }
        }
        currentRangeValues = {
            min: clampRangeValue(minValue, currentStats),
            max: clampRangeValue(maxValue, currentStats),
        };
        updateRangeDisplay();
        scheduleMicrotask(() => refreshSummary());
    }

    /**
     * @param {{preserveSelection?:boolean}} [options]
     */
    function updateRangeStats(options = {}) {
        try {
            const globalRecords = Array.isArray(globalThis?.globalData?.recordMesgs)
                ? globalThis.globalData.recordMesgs
                : [];
            const stats = computeMetricStatistics(globalRecords, metricSelect.value);
            currentStats = stats;

            if (!stats) {
                rangeSliderMin.disabled = true;
                rangeSliderMax.disabled = true;
                rangeValueDisplay.textContent = "Range unavailable";
                rangeGroup.dataset.disabled = "true";
                return;
            }

            delete rangeGroup.dataset.disabled;
            rangeSliderMin.disabled = false;
            rangeSliderMax.disabled = false;
            rangeSliderMin.min = rangeSliderMax.min = String(stats.min);
            rangeSliderMin.max = rangeSliderMax.max = String(stats.max);
            rangeSliderMin.step = rangeSliderMax.step = String(stats.step);

            const preserveSelection = Boolean(options?.preserveSelection);
            let minValue = preserveSelection && currentRangeValues.min !== undefined ? currentRangeValues.min : stats.min;
            let maxValue = preserveSelection && currentRangeValues.max !== undefined ? currentRangeValues.max : stats.max;

            minValue = clampRangeValue(minValue, stats);
            maxValue = clampRangeValue(maxValue, stats);
            if (minValue > maxValue) {
                minValue = stats.min;
                maxValue = stats.max;
            }

            currentRangeValues = { min: minValue, max: maxValue };
            rangeSliderMin.value = toSliderString(minValue, stats.decimals);
            rangeSliderMax.value = toSliderString(maxValue, stats.decimals);
            updateRangeDisplay();
        } catch (error) {
            console.error("[dataPointFilter] Failed to compute metric statistics", error);
            currentStats = null;
            rangeSliderMin.disabled = true;
            rangeSliderMax.disabled = true;
            rangeValueDisplay.textContent = "Range unavailable";
            rangeGroup.dataset.disabled = "true";
        }
    }

    function updateRangeDisplay() {
        if (!currentStats) {
            rangeValueDisplay.textContent = "Range unavailable";
            return;
        }
        const minValue = clampRangeValue(currentRangeValues.min ?? currentStats.min, currentStats);
        const maxValue = clampRangeValue(currentRangeValues.max ?? currentStats.max, currentStats);
        rangeValueDisplay.textContent = `${formatMetricValue(minValue)} – ${formatMetricValue(maxValue)} ${
            currentStats.metricLabel
        }`;
    }

    function toSliderString(value, decimals) {
        if (!Number.isFinite(value)) {
            return "0";
        }
        if (decimals > 0) {
            const limited = Math.min(4, Math.max(0, decimals));
            return value.toFixed(limited);
        }
        return String(Math.round(value));
    }

    function clampRangeValue(value, stats) {
        if (!Number.isFinite(value)) {
            return stats.min;
        }
        if (value < stats.min) {
            return stats.min;
        }
        if (value > stats.max) {
            return stats.max;
        }
        return value;
    }

    function formatMetricValue(value, decimalsOverride) {
        const decimalsRaw =
            typeof decimalsOverride === "number"
                ? decimalsOverride
                : currentStats?.decimals ?? (Number.isInteger(value) ? 0 : 2);
        const decimals = Math.min(4, Math.max(0, decimalsRaw));
        const formatter = new Intl.NumberFormat(undefined, {
            maximumFractionDigits: decimals,
            minimumFractionDigits: decimals > 0 ? Math.min(decimals, 2) : 0,
        });
        return formatter.format(value);
    }

    function formatPercent(value) {
        if (!Number.isFinite(value)) {
            return "0";
        }
        const formatter = new Intl.NumberFormat(undefined, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 0,
        });
        return formatter.format(value);
    }

    function buildSummaryText(result, config) {
        if (!result || !result.isActive || result.reason) {
            return null;
        }
        if (result.mode === "valueRange") {
            const appliedMin = result.appliedMin ?? result.minCandidate ?? 0;
            const appliedMax = result.appliedMax ?? result.maxCandidate ?? 0;
            const coverage = formatPercent(result.percent ?? 0);
            return `Showing ${result.selectedCount} of ${result.totalCandidates} points between ${formatMetricValue(
                appliedMin
            )} and ${formatMetricValue(appliedMax)} ${result.metricLabel ?? result.metric} (${coverage}% coverage)`;
        }
        const percentValue = config?.percent ?? result.percent ?? 0;
        return `Showing top ${percentValue}% (${result.selectedCount} of ${result.totalCandidates}) by ${
            result.metricLabel ?? result.metric
        }`;
    }

    container.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !panel.hidden) {
            closePanel();
            toggleButton.focus();
        }
    });

    function notifyChange(action, config, result) {
        if (typeof onFilterChange === "function") {
            onFilterChange({ action, config, result });
        }
        scheduleMicrotask(() => refreshSummary());
    }

    function previewFilterResult(config) {
        try {
            const globalRecords = Array.isArray(globalThis?.globalData?.recordMesgs)
                ? globalThis.globalData.recordMesgs
                : [];
            return createMetricFilter(globalRecords, config);
        } catch (error) {
            console.error("[dataPointFilter] Failed to preview filter result", error);
            return null;
        }
    }

    function closePanel() {
        if (!panel.hidden) {
            panel.hidden = true;
        }
        cancelAnimationFrame(pendingFrame);
        pendingFrame = 0;
        document.removeEventListener("mousedown", handleOutsideClick, true);
        window.removeEventListener("resize", handleViewportResize);
        window.removeEventListener("scroll", handleViewportScroll, true);
        container.classList.remove("data-point-filter-control--open");
        toggleButton.setAttribute("aria-expanded", "false");
        panel.classList.remove("data-point-filter-control__panel--reverse");
        panel.style.left = "";
        panel.style.top = "";
        panel.style.opacity = "";
        panel.style.pointerEvents = "";
        panel.style.removeProperty("--data-point-filter-arrow-offset");
    }

    function repositionPanel() {
        if (panel.hidden) {
            return;
        }
        const buttonRect = toggleButton.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (panelRect.width === 0 || panelRect.height === 0) {
            return;
        }

        const centeredLeft = buttonRect.left + buttonRect.width / 2 - panelRect.width / 2;
        const maxLeft = viewportWidth - panelRect.width - viewportPadding;
        const clampedLeft = Math.max(viewportPadding, Math.min(centeredLeft, Math.max(viewportPadding, maxLeft)));

        let top = buttonRect.bottom + viewportPadding;
        let reverse = false;
        if (top + panelRect.height > viewportHeight - viewportPadding) {
            reverse = true;
            top = Math.max(viewportPadding, buttonRect.top - viewportPadding - panelRect.height);
        }

        panel.classList.toggle("data-point-filter-control__panel--reverse", reverse);
        panel.style.left = `${Math.round(clampedLeft)}px`;
        panel.style.top = `${Math.round(top)}px`;

        const arrowRaw = buttonRect.left + buttonRect.width / 2 - clampedLeft;
        const arrowMin = 14;
        const arrowMax = Math.max(arrowMin, panelRect.width - 14);
        const arrowOffset = Math.max(arrowMin, Math.min(arrowRaw, arrowMax));
        panel.style.setProperty("--data-point-filter-arrow-offset", `${Math.round(arrowOffset)}px`);
    }

    function queueReposition() {
        if (panel.hidden) {
            return;
        }
        cancelAnimationFrame(pendingFrame);
        pendingFrame = requestAnimationFrame(repositionPanel);
    }

    function handleViewportResize() {
        queueReposition();
    }

    function handleViewportScroll() {
        queueReposition();
    }

    function refreshSummary() {
        try {
            const win = /** @type {any} */ (globalThis);
            const last = win.mapDataPointFilterLastResult;
            if (last && last.applied) {
                if (last.mode === "valueRange") {
                    const appliedMin = typeof last.appliedMin === "number" ? last.appliedMin : last.minCandidate ?? 0;
                    const appliedMax = typeof last.appliedMax === "number" ? last.appliedMax : last.maxCandidate ?? 0;
                    const coverageValue =
                        typeof last.coverage === "number" ? last.coverage : typeof last.percent === "number" ? last.percent : 0;
                    summary.textContent = `Showing ${last.selectedCount} of ${last.totalCandidates} points between ${formatMetricValue(
                        appliedMin
                    )} and ${formatMetricValue(appliedMax)} ${last.metricLabel ?? last.metric} (${formatPercent(
                        coverageValue
                    )}% coverage)`;
                } else {
                    summary.textContent = `Showing top ${last.percent}% (${last.selectedCount} of ${last.totalCandidates}) by ${
                        last.metricLabel ?? last.metric
                    }`;
                }
                return;
            }
            if (last && last.reason) {
                summary.textContent = String(last.reason);
                return;
            }
            if (!win.mapDataPointFilter || !win.mapDataPointFilter.enabled) {
                summary.textContent = "Highlight the most intense sections of your ride.";
            }
        } catch {
            /* ignore */
        }
    }

    /** @type {any} */ (container).refreshSummary = refreshSummary;

    return container;
}


/**
 * Clamp a percent value into the 1-100 range accepted by the control.
 * @param {number} value
 * @returns {number}
 */
function clampPercent(value) {
    if (Number.isNaN(value) || value < 1) {
        return 1;
    }
    if (value > 100) {
        return 100;
    }
    return Math.trunc(value);
}

/**
 * Resolve initial control values based on global configuration.
 * @param {string} defaultMetric
 * @param {string} defaultPercent
 * @returns {MapDataPointFilterConfig}
 */
function resolveInitialConfig(defaultMetric, defaultPercent) {
    const win = /** @type {any} */ (globalThis);
    const existing = win.mapDataPointFilter;
    const metricKey = typeof existing?.metric === "string" ? existing.metric : defaultMetric;
    const mode = existing?.mode === "valueRange" ? "valueRange" : "topPercent";
    const percentValue = clampPercent(
        typeof existing?.percent === "number" ? existing.percent : Number.parseInt(defaultPercent, 10) || 10
    );
    const minValue = typeof existing?.minValue === "number" ? existing.minValue : undefined;
    const maxValue = typeof existing?.maxValue === "number" ? existing.maxValue : undefined;
    return {
        enabled: Boolean(existing?.enabled),
        maxValue,
        metric: metricKey,
        minValue,
        mode,
        percent: percentValue,
    };
}

/**
 * Update the shared window-level filter configuration.
 * @param {MapDataPointFilterConfig} config
 * @returns {void}
 */
function updateGlobalFilter(config) {
    const win = /** @type {any} */ (globalThis);
    win.mapDataPointFilter = { ...config };
}
