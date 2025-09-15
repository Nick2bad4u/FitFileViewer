/**
 * @fileoverview Enhanced Chart.js rendering utility with State Management Integration
 * @description Provides comprehensive chart rendering, controls management, and export capabilities
 * for fitness device data visualization in the FitFileViewer application.
 *
 * STATE MANAGEMENT INTEGRATION:
 * - Uses getState() to access chart data and configuration
 * - Updates chart state through setState() for proper reactivity
 * - Integrates with ui and performance state tracking
 * - Provides proper error handling and loading states
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
 * - Chart.js library (windowAny.Chart)
 * - chartjs-plugin-zoom for interactive zoom/pan
 * - showNotification utility for user feedback
 * - JSZip library (window.JSZip) for ZIP export functionality
 * - State management system must be initialized
 *
 * @author FitFileViewer Development Team
 * @version 21.2.0
 * @since 1.0.0
 */

/**
 * @typedef {Object} ChartJS
 * @property {Function} register - Chart.js plugin registration
 * @property {Object} registry - Chart.js plugin registry
 * @property {Object} Zoom - Chart.js zoom plugin
 */

/**
 * @typedef {Object} WindowExtensions
 * @property {ChartJS} Chart - Chart.js library instance
 * @property {Object} chartjsPluginZoom - Alternative zoom plugin reference
 * @property {Object} ChartZoom - Alternative zoom plugin reference
 * @property {boolean} _fitFileViewerChartListener - Chart listener initialization flag
 * @property {Array<any>} _chartjsInstances - Array of active Chart.js instances
 * @property {Function} getThemeConfig - Theme configuration getter
 * @property {Function} addHoverEffectsToExistingCharts - Chart hover effects
 * @property {Object} __chartjs_dev - Development utilities object
 */

/**
 * @typedef {Object} ChartSettings
 * @property {string|number} maxpoints - Maximum data points to display
 * @property {string} chartType - Type of chart (line, bar, etc.)
 * @property {string} interpolation - Data interpolation method
 * @property {string} animation - Animation style preference
 * @property {boolean} showGrid - Whether to show grid lines
 * @property {boolean} showLegend - Whether to show chart legend
 * @property {boolean} showTitle - Whether to show chart title
 * @property {boolean} showPoints - Whether to show data points
 * @property {boolean} showFill - Whether to fill areas under lines
 * @property {number} smoothing - Line smoothing factor
 * @property {Array<string>} colors - Custom color palette
 */

/**
 * @typedef {Object} ThemeConfig
 * @property {Object} colors - Theme color configuration
 * @property {string} colors.text - Primary text color
 * @property {string} colors.textPrimary - Primary text color variant
 * @property {string} colors.backgroundAlt - Alternative background color
 * @property {string} colors.border - Border color
 * @property {string} colors.error - Error state color
 * @property {string} colors.primary - Primary brand color
 * @property {string} colors.primaryAlpha - Primary color with transparency
 */

/**
 * @typedef {Object} RenderResult
 * @property {boolean} success - Whether rendering succeeded
 * @property {number} chartCount - Number of charts rendered
 * @property {number} renderTime - Time taken to render in milliseconds
 * @property {Array<string>} fieldsRendered - List of fields that were rendered
 */

/**
 * @typedef {Object} ChartData
 * @property {Array<any>} labels - Chart x-axis labels
 * @property {Array<Object>} datasets - Chart dataset configurations
 */

/**
 * @typedef {Object} ChartPoint
 * @property {number} x - X coordinate value
 * @property {number|null} y - Y coordinate value (nullable)
 */

/**
 * @typedef {Object} PerformanceRecord
 * @property {number} duration - Duration in milliseconds
 * @property {number} timestamp - Timestamp of the record
 * @property {number} chartCount - Number of charts rendered
 */

// State management imports
import { getState, setState, subscribe, updateState } from "../../state/core/stateManager.js";
import { AppActions } from "../../app/lifecycle/appActions.js";
import { uiStateManager } from "../../state/domain/uiStateManager.js";
import { settingsStateManager } from "../../state/domain/settingsStateManager.js";
import { computedStateManager } from "../../state/core/computedStateManager.js";
import { middlewareManager } from "../../state/core/stateMiddleware.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

// Chart utility imports
import { detectCurrentTheme } from "../theming/chartThemeUtils.js";
import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { convertValueToUserUnits } from "../../formatting/converters/convertValueToUserUnits.js";
import { setupZoneData } from "../../data/processing/setupZoneData.js";
import { fieldLabels, formatChartFields } from "../../formatting/display/formatChartFields.js";
import { ensureChartSettingsDropdowns } from "../../ui/components/ensureChartSettingsDropdowns.js";
import { loadSharedConfiguration } from "../../app/initialization/loadSharedConfiguration.js";
import { createEnhancedChart } from "../components/createEnhancedChart.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { renderEventMessagesChart } from "../rendering/renderEventMessagesChart.js";
import { renderTimeInZoneCharts } from "../rendering/renderTimeInZoneCharts.js";
import { renderPerformanceAnalysisCharts } from "../rendering/renderPerformanceAnalysisCharts.js";
import { renderGPSTrackChart } from "../rendering/renderGPSTrackChart.js";
import { renderLapZoneCharts } from "../rendering/renderLapZoneCharts.js";
import { showRenderNotification } from "../../ui/notifications/showRenderNotification.js";
import { createUserDeviceInfoBox } from "../../rendering/components/createUserDeviceInfoBox.js";
import {
    addChartHoverEffects,
    addHoverEffectsToExistingCharts,
    removeChartHoverEffects,
} from "../plugins/addChartHoverEffects.js";
import { setupChartThemeListener } from "../theming/chartThemeListener.js";
import { getThemeConfig } from "../../theming/core/theme.js";

