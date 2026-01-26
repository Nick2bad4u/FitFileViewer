/**
 * @fileoverview Chart Status Indicator utility for showing chart visibility statistics
 * @description Provides a visual indicator showing how many charts are currently visible
 * out of the total available charts, helping users understand their chart selection status
 */

import { subscribeToChartSettings } from "../../state/domain/settingsStateManager.js";
import { getChartCounts } from "../core/getChartCounts.js";
import { createChartStatusIndicator } from "./createChartStatusIndicator.js";
import { createChartStatusIndicatorFromCounts } from "./createChartStatusIndicatorFromCounts.js";
import { createGlobalChartStatusIndicator } from "./createGlobalChartStatusIndicator.js";
import { createGlobalChartStatusIndicatorFromCounts } from "./createGlobalChartStatusIndicatorFromCounts.js";
/** @typedef {import('../core/getChartCounts.js').ChartCounts} ChartCounts */

/**
 * Sets up automatic updates for the chart status indicator
 * Called whenever charts are rendered or field toggles change
 */
export function setupChartStatusUpdates() {
    try {
        // Listen for chart settings updates (field visibility changes)
        subscribeToChartSettings(() => {
            setTimeout(() => {
                try {
                    updateAllChartStatusIndicators();
                } catch (error) {
                    console.error("[ChartStatus] Error in chart settings handler:", error);
                }
            }, 50);
        });

        // Listen for custom field toggle events (real-time updates in same window)
        globalThis.addEventListener("fieldToggleChanged", () => {
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
        const existingDescriptor = Object.getOwnPropertyDescriptor(globalThis, "globalData");

        // Only set up the property if it doesn't already have a custom setter
        if (!existingDescriptor || !existingDescriptor.set || existingDescriptor.configurable) {
            try {
                // Store existing value if any
                const currentValue = globalThis.globalData;

                Object.defineProperty(globalThis, "globalData", {
                    configurable: true,
                    enumerable: true,
                    get() {
                        return /** @type {any} */ (globalThis).___ffv_globalData || currentValue;
                    },
                    set(value) {
                        /** @type {any} */ (globalThis).___ffv_globalData = value;
                        setTimeout(() => {
                            try {
                                updateAllChartStatusIndicators();
                            } catch (error) {
                                console.error("[ChartStatus] Error in globalData setter:", error);
                            }
                        }, 100);
                    },
                });

                // Set initial value if it existed
                if (currentValue !== undefined) {
                    /** @type {any} */ (globalThis).___ffv_globalData = currentValue;
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

/**
 * Updates both the settings and global chart status indicators synchronously
 * This ensures they always show the same counts
 */
export function updateAllChartStatusIndicators() {
    try {
        // Use a single call to get counts to ensure consistency
        const counts = getChartCounts(),
            // Update settings indicator
            settingsIndicator = document.querySelector("#chart-status-indicator");
        if (settingsIndicator) {
            const newSettingsIndicator = createChartStatusIndicatorFromCounts(counts),
                parent = settingsIndicator.parentNode;
            if (parent && newSettingsIndicator) {
                settingsIndicator.replaceWith(newSettingsIndicator);
            }
        }

        // Update global indicator
        const globalIndicator = document.querySelector("#global-chart-status");
        if (globalIndicator) {
            const newGlobalIndicator = createGlobalChartStatusIndicatorFromCounts(counts);
            if (newGlobalIndicator) {
                const parent = globalIndicator.parentNode;
                if (parent) {
                    globalIndicator.replaceWith(newGlobalIndicator);
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
        const target = indicator || document.querySelector("#chart-status-indicator");
        if (!target) {
            return;
        }

        // Replace the entire indicator with a new one
        const newIndicator = createChartStatusIndicator(),
            parent = target.parentNode;
        if (parent && newIndicator) {
            target.replaceWith(newIndicator);
        }
    } catch (error) {
        console.error("[ChartStatus] Error updating chart status indicator:", error);
    }
}
