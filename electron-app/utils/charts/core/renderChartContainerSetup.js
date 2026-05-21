import { clearElement } from "../../dom/index.js";
import { createUserDeviceInfoBox } from "../../rendering/components/createUserDeviceInfoBox.js";
import { ensureChartSettingsDropdowns } from "../../ui/components/ensureChartSettingsDropdowns.js";
import {
    getChartRenderContainer,
    getChartSettingsWrapper,
    resolveChartContainer,
} from "../dom/chartDomUtils.js";
import { setupChartThemeListener } from "../theming/chartThemeListener.js";
import { isElement } from "./renderChartDomHelpers.js";
function normalizeChartTarget(targetContainer) {
    if (typeof targetContainer === "string") {
        return targetContainer;
    }
    return isElement(targetContainer) ? targetContainer : undefined;
}
function createFallbackChartContainer(doc) {
    const chartContainer = doc.createElement("div");
    chartContainer.id = "chartjs_chart_container";
    chartContainer.style.cssText = `
			margin-top: 20px;
			padding: 20px;
			background: var(--color-shadow, rgba(0, 0, 0, 0.05));
			border-radius: 12px;
		`;
    const settingsWrapper = getChartSettingsWrapper(doc);
    if (settingsWrapper && settingsWrapper.parentNode) {
        settingsWrapper.parentNode.insertBefore(
            chartContainer,
            settingsWrapper.nextSibling
        );
    } else {
        doc.body.append(chartContainer);
    }
    return chartContainer;
}
function resolveOrCreateChartContainer(doc, targetContainer) {
    return (
        resolveChartContainer(doc, targetContainer) ||
        getChartRenderContainer(doc) ||
        createFallbackChartContainer(doc)
    );
}
/**
 * Prepares the chart render container and adjacent controls for chart output.
 *
 * @param dependencies - DOM and cleanup dependencies for container setup.
 * @param options - Target container and control-panel options.
 *
 * @returns The prepared chart container.
 */
export function prepareChartRenderContainer(dependencies, options) {
    const targetContainer = normalizeChartTarget(options.targetContainer);
    if (!options.skipControls) {
        ensureChartSettingsDropdowns(targetContainer);
    }
    const chartContainer = resolveOrCreateChartContainer(
        dependencies.doc,
        targetContainer
    );
    const settingsWrapper = getChartSettingsWrapper(dependencies.doc);
    if (!options.skipControls && targetContainer && settingsWrapper) {
        setupChartThemeListener(chartContainer, settingsWrapper);
    }
    dependencies.removeChartHoverEffects(chartContainer);
    clearElement(chartContainer);
    createUserDeviceInfoBox(chartContainer);
    return chartContainer;
}
