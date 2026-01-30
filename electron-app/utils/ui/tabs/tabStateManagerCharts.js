import { ensureChartSettingsDropdowns } from "../components/ensureChartSettingsDropdowns.js";
import { getDoc } from "./tabStateManagerDoc.js";

/**
 * Attach any pre-rendered chart canvas from the background container into the
 * visible chart container.
 *
 * @returns {boolean}
 */
export function attachPreRenderedCharts() {
    const doc = getDoc();
    if (!doc || !doc.body) {
        return false;
    }

    // We need to move the chart container from the background to the visible tab
    try {
        const bgContainer = doc.getElementById("background_chart_container");
        const visibleContainer =
            doc.getElementById("content_chartjs") ||
            doc.getElementById("content_chart");

        if (!bgContainer || !visibleContainer) {
            return false;
        }

        // Get the pre-rendered chart container
        const preRenderedContainer = bgContainer.querySelector(
            "#chartjs_chart_container"
        );
        if (!preRenderedContainer) {
            return false;
        }

        // Ensure we don't already have a chart in the visible container
        if (visibleContainer.querySelector("#chartjs_chart_container")) {
            return false;
        }

        // Move the chart container to the visible tab
        visibleContainer.append(preRenderedContainer);

        // Update UI controls for Chart.js
        if (typeof ensureChartSettingsDropdowns === "function") {
            ensureChartSettingsDropdowns();
        }

        return true;
    } catch (error) {
        console.error(
            "[TabManager] Error attaching pre-rendered chart:",
            error
        );
        return false;
    }
}