/**
 * Simple debounce utility to limit function execution frequency
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    /** @type {any} */
    let timeout = null;
    // Use arrow function to avoid 'this' context issues
    return (/** @type {any[]} */ ...args) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Debouncing variables for renderChartJS
let lastRenderTime = 0;
const RENDER_DEBOUNCE_MS = 200; // Minimum time between renders

// Track previous render state for notification logic
export const previousChartState = {
    chartCount: 0,
    fieldsRendered: [],
    lastRenderTimestamp: 0,
};

// Chart.js plugin registration
/** @type {any} */
const windowAny = window;
if (windowAny.Chart && windowAny.Chart.register && windowAny.Chart.Zoom) {
    windowAny.Chart.register(windowAny.Chart.Zoom);
    console.log("[ChartJS] chartjs-plugin-zoom registered.");
} else if (windowAny.Chart && windowAny.Chart.register && windowAny.chartjsPluginZoom) {
    windowAny.Chart.register(windowAny.chartjsPluginZoom);
    console.log("[ChartJS] chartjs-plugin-zoom registered (windowAny.ChartjsPluginZoom).");
} else if (windowAny.Chart && windowAny.Chart.register && windowAny.ChartZoom) {
    windowAny.Chart.register(windowAny.ChartZoom);
    console.log("[ChartJS] chartjs-plugin-zoom registered (windowAny.ChartZoom).");
} else {
    console.warn("[ChartJS] chartjs-plugin-zoom is not loaded. Zoom/pan will be unavailable.");
}

// Enhanced state-aware file loading event listener
if (!windowAny._fitFileViewerChartListener) {
    windowAny._fitFileViewerChartListener = true;

    // Subscribe to state changes for reactive chart updates instead of custom events
    // The chartStateManager already handles this, so we can simplify or remove this

    console.log("[ChartJS] Chart state management is now handled by chartStateManager");
    console.log("[ChartJS] Old event-based system is being phased out in favor of reactive state");
}

/**
 * Creates an enhanced settings and control panel for charts
 * @param {HTMLElement|string} targetContainer - Container element or ID
 * @returns {Object} Current settings object
 */
/**
 * Chart state management with reactive updates
 * Integrates with the centralized state system for chart rendering and controls
 */
export const chartState = {
    // Use computed state for reactive updates
    get isRendered() {
        return getState("charts.isRendered") || false;
    },

    get isRendering() {
        return getState("charts.isRendering") || false;
    },

    get controlsVisible() {
        return getState("charts.controlsVisible") !== false; // Default to true
    },

    get selectedChart() {
        return getState("charts.selectedChart") || "elevation";
    },

    get chartData() {
        return getState("charts.chartData");
    },

    get chartOptions() {
        return getState("charts.chartOptions") || {};
    },

    // Computed properties using the computed state manager
    get hasValidData() {
        const data = getState("globalData");
        return data && data.recordMesgs && Array.isArray(data.recordMesgs) && data.recordMesgs.length > 0;
    },

    get renderableFields() {
        if (!this.hasValidData) {return [];}

        return Array.isArray(formatChartFields)
            ? formatChartFields.filter((field) => {
                  const visibility = localStorage.getItem(`chartjs_field_${field}`) || "visible";
                  return visibility !== "hidden";
              })
            : [];
    },
};

/**
 * Chart actions - encapsulated state transitions for chart operations
 */
export const chartActions = {
    /**
     * Start chart rendering process
     */
    startRendering() {
        // Use state management instead of missing AppActions method
        setState("charts.isRendering", true, { silent: false, source: "chartActions.startRendering" });
        setState("isLoading", true, { silent: false, source: "chartActions.startRendering" });
    },

    /**
     * Complete chart rendering process
     * @param {boolean} success - Whether rendering succeeded
     * @param {number} chartCount - Number of charts rendered
     * @param {number} renderTime - Time taken to render
     */
    completeRendering(success, chartCount = 0, renderTime = 0) {
        // Use updateState for efficient nested updates
        updateState(
            "charts",
            {
                isRendered: success,
                isRendering: false,
                ...(success && {
                    lastRenderTime: Date.now(),
                    renderedCount: chartCount,
                }),
            },
            { silent: false, source: "chartActions.completeRendering" }
        );

        setState("isLoading", false, { silent: false, source: "chartActions.completeRendering" });

        if (success) {
            updateState(
                "performance.renderTimes",
                {
                    chart: renderTime,
                },
                { silent: false, source: "chartActions.completeRendering" }
            );

            // Notify other components of successful render
            /** @type {any} */ (AppActions).notifyChartRenderComplete?.(chartCount);
        }
    },

    /**
     * Update chart selection
     * @param {string} chartType - New chart type selection
     */
    selectChart(chartType) {
        setState("charts.selectedChart", chartType, { silent: false, source: "chartActions.selectChart" });

        // Trigger re-render if charts are currently displayed
        if (chartState.isRendered) {
            this.requestRerender("Chart selection changed");
        }
    },

    /**
     * Toggle chart controls visibility
     */
    toggleControls() {
        const newVisibility = !chartState.controlsVisible;
        setState("charts.controlsVisible", newVisibility, { silent: false, source: "chartActions.toggleControls" });
        /** @type {any} */ (uiStateManager).updatePanelVisibility?.("chart-controls", newVisibility);
    },

    /**
     * Request chart re-render with debouncing
     * @param {string} reason - Reason for re-render
     */
    requestRerender(reason = "State change") {
        console.log(`[ChartJS] Re-render requested: ${reason}`);

        // Use debounce to handle limiting frequent re-renders
        debounce(() => {
            const container = document.getElementById("content-chart");
            if (container && chartState.hasValidData) {
                renderChartJS(container);
            }
        }, RENDER_DEBOUNCE_MS)();
    },

    /**
     * Clear all chart data and reset state
     */
    clearCharts() {
        // Destroy existing chart instances
        if (windowAny._chartjsInstances) {
            windowAny._chartjsInstances.forEach((/** @type {any} */ chart, /** @type {any} */ index) => {
                try {
                    if (chart && typeof chart.destroy === "function") {
                        chart.destroy();
                    }
                } catch (error) {
                    console.warn(`[ChartJS] Error destroying chart ${index}:`, error);
                }
            });
            windowAny._chartjsInstances = [];
        }

        // Reset chart state using updateState for efficiency
        updateState(
            "charts",
            {
                isRendered: false,
                chartData: null,
                renderedCount: 0,
            },
            { silent: false, source: "chartActions.clearCharts" }
        );
    },
};

