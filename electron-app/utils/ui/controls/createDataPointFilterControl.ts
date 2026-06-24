import {
    MAP_FILTER_METRICS,
    type MapDataPointFilterConfig,
    type MetricFilterResult,
    type MetricStatistics,
} from "../../maps/filters/mapMetricFilter.js";
import { getMapDataPointFilter } from "../../maps/state/mapDataPointFilterState.js";
import { showNotification } from "../notifications/showNotification.js";
import { getCreateDataPointFilterControlRuntime } from "./createDataPointFilterControlRuntime.js";
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
    updateDataPointFilterState,
    type ResolvedDataPointFilterConfig,
} from "./dataPointFilterControl/stateHelpers.js";
import { createSummaryRefresher } from "./dataPointFilterControl/summaryRefresher.js";

let filterControlInstance = 0;

type CurrentRangeValues = {
    max?: number;
    min?: number;
};

type RangeStatsOptions = {
    preserveSelection?: boolean;
};

type FilterChangePayload = {
    action: "apply" | "clear";
    config: MapDataPointFilterConfig;
    result?: MetricFilterResult;
};

type FilterControlElement = HTMLDivElement & {
    refreshSummary?: () => void;
};

type FilterMode = NonNullable<MapDataPointFilterConfig["mode"]>;

/**
 * Creates the map data-point filter control.
 *
 * @returns The filter control container.
 */
