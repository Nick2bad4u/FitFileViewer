/**
 * @fileoverview Enhanced Chart.js rendering utility for FIT file data visualization
 * @description Provides comprehensive chart rendering, controls management, and export capabilities
 * for fitness device data visualization in the FitFileViewe            container.innerHTML = `
				<div class="chart-error" style="
					text-align: center; 
					padding: 40px; 
					color: var(--color-error);
					background: var(--color-glass);
					border: 1px solid var(--color-border);
					border-radius: var(--border-radius);
					margin: 20px 0;
				">
					<h3 style="margin-bottom: 16px; color: var(--color-error);">Chart Rendering Error</h3>
					<p style="margin-bottom: 8px; color: var(--color-fg);">An error occurred while rendering the charts.</p>
					<details style="text-align: left; margin-top: 16px;">
						<summary style="cursor: pointer; font-weight: bold; color: var(--color-fg);">Error Details</summary>
						<pre style="background: var(--color-glass); color: var(--color-fg); padding: 8px; border-radius: var(--border-radius-small); margin-top: 8px; font-size: 12px; overflow-x: auto; border: 1px solid var(--color-border);">${
                            error.stack || error.message
                        }</pre>
					</details>
				</div>`;on.
 *
 * Features:
 * - Multiple chart types (line, bar, doughnut) with dynamic data binding
 * - Toggleable controls panel with professional UI
 * - Comprehensive export capabilities (PNG, CSV, JSON, clipboard)
 * - Performance monitoring and error handling
 * - Theme-aware styling and responsive design
 * - Accessibility support with ARIA labels
 *
 * Dependencies:
 * - Chart.js library (window.Chart)
 * - chartjs-plugin-zoom for interactive zoom/pan
 * - showNotification utility for user feedback
 * - JSZip library (window.JSZip) for ZIP export functionality
 *
 * @author FitFileViewer Development Team
 * @version 2.0.0
 * @since 1.0.0
 */

// filepath: electron-app/utils/renderChartJS.js
// Enhanced Chart.js rendering for FIT file data with comprehensive export capabilities
// Assumes Chart.js and JSZip are loaded as window.Chart and window.JSZip

import { showNotification } from "./showNotification.js";
import { detectCurrentTheme } from "./chartThemeUtils.js";
import { getUnitSymbol } from "./getUnitSymbol.js";
import { convertValueToUserUnits } from "./convertValueToUserUnits.js";
import { setupZoneData } from "./setupZoneData.js";
import { fieldLabels, chartFields } from "./chartFields.js";
import { ensureChartSettingsDropdowns } from "./ensureChartSettingsDropdowns.js";
import { getCurrentSettings } from "./getCurrentSettings.js";
import { loadSharedConfiguration } from "./loadSharedConfiguration.js";
import { createEnhancedChart } from "./createEnhancedChart.js";
import { backgroundColorPlugin } from "./backgroundColorPlugin.js";
import { createChartCanvas } from "./createChartCanvas.js";
import { renderEventMessagesChart } from "./renderEventMessagesChart.js";
import { renderTimeInZoneCharts } from "./renderTimeInZoneCharts.js";
import { renderPerformanceAnalysisCharts } from "./renderPerformanceAnalysisCharts.js";
import { renderGPSTrackChart } from "./renderGPSTrackChart.js";
import { renderLapZoneCharts } from "./renderLapZoneCharts.js";
import { shouldShowRenderNotification } from "./shouldShowRenderNotification.js";
import { createUserDeviceInfoBox } from "./createUserDeviceInfoBox.js";
import {
    addChartHoverEffects,
    addHoverEffectsToExistingCharts,
    removeChartHoverEffects,
} from "./addChartHoverEffects.js";
import { setupChartThemeListener } from "./chartThemeListener.js";
import { getThemeConfig } from "./theme.js";

// Debouncing variables for renderChartJS
let renderTimeout = null;
let lastRenderTime = 0;
const RENDER_DEBOUNCE_MS = 200; // Minimum time between renders