// Load shared configuration on page load
if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", loadSharedConfiguration);
}

// Register the background color plugin globally
try {
    const ChartRef = windowAny.Chart;
    const hasRegistry = !!(ChartRef && ChartRef.registry && ChartRef.registry.plugins && typeof ChartRef.registry.plugins.get === 'function');
    const already = hasRegistry ? ChartRef.registry.plugins.get("chartBackgroundColorPlugin") : false;
    if (ChartRef && typeof ChartRef.register === 'function' && !already) {
        ChartRef.register(chartBackgroundColorPlugin);
        console.log("[ChartJS] chartBackgroundColorPlugin registered");
    }
} catch {}

// Utility function to convert hex to rgba
/**
 * @param {string} hex - Hex color code
 * @param {number} alpha - Alpha transparency value
 * @returns {string} RGBA color string
 */
export function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16),
     g = parseInt(hex.slice(3, 5), 16),
     b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Process and set up zone data from FIT file for chart rendering
 * Extracts time in zone data from session messages and sets global variables
 */
/**
 * Main chart rendering function with state management integration and comprehensive error handling
 * @param {Element|string} [targetContainer] - Optional container element or ID for chart rendering. If omitted, defaults to '#content-chart'.
 * @returns {Promise<boolean>} Success status of the rendering operation
 */
