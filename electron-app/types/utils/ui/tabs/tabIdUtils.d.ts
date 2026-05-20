/**
 * Tab configuration shape used by tab ID resolution.
 */
export type TabIdConfig = {
    id?: string;
};
/**
 * Options for extracting tab names from button IDs.
 */
export type ExtractTabNameOptions = {
    knownTabNames?: readonly string[];
};
/**
 * Default tab names known by the legacy tab UI.
 */
export const DEFAULT_TAB_NAMES_LIST: string[];
/**
 * Normalize a tab name for matching.
 *
 * @param rawName - Tab name candidate.
 * @returns Normalized tab name.
 */
export function normalizeTabName(rawName: string): string;
/**
 * Normalize a tab name derived from content IDs, mapping chartjs to chart.
 *
 * @param rawName - Content-derived tab name candidate.
 * @returns Normalized content tab name.
 */
export function normalizeContentTabName(rawName: string): string;
/**
 * Extract tab name from a button ID for state updates.
 *
 * @param tabId - Tab button ID.
 * @param options - Optional known tab names for guarded underscore parsing.
 * @returns Extracted tab name, or the original ID when it cannot be mapped.
 */
export function extractTabNameFromButtonId(
    tabId: string,
    options?: ExtractTabNameOptions
): string;
/**
 * Resolve a tab name from a button ID using tab config entries when available.
 *
 * @param buttonId - Button ID to resolve.
 * @param tabConfigMap - Known tab configuration map.
 * @returns Resolved tab name, or null when no match exists.
 */
export function resolveTabNameFromButtonId(
    buttonId: unknown,
    tabConfigMap: null | Record<string, TabIdConfig> | undefined
): null | string;
/**
 * Extract tab name from a content element ID.
 *
 * @param contentId - Content element ID.
 * @returns Extracted tab name, or null when no pattern matches.
 */
export function extractTabNameFromContentId(
    contentId: unknown
): null | string;
/**
 * Get content ID from tab name.
 *
 * @param tabName - Tab name.
 * @returns Content element ID.
 */
export function getContentIdFromTabName(tabName: string): string;