// Track previous render state for notification logic
export let previousChartState = {
    chartCount: 0,
    fieldsRendered: [],
    lastRenderTimestamp: 0,
};

// Chart.js plugin registration
if (window.Chart && window.Chart.register && window.Chart.Zoom) {
    window.Chart.register(window.Chart.Zoom);
    console.log("[ChartJS] chartjs-plugin-zoom registered.");
} else if (window.Chart && window.Chart.register && window.chartjsPluginZoom) {
    window.Chart.register(window.chartjsPluginZoom);
    console.log("[ChartJS] chartjs-plugin-zoom registered (window.chartjsPluginZoom).");
} else if (window.Chart && window.Chart.register && window.ChartZoom) {
    window.Chart.register(window.ChartZoom);
    console.log("[ChartJS] chartjs-plugin-zoom registered (window.ChartZoom).");
} else {
    console.warn("[ChartJS] chartjs-plugin-zoom is not loaded. Zoom/pan will be unavailable.");
}

// Listen for a custom event to trigger chart re-render on file load
if (!window._fitFileViewerChartListener) {
    window._fitFileViewerChartListener = true;
    let _fitfileLoadedFired = false;
    window.addEventListener("fitfile-loaded", function () {
        _fitfileLoadedFired = true;
        console.log("[ChartJS] fitfile-loaded event received, resetting notification state and re-rendering charts");
        // Reset notification state for new file
        resetChartNotificationState();
        // Re-render charts when a new file is loaded
        renderChartJS();
    });
    // Also listen for file input changes (if any file input exists)
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => {
        input.addEventListener("change", function () {
            console.log("[ChartJS] File input changed, re-rendering charts");
            setTimeout(() => {
                window.dispatchEvent(new Event("fitfile-loaded"));
            }, 100); // slight delay to allow file to load
        });
    });
    // Warn if event is not dispatched after file load
    setTimeout(() => {
        if (!_fitfileLoadedFired && (!window._chartjsInstances || window._chartjsInstances.length === 0)) {
            console.warn(
                '[ChartJS] fitfile-loaded event was not dispatched after file load. Charts will not update until you call window.dispatchEvent(new Event("fitfile-loaded")) after loading a new file.'
            );
        }
    }, 2000);
}

/**
 * Creates an enhanced settings and control panel for charts
 * @param {HTMLElement|string} targetContainer - Container element or ID
 * @returns {Object} Current settings object
 */
/**
 * State management for the chart controls panel
 */
export const chartControlsState = {
    isVisible: false,
    isInitialized: false,
    wrapper: null,
};

// Load shared configuration on page load
if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", loadSharedConfiguration);
}

// Register the background color plugin globally
if (window.Chart && !window.Chart.registry.plugins.get("backgroundColorPlugin")) {
    window.Chart.register(backgroundColorPlugin);
    console.log("[ChartJS] backgroundColorPlugin registered");
}

// Utility function to convert hex to rgba
export function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Process and set up zone data from FIT file for chart rendering
 * Extracts time in zone data from session messages and sets global variables
 */
/**
 * Main chart rendering function with comprehensive error handling and performance monitoring
 * @param {Element|string} targetContainer - Container element or ID for chart rendering
 * @returns {boolean} Success status of the rendering operation
 */
