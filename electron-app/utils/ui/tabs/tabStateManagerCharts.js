import {
    getChartBackgroundContainer,
    getChartContentContainer,
    getChartRenderContainer,
} from "../../charts/dom/chartDomUtils.js";
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
        const bgContainer = getChartBackgroundContainer(doc);
        const visibleContainer = getChartContentContainer(doc);

        if (!bgContainer || !visibleContainer) {
            return false;
        }

        // Get the pre-rendered chart container
        const preRenderedContainer = getChartRenderContainer(bgContainer);
        if (!preRenderedContainer) {
            return false;
        }

        // Ensure we don't already have a chart in the visible container
        if (getChartRenderContainer(visibleContainer)) {
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
