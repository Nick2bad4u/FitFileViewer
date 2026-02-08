import { MAP_FILTER_METRICS } from "../../maps/filters/mapMetricFilter.js";
import { showNotification } from "../notifications/showNotification.js";
import { createFilterControlElements } from "./dataPointFilterControl/elementFactory.js";
import {
    buildSummaryText,
    previewFilterResult,
} from "./dataPointFilterControl/metricsPreview.js";
import { createPanelController } from "./dataPointFilterControl/panelController.js";
import {
    clampPercent,
    clampRangeValue,
    computeMetricStats,
    computeRangeState,
    formatMetricValue,
    formatPercent,
    resolveInitialConfig,
    toSliderString,
    updateGlobalFilter,
} from "./dataPointFilterControl/stateHelpers.js";
import { createSummaryRefresher } from "./dataPointFilterControl/summaryRefresher.js";

let filterControlInstance = 0;

/**
 * @typedef {import("../../maps/filters/mapMetricFilter.js").MapDataPointFilterConfig} MapDataPointFilterConfig
 */

/**
 * @param {(payload: {
 *     action: "apply" | "clear";
 *     config: MapDataPointFilterConfig;
 *     result?: import("../../maps/filters/mapMetricFilter.js").MetricFilterResult;
 * }) => void} [onFilterChange]
 *
 * @returns {HTMLDivElement}
 */
