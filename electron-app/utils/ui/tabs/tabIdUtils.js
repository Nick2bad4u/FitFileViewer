/**
 * @file Shared tab ID parsing utilities.
 *
 *   Consolidates tab button/content ID parsing to reduce duplicate logic and keep
 *   tab naming conventions consistent across UI modules.
 */

import { buildIdVariants } from "../dom/elementIdUtils.js";

const DEFAULT_TAB_NAMES = [
    "altfit",
    "browser",
    "chart",
    "chartjs",
    "data",
    "map",
    "summary",
    "zwift",
];

/**
 * Normalize a tab name for matching.
 *
 * @param {string} rawName
 *
 * @returns {string}
 */
export function normalizeTabName(rawName) {
    return String(rawName)
        .replaceAll(/([a-z0-9])([A-Z])/gu, "$1_$2")
        .toLowerCase();
}

/**
 * Normalize a tab name derived from content IDs, mapping chartjs -> chart.
 *
 * @param {string} rawName
 *
 * @returns {string}
 */
export function normalizeContentTabName(rawName) {
    const normalized = normalizeTabName(rawName);
    return normalized === "chartjs" ? "chart" : normalized;
}

/**
 * Extract tab name from a button ID for state updates.
 *
 * This preserves original casing for dashed/btn patterns while protecting
 * underscore-prefixed IDs that do not map to known tabs.
 *
 * @param {string} tabId
 * @param {{ knownTabNames?: string[] }} [options]
 *
 * @returns {string}
 */
export function extractTabNameFromButtonId(tabId, options = {}) {
    const knownTabNames = options.knownTabNames || DEFAULT_TAB_NAMES;

    const patterns = [
        /^tab_(.+)$/, // Tab_summary -> summary
        /^(.+)_tab$/, // Summary_tab -> summary
        /^tab-(.+)$/, // Tab-summary -> summary
        /^(.+)-tab$/, // Summary-tab -> summary
        /^btn_(.+)$/, // Btn_chart -> chart
        /^(.+)_btn$/, // Chart_btn -> chart
        /^btn-(.+)$/, // Btn-chart -> chart
        /^(.+)-btn$/, // Chart-btn -> chart
    ];

    for (const pattern of patterns) {
        const match = tabId.match(pattern);
        if (match) {
            const rawName = /** @type {string} */ (match[1] || "");
            const normalized = rawName.toLowerCase();
            const isTabUnderscorePattern = pattern === patterns[0];
            if (isTabUnderscorePattern) {
                return knownTabNames.includes(normalized) ? rawName : tabId;
            }
            return rawName;
        }
    }

    return tabId;
}

/**
 * Resolve a tab name from a button ID using tab config entries when available.
 *
 * @param {string} buttonId
 * @param {Record<string, { id?: string }>} tabConfigMap
 *
 * @returns {string | null}
 */
export function resolveTabNameFromButtonId(buttonId, tabConfigMap) {
    if (!buttonId || typeof buttonId !== "string") {
        return null;
    }

    const variants = buildIdVariants(buttonId);
    for (const [tabName, config] of Object.entries(tabConfigMap || {})) {
        if (config?.id && variants.includes(config.id)) {
            return tabName;
        }
    }

    const patterns = [
        /^tab[-_]?(.+)$/i,
        /^(.+?)[-_]?tab$/i,
        /^btn[-_]?(.+)$/i,
        /^(.+?)[-_]?btn$/i,
    ];

    for (const pattern of patterns) {
        const match = buttonId.match(pattern);
        if (match && match[1]) {
            const rawName = String(match[1]);
            const normalized = normalizeTabName(rawName);
            if (tabConfigMap?.[normalized]) {
                return normalized;
            }
        }
    }

    return null;
}

/**
 * Extract tab name from a content element ID.
 *
 * @param {string} contentId
 *
 * @returns {string | null}
 */
export function extractTabNameFromContentId(contentId) {
    if (!contentId || typeof contentId !== "string") {
        console.warn(
            "extractTabNameFromContentId: Invalid contentId provided. Expected a non-empty string. Received:",
            contentId
        );
        return null;
    }

    const patterns = [
        /^content_(.+)$/, // content_summary -> summary
        /^content-(.+)$/, // content-summary -> summary
        /^content([A-Z].+)$/, // contentSummary -> summary
        /^(.+)_content$/, // summary_content -> summary
        /^(.+)-content$/, // summary-content -> summary
    ];

    for (const pattern of patterns) {
        const match = contentId.match(pattern);
        if (match) {
            const [, rawName] = match;
            return normalizeContentTabName(String(rawName));
        }
    }

    return null;
}

/**
 * Get content ID from tab name.
 *
 * @param {string} tabName
 *
 * @returns {string}
 */
export function getContentIdFromTabName(tabName) {
    const tabToContentMap = {
        altfit: "content_altfit",
        browser: "content_browser",
        chart: "content_chartjs",
        chartjs: "content_chartjs",
        data: "content_data",
        map: "content_map",
        summary: "content_summary",
        zwift: "content_zwift",
    };

    return (
        /** @type {Record<string, string>} */ (tabToContentMap)[tabName] ||
        `content_${tabName}`
    );
}

export const DEFAULT_TAB_NAMES_LIST = [...DEFAULT_TAB_NAMES];
