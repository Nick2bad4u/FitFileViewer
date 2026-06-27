/**
 * Tab configuration definitions.
 */

import {
    isRendererTabName,
    type RendererTabName,
} from "../../state/domain/rendererActiveTabState.js";

/** Metadata for one tab managed by the renderer tab state manager. */
export type TabDef = {
    contentId: string;
    handler: null | string;
    id: string;
    label: string;
    requiresData: boolean;
};

const TAB_CONFIG: Record<RendererTabName, TabDef> = {
    altfit: {
        contentId: "content_altfit",
        handler: null,
        id: "tab_altfit",
        label: "Alternative View",
        requiresData: false,
    },
    browser: {
        contentId: "content_browser",
        handler: null,
        id: "tab_browser",
        label: "Browser",
        requiresData: false,
    },
    chart: {
        contentId: "content_chartjs",
        handler: "renderChartJS",
        id: "tab_chart",
        label: "Charts",
        requiresData: true,
    },
    chartjs: {
        contentId: "content_chartjs",
        handler: "renderChartJS",
        id: "tab_chartjs",
        label: "Charts",
        requiresData: true,
    },
    data: {
        contentId: "content_data",
        handler: "createTables",
        id: "tab_data",
        label: "Data Tables",
        requiresData: true,
    },
    map: {
        contentId: "content_map",
        handler: "renderMap",
        id: "tab_map",
        label: "Map",
        requiresData: true,
    },
    summary: {
        contentId: "content_summary",
        handler: "renderSummary",
        id: "tab_summary",
        label: "Summary",
        requiresData: true,
    },
    zwift: {
        contentId: "content_zwift",
        handler: null,
        id: "tab_zwift",
        label: "Zwift",
        requiresData: false,
    },
};

export const TAB_CONTENT_IDS = [
    ...new Set(Object.values(TAB_CONFIG).map(({ contentId }) => contentId)),
] as const;

export function getConfiguredTab(tabName: unknown): TabDef | undefined {
    return isRendererTabName(tabName) ? TAB_CONFIG[tabName] : undefined;
}

export { TAB_CONFIG };