export function renderChartJS(targetContainer) {
    console.log("[ChartJS] Starting chart rendering...");

    // Debounce multiple rapid calls
    const now = Date.now();
    if (now - lastRenderTime < RENDER_DEBOUNCE_MS) {
        console.log("[ChartJS] Debouncing rapid render calls");
        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(() => renderChartJS(targetContainer), RENDER_DEBOUNCE_MS);
        return false;
    }
    lastRenderTime = now;

    const performanceStart = performance.now();

    try {
        // Initialize chart instances array
        if (!window._chartjsInstances) {
            window._chartjsInstances = [];
        }

        // Destroy existing chart instances with error handling
        window._chartjsInstances.forEach((chart, index) => {
            try {
                if (chart && typeof chart.destroy === "function") {
                    chart.destroy();
                }
            } catch (destroyError) {
                console.warn(`[ChartJS] Error destroying chart ${index}:`, destroyError);
            }
        });
        window._chartjsInstances = [];

        // Validate Chart.js availability
        if (!window.Chart) {
            const error = "Chart.js library is not loaded or not available";
            console.error(`[ChartJS] ${error}`);
            showNotification("Chart library not available", "error");
            return false;
        }

        // Validate FIT file data availability
        if (!window.globalData || typeof window.globalData !== "object") {
            console.warn("[ChartJS] No FIT file data available");
            showNotification("No FIT file data available for chart rendering", "warning");
            return false;
        }
        // Setup zone data from FIT file
        setupZoneData(window.globalData);

        // Validate record messages (main time-series data)
        const recordMesgs = window.globalData.recordMesgs;
        if (!recordMesgs || !Array.isArray(recordMesgs) || recordMesgs.length === 0) {
            console.warn("[ChartJS] No record messages found in FIT data");
            showNotification("No chartable data found in this FIT file", "info");

            // Still render the UI but show a helpful message
            const container = document.getElementById("content-chart");
            if (container) {
                const themeConfig = getThemeConfig();
                container.innerHTML = `
					<div class="chart-placeholder" style="
						text-align: center; 
						padding: 40px; 
						color: var(--color-fg, ${themeConfig.colors.text});
						background: var(--color-bg-alt-solid, ${themeConfig.colors.backgroundAlt});
						border-radius: 12px;
						margin: 20px 0;
						border: 1px solid var(--color-border, ${themeConfig.colors.border});
					">
						<h3 style="color: var(--color-fg-alt, ${themeConfig.colors.textPrimary}); margin-bottom: 16px;">No Chart Data Available</h3>
						<p style="margin-bottom: 8px;">This FIT file does not contain time-series data that can be charted.</p>
						<p style="margin-bottom: 0;">Try loading a FIT file from a fitness activity or workout.</p>
					</div>
				`;
            }
            return false;
        }

        console.log(`[ChartJS] Found ${recordMesgs.length} data points to process`);

        // Get the actual start time from the first record message
        let activityStartTime = null;
        if (recordMesgs.length > 0 && recordMesgs[0].timestamp) {
            activityStartTime = recordMesgs[0].timestamp;
            console.log("[ChartJS] Activity start time:", activityStartTime);
        }

        const result = renderChartsWithData(targetContainer, recordMesgs, activityStartTime);

        // Log performance timing
        const performanceEnd = performance.now();
        console.log(`[ChartJS] Chart rendering completed in ${(performanceEnd - performanceStart).toFixed(2)}ms`);

        return result;
    } catch (error) {
        console.error("[ChartJS] Critical error in chart rendering:", error);
        showNotification("Failed to render charts due to an error", "error");

        // Try to show error information to user
        const container = document.getElementById("content-chart") || targetContainer;
        if (container) {
            const themeConfig = getThemeConfig();
            container.innerHTML = `
				<div class="chart-error" style="
					text-align: center; 
					padding: 40px; 
					color: var(--color-error, ${themeConfig.colors.error});
					background: var(--color-glass, ${themeConfig.colors.backgroundAlt});
					border: 1px solid var(--color-border, ${themeConfig.colors.border});
					border-radius: var(--border-radius, 12px);
					margin: 20px 0;
				">
					<h3 style="margin-bottom: 16px; color: var(--color-error, ${themeConfig.colors.error});">Chart Rendering Error</h3>
					<p style="margin-bottom: 8px; color: var(--color-fg, ${
                        themeConfig.colors.text
                    });">An error occurred while rendering the charts.</p>
					<details style="text-align: left; margin-top: 16px;">
						<summary style="cursor: pointer; font-weight: bold; color: var(--color-fg, ${
                            themeConfig.colors.text
                        });">Error Details</summary>
						<pre style="background: var(--color-glass, ${themeConfig.colors.backgroundAlt}); color: var(--color-fg, ${
                themeConfig.colors.text
            }); padding: 8px; border-radius: var(--border-radius-small, 4px); margin-top: 8px; font-size: 12px; overflow-x: auto; border: 1px solid var(--color-border, ${
                themeConfig.colors.border
            });">${error.stack || error.message}</pre>
					</details>
				</div>
			`;
        }
        return false;
    }
}

