/**
 * @fileoverview Chart Status Indicator utility for showing chart visibility statistics
 * @description Provides a visual indicator showing how many charts are currently visible
 * out of the total available charts, helping users understand their chart selection status
 */

import { subscribe } from "../../state/core/stateManager.js";
import { getGlobalData, setGlobalData } from "../../state/domain/globalDataState.js";
import { getChartCounts } from "../core/getChartCounts.js";
import { createChartStatusIndicator } from "./createChartStatusIndicator.js";
import { createChartStatusIndicatorFromCounts } from "./createChartStatusIndicatorFromCounts.js";
import { createGlobalChartStatusIndicator } from "./createGlobalChartStatusIndicator.js";
import { createGlobalChartStatusIndicatorFromCounts } from "./createGlobalChartStatusIndicatorFromCounts.js";
/** @typedef {import('../core/getChartCounts.js').ChartCounts} ChartCounts */

/** @type {(() => void) | null} */
let unsubscribeGlobalDataListener = null;

/**
 * Sets up automatic updates for the chart status indicator
 * Called whenever charts are rendered or field toggles change
 */
export function setupChartStatusUpdates() {
    try {
        ensureGlobalDataProperty();

        // Listen for storage changes (field toggles)
        globalThis.addEventListener("storage", (e) => {
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
        });

        if (unsubscribeGlobalDataListener) {
            unsubscribeGlobalDataListener();
        }
        unsubscribeGlobalDataListener = subscribe("globalData", () => {
            setTimeout(() => {
                try {
                    updateAllChartStatusIndicators();
                } catch (error) {
                    console.error("[ChartStatus] Error reacting to globalData change:", error);
                }
            }, 100);
        });

        // Create global indicator on initial setup
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

function ensureGlobalDataProperty() {
    try {
        const host = /** @type {any} */ (globalThis);
        if (!Object.getOwnPropertyDescriptor(host, "globalData")) {
            Object.defineProperty(host, "globalData", {
                configurable: true,
                get: () => getGlobalData(),
                set: (value) => setGlobalData(value, "chartStatusIndicator.windowSetter"),
            });
        }

        if (host.window && typeof host.window === "object") {
            const windowHost = host.window;
            if (!Object.getOwnPropertyDescriptor(windowHost, "globalData")) {
                Object.defineProperty(windowHost, "globalData", {
                    configurable: true,
                    get: () => getGlobalData(),
                    set: (value) => setGlobalData(value, "chartStatusIndicator.windowSetter"),
                });
            }
        }
    } catch (error) {
        console.warn("[ChartStatus] Failed to ensure globalData property", error);
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