export function createDataPointFilterControl(onFilterChange) {
    filterControlInstance += 1;
    const instanceId = filterControlInstance;

    const {
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
    } = createFilterControlElements(instanceId);

    const scheduleMicrotask =
        typeof queueMicrotask === "function"
            ? queueMicrotask
            : (callback) => Promise.resolve().then(callback);

    const viewportPadding = 16;
    const { closePanel, openPanel } = createPanelController({
        container,
        metricSelect,
        panel,
        toggleButton,
        viewportPadding,
    });

    /** @type {Map<string, ReturnType<typeof computeMetricStats>>} */
    const metricStatsCache = new Map();

    /**
     * Resolve cached stats for a metric key to avoid repeated scans.
     *
     * @param {string} metricKey
     *
     * @returns {ReturnType<typeof computeMetricStats>}
     */
    const getMetricStats = (metricKey) => {
        if (metricStatsCache.has(metricKey)) {
            return metricStatsCache.get(metricKey);
        }
        const stats = computeMetricStats(metricKey);
        metricStatsCache.set(metricKey, stats);
        return stats;
    };

    /**
     * Determine if a metric has data available for this file.
     *
     * NOTE: Do not exclude all-zero metrics here. Some files legitimately have
     * constant values (e.g., stationary rides or flat altitude), and users
     * still expect those metrics to appear in the selector.
     *
     * @param {string} metricKey
     *
     * @returns {boolean}
     */
    const isMetricAvailable = (metricKey) => {
        const stats = getMetricStats(metricKey);
        return Boolean(
            stats && Number.isFinite(stats.count) && stats.count > 0
        );
    };

    const availableMetrics = MAP_FILTER_METRICS.filter((metric) =>
        isMetricAvailable(metric.key)
    );
    metricSelect.replaceChildren();

    if (availableMetrics.length === 0) {
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = "No metrics available";
        emptyOption.disabled = true;
        emptyOption.selected = true;
        metricSelect.append(emptyOption);
        metricSelect.disabled = true;
        toggleButton.disabled = true;
        applyButton.disabled = true;
        resetButton.disabled = true;
        summary.textContent = "No map metrics available for this file.";
    } else {
        for (const metric of availableMetrics) {
            const option = document.createElement("option");
            option.value = metric.key;
            option.textContent = metric.label;
            metricSelect.append(option);
        }
        metricSelect.disabled = false;
        toggleButton.disabled = false;
        applyButton.disabled = false;
        resetButton.disabled = false;
    }

    const defaultMetric = availableMetrics[0]?.key ?? "";
    const resolvedConfig = resolveInitialConfig(
        defaultMetric,
        percentInput.value
    );
    const metricIsAvailable = availableMetrics.some(
        (metric) => metric.key === resolvedConfig.metric
    );
    const metricKey = metricIsAvailable ? resolvedConfig.metric : defaultMetric;
    metricSelect.value = metricKey;
    percentInput.value = String(resolvedConfig.percent ?? 10);

    const shouldDisable = availableMetrics.length === 0 || !metricIsAvailable;
    const initialConfig = {
        ...resolvedConfig,
        enabled: shouldDisable ? false : resolvedConfig.enabled,
        metric: metricKey,
    };

    let currentMode =
        initialConfig.mode === "valueRange" ? "valueRange" : "topPercent";
    let currentStats = null;
    let currentRangeValues = {
        max:
            typeof initialConfig.maxValue === "number"
                ? initialConfig.maxValue
                : undefined,
        min:
            typeof initialConfig.minValue === "number"
                ? initialConfig.minValue
                : undefined,
    };

    topPercentRadio.checked = currentMode === "topPercent";
    rangeRadio.checked = currentMode === "valueRange";

    updateModeVisibility();
    updateModeSelectionState();
    updateRangeStats({ preserveSelection: true });

    if (!globalThis.mapDataPointFilter || shouldDisable) {
        updateGlobalFilter(initialConfig);
    }

    if (!metricIsAvailable && availableMetrics.length > 0) {
        summary.textContent = "Selected metric unavailable; filter disabled.";
    }

    if (initialConfig.enabled) {
        const preview = previewFilterResult(initialConfig);
        const text = buildSummaryText(preview, initialConfig, currentStats);
        if (text) {
            summary.textContent = text;
        }
    }

    const refreshSummary = createSummaryRefresher({
        formatMetricValue: (value, stats) => formatMetricValue(value, stats),
        formatPercent: (value) => formatPercent(value),
        summary,
    });

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
        const percentValue = clampPercent(
            Number.parseInt(percentInput.value, 10)
        );
        percentInput.value = String(percentValue);
    });

    applyButton.addEventListener("click", () => {
        const selectedMetricKey = metricSelect.value;

        if (currentMode === "valueRange") {
            if (!currentStats) {
                showNotification(
                    "No data points available for that metric.",
                    "info"
                );
                return;
            }

            const minValue = clampRangeValue(
                currentRangeValues.min ?? currentStats.min,
                currentStats
            );
            const maxValue = clampRangeValue(
                currentRangeValues.max ?? currentStats.max,
                currentStats
            );

            const config = {
                enabled: true,
                maxValue,
                metric: selectedMetricKey,
                minValue,
                mode: "valueRange",
            };

            const preview = previewFilterResult(config);
            const shouldEnable =
                preview &&
                preview.isActive &&
                !preview.reason &&
                preview.selectedCount > 0;

            if (!shouldEnable) {
                updateGlobalFilter({ ...config, enabled: false });
                if (preview?.reason) {
                    showNotification(preview.reason, "info");
                    summary.textContent = preview.reason;
                } else {
                    showNotification(
                        "No data points available for that range.",
                        "info"
                    );
                    summary.textContent =
                        "Filter disabled due to insufficient data.";
                }
                notifyChange("clear", config, preview);
                return;
            }

            currentRangeValues = {
                min: clampRangeValue(
                    preview.appliedMin ?? minValue,
                    currentStats
                ),
                max: clampRangeValue(
                    preview.appliedMax ?? maxValue,
                    currentStats
                ),
            };

            const nextMin = currentRangeValues.min ?? minValue;
            const nextMax = currentRangeValues.max ?? maxValue;
            rangeSliderMin.value = toSliderString(
                nextMin,
                currentStats.decimals
            );
            rangeSliderMax.value = toSliderString(
                nextMax,
                currentStats.decimals
            );
            updateRangeDisplay();

            updateGlobalFilter(config);
            closePanel();
            const summaryText = buildSummaryText(preview, config, currentStats);
            if (summaryText) {
                summary.textContent = summaryText;
            }
            const minLabel = formatMetricValue(nextMin, currentStats);
            const maxLabel = formatMetricValue(nextMax, currentStats);
            const coverage = formatPercent(preview.percent ?? 0);
            showNotification(
                `Showing ${preview.metricLabel ?? preview.metric} between ${minLabel} and ${maxLabel} (${coverage}% coverage)`,
                "success"
            );
            notifyChange("apply", config, preview);
            return;
        }

        const percentValue = clampPercent(
            Number.parseInt(percentInput.value, 10)
        );
        percentInput.value = String(percentValue);

        const config = {
            enabled: true,
            metric: selectedMetricKey,
            mode: "topPercent",
            percent: percentValue,
        };

        const preview = previewFilterResult(config);
        const shouldEnable =
            preview &&
            preview.isActive &&
            !preview.reason &&
            preview.selectedCount > 0;

        if (!shouldEnable) {
            updateGlobalFilter({ ...config, enabled: false });
            if (preview?.reason) {
                showNotification(preview.reason, "info");
                summary.textContent = preview.reason;
            } else {
                showNotification(
                    "No data points available for that metric.",
                    "info"
                );
                summary.textContent =
                    "Filter disabled due to insufficient data.";
            }
            notifyChange("clear", config, preview);
            return;
        }

        updateGlobalFilter(config);
        closePanel();
        const summaryText = buildSummaryText(preview, config, currentStats);
        if (summaryText) {
            summary.textContent = summaryText;
        }
        showNotification(
            `Showing top ${percentValue}% ${preview.metricLabel} data points`,
            "success"
        );
        notifyChange("apply", config, preview);
    });

    resetButton.addEventListener("click", () => {
        const selectedMetricKey = metricSelect.value;
        let clearedConfig;

        if (currentMode === "valueRange") {
            if (currentStats) {
                const minValue = clampRangeValue(
                    currentRangeValues.min ?? currentStats.min,
                    currentStats
                );
                const maxValue = clampRangeValue(
                    currentRangeValues.max ?? currentStats.max,
                    currentStats
                );
                clearedConfig = {
                    enabled: false,
                    maxValue,
                    metric: selectedMetricKey,
                    minValue,
                    mode: "valueRange",
                };
            } else {
                clearedConfig = {
                    enabled: false,
                    metric: selectedMetricKey,
                    mode: "valueRange",
                };
            }
        } else {
            const percentValue = clampPercent(
                Number.parseInt(percentInput.value, 10)
            );
            percentInput.value = String(percentValue);
            clearedConfig = {
                enabled: false,
                metric: selectedMetricKey,
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
        topPercentOption.dataset.checked = topPercentRadio.checked
            ? "true"
            : "false";
        rangeOption.dataset.checked = rangeRadio.checked ? "true" : "false";
    }

    /**
     * @param {"min" | "max"} source
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
                rangeSliderMax.value = toSliderString(
                    maxValue,
                    currentStats.decimals
                );
            } else {
                minValue = maxValue;
                rangeSliderMin.value = toSliderString(
                    minValue,
                    currentStats.decimals
                );
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
     * @param {{ preserveSelection?: boolean }} [options]
     */
    function updateRangeStats(options = {}) {
        const { stats, rangeValues, sliderValues } = computeRangeState(
            metricSelect.value,
            currentRangeValues,
            options
        );
        currentStats = stats;

        if (!stats || !rangeValues || !sliderValues) {
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

        currentRangeValues = rangeValues;
        rangeSliderMin.value = sliderValues.min;
        rangeSliderMax.value = sliderValues.max;
        updateRangeDisplay();
    }

    function updateRangeDisplay() {
        if (!currentStats) {
            rangeValueDisplay.textContent = "Range unavailable";
            return;
        }
        const minValue = clampRangeValue(
            currentRangeValues.min ?? currentStats.min,
            currentStats
        );
        const maxValue = clampRangeValue(
            currentRangeValues.max ?? currentStats.max,
            currentStats
        );
        rangeValueDisplay.textContent = `${formatMetricValue(minValue, currentStats)} – ${formatMetricValue(
            maxValue,
            currentStats
        )} ${currentStats.metricLabel}`;
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

    /** @type {any} */ (container).refreshSummary = refreshSummary;

    return container;
}
