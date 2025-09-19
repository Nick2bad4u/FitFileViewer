/**
 * Global Chart Status Indicator
 * Creates a persistent status indicator for chart visibility and availability
 */

import { getChartCounts } from "../core/getChartCounts.js";

/**
 * @typedef {import('../core/getChartCounts.js').ChartCounts} ChartCounts
 * @typedef {Object} ChartStatus
 * @property {boolean} isAllVisible
 * @property {boolean} hasHiddenCharts
 * @property {boolean} hasNoCharts
 * @property {ChartCounts} counts
 */

// Constants for better maintainability
const CONSTANTS = {
    CLASSES: {
        FIELDS_SECTION: "fields-section",
        GLOBAL_CHART_STATUS: "global-chart-status",
    },
    ICONS: {
        ALL_SET: "✨",
        ALL_VISIBLE: "✅",
        LOAD_FILE: "📂",
        NONE_VISIBLE: "❌",
        SETTINGS: "⚙️",
        SOME_HIDDEN: "⚠️",
    },
    IDS: {
        CHART_CONTAINER: "chartjs-chart-container",
        CHART_CONTROLS_TOGGLE: "chart-controls-toggle",
        CHART_TAB_CONTENT: "content-chartjs",
        GLOBAL_CHART_STATUS: "global-chart-status",
        SETTINGS_WRAPPER: "chartjs-settings-wrapper",
    },
    LOG_PREFIX: "[GlobalChartStatus]",
    TEXTS: {
        ALL_SET: "All Set",
        HIDE_CONTROLS: "▼ Hide Controls",
        LOAD_FIT: "Load FIT",
        SHOW_SETTINGS: "Show Settings",
    },
    TOOLTIPS: {
        ALL_SET: "All available charts are visible",
        ALL_VISIBLE: "All available charts are visible",
        LOAD_FIT: "Load a FIT file to see charts",
        NONE_VISIBLE: "No charts are visible",
        SHOW_SETTINGS: "Open chart settings to enable more charts",
        SOME_HIDDEN: "Some charts are hidden",
    },
};

/**
 * Creates a persistent global chart status indicator that's always visible
 * at the top of the chart tab, regardless of settings panel visibility
 *
 * Provides visual feedback about chart availability and visibility status,
 * with quick access to settings for enabling hidden charts.
 *
 * @returns {HTMLElement|null} The created indicator element or null on failure
 *
 * @example
 * // Create or update the global chart status indicator
 * const indicator = createGlobalChartStatusIndicator();
 * if (indicator) {
 *     console.log("Chart status indicator created successfully");
 * }
 */
export function createGlobalChartStatusIndicator() {
    try {
        logWithContext("info", "Creating global chart status indicator");

        const chartTabContent = getElementSafely(CONSTANTS.IDS.CHART_TAB_CONTENT, "Chart tab content");

        if (!chartTabContent) {
            return null;
        }

        // Check if global indicator already exists
        let globalIndicator = document.getElementById(CONSTANTS.IDS.GLOBAL_CHART_STATUS);
        if (globalIndicator) {
            logWithContext("info", "Global chart status indicator already exists");
            return globalIndicator;
        }

        // Get chart counts and calculate status
        /** @type {ChartCounts} */
        const counts = getChartCounts(),
            /** @type {ChartStatus} */
            status = calculateChartStatus(counts);

        logWithContext("info", "Chart status calculated", { status });

        // Create the main indicator container
        globalIndicator = document.createElement("div");
        globalIndicator.id = CONSTANTS.IDS.GLOBAL_CHART_STATUS;
        globalIndicator.className = CONSTANTS.CLASSES.GLOBAL_CHART_STATUS;

        // Apply styles to the container
        applyIndicatorStyles(globalIndicator);

        // Create status info section (left side)
        const statusInfo = document.createElement("div");
        statusInfo.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        // Create and add status components
        const quickAction = createQuickActionButton(status),
            statusIcon = createStatusIcon(status),
            statusText = createStatusText(status);

        // Assemble the indicator
        statusInfo.append(statusIcon);
        statusInfo.append(statusText);
        globalIndicator.append(statusInfo);
        globalIndicator.append(quickAction);

        // Insert into DOM
        insertIndicatorIntoDOM(globalIndicator, chartTabContent);

        logWithContext("info", "Global chart status indicator created successfully", {
            available: status.counts.available,
            visible: status.counts.visible,
        });

        return globalIndicator;
    } catch (/** @type {any} */ error) {
        logWithContext("error", "Failed to create global chart status indicator", {
            error:
                error && typeof error === "object" && "message" in error
                    ? /** @type {any} */ (error).message
                    : String(error),
            stack:
                error && typeof error === "object" && "stack" in error ? /** @type {any} */ (error).stack : undefined,
        });
        return null;
    }
}