export function createDataPointFilterControl(
    onFilterChange?: (payload: FilterChangePayload) => void
): HTMLDivElement {
    const runtime = getCreateDataPointFilterControlRuntime();
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

    const eventController = runtime.createAbortController();
    const { signal } = eventController;

    const { scheduleMicrotask } = runtime;

    const viewportPadding = 16;
    const { closePanel, openPanel } = createPanelController({
        container,
        metricSelect,
        panel,
        toggleButton,
        viewportPadding,
    });

    const metricStatsCache = new Map<string, MetricStatistics | null>();

    /** Resolve cached stats for a metric key to avoid repeated scans. */
    const getMetricStats = (metricKey: string): MetricStatistics | null => {
        if (metricStatsCache.has(metricKey)) {
            return metricStatsCache.get(metricKey) ?? null;
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
     */
    const isMetricAvailable = (metricKey: string): boolean => {
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
        const emptyOption = runtime.createOption();
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
            const option = runtime.createOption();
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
    const initialConfig: ResolvedDataPointFilterConfig = {
        ...resolvedConfig,
        enabled: shouldDisable ? false : resolvedConfig.enabled,
        metric: metricKey,
    };

    let currentMode: FilterMode =
        initialConfig.mode === "valueRange" ? "valueRange" : "topPercent";
    let currentStats: MetricStatistics | null = null;
    let currentRangeValues: CurrentRangeValues = {};
    if (typeof initialConfig.maxValue === "number") {
        currentRangeValues.max = initialConfig.maxValue;
    }
    if (typeof initialConfig.minValue === "number") {
        currentRangeValues.min = initialConfig.minValue;
    }

    topPercentRadio.checked = currentMode === "topPercent";
    rangeRadio.checked = currentMode === "valueRange";

    updateModeVisibility();
    updateModeSelectionState();
    updateRangeStats({ preserveSelection: true });

    if (!getMapDataPointFilter() || shouldDisable) {
        updateDataPointFilterState(toMapFilterConfig(initialConfig));
    }

    if (!metricIsAvailable && availableMetrics.length > 0) {
        summary.textContent = "Selected metric unavailable; filter disabled.";
    }

    if (initialConfig.enabled) {
        const previewConfig = toMapFilterConfig(initialConfig);
        const preview = previewFilterResult(previewConfig);
        const text = buildSummaryText(preview, previewConfig, currentStats);
        if (text) {
            summary.textContent = text;
        }
    }

    const refreshSummary = createSummaryRefresher({
        formatMetricValue: (value, stats) => formatMetricValue(value, stats),
        formatPercent: (value) => formatPercent(value),
        summary,
    });

    metricSelect.addEventListener(
        "change",
        () => {
            currentRangeValues = {};
            updateRangeStats({ preserveSelection: false });
            scheduleMicrotask(() => refreshSummary());
        },
        { signal }
    );

    toggleButton.addEventListener(
        "click",
        () => {
            if (panel.hidden) {
                openPanel();
            } else {
                closePanel();
            }
        },
        { signal }
    );

    topPercentRadio.addEventListener(
        "change",
        () => {
            if (!topPercentRadio.checked) {
                return;
            }
            currentMode = "topPercent";
            rangeRadio.checked = false;
            updateModeVisibility();
            updateModeSelectionState();
            scheduleMicrotask(() => refreshSummary());
        },
        { signal }
    );

    rangeRadio.addEventListener(
        "change",
        () => {
            if (!rangeRadio.checked) {
                return;
            }
            currentMode = "valueRange";
            topPercentRadio.checked = false;
            updateModeVisibility();
            updateModeSelectionState();
            updateRangeStats({ preserveSelection: true });
            scheduleMicrotask(() => refreshSummary());
        },
        { signal }
    );

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

    rangeSliderMin.addEventListener("input", handleRangeMinInput, { signal });
    rangeSliderMin.addEventListener("change", handleRangeMinInput, { signal });
    rangeSliderMax.addEventListener("input", handleRangeMaxInput, { signal });
    rangeSliderMax.addEventListener("change", handleRangeMaxInput, { signal });

    percentInput.addEventListener(
        "change",
        () => {
            const percentValue = clampPercent(
                Number.parseInt(percentInput.value, 10)
            );
            percentInput.value = String(percentValue);
        },
        { signal }
    );

    applyButton.addEventListener(
        "click",
        () => {
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

                const config: MapDataPointFilterConfig = {
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
                    updateDataPointFilterState({ ...config, enabled: false });
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

                updateDataPointFilterState(config);
                closePanel();
                const summaryText = buildSummaryText(
                    preview,
                    config,
                    currentStats
                );
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

            const config: MapDataPointFilterConfig = {
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
                updateDataPointFilterState({ ...config, enabled: false });
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

            updateDataPointFilterState(config);
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
        },
        { signal }
    );

    resetButton.addEventListener(
        "click",
        () => {
            const selectedMetricKey = metricSelect.value;
            let clearedConfig: MapDataPointFilterConfig;

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
            updateDataPointFilterState(clearedConfig);
            closePanel();
            summary.textContent = "Metric filtering disabled.";
            showNotification("Map metric filtering cleared", "info");
            notifyChange("clear", clearedConfig);
        },
        { signal }
    );

    function updateModeVisibility() {
        const isRange = currentMode === "valueRange";
        percentGroup.style.display = isRange ? "none" : "";
        percentGroup.setAttribute("aria-hidden", isRange ? "true" : "false");
        rangeGroup.style.display = isRange ? "" : "none";
        rangeGroup.setAttribute("aria-hidden", isRange ? "false" : "true");
    }

    function updateModeSelectionState() {
        topPercentOption.dataset["checked"] = topPercentRadio.checked
            ? "true"
            : "false";
        rangeOption.dataset["checked"] = rangeRadio.checked ? "true" : "false";
    }

    function syncRangeSlider(source: "min" | "max"): void {
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

    function updateRangeStats(options: RangeStatsOptions = {}): void {
        const { stats, rangeValues, sliderValues } = computeRangeState(
            metricSelect.value,
            toCompleteRangeValues(currentRangeValues),
            options
        );
        currentStats = stats;

        if (!stats || !rangeValues || !sliderValues) {
            rangeSliderMin.disabled = true;
            rangeSliderMax.disabled = true;
            rangeValueDisplay.textContent = "Range unavailable";
            rangeGroup.dataset["disabled"] = "true";
            return;
        }

        delete rangeGroup.dataset["disabled"];
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

    function notifyChange(
        action: "apply" | "clear",
        config: MapDataPointFilterConfig,
        result?: MetricFilterResult | null
    ): void {
        if (typeof onFilterChange === "function") {
            const payload: FilterChangePayload = { action, config };
            if (result) {
                payload.result = result;
            }
            onFilterChange(payload);
        }
        scheduleMicrotask(() => refreshSummary());
    }

    (container as FilterControlElement).refreshSummary = refreshSummary;
    (container as FilterControlElement).addEventListener(
        "ffv:data-point-filter:dispose",
        () => eventController.abort(),
        { once: true, signal }
    );

    return container;
}

function toCompleteRangeValues(
    values: CurrentRangeValues
): { max: number; min: number } | null {
    return typeof values.max === "number" && typeof values.min === "number"
        ? { max: values.max, min: values.min }
        : null;
}

function toMapFilterConfig(
    config: MapDataPointFilterConfig | ResolvedDataPointFilterConfig
): MapDataPointFilterConfig {
    const normalized: MapDataPointFilterConfig = {
        enabled: config.enabled,
        metric: config.metric,
    };

    if (config.mode) {
        normalized.mode = config.mode;
    }
    if (typeof config.percent === "number") {
        normalized.percent = config.percent;
    }
    if (typeof config.minValue === "number") {
        normalized.minValue = config.minValue;
    }
    if (typeof config.maxValue === "number") {
        normalized.maxValue = config.maxValue;
    }

    return normalized;
}
