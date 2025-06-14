/* eslint-disable no-undef */

/**
 * Renders a Vega-Lite chart into the specified container using global FIT file data.
 *
 * This function expects `window.globalData.recordMesgs` to be available, which should be an array of record messages.
 * It uses Arquero (`window.aq`) to transform the data and Vega-Lite to render an interactive, faceted chart.
 * The chart is responsive to window resizing and custom 'tab-shown' events.
 *
 * @param {HTMLElement|string} [targetContainer] - The target container element or its ID where the chart will be rendered.
 *   If not provided, defaults to the element with ID 'content-chart'.
 *
 * @example
 * // Render chart in a specific container by ID
 * renderChart('my-chart-container');
 *
 * @example
 * // Render chart in a specific container element
 * const container = document.getElementById('my-chart-container');
 * renderChart(container);
 *
 * @global
 * @requires window.globalData.recordMesgs - Array of FIT record messages.
 * @requires window.aq - Arquero library for data manipulation.
 * @requires vegaEmbed - Vega-Embed function for rendering Vega-Lite specs.
 */
// Import the function to generate Vega-Lite chart specifications based on the data
import { getChartSpec } from "./chartSpec.js";

export function renderChart(targetContainer) {
    const chartContainer = targetContainer
        ? typeof targetContainer === "string"
            ? document.getElementById(targetContainer)
            : targetContainer
        : document.getElementById("content-chart");
    if (!chartContainer) {
        console.error("[ERROR] Target container not found. Skipping chart rendering.");
        return;
    }
    chartContainer.innerHTML = '<div id="vega-container"></div>';
    if (window.globalData && window.globalData.recordMesgs && Array.isArray(window.globalData.recordMesgs)) {
        if (!window.aq) {
            console.error("[ERROR] Arquero library (window.aq) is not loaded. Skipping chart rendering.");
            return;
        }
        const recordTable = window.aq.from(window.globalData.recordMesgs);
        // List of allowed chart fields
        const allowedChartFields = [
            "timestamp",
            "positionLat",
            "positionLong",
            "distance",
            "altitude",
            "speed",
            "power",
            "heartRate",
            "cadence",
            "enhancedAltitude",
            "enhancedSpeed",
            "resistance",
            "temperature",
        ];
        const columnsToFold = recordTable.columnNames().filter((col) => col !== "timestamp" && allowedChartFields.includes(col));
        if (columnsToFold.length === 0) {
            console.info("[INFO] No suitable numeric data available for chart. Available columns: " + recordTable.columnNames().join(", "));
            chartContainer.innerHTML =
                "<p>No suitable numeric data available for chart.<br>Available columns: " + recordTable.columnNames().join(", ") + "</p>";
            return;
        }
        const folded = recordTable.fold(columnsToFold, { as: ["key", "value"] });
        if (!folded || typeof folded.objects !== "function") {
            console.error("[ERROR] Folded data is invalid or malformed. Skipping chart rendering.");
            chartContainer.innerHTML = "<p>Invalid data for chart rendering.</p>";
            return;
        }

        // Detect current theme from localStorage or document.body
        let theme = "dark";
        try {
            if (localStorage.getItem("ffv-theme")) {
                theme = localStorage.getItem("ffv-theme");
            } else if (document.body.classList.contains("theme-light")) {
                theme = "light";
            }
        } catch {
            /* intentionally ignore errors */
        }

        const spec = getChartSpec(folded.objects(), theme);
        const vegaContainer = chartContainer.querySelector("#vega-container");
        if (vegaContainer) {
            vegaEmbed(vegaContainer, spec)
                .then((result) => {
                    // Trigger a resize immediately after rendering in case the container was hidden
                    if (result && result.view) {
                        setTimeout(() => {
                            result.view.resize().run();
                        }, 0);

                        // --- Add window resize handler for responsive chart ---
                        // Remove any previous handler to avoid duplicates
                        if (window._vegaResizeHandler) {
                            window.removeEventListener("resize", window._vegaResizeHandler);
                        }
                        let resizeTimeout;
                        window._vegaResizeHandler = () => {
                            clearTimeout(resizeTimeout);
                            resizeTimeout = setTimeout(() => {
                                result.view.resize().run();
                            }, 200); // Adjust debounce delay as needed
                        };
                        window.addEventListener("resize", window._vegaResizeHandler);
                        // --- End window resize handler ---
                    }
                    // If the container was hidden, listen for a custom event to resize the chart
                    const handleTabShown = () => {
                        if (result && result.view) {
                            result.view.resize().run();
                        }
                    };
                    // Remove any previous 'tab-shown' event listener to avoid duplicates
                    if (chartContainer._tabShownHandler) {
                        chartContainer.removeEventListener("tab-shown", chartContainer._tabShownHandler);
                    }
                    // Listen for a custom event 'tab-shown' on the container
                    chartContainer._tabShownHandler = handleTabShown;
                    chartContainer.addEventListener("tab-shown", handleTabShown);
                })
                .catch((error) => {
                    console.error(error);
                    chartContainer.innerHTML = "<p>Failed to render the chart. Please try again later.</p>";
                });
        } else {
            console.warn("[WARNING] #vega-container element is missing. Skipping chart rendering.");
        }
    } else {
        chartContainer.innerHTML = "<p>No recordMesgs data available for chart.</p>";
    }
}