/**
 * Renders charts with validated data
 * @private
 */
function renderChartsWithData(targetContainer, recordMesgs, startTime) {
    // Get theme configuration for consistent theming
    const themeConfig = getThemeConfig();

    // Ensure settings dropdowns exist
    ensureChartSettingsDropdowns(targetContainer);

    // Setup theme listener for real-time theme updates
    const settingsWrapper = document.getElementById("chartjs-settings-wrapper");
    setupChartThemeListener(targetContainer, settingsWrapper);

    // Get chart container
    let chartContainer = targetContainer
        ? typeof targetContainer === "string"
            ? document.getElementById(targetContainer)
            : targetContainer
        : document.getElementById("chartjs-chart-container");

    if (!chartContainer) {
        chartContainer = document.createElement("div");
        chartContainer.id = "chartjs-chart-container";
        chartContainer.style.cssText = `
			margin-top: 20px;
			padding: 20px;
			background: var(--color-shadow, rgba(0, 0, 0, 0.05));
			border-radius: 12px;
		`;

        const settingsWrapper = document.getElementById("chartjs-settings-wrapper");
        if (settingsWrapper && settingsWrapper.parentNode) {
            settingsWrapper.parentNode.insertBefore(chartContainer, settingsWrapper.nextSibling);
        } else {
            document.body.appendChild(chartContainer);
        }
    }

    // Clear existing charts and remove any hover effects
    removeChartHoverEffects(chartContainer);
    chartContainer.innerHTML = "";

    // Add user and device info box
    createUserDeviceInfoBox(chartContainer);

    // Get current settings
    const settings = getCurrentSettings();
    const {
        maxpoints: maxPoints,
        chartType,
        interpolation,
        animation: animationStyle,
        showGrid,
        showLegend,
        showTitle,
        showPoints,
        showFill,
        smoothing,
        colors: customColors,
    } = settings;

    // Convert boolean settings from strings
    const boolSettings = {
        showGrid: showGrid !== "off",
        showLegend: showLegend !== "off",
        showTitle: showTitle !== "off",
        showPoints: showPoints === "on",
        showFill: showFill === "on",
    };

    // Prepare zoom plugin config
    const zoomPluginConfig = {
        pan: {
            enabled: true,
            mode: "x",
            modifierKey: null, // Allow panning without modifier key
        },
        zoom: {
            wheel: {
                enabled: true,
                speed: 0.1,
            },
            pinch: {
                enabled: true,
            },
            drag: {
                enabled: true,
                backgroundColor: themeConfig.colors.primaryAlpha || "rgba(59, 130, 246, 0.2)",
                borderColor: themeConfig.colors.primary || "rgba(59, 130, 246, 0.8)",
                borderWidth: 2,
                modifierKey: "shift", // Require shift key for drag selection
            },
            mode: "x",
        },
        limits: {
            x: {
                min: "original",
                max: "original",
            },
        },
    };
    // Get theme from options or fallback to system
    const currentTheme = detectCurrentTheme();
    console.log("[renderChartsWithData] Detected theme:", currentTheme);

    // Process data
    const data = recordMesgs; // Use the record messages
    const labels = data.map((row, i) => {
        // Convert timestamp to relative seconds from start time
        if (row.timestamp && startTime) {
            let timestamp;
            let startTimestamp;

            // Handle different timestamp formats
            if (row.timestamp instanceof Date) {
                timestamp = row.timestamp.getTime() / 1000; // Convert to seconds
            } else if (typeof row.timestamp === "number") {
                // Check if timestamp is in milliseconds (very large number) or seconds
                timestamp = row.timestamp > 1000000000000 ? row.timestamp / 1000 : row.timestamp;
            } else {
                return i; // fallback to index if timestamp is invalid
            }

            if (typeof startTime === "number") {
                startTimestamp = startTime > 1000000000000 ? startTime / 1000 : startTime;
            } else if (startTime instanceof Date) {
                startTimestamp = startTime.getTime() / 1000;
            } else {
                return i; // fallback to index if startTime is invalid
            }

            return Math.round(timestamp - startTimestamp);
        }
        return i; // fallback to index
    }); // Define fields to process for charts - updated to match actual FIT file field names
    // Use chartFields imported from chartFields.js for consistency
    // (imported at the top: import { chartFields } from "./chartFields.js";)
    let visibleFieldCount = 0; // Process each field
    chartFields.forEach((field) => {
        // Check field visibility
        const visibility = localStorage.getItem(`chartjs_field_${field}`);
        if (visibility === "hidden") {
            return; // Skip this field
        }
        // Extract numeric data with unit conversion and better debugging
        const numericData = data.map((row, index) => {
            if (row[field] !== undefined && row[field] !== null) {
                let value = parseFloat(row[field]);

                // Apply unit conversion based on user preferences
                if (!isNaN(value)) {
                    value = convertValueToUserUnits(value, field);
                }

                if (index < 3) {
                    // Debug first few rows
                    console.log(
                        `[ChartJS] Field ${field}, row ${index}: raw=${row[field]}, converted=${value} ${getUnitSymbol(
                            field
                        )}`
                    );
                }
                return isNaN(value) ? null : value;
            }
            return null;
        });

        const validDataCount = numericData.filter((val) => val !== null).length;
        console.log(`[ChartJS] Field ${field}: ${validDataCount} valid data points out of ${numericData.length}`);

        // Skip if no valid data
        if (numericData.every((val) => val === null)) {
            console.log(`[ChartJS] Skipping field ${field} - no valid data`);
            return;
        }

        visibleFieldCount++;
        const canvas = createChartCanvas(field, visibleFieldCount);
        chartContainer.appendChild(canvas);

        // Prepare chart data for enhanced chart with comprehensive unit conversion
        let chartData = data
            .map((row, i) => {
                let value = row[field] ?? null;

                // Apply unit conversion based on user preferences
                if (value !== null && typeof value === "number") {
                    value = convertValueToUserUnits(value, field);
                }

                return {
                    x: labels[i],
                    y: value,
                };
            })
            .filter((point) => point.y !== null);

        console.log(`[ChartJS] Field ${field}: prepared ${chartData.length} chart data points`);

        // Apply data point limiting
        if (maxPoints !== "all" && chartData.length > maxPoints) {
            const step = Math.ceil(chartData.length / maxPoints);
            chartData = chartData.filter((_, i) => i % step === 0);
            console.log(`[ChartJS] Field ${field}: limited to ${chartData.length} points (max: ${maxPoints})`);
        }
        // Create enhanced chart
        const chart = createEnhancedChart(canvas, {
            field,
            chartData,
            chartType,
            interpolation,
            animationStyle,
            showGrid: boolSettings.showGrid,
            showLegend: boolSettings.showLegend,
            showTitle: boolSettings.showTitle,
            showPoints: boolSettings.showPoints,
            showFill: boolSettings.showFill,
            smoothing,
            customColors,
            zoomPluginConfig,
            fieldLabels,
            theme: currentTheme,
        });
        if (chart) {
            window._chartjsInstances.push(chart);
        }
    });
    renderEventMessagesChart(
        chartContainer,
        {
            showGrid: boolSettings.showGrid,
            showLegend: boolSettings.showLegend,
            showTitle: boolSettings.showTitle,
            zoomPluginConfig,
            theme: currentTheme,
        },
        startTime
    );

    renderTimeInZoneCharts(chartContainer, {
        showGrid: boolSettings.showGrid,
        showLegend: boolSettings.showLegend,
        showTitle: boolSettings.showTitle,
        zoomPluginConfig,
        theme: currentTheme,
    });

    // Render lap zone charts
    renderLapZoneCharts(chartContainer, {
        showGrid: boolSettings.showGrid,
        showLegend: boolSettings.showLegend,
        showTitle: boolSettings.showTitle,
        zoomPluginConfig,
        theme: currentTheme,
    }); // Render GPS track chart if position data is available
    renderGPSTrackChart(chartContainer, data, {
        showGrid: boolSettings.showGrid,
        showLegend: boolSettings.showLegend,
        showTitle: boolSettings.showTitle,
        zoomPluginConfig,
        theme: currentTheme,
        maxPoints,
        showPoints: boolSettings.showPoints,
    });

    // Render performance analysis charts
    renderPerformanceAnalysisCharts(chartContainer, data, labels, {
        showGrid: boolSettings.showGrid,
        showLegend: boolSettings.showLegend,
        showTitle: boolSettings.showTitle,
        zoomPluginConfig,
        theme: currentTheme,
        maxPoints,
        chartType,
        interpolation,
        animationStyle,
        showPoints: boolSettings.showPoints,
        showFill: boolSettings.showFill,
        smoothing,
        customColors,
    });
    // Count total rendered charts by checking the _chartjsInstances array
    const totalChartsRendered = window._chartjsInstances ? window._chartjsInstances.length : 0;

    // Handle no charts case
    if (totalChartsRendered === 0 && visibleFieldCount === 0) {
        chartContainer.innerHTML =
            '<div class="no-data-message">No visible metrics selected. Enable metrics in the "Visible Metrics" section above.</div>';
    } else if (totalChartsRendered === 0) {
        chartContainer.innerHTML =
            '<div class="no-data-message">No suitable numeric data available for selected chart type.</div>';
    }

    // Performance logging
    const endTime = performance.now();
    console.log(`[ChartJS] Rendered ${totalChartsRendered} charts in ${(endTime - startTime).toFixed(2)}ms`);

    // Check if this is a meaningful render that warrants a notification
    const shouldShowNotification = shouldShowRenderNotification(totalChartsRendered, visibleFieldCount);

    if (shouldShowNotification && totalChartsRendered > 0) {
        const message =
            totalChartsRendered === 1
                ? "Chart rendered successfully"
                : `Rendered ${totalChartsRendered} charts successfully`;

        console.log(`[ChartJS] Showing success notification: "${message}"`);

        // Use setTimeout to ensure notification shows after any DOM changes
        setTimeout(() => {
            showNotification(message, "success", 3000);
        }, 100);
    } else {
        console.log(
            `[ChartJS] No notification shown - shouldShow: ${shouldShowNotification}, totalChartsRendered: ${totalChartsRendered}`
        );
    }

    // Add hover effects to all rendered charts
    if (totalChartsRendered > 0) {
        // Get theme configuration for hover effects
        let themeConfig;
        if (window.getThemeConfig) {
            themeConfig = window.getThemeConfig();
        } else {
            // Use the established theme configuration
            themeConfig = getThemeConfig();
        }

        // Add hover effects to charts
        addChartHoverEffects(chartContainer, themeConfig);
    }

    return true;
}

/**
 * Updates the previous chart state tracking
 * @param {number} chartCount - Current chart count
 * @param {number} visibleFields - Current visible field count
 * @param {number} timestamp - Current timestamp
 */
export function updatePreviousChartState(chartCount, visibleFields, timestamp) {
    previousChartState.chartCount = chartCount;
    previousChartState.fieldsRendered = new Array(visibleFields).fill(true);
    previousChartState.lastRenderTimestamp = timestamp;
}

/**
 * Resets the chart state tracking - call when loading a new FIT file
 * This ensures notifications are shown for the first render of a new file
 */
export function resetChartNotificationState() {
    previousChartState.chartCount = 0;
    previousChartState.fieldsRendered = [];
    previousChartState.lastRenderTimestamp = 0;
    console.log("[ChartJS] Chart notification state reset for new file");
}

// Expose to window for development
if (typeof window !== "undefined") {
    window.addHoverEffectsToExistingCharts = addHoverEffectsToExistingCharts;
}
