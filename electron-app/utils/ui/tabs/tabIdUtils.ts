/**
 * Shared tab ID parsing utilities.
 *
 * Consolidates tab button/content ID parsing to reduce duplicate logic and keep
 * tab naming conventions consistent across UI modules.
 */

import { buildIdVariants } from "../dom/elementIdUtils.js";
import { RENDERER_TAB_NAMES } from "../../state/domain/rendererActiveTabState.js";

/** Tab configuration shape used by tab ID resolution. */
export type TabIdConfig = {
    id?: string;
};

/** Options for extracting tab names from button IDs. */
export type ExtractTabNameOptions = {
    knownTabNames?: readonly string[];
};

/**
 * Normalize a tab name for matching.
 *
 * @param rawName - Tab name candidate.
 *
 * @returns Normalized tab name.
 */
export function normalizeTabName(rawName: string): string {
    return String(rawName)
        .replaceAll(/(?<=[a-z0-9])(?=[A-Z])/gu, "_")
        .toLowerCase();
}

/**
 * Normalize a tab name derived from content IDs, mapping chartjs to chart.
 *
 * @param rawName - Content-derived tab name candidate.
 *
 * @returns Normalized content tab name.
 */
export function normalizeContentTabName(rawName: string): string {
    const normalized = normalizeTabName(rawName);
    return normalized === "chartjs" ? "chart" : normalized;
}

/**
 * Extract tab name from a button ID for state updates.
 *
 * @param tabId - Tab button ID.
 * @param options - Optional known tab names for guarded underscore parsing.
 *
 * @returns Extracted tab name, or the original ID when it cannot be mapped.
 */
export function extractTabNameFromButtonId(
    tabId: string,
    options: ExtractTabNameOptions = {}
): string {
    const knownTabNames = options.knownTabNames ?? RENDERER_TAB_NAMES;

    const patterns: RegExp[] = [
        /^tab_(.+)$/,
        /^(.+)_tab$/,
        /^tab-(.+)$/,
        /^(.+)-tab$/,
        /^btn_(.+)$/,
        /^(.+)_btn$/,
        /^btn-(.+)$/,
        /^(.+)-btn$/,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(tabId);
        if (match) {
            const rawName = match[1] ?? "";
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
 * @param buttonId - Button ID to resolve.
 * @param tabConfigMap - Known tab configuration map.
 *
 * @returns Resolved tab name, or null when no match exists.
 */
export function resolveTabNameFromButtonId(
    buttonId: unknown,
    tabConfigMap: null | Record<string, TabIdConfig> | undefined
): null | string {
    if (!buttonId || typeof buttonId !== "string") {
        return null;
    }

    const variants = buildIdVariants(buttonId);
    for (const [tabName, config] of Object.entries(tabConfigMap ?? {})) {
        if (config.id && variants.includes(config.id)) {
            return tabName;
        }
    }

    const patterns = [
        /^tab[_-]?(.+)$/i,
        /^(.+?)[_-]?tab$/i,
        /^btn[_-]?(.+)$/i,
        /^(.+?)[_-]?btn$/i,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(buttonId);
        if (match?.[1]) {
            const normalized = normalizeTabName(match[1]);
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
 * @param contentId - Content element ID.
 *
 * @returns Extracted tab name, or null when no pattern matches.
 */
export function extractTabNameFromContentId(contentId: unknown): null | string {
    if (!contentId || typeof contentId !== "string") {
        console.warn(
            "extractTabNameFromContentId: Invalid contentId provided. Expected a non-empty string. Received:",
            contentId
        );
        return null;
    }

    const patterns = [
        /^content_(.+)$/,
        /^content-(.+)$/,
        /^content([A-Z].+)$/,
        /^(.+)_content$/,
        /^(.+)-content$/,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(contentId);
        if (match?.[1]) {
            return normalizeContentTabName(match[1]);
        }
    }

    return null;
}

/**
 * Get content ID from tab name.
 *
 * @param tabName - Tab name.
 *
 * @returns Content element ID.
 */
export function getContentIdFromTabName(tabName: string): string {
    const tabToContentMap: Record<string, string> = {
        altfit: "content_altfit",
        browser: "content_browser",
        chart: "content_chartjs",
        chartjs: "content_chartjs",
        data: "content_data",
        map: "content_map",
        summary: "content_summary",
        zwift: "content_zwift",
    };

    return tabToContentMap[tabName] ?? `content_${tabName}`;
}

/** Default tab names known by the legacy tab UI. */
export const DEFAULT_TAB_NAMES_LIST = [...RENDERER_TAB_NAMES];