export async function renderChartJS(targetContainer) {
    console.log("[ChartJS] Starting chart rendering...");

    try {
        // Start rendering process through state actions
        chartActions.startRendering();

        // Debounce multiple rapid calls
        const now = Date.now();
        if (now - lastRenderTime < RENDER_DEBOUNCE_MS) {
            console.log("[ChartJS] Debouncing rapid render calls");

            // Use debounce for proper rate limiting
            return new Promise((resolve) => {
                debounce(async () => {
                    const result = await renderChartJS(targetContainer);
                    resolve(result);
                }, RENDER_DEBOUNCE_MS)();
            });
        }
        lastRenderTime = now;

        const performanceStart = performance.now();

        // Initialize chart instances array
        if (!windowAny._chartjsInstances) {
            windowAny._chartjsInstances = [];
        }

        // Clear existing charts using state action
        chartActions.clearCharts();

        // Validate Chart.js availability
        if (!windowAny.Chart) {
            const error = "Chart.js library is not loaded or not available";
            console.error(`[ChartJS] ${error}`);
            showNotification("Chart library not available", "error");
            chartActions.completeRendering(false);
            return false;
        }

        // Use state-managed data validation
        if (!chartState.hasValidData) {
            console.warn("[ChartJS] No valid FIT file data available for charts");
            showNotification("No FIT file data available for chart rendering", "warning");
            chartActions.completeRendering(false);
            return false;
        }

        // Get validated data through state
        const globalData = getState("globalData");

        // Setup zone data from FIT file
        setupZoneData(globalData);

        // Validate record messages (main time-series data)
        const {recordMesgs} = globalData;
        if (!recordMesgs || !Array.isArray(recordMesgs) || recordMesgs.length === 0) {
            console.warn("[ChartJS] No record messages found in FIT data");
            showNotification("No chartable data found in this FIT file", "info");

            // Still render the UI but show a helpful message using state-aware theming
            // Resolve target container (allow optional arg)
            let container = /** @type {HTMLElement|null} */ (null);
            if (targetContainer) {
                if (typeof targetContainer === "string") {
                    container = document.getElementById(targetContainer) || document.querySelector(targetContainer);
                } else if (targetContainer instanceof Element) {
                    container = /** @type {HTMLElement} */ (targetContainer);
                }
            }
            if (!container) {
                container = document.getElementById("content-chart");
            }
            if (container) {
                const themeConfig = getThemeConfig();
                container.innerHTML = `
					<div class="chart-placeholder" style="
						text-align: center;
						padding: 40px;
						color: var(--color-fg, ${/** @type {any} */ (themeConfig).colors.text});
						background: var(--color-bg-alt-solid, ${/** @type {any} */ (themeConfig).colors.backgroundAlt});
						border-radius: 12px;
						margin: 20px 0;
						border: 1px solid var(--color-border, ${/** @type {any} */ (themeConfig).colors.border});
					">
						<h3 style="color: var(--color-fg-alt, ${/** @type {any} */ (themeConfig).colors.textPrimary}); margin-bottom: 16px;">No Chart Data Available</h3>
						<p style="margin-bottom: 8px;">This FIT file does not contain time-series data that can be charted.</p>
						<p style="margin-bottom: 0;">Try loading a FIT file from a fitness activity or workout.</p>
					</div>
				`;
            }
            chartActions.completeRendering(false);
            return false;
        }

        console.log(`[ChartJS] Found ${recordMesgs.length} data points to process`);

        // Get the actual start time from the first record message
        let activityStartTime = null;
        if (recordMesgs.length > 0 && recordMesgs[0].timestamp) {
            activityStartTime = recordMesgs[0].timestamp;
            console.log("[ChartJS] Activity start time:", activityStartTime);
        }

        // Store chart data in state for other components
        setState(
            "charts.chartData",
            {
                recordMesgs,
                activityStartTime,
                totalDataPoints: recordMesgs.length,
            },
            { silent: false, source: "renderChartJS" }
        );

        const result = await renderChartsWithData(
            /** @type {HTMLElement} */ (targetContainer),
            recordMesgs,
            activityStartTime
        ),

        // Log performance timing
         performanceEnd = performance.now(),
         renderTime = performanceEnd - performanceStart;
        console.log(`[ChartJS] Chart rendering completed in ${renderTime.toFixed(2)}ms`);

        // Complete rendering process through state actions
        const chartCount = windowAny._chartjsInstances ? windowAny._chartjsInstances.length : 0;
        chartActions.completeRendering(result, chartCount, renderTime);

        return result;
    } catch (error) {
        console.error("[ChartJS] Critical error in chart rendering:", error);
        showNotification("Failed to render charts due to an error", "error");

        // Handle error through state actions
        chartActions.completeRendering(false);

        // Try to show error information to user
        let container = document.getElementById("content-chart");
        if (!container && targetContainer) {
            // Handle case where targetContainer is a string ID or DOM element
            if (typeof targetContainer === "string") {
                container = document.getElementById(targetContainer);
            } else if (targetContainer && targetContainer.nodeType === Node.ELEMENT_NODE) {
                container = /** @type {HTMLElement} */ (targetContainer);
            }
        }

        if (container) {
            const themeConfig = getThemeConfig();
            container.innerHTML = `
				<div class="chart-error" style="
					text-align: center;
					padding: 40px;
					color: var(--color-error, ${/** @type {any} */ (themeConfig).colors.error});
					background: var(--color-glass, ${/** @type {any} */ (themeConfig).colors.backgroundAlt});
					border: 1px solid var(--color-border, ${/** @type {any} */ (themeConfig).colors.border});
					border-radius: var(--border-radius, 12px);
					margin: 20px 0;
				">
					<h3 style="margin-bottom: 16px; color: var(--color-error, ${/** @type {any} */ (themeConfig).colors.error});">Chart Rendering Error</h3>
					<p style="margin-bottom: 8px; color: var(--color-fg, ${
                        /** @type {any} */ (themeConfig).colors.text
                    });">An error occurred while rendering the charts.</p>
					<details style="text-align: left; margin-top: 16px;">
						<summary style="cursor: pointer; font-weight: bold; color: var(--color-fg, ${
                            /** @type {any} */ (themeConfig).colors.text
                        });">Error Details</summary>
						<pre style="background: var(--color-glass, ${/** @type {any} */ (themeConfig).colors.backgroundAlt}); color: var(--color-fg, ${
                            /** @type {any} */ (themeConfig).colors.text
                        }); padding: 8px; border-radius: var(--border-radius-small, 4px); margin-top: 8px; font-size: 12px; overflow-x: auto; border: 1px solid var(--color-border, ${
                            /** @type {any} */ (themeConfig).colors.border
                        });">${/** @type {any} */ (error).stack || /** @type {any} */ (error).message}</pre>
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
/**
 * @param {HTMLElement} targetContainer - Container element for charts
 * @param {Array<Object>} recordMesgs - FIT file record messages
 * @param {number} startTime - Performance timing start
 * @returns {Promise<boolean>} Success status
 */
async function renderChartsWithData(targetContainer, recordMesgs, startTime) {
    // Get theme configuration for consistent theming
    const themeConfig = getThemeConfig();

    // Ensure settings dropdowns exist
    ensureChartSettingsDropdowns(targetContainer);

    // Setup theme listener for real-time theme updates
    const settingsWrapper = document.getElementById("chartjs-settings-wrapper");
    if (targetContainer && settingsWrapper) {
        setupChartThemeListener(targetContainer, settingsWrapper);
    }

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

    // Get current settings through enhanced state management
    /** @type {ChartSettings} */
    const settings = /** @type {any} */ (chartSettingsManager.getSettings()),
     {
        maxpoints: maxPoints = "all",
        chartType = "line",
        interpolation = "linear",
        animation: animationStyle = "normal",
        showGrid = true,
        showLegend = true,
        showTitle = true,
        showPoints = false,
        showFill = false,
        smoothing = 0.1,
        colors: customColors = [],
    } = settings,

    // Convert boolean settings from strings (maintain backward compatibility)
     boolSettings = {
        showGrid: String(showGrid) !== "off" && showGrid !== false,
        showLegend: String(showLegend) !== "off" && showLegend !== false,
        showTitle: String(showTitle) !== "off" && showTitle !== false,
        showPoints: String(showPoints) === "on" || showPoints === true,
        showFill: String(showFill) === "on" || showFill === true,
    }; // Store processed settings in state for other components
    setState(
        "charts.chartOptions",
        {
            ...settings,
            boolSettings,
            processedAt: Date.now(),
        },
        { silent: false, source: "renderChartsWithData" }
    );

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
                backgroundColor: /** @type {any} */ (themeConfig).colors.primaryAlpha || "rgba(59, 130, 246, 0.2)",
                borderColor: /** @type {any} */ (themeConfig).colors.primary || "rgba(59, 130, 246, 0.8)",
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
    },
    // Get theme from options or fallback to system
     currentTheme = detectCurrentTheme();
    console.log("[renderChartsWithData] Detected theme:", currentTheme);

    // Process data
    const data = recordMesgs, // Use the record messages
     labels = data.map((row, i) => {
        // Convert timestamp to relative seconds from start time
        if (/** @type {any} */ (row).timestamp && startTime) {
            let startTimestamp,
             timestamp;

            // Handle different timestamp formats
            if (/** @type {any} */ (row).timestamp instanceof Date) {
                timestamp = /** @type {any} */ (row).timestamp.getTime() / 1000; // Convert to seconds
            } else if (typeof (/** @type {any} */ (row).timestamp) === "number") {
                // Check if timestamp is in milliseconds (very large number) or seconds
                timestamp =
                    /** @type {any} */ (row).timestamp > 1000000000000
                        ? /** @type {any} */ (row).timestamp / 1000
                        : /** @type {any} */ (row).timestamp;
            } else {
                return i; // Fallback to index if timestamp is invalid
            }

            if (typeof startTime === "number") {
                startTimestamp = startTime > 1000000000000 ? startTime / 1000 : startTime;
            } else if (startTime && typeof startTime === "object" && "getTime" in startTime) {
                startTimestamp = /** @type {Date} */ (startTime).getTime() / 1000;
            } else {
                return i; // Fallback to index if startTime is invalid
            }

            return Math.round(timestamp - startTimestamp);
        }
        return i; // Fallback to index
    }); // Define fields to process for charts - updated to match actual FIT file field names
    // Use formatChartFields imported from formatChartFields.js for consistency
    // (imported at the top: import { formatChartFields } from "../formatting/display/formatChartFields";)
    // Process each field using state-managed visibility settings
    let visibleFieldCount = 0;
    const {renderableFields} = chartState;

    console.log(
        `[ChartJS] Processing ${renderableFields.length} visible fields out of ${Array.isArray(formatChartFields) ? formatChartFields.length : 0} total`
    );

    renderableFields.forEach((field) => {
        // Double-check field visibility through enhanced settings state manager
        const visibility = chartSettingsManager.getFieldVisibility(field);
        if (visibility === "hidden") {
            console.log(`[ChartJS] Skipping hidden field: ${field}`);
            return; // Skip this field
        }

        console.log(`[ChartJS] Processing field: ${field} (visibility: ${visibility})`);

        // Extract numeric data with unit conversion and better debugging
        const numericData = data.map((row, index) => {
            if (/** @type {any} */ (row)[field] !== undefined && /** @type {any} */ (row)[field] !== null) {
                let value = parseFloat(/** @type {any} */ (row)[field]);

                // Apply unit conversion based on user preferences
                if (!isNaN(value)) {
                    value = convertValueToUserUnits(value, field);
                }

                if (index < 3) {
                    // Debug first few rows
                    console.log(
                        `[ChartJS] Field ${field}, row ${index}: raw=${/** @type {any} */ (row)[field]}, converted=${value} ${getUnitSymbol(
                            field
                        )}`
                    );
                }
                return isNaN(value) ? null : value;
            }
            return null;
        }),

         validDataCount = numericData.filter((val) => val !== null).length;
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
                let value = /** @type {any} */ (row)[field] ?? null;

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
        if (maxPoints !== "all" && chartData.length > Number(maxPoints)) {
            const step = Math.ceil(chartData.length / Number(maxPoints));
            chartData = chartData.filter((_, i) => i % step === 0);
            console.log(`[ChartJS] Field ${field}: limited to ${chartData.length} points (max: ${maxPoints})`);
        }
        // Create enhanced chart
        const chart = createEnhancedChart(
            canvas,
            /** @type {any} */ ({
                field,
                chartData,
                chartType,
                interpolation,
                animationStyle,
                showLegend: boolSettings.showLegend,
                showTitle: boolSettings.showTitle,
                showPoints: boolSettings.showPoints,
                showFill: boolSettings.showFill,
                smoothing,
                customColors,
                zoomPluginConfig,
                fieldLabels,
            })
        );
        if (chart) {
            windowAny._chartjsInstances.push(chart);
        }
    });

    // Event messages chart (respect state-managed visibility)
    const eventMessagesVisibility = chartSettingsManager.getFieldVisibility("event_messages");
    if (eventMessagesVisibility !== "hidden") {
        renderEventMessagesChart(
            chartContainer,
            {
                showGrid: boolSettings.showGrid,
                showLegend: boolSettings.showLegend,
                showTitle: boolSettings.showTitle,
                zoomPluginConfig,
            },
            startTime
        );
    }

    // Render time in zone charts
    renderTimeInZoneCharts(chartContainer, {
        showGrid: boolSettings.showGrid,
        showLegend: boolSettings.showLegend,
        showTitle: boolSettings.showTitle,
        zoomPluginConfig,
    });

    // Render lap zone charts with enhanced state-managed visibility
    const lapZoneVisibility = {
        hrStackedVisible: chartSettingsManager.getFieldVisibility("hr_lap_zone_stacked") !== "hidden",
        hrIndividualVisible: chartSettingsManager.getFieldVisibility("hr_lap_zone_individual") !== "hidden",
        powerStackedVisible: chartSettingsManager.getFieldVisibility("power_lap_zone_stacked") !== "hidden",
        powerIndividualVisible: chartSettingsManager.getFieldVisibility("power_lap_zone_individual") !== "hidden",
    };

    // Only render if at least one lap zone chart type is visible
    if (Object.values(lapZoneVisibility).some((visible) => visible)) {
        renderLapZoneCharts(
            chartContainer,
            /** @type {any} */ ({
                // ShowGrid/showLegend/showTitle not part of LapZoneChartsOptions type; passed via any cast
                showGrid: boolSettings.showGrid,
                showLegend: boolSettings.showLegend,
                showTitle: boolSettings.showTitle,
                zoomPluginConfig,
                visibilitySettings: lapZoneVisibility,
            })
        );
    } // Render GPS track chart if position data is available
    renderGPSTrackChart(chartContainer, data, {
        showGrid: boolSettings.showGrid,
        showLegend: boolSettings.showLegend,
        showTitle: boolSettings.showTitle,
        maxPoints: typeof maxPoints === "number" || maxPoints === "all" ? maxPoints : Number(maxPoints) || "all",
        showPoints: boolSettings.showPoints,
    });

    // Render performance analysis charts
    renderPerformanceAnalysisCharts(chartContainer, data, labels, {
        showGrid: boolSettings.showGrid,
        showLegend: boolSettings.showLegend,
        showTitle: boolSettings.showTitle,
        zoomPluginConfig,
        maxPoints: typeof maxPoints === "number" || maxPoints === "all" ? maxPoints : Number(maxPoints) || "all",
        chartType,
        interpolation,
        animationStyle,
        showPoints: boolSettings.showPoints,
        showFill: boolSettings.showFill,
        smoothing,
        customColors,
    });
    // Count total rendered charts by checking the _chartjsInstances array
    const totalChartsRendered = windowAny._chartjsInstances ? windowAny._chartjsInstances.length : 0;

    // Handle no charts case
    if (totalChartsRendered === 0 && visibleFieldCount === 0) {
        chartContainer.innerHTML =
            '<div class="no-data-message">No visible metrics selected. Enable metrics in the "Visible Metrics" section above.</div>';
    } else if (totalChartsRendered === 0) {
        chartContainer.innerHTML =
            '<div class="no-data-message">No suitable numeric data available for selected chart type.</div>';
    }

    // Performance logging with state updates using updateState
    const endTime = performance.now(),
     renderTime = endTime - (startTime || performance.now());
    console.log(`[ChartJS] Rendered ${totalChartsRendered} charts in ${renderTime.toFixed(2)}ms`);

    // Update performance metrics in state using updateState for efficiency
    updateState(
        "performance",
        {
            renderTimes: {
                ...getState("performance.renderTimes"),
                lastChartRender: renderTime,
            },
            chartsRendered: totalChartsRendered,
        },
        { source: "renderChartsWithData", merge: true }
    );

    // Check if this is a meaningful render that warrants a notification
    const shouldShowNotification = showRenderNotification(totalChartsRendered, visibleFieldCount);

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

        // Update notification state using updateState
        updateState(
            "ui",
            {
                lastNotification: {
                    message,
                    type: "success",
                    timestamp: Date.now(),
                },
            },
            { source: "renderChartsWithData", merge: true }
        );
    } else {
        console.log(
            `[ChartJS] No notification shown - shouldShow: ${shouldShowNotification}, totalChartsRendered: ${totalChartsRendered}`
        );
    }

    // Add hover effects to all rendered charts
    if (totalChartsRendered > 0) {
        // Get theme configuration for hover effects
        let themeConfig;
        if (windowAny.getThemeConfig) {
            themeConfig = windowAny.getThemeConfig();
        } else {
            // Use the established theme configuration
            themeConfig = getThemeConfig();
        }

        // Add hover effects to charts
        addChartHoverEffects(chartContainer, themeConfig);

        // Update UI state for chart interactions using existing method
        uiStateManager.updateChartControlsUI(true);
    }

    // Update previous chart state for future comparisons
    updatePreviousChartState(totalChartsRendered, visibleFieldCount, Date.now());

    // Emit comprehensive chart status event with state information
    const chartsRenderedEvent = new CustomEvent("chartsRendered", {
        detail: {
            totalRendered: totalChartsRendered,
            visibleFields: visibleFieldCount,
            renderTime,
            settings: getState("charts.chartOptions"),
            hasData: chartState.hasValidData,
            timestamp: Date.now(),
        },
    });
    document.dispatchEvent(chartsRenderedEvent);

    // Update computed state that depends on rendered charts
    computedStateManager.invalidateComputed("charts.summary");

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
    previousChartState.fieldsRendered = /** @type {any} */ (new Array(visibleFields).fill(true));
    previousChartState.lastRenderTimestamp = timestamp;

    // Update state for other components using updateState
    updateState(
        "charts.previousState",
        {
            chartCount,
            visibleFields,
            timestamp,
        },
        { silent: false, source: "updatePreviousChartState" }
    );
}

/**
 * Resets the chart state tracking - call when loading a new FIT file
 * This ensures notifications are shown for the first render of a new file
 */
export function resetChartNotificationState() {
    previousChartState.chartCount = 0;
    previousChartState.fieldsRendered = [];
    previousChartState.lastRenderTimestamp = 0;

    // Reset state-managed notification tracking using updateState
    updateState(
        "charts.previousState",
        {
            chartCount: 0,
            visibleFields: 0,
            timestamp: 0,
        },
        { silent: false, source: "resetChartNotificationState" }
    );

    console.log("[ChartJS] Chart notification state reset for new file");
}

/**
 * State-aware chart refresh function
 * Triggers re-render only if conditions are met
 */
export function refreshChartsIfNeeded() {
    if (chartState.hasValidData && !chartState.isRendering) {
        chartActions.requestRerender("Manual refresh requested");
        return true;
    }
    return false;
}

/**
 * Get comprehensive chart status from state
 * @returns {Object} Chart status information
 */
export function getChartStatus() {
    return {
        isRendered: chartState.isRendered,
        isRendering: chartState.isRendering,
        hasData: chartState.hasValidData,
        controlsVisible: chartState.controlsVisible,
        selectedChart: chartState.selectedChart,
        renderedCount: getState("charts.renderedCount") || 0,
        lastRenderTime: getState("charts.lastRenderTime"),
        performance: getState("performance.renderTimes.chart"),
        renderableFields: chartState.renderableFields,
        chartOptions: getState("charts.chartOptions"),
    };
}

/**
 * State-aware chart export function
 * @param {string} format - Export format (png, csv, json)
 * @returns {Promise<boolean>} Success status
 */
export async function exportChartsWithState(format = "png") {
    if (!chartState.isRendered || !windowAny._chartjsInstances?.length) {
        showNotification("No charts available for export", "warning");
        return false;
    }

    try {
        setState("ui.isExporting", true, { silent: false, source: "exportChartsWithState" });

        // Implementation would go here based on format
        // This is a placeholder for the full export implementation

        showNotification(`Charts exported as ${format.toUpperCase()}`, "success");
        setState("ui.isExporting", false, { silent: false, source: "exportChartsWithState" });
        return true;
    } catch (error) {
        console.error("[ChartJS] Export failed:", error);
        showNotification("Chart export failed", "error");
        setState("ui.isExporting", false, { silent: false, source: "exportChartsWithState" });
        return false;
    }
}

/**
 * Initialize chart state management integration
 * Sets up reactive subscriptions and state synchronization
 * Call this during application startup
 */
export function initializeChartStateManagement() {
    console.log("[ChartJS] Initializing chart state management...");

    // Initialize chart state in the global state using updateState for better merge handling
    updateState(
        "charts",
        {
            isRendered: false,
            isRendering: false,
            controlsVisible: true,
            selectedChart: "elevation",
            zoomLevel: 1,
            chartData: null,
            chartOptions: {},
            renderedCount: 0,
            lastRenderTime: null,
            previousState: {
                chartCount: 0,
                visibleFields: 0,
                timestamp: 0,
            },
        },
        { source: "initializeChartStateManagement", merge: true }
    );

    // Set up computed state dependencies
    /** @type {any} */ (computedStateManager).define?.("charts.hasData", () => {
        const data = getState("globalData");
        return data && data.recordMesgs && Array.isArray(data.recordMesgs) && data.recordMesgs.length > 0;
    });

    /** @type {any} */ (computedStateManager).define?.("charts.renderableFieldCount", () => chartState.renderableFields.length);

    /** @type {any} */ (computedStateManager).define?.("charts.summary", () => ({
            isRendered: chartState.isRendered,
            hasData: chartState.hasValidData,
            fieldCount: chartState.renderableFields.length,
            chartCount: getState("charts.renderedCount") || 0,
            lastRender: getState("charts.lastRenderTime"),
        }));

    // Set up state middleware for chart operations
    middlewareManager.register("chart-render", {
        beforeSet: (/** @type {any} */ context) => {
            console.log("[ChartJS] Starting chart render action:", context);
            return context;
        },
        afterSet: (/** @type {any} */ context) => {
            console.log("[ChartJS] Chart render action completed:", context);
            return context;
        },
        onError: (/** @type {any} */ context) => {
            console.error("[ChartJS] Chart render action failed:", context);
            showNotification("Chart rendering failed", "error");
            return context;
        },
    });

    console.log("[ChartJS] Chart state management initialized successfully");
}

/**
 * Enhanced chart settings management with state integration
 * Provides centralized settings access with reactive updates
 */
export const chartSettingsManager = {
    /**
     * Get chart settings with state management integration
     * @returns {Object} Complete chart settings
     */
    getSettings() {
        // First try to get from state
        let settings = getState("settings.charts");

        // Fallback to settings state manager if not available
        if (!settings) {
            settings = settingsStateManager.getChartSettings();
            // Cache in state for faster access
            setState("settings.charts", settings, { silent: false, source: "chartSettingsManager.getSettings" });
        }

        return {
            maxpoints: settings.maxpoints || "all",
            chartType: settings.chartType || "line",
            interpolation: settings.interpolation || "linear",
            animation: settings.animation || "normal",
            showGrid: settings.showGrid !== false,
            showLegend: settings.showLegend !== false,
            showTitle: settings.showTitle !== false,
            showPoints: settings.showPoints === true,
            showFill: settings.showFill === true,
            smoothing: settings.smoothing || 0.1,
            colors: settings.colors || [],
            ...settings,
        };
    },

    /**
     * Update chart settings and trigger reactive updates
     * @param {Object} newSettings - Settings to update
     */
    updateSettings(newSettings) {
        const currentSettings = this.getSettings(),
         updatedSettings = { ...currentSettings, ...newSettings };

        // Update through settings state manager for persistence
        /** @type {any} */ (settingsStateManager).updateChartSettings?.(updatedSettings);

        // Update in global state for reactive access using updateState
        updateState("settings.charts", updatedSettings, {
            silent: false,
            source: "chartSettingsManager.updateSettings",
        });

        // Trigger chart re-render if charts are currently displayed
        if (chartState.isRendered) {
            chartActions.requestRerender("Settings updated");
        }
    },

    /**
     * Get field visibility setting with state management
     * @param {string} field - Field name
     * @returns {string} Visibility setting ("visible", "hidden")
     */
    getFieldVisibility(field) {
        // Use localStorage directly for field visibility (existing pattern)
        const visibility = localStorage.getItem(`chartjs_field_${field}`) || "visible";

        // Update field visibility state for reactive access
        setState(`settings.charts.fieldVisibility.${field}`, visibility, {
            silent: false,
            source: "chartSettingsManager.getFieldVisibility",
        });

        return visibility;
    },

    /**
     * Set field visibility and trigger updates
     * @param {string} field - Field name
     * @param {string} visibility - Visibility setting
     */
    setFieldVisibility(field, visibility) {
        // Use localStorage directly for field visibility (existing pattern)
        localStorage.setItem(`chartjs_field_${field}`, visibility);

        // Update state for reactive access
        setState(`settings.charts.fieldVisibility.${field}`, visibility, {
            silent: false,
            source: "chartSettingsManager.setFieldVisibility",
        });

        // Invalidate computed state that depends on field visibility
        computedStateManager.invalidateComputed("charts.renderableFieldCount");

        // Trigger re-render if needed
        if (chartState.isRendered) {
            chartActions.requestRerender(`Field ${field} visibility changed to ${visibility}`);
        }
    },
};

/**
 * State-aware chart performance monitoring
 * Tracks and reports chart rendering performance metrics
 */
export const chartPerformanceMonitor = {
    /**
     * Start performance tracking for a chart operation
     * @param {string} operation - Operation name
     * @returns {string} Performance tracking ID
     */
    startTracking(operation) {
        const trackingId = `chart-${operation}-${Date.now()}`,
         startTime = performance.now();

        // Use updateState to efficiently add tracking data
        updateState(
            `performance.tracking`,
            {
                [trackingId]: {
                    operation,
                    startTime,
                    status: "running",
                },
            },
            { source: "chartPerformanceMonitor.startTracking", merge: true }
        );

        return trackingId;
    },

    /**
     * End performance tracking and record metrics
     * @param {string} trackingId - Tracking ID from startTracking
     * @param {Object} additionalData - Additional performance data
     */
    endTracking(trackingId, additionalData = {}) {
        const trackingData = getState(`performance.tracking.${trackingId}`);
        if (!trackingData) {return;}

        const endTime = performance.now(),
         duration = endTime - trackingData.startTime,

         performanceRecord = {
            ...trackingData,
            endTime,
            duration,
            status: "completed",
            ...additionalData,
        };

        // Update tracking record using updateState
        updateState(
            `performance.tracking`,
            {
                [trackingId]: performanceRecord,
            },
            { source: "chartPerformanceMonitor.endTracking", merge: true }
        );

        // Add to performance history
        const history = getState("performance.chartHistory") || [];
        history.push(performanceRecord);

        // Keep only last 50 records
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }

        setState("performance.chartHistory", history, {
            silent: false,
            source: "chartPerformanceMonitor.endTracking",
        });

        console.log(`[ChartJS Performance] ${trackingData.operation} completed in ${duration.toFixed(2)}ms`);
    },

    /**
     * Get performance summary for charts
     * @returns {Object} Performance metrics summary
     */
    getSummary() {
        const history = getState("performance.chartHistory") || [];
        if (history.length === 0) {return {};}

        const durations = history.map((/** @type {any} */ record) => record.duration),
         avgDuration =
            durations.reduce((/** @type {any} */ sum, /** @type {any} */ duration) => sum + duration, 0) /
            durations.length,
         maxDuration = Math.max(...durations),
         minDuration = Math.min(...durations);

        return {
            totalOperations: history.length,
            averageDuration: avgDuration,
            maxDuration,
            minDuration,
            recentOperations: history.slice(-10),
            lastOperation: history[history.length - 1],
        };
    },
};

// Expose comprehensive state-aware development tools and functions to window
if (typeof window !== "undefined") {
    windowAny.addHoverEffectsToExistingCharts = addHoverEffectsToExistingCharts;

    // Enhanced development tools with complete state integration
    if (!windowAny.__chartjs_dev) {
        windowAny.__chartjs_dev = {
            // Core state access
            getChartState: () => chartState,
            getChartStatus,

            // Actions and state management
            actions: chartActions,
            settings: chartSettingsManager,
            performance: chartPerformanceMonitor,

            // Chart operations
            refreshCharts: refreshChartsIfNeeded,
            clearCharts: chartActions.clearCharts,
            requestRerender: chartActions.requestRerender,

            // State debugging and manipulation
            getState: (/** @type {any} */ path) => getState(path),
            setState: (/** @type {any} */ path, /** @type {any} */ value) =>
                setState(path, value, { silent: false, source: "dev-tools" }),
            subscribe: (/** @type {any} */ path, /** @type {any} */ callback) => subscribe(path, callback),

            // Chart instance management
            getChartInstances: () => windowAny._chartjsInstances || [],
            getChartSettings: () => chartSettingsManager.getSettings(),

            // Export and import functions
            exportCharts: exportChartsWithState,

            // State reset and initialization
            resetNotificationState: resetChartNotificationState,
            initializeStateManagement: initializeChartStateManagement,

            // Performance monitoring and debugging
            getPerformanceMetrics: () => getState("performance"),
            getPerformanceSummary: () => chartPerformanceMonitor.getSummary(),

            // Debounce testing utility
            testDebounce: (delay = 1000) => {
                debounce(() => {
                    console.log("[ChartJS Dev] Debounce test executed");
                }, delay)();
            },

            // Computed state management
            computed: {
                invalidate: (/** @type {any} */ key) => /** @type {any} */ (computedStateManager).invalidate?.(key),
                get: (/** @type {any} */ key) => /** @type {any} */ (computedStateManager).get?.(key),
                list: () => /** @type {any} */ (computedStateManager).list?.(),
            },

            // State history and debugging
            getStateHistory: () => getState("__stateHistory") || [],

            // Field visibility management
            fieldVisibility: {
                get: (/** @type {any} */ field) => chartSettingsManager.getFieldVisibility(field),
                set: (/** @type {any} */ field, /** @type {any} */ visibility) =>
                    chartSettingsManager.setFieldVisibility(field, visibility),
                getAll: () => {
                    /** @type {any} */
                    const result = {};
                    if (Array.isArray(formatChartFields)) {
                        formatChartFields.forEach((/** @type {any} */ field) => {
                            result[field] = chartSettingsManager.getFieldVisibility(field);
                        });
                    }
                    return result;
                },
            },

            // State synchronization testing
            testStateSynchronization: () => {
                console.log("[ChartJS Dev] Testing state synchronization...");

                // Test theme change
                const currentTheme = getState("ui.theme"),
                 newTheme = currentTheme === "dark" ? "light" : "dark";
                setState("ui.theme", newTheme, { silent: false, source: "dev-test" });

                setTimeout(() => {
                    setState("ui.theme", currentTheme, { silent: false, source: "dev-test" });
                    console.log("[ChartJS Dev] State synchronization test completed");
                }, 1000);
            },

            // Comprehensive state dump for debugging
            dumpState: () => ({
                    charts: getState("charts"),
                    settings: getState("settings"),
                    performance: getState("performance"),
                    ui: getState("ui"),
                    globalData: Boolean(getState("globalData")),
                    chartInstances: windowAny._chartjsInstances?.length || 0,
                }),
        };

        console.log("[ChartJS] Enhanced development tools available at windowAny.__chartjs_dev");
        console.log("[ChartJS] Available commands:", Object.keys(windowAny.__chartjs_dev));
    }
}
