export const DEFAULT_TAB_NAMES_LIST: string[];

export function normalizeTabName(rawName: string): string;

export function normalizeContentTabName(rawName: string): string;

export function extractTabNameFromButtonId(
    tabId: string,
    options?: {
        knownTabNames?: string[];
    }
): string;

export function resolveTabNameFromButtonId(
    buttonId: string,
    tabConfigMap: Record<string, { id?: string }>
): string | null;

export function extractTabNameFromContentId(contentId: string): string | null;

export function getContentIdFromTabName(tabName: string): string;
