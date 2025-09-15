/**
 * @fileoverview Chart Status Indicator utility for showing chart visibility statistics
 * @description Provides a visual indicator showing how many charts are currently visible
 * out of the total available charts, helping users understand their chart selection status
 */

import { createChartStatusIndicator } from "./createChartStatusIndicator.js";
import { createChartStatusIndicatorFromCounts } from "./createChartStatusIndicatorFromCounts.js";
import { createGlobalChartStatusIndicator } from "./createGlobalChartStatusIndicator.js";
import { createGlobalChartStatusIndicatorFromCounts } from "./createGlobalChartStatusIndicatorFromCounts.js";
import { getChartCounts } from "../core/getChartCounts.js";
/** @typedef {import('../core/getChartCounts.js').ChartCounts} ChartCounts */

/**
 * Updates both the settings and global chart status indicators synchronously
 * This ensures they always show the same counts
 */
export function updateAllChartStatusIndicators() {
    try {
        // Use a single call to get counts to ensure consistency
        const counts = getChartCounts(),
            // Update settings indicator
            settingsIndicator = document.getElementById("chart-status-indicator");
        if (settingsIndicator) {
            const newSettingsIndicator = createChartStatusIndicatorFromCounts(counts),
                parent = settingsIndicator.parentNode;
            if (parent && newSettingsIndicator) {
                parent.replaceChild(newSettingsIndicator, settingsIndicator);
            }
        }

        // Update global indicator
        const globalIndicator = document.getElementById("global-chart-status");
        if (globalIndicator) {
            const newGlobalIndicator = createGlobalChartStatusIndicatorFromCounts(counts);
            if (newGlobalIndicator) {
                const parent = globalIndicator.parentNode;
                if (parent) {
                    parent.replaceChild(newGlobalIndicator, globalIndicator);
                }
            }
        } else {
            // Create if it doesn't exist
            createGlobalChartStatusIndicator();
        }
    } catch (error) {
        console.error("[ChartStatus] Error updating all chart status indicators:", error);
    }
}

/**
 * Update a single chart status indicator element
 * @param {HTMLElement|null} indicator
 */
export function updateChartStatusIndicator(indicator = null) {
    try {
        const target = indicator || document.getElementById("chart-status-indicator");
        if (!target) {
            return;
        }

        // Replace the entire indicator with a new one
        const newIndicator = createChartStatusIndicator(),
            parent = target.parentNode;
        if (parent && newIndicator) {
            parent.replaceChild(newIndicator, target);
        }
    } catch (error) {
        console.error("[ChartStatus] Error updating chart status indicator:", error);
    }
}

/**
 * Sets up automatic updates for the chart status indicator
 * Called whenever charts are rendered or field toggles change
 */
export function setupChartStatusUpdates() {
    try {
        // Listen for storage changes (field toggles)
        window.addEventListener("storage", (e) => {
            if (e.key && e.key.startsWith("chartjs_field_")) {
                setTimeout(() => {
                    try {
                        updateAllChartStatusIndicators();
                    } catch (error) {
                        console.error("[ChartStatus] Error in storage handler:", error);
                    }
                }, 50);
            }
        });

        // Listen for custom field toggle events (real-time updates in same window)
        window.addEventListener("fieldToggleChanged", () => {
            setTimeout(() => {
                try {
                    updateAllChartStatusIndicators();
                } catch (error) {
                    console.error("[ChartStatus] Error in fieldToggleChanged handler:", error);
                }
            }, 50);
        }); // Listen for custom events when charts are rendered
        document.addEventListener("chartsRendered", () => {
            // Use setTimeout to ensure DOM updates don't interfere with chart rendering
            setTimeout(() => {
                try {
                    updateAllChartStatusIndicators();
                } catch (error) {
                    console.error("[ChartStatus] Error in chartsRendered handler:", error);
                }
            }, 50);
        }); // Update when global data changes
        const existingDescriptor = Object.getOwnPropertyDescriptor(window, "globalData");

        // Only set up the property if it doesn't already have a custom setter
        if (!existingDescriptor || !existingDescriptor.set || existingDescriptor.configurable) {
            try {
                // Store existing value if any
                const currentValue = window.globalData;

                Object.defineProperty(window, "globalData", {
                    get() {
                        return /** @type {any} */ (window).___ffv_globalData || currentValue;
                    },
                    set(value) {
                        /** @type {any} */ (window).___ffv_globalData = value;
                        setTimeout(() => {
                            try {
                                updateAllChartStatusIndicators();
                            } catch (error) {
                                console.error("[ChartStatus] Error in globalData setter:", error);
                            }
                        }, 100);
                    },
                    configurable: true,
                    enumerable: true,
                });

                // Set initial value if it existed
                if (currentValue !== undefined) {
                    /** @type {any} */ (window).___ffv_globalData = currentValue;
                }
            } catch (propertyError) {
                console.warn(
                    "[ChartStatus] Could not redefine globalData property, using fallback approach:",
                    propertyError
                );
                // Fallback: just monitor for manual updates
            }
        } // Create global indicator on initial setup
        setTimeout(() => {
            try {
                createGlobalChartStatusIndicator();
            } catch (error) {
                console.error("[ChartStatus] Error creating initial global indicator:", error);
            }
        }, 100);
    } catch (error) {
        console.error("[ChartStatus] Error setting up chart status updates:", error);
    }
}
