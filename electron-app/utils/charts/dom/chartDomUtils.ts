/**
 * Shared chart DOM lookup helpers.
 *
 * Centralizes chart container and control element lookups to avoid duplicated
 * ID fallbacks across chart-related modules.
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
 * @param doc - DOM root used for lookup.
 *
 * @returns The chart content container, if found.
 */
export function getChartContentContainer(
    doc: Document | ParentNode | null | undefined
): HTMLElement | null {
    return getElementByIdFlexibleList(doc, CHART_CONTENT_IDS);
}

/**
 * Resolve the main chart rendering container.
 *
 * @param doc - DOM root used for lookup.
 *
 * @returns The chart render container, if found.
 */
export function getChartRenderContainer(
    doc: Document | ParentNode | null | undefined
): HTMLElement | null {
    return getElementByIdFlexibleList(doc, CHART_RENDER_CONTAINER_IDS);
}

/**
 * Resolve the chart background container.
 *
 * @param doc - Document used for lookup.
 *
 * @returns The chart background container, if found.
 */
export function getChartBackgroundContainer(
    doc: Document | null | undefined
): HTMLElement | null {
    return getElementByIdFlexible(doc, CHART_BACKGROUND_CONTAINER_ID);
}

/**
 * Resolve the chart settings wrapper.
 *
 * @param doc - Document used for lookup.
 *
 * @returns The chart settings wrapper, if found.
 */
export function getChartSettingsWrapper(
    doc: Document | null | undefined
): HTMLElement | null {
    return querySelectorByIdFlexible(doc, CHART_SETTINGS_WRAPPER_SELECTOR);
}

/**
 * Resolve the chart controls toggle button.
 *
 * @param doc - Document used for lookup.
 *
 * @returns The chart controls toggle, if found.
 */
export function getChartControlsToggle(
    doc: Document | null | undefined
): HTMLElement | null {
    return querySelectorByIdFlexible(doc, CHART_CONTROLS_TOGGLE_SELECTOR);
}

/**
 * Resolve a chart container from an optional target.
 *
 * @param doc - Document used for fallback lookup.
 * @param targetContainer - Element or ID supplied by callers.
 *
 * @returns Resolved chart container, if found.
 */
export function resolveChartContainer(
    doc: Document | null | undefined,
    targetContainer?: Element | null | string
): HTMLElement | null {
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

/**
 * Stable chart DOM identifiers used by chart container lookup helpers.
 */
export const CHART_DOM_IDS = {
    backgroundContainer: CHART_BACKGROUND_CONTAINER_ID,
    contentContainers: [...CHART_CONTENT_IDS],
    controlsToggleSelector: CHART_CONTROLS_TOGGLE_SELECTOR,
    renderContainers: [...CHART_RENDER_CONTAINER_IDS],
    settingsWrapperSelector: CHART_SETTINGS_WRAPPER_SELECTOR,
} as const;
