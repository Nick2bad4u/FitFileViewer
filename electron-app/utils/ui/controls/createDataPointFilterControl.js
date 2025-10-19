/**
 * Creates a map control for filtering markers by top metric percentiles.
 */

import { createMetricFilter, MAP_FILTER_METRICS } from "../../maps/filters/mapMetricFilter.js";
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

    const metricLabel = document.createElement("label");
    metricLabel.textContent = "Metric";
    metricLabel.htmlFor = "map-filter-metric";

    const metricSelect = document.createElement("select");
    metricSelect.id = "map-filter-metric";
    metricSelect.className = "data-point-filter-control__select";
    for (const metric of MAP_FILTER_METRICS) {
        const option = document.createElement("option");
        option.value = metric.key;
        option.textContent = metric.label;
        metricSelect.append(option);
    }

    const percentLabel = document.createElement("label");
    percentLabel.textContent = "Top %";
    percentLabel.htmlFor = "map-filter-percent";

    const percentInput = document.createElement("input");
    percentInput.type = "number";
    percentInput.min = "1";
    percentInput.max = "100";
    percentInput.step = "1";
    percentInput.id = "map-filter-percent";
    percentInput.className = "data-point-filter-control__input";
    percentInput.value = "10";

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
    panel.append(metricLabel, metricSelect, percentLabel, percentInput, summary, actions);

    container.append(toggleButton);

    const viewportPadding = 16;
    let pendingFrame = 0;

    const initialConfig = resolveInitialConfig(metricSelect.value, percentInput.value);
    metricSelect.value = initialConfig.metric;
    percentInput.value = String(initialConfig.percent);

    if (!globalThis.mapDataPointFilter) {
        updateGlobalFilter(initialConfig);
    }

    if (initialConfig.enabled) {
        const preview = previewFilterResult(initialConfig);
        if (preview && preview.isActive && !preview.reason && preview.selectedCount > 0) {
            summary.textContent = `Showing top ${initialConfig.percent}% (${preview.selectedCount} of ${preview.totalCandidates}) by ${preview.metricLabel}`;
        }
    }

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

    applyButton.addEventListener("click", () => {
        const metricKey = metricSelect.value;
        const percentValue = clampPercent(Number.parseInt(percentInput.value, 10));
        percentInput.value = String(percentValue);

        const config = {
            enabled: true,
            metric: metricKey,
            percent: percentValue,
        };

        const preview = previewFilterResult(config);
        const shouldEnable = preview && preview.isActive && !preview.reason && preview.selectedCount > 0;

        if (!shouldEnable) {
            updateGlobalFilter({ ...config, enabled: false });
            if (preview?.reason) {
                showNotification(preview.reason, "info");
            } else {
                showNotification("No data points available for that metric.", "info");
            }
            notifyChange("clear", config, preview);
            summary.textContent = "Filter disabled due to insufficient data.";
            return;
        }

        updateGlobalFilter(config);
        closePanel();
        const descriptor = `${preview.selectedCount} of ${preview.totalCandidates} points`;
        summary.textContent = `Showing top ${percentValue}% (${descriptor}) by ${preview.metricLabel}`;
        showNotification(`Showing top ${percentValue}% ${preview.metricLabel} data points`, "success");
        notifyChange("apply", config, preview);
    });

    resetButton.addEventListener("click", () => {
        const metricKey = metricSelect.value;
        const percentValue = clampPercent(Number.parseInt(percentInput.value, 10));
        const clearedConfig = {
            enabled: false,
            metric: metricKey,
            percent: percentValue,
        };
        updateGlobalFilter(clearedConfig);
        closePanel();
        summary.textContent = "Metric filtering disabled.";
        showNotification("Map metric filtering cleared", "info");
        notifyChange("clear", clearedConfig);
    });

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
                summary.textContent = `Showing top ${last.percent}% (${last.selectedCount} of ${last.totalCandidates}) by ${last.metricLabel ?? last.metric}`;
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
    const percentValue = clampPercent(
        typeof existing?.percent === "number" ? existing.percent : Number.parseInt(defaultPercent, 10) || 10
    );
    return {
        enabled: Boolean(existing?.enabled),
        metric: metricKey,
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