/**
 * Apply styles to the global indicator container
 * @param {HTMLElement} globalIndicator - The indicator element
 */
function applyIndicatorStyles(globalIndicator) {
    globalIndicator.style.cssText = `
        position: sticky;
        top: 0;
        z-index: 100;
        background: var(--color-bg-alt);
        border-bottom: 1px solid var(--color-border);
        padding: 8px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        backdrop-filter: var(--backdrop-blur);
        margin-bottom: 16px;
        border-radius: 8px 8px 0 0;
        box-shadow: 0 2px 4px var(--color-shadow);
    `;
}

/**
 * Calculate chart status information
 * @param {ChartCounts} counts
 * @returns {ChartStatus}
 */
function calculateChartStatus(counts) {
    const hasHiddenCharts = counts.available > counts.visible,
        hasNoCharts = counts.available === 0,
        isAllVisible = counts.visible === counts.available;

    return {
        counts,
        hasHiddenCharts,
        hasNoCharts,
        isAllVisible,
    };
}

/**
 * Create quick action button based on chart status
 * @param {ChartStatus} status
 * @returns {HTMLElement}
 */
function createQuickActionButton(status) {
    const quickAction = document.createElement("button");
    quickAction.style.cssText = `
        padding: 4px 8px;
        border: 1px solid var(--color-border);
        border-radius: 6px;
        background: var(--color-btn-bg);
        color: var(--color-fg-alt);
        font-size: 12px;
        cursor: pointer;
        transition: var(--transition-smooth);
    `;

    if (status.hasHiddenCharts) {
        quickAction.textContent = `${CONSTANTS.ICONS.SETTINGS} ${CONSTANTS.TEXTS.SHOW_SETTINGS}`;
        quickAction.title = CONSTANTS.TOOLTIPS.SHOW_SETTINGS;
        quickAction.addEventListener("click", handleSettingsToggle);

        // Add hover effects for interactive button
        quickAction.addEventListener("mouseenter", () => {
            quickAction.style.background = "var(--color-accent-hover)";
            quickAction.style.transform = "translateY(-1px)";
        });

        quickAction.addEventListener("mouseleave", () => {
            quickAction.style.background = "var(--color-btn-bg)";
            quickAction.style.transform = "translateY(0)";
        });
    } else if (status.isAllVisible && status.counts.available > 0) {
        quickAction.textContent = `${CONSTANTS.ICONS.ALL_SET} ${CONSTANTS.TEXTS.ALL_SET}`;
        quickAction.title = CONSTANTS.TOOLTIPS.ALL_SET;
        quickAction.style.opacity = "0.7";
        quickAction.style.cursor = "default";
    } else {
        quickAction.textContent = `${CONSTANTS.ICONS.LOAD_FILE} ${CONSTANTS.TEXTS.LOAD_FIT}`;
        quickAction.title = CONSTANTS.TOOLTIPS.LOAD_FIT;
        quickAction.style.opacity = "0.7";
        quickAction.style.cursor = "default";
    }

    return quickAction;
}

/**
 * Create status icon based on chart status
 * @param {ChartStatus} status
 * @returns {HTMLElement}
 */
function createStatusIcon(status) {
    const statusIcon = document.createElement("span");
    statusIcon.style.fontSize = "18px";

    if (status.isAllVisible) {
        statusIcon.textContent = CONSTANTS.ICONS.ALL_VISIBLE;
        statusIcon.title = CONSTANTS.TOOLTIPS.ALL_VISIBLE;
    } else if (status.hasHiddenCharts) {
        statusIcon.textContent = CONSTANTS.ICONS.SOME_HIDDEN;
        statusIcon.title = CONSTANTS.TOOLTIPS.SOME_HIDDEN;
    } else {
        statusIcon.textContent = CONSTANTS.ICONS.NONE_VISIBLE;
        statusIcon.title = CONSTANTS.TOOLTIPS.NONE_VISIBLE;
    }

    return statusIcon;
}

