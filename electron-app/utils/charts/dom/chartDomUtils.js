/**
 * @file Shared chart DOM lookup helpers.
 *
 *   Centralizes chart container and control element lookups to avoid duplicated
 *   ID fallbacks across chart-related modules.
 */

import { isHTMLElement } from "../../dom/domHelpers.js";
import {
    getElementByIdFlexible,
    getElementByIdFlexibleList,
    querySelectorByIdFlexible,
} from "../../ui/dom/elementIdUtils.js";

const CHART_CONTENT_IDS = ["content_chartjs", "content_chart"];
const CHART_RENDER_CONTAINER_IDS = [
    "chartjs_chart_container",
    "chart-container",
    ...CHART_CONTENT_IDS,
];
const CHART_BACKGROUND_CONTAINER_ID = "background_chart_container";
const CHART_SETTINGS_WRAPPER_SELECTOR = "#chartjs-settings-wrapper";
const CHART_CONTROLS_TOGGLE_SELECTOR = "#chart-controls-toggle";

/**
 * Resolve the chart tab content container.
 *
 * @param {Document | null | undefined} doc
 *
 * @returns {HTMLElement | null}
 */
export function getChartContentContainer(doc) {
    return getElementByIdFlexibleList(doc, CHART_CONTENT_IDS);
}

/**
 * Resolve the main chart rendering container.
 *
 * @param {Document | null | undefined} doc
 *
 * @returns {HTMLElement | null}
 */
export function getChartRenderContainer(doc) {
    return getElementByIdFlexibleList(doc, CHART_RENDER_CONTAINER_IDS);
}

/**
 * Resolve the chart background container.
 *
 * @param {Document | null | undefined} doc
 *
 * @returns {HTMLElement | null}
 */
export function getChartBackgroundContainer(doc) {
    return getElementByIdFlexible(doc, CHART_BACKGROUND_CONTAINER_ID);
}

/**
 * Resolve the chart settings wrapper.
 *
 * @param {Document | null | undefined} doc
 *
 * @returns {HTMLElement | null}
 */
export function getChartSettingsWrapper(doc) {
    return querySelectorByIdFlexible(doc, CHART_SETTINGS_WRAPPER_SELECTOR);
}

/**
 * Resolve the chart controls toggle button.
 *
 * @param {Document | null | undefined} doc
 *
 * @returns {HTMLElement | null}
 */
export function getChartControlsToggle(doc) {
    return querySelectorByIdFlexible(doc, CHART_CONTROLS_TOGGLE_SELECTOR);
}

/**
 * Resolve a chart container from an optional target.
 *
 * @param {Document | null | undefined} doc
 * @param {Element | string | null | undefined} targetContainer
 *
 * @returns {HTMLElement | null}
 */
export function resolveChartContainer(doc, targetContainer) {
    if (!doc) {
        return null;
    }

    if (typeof targetContainer === "string") {
        return getElementByIdFlexibleList(doc, [targetContainer]);
    }

    if (isHTMLElement(targetContainer)) {
        return targetContainer;
    }

    return getChartRenderContainer(doc);
}

export const CHART_DOM_IDS = {
    backgroundContainer: CHART_BACKGROUND_CONTAINER_ID,
    contentContainers: [...CHART_CONTENT_IDS],
    controlsToggleSelector: CHART_CONTROLS_TOGGLE_SELECTOR,
    renderContainers: [...CHART_RENDER_CONTAINER_IDS],
    settingsWrapperSelector: CHART_SETTINGS_WRAPPER_SELECTOR,
};
