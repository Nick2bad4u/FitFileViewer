/**
 * Tab configuration definitions.
 */

/**
 * @typedef {{
 *     id: string;
 *     contentId: string;
 *     label: string;
 *     requiresData: boolean;
 *     handler: string | null;
 * }} TabDef
 */

/** @type {Record<string, TabDef>} */
const TAB_CONFIG = {
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

export { TAB_CONFIG };