/**
 * Create status text based on chart status
 * @param {ChartStatus} status
 * @returns {HTMLElement}
 */
function createStatusText(status) {
    const statusText = document.createElement("span");
    statusText.style.cssText = `
        font-weight: 600;
        font-size: 14px;
    `;

    if (status.hasNoCharts) {
        statusText.textContent = "No chart data available in this FIT file";
        statusText.style.color = "var(--color-fg-muted)";
    } else {
        const colorClass = status.isAllVisible
            ? "var(--color-success)"
            : status.hasHiddenCharts
              ? "var(--color-warning)"
              : "var(--color-error)";

        statusText.innerHTML = `
            Showing
            <span style="color: ${colorClass};">
                ${status.counts.visible}
            </span>
            of ${status.counts.available} available charts
        `;
        statusText.style.color = "var(--color-fg)";
    }

    return statusText;
}

/**
 * Get DOM element with validation
 * @param {string} id - Element ID
 * @param {string} description - Element description for logging
 * @returns {HTMLElement|null} Element or null if not found
 */
function getElementSafely(id, description) {
    const element = document.getElementById(id);
    if (!element) {
        logWithContext("warn", `${description} not found`, { id });
    }
    return element;
}

/**
 * Handle settings panel toggle
 */
function handleSettingsToggle() {
    try {
        const toggleBtn = getElementSafely(CONSTANTS.IDS.CHART_CONTROLS_TOGGLE, "Chart controls toggle button"),
            wrapper = getElementSafely(CONSTANTS.IDS.SETTINGS_WRAPPER, "Settings wrapper");

        if (wrapper && toggleBtn) {
            wrapper.style.display = "block";
            toggleBtn.textContent = CONSTANTS.TEXTS.HIDE_CONTROLS;
            toggleBtn.setAttribute("aria-expanded", "true");

            // Scroll to field toggles with delay for smooth animation
            const fieldsSection = document.querySelector(`.${CONSTANTS.CLASSES.FIELDS_SECTION}`);
            if (fieldsSection) {
                setTimeout(() => {
                    fieldsSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }, 100);
            }

            logWithContext("info", "Settings panel opened");
        }
    } catch (error) {
        logWithContext("error", "Failed to toggle settings panel", {
            error:
                error && typeof error === "object" && "message" in error
                    ? /** @type {any} */ (error).message
                    : String(error),
        });
    }
}

/**
 * Insert the indicator into the DOM at the correct position
 * @param {HTMLElement} globalIndicator - The indicator element
 * @param {HTMLElement} chartTabContent - The chart tab content container
 */
function insertIndicatorIntoDOM(globalIndicator, chartTabContent) {
    try {
        const chartContainer = getElementSafely(CONSTANTS.IDS.CHART_CONTAINER, "Chart container");

        if (chartContainer) {
            chartContainer.before(globalIndicator);
        } else {
            chartTabContent.append(globalIndicator);
        }

        logWithContext("info", "Global chart status indicator inserted into DOM");
    } catch (error) {
        logWithContext("error", "Failed to insert indicator into DOM", {
            error:
                error && typeof error === "object" && "message" in error
                    ? /** @type {any} */ (error).message
                    : String(error),
        });
    }
}

/**
 * Supported log levels for this module
 * @typedef {'log'|'info'|'warn'|'error'} LogLevel
 */
/**
 * Enhanced logging with context (avoids dynamic console indexing for typing)
 * @param {LogLevel} level
 * @param {string} message
 * @param {Record<string, any>} [context]
 */
function logWithContext(level, message, context) {
    const hasContext = context && Object.keys(context).length > 0,
        timestamp = new Date().toISOString(),
        logMessage = `${timestamp} ${CONSTANTS.LOG_PREFIX} ${message}`;
    switch (level) {
        case "error": {
            hasContext ? console.error(logMessage, context) : console.error(logMessage);
            break;
        }
        case "info": {
            hasContext ? console.info(logMessage, context) : console.info(logMessage);
            break;
        }
        case "warn": {
            hasContext ? console.warn(logMessage, context) : console.warn(logMessage);
            break;
        }
        default: {
            hasContext ? console.log(logMessage, context) : console.log(logMessage);
        }
    }
}
